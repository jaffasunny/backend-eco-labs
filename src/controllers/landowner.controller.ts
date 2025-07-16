import {
  generatePassword,
  parseBooleanQueryParam,
  toMongoId,
} from './../utils/utils.js';
import { Response, Request } from 'express';
import { User } from '../models/user.model.js';
import { ApiError } from '../utils/ApiError.js';
import { ApiResponse } from '../utils/ApiResponse.js';
import { asyncHandler } from '../utils/asyncHandler.js';
import sendEmail from '../utils/sendMail.js';
import { PLATFORM_NAME, ROLES } from '../constants.js';
import mongoose from 'mongoose';
import { updateUserDetails } from '../services/user.service.js';
import {
  assignResearcherPropertyService,
  findOrUpdatePropertySession,
} from '../services/property.service.js';
import { IUpdateLandowner } from '../interface/property.interface.js';
import {
  findOrUpdateUser,
  landownerAggregatePaginationService,
  landownerPropertyAggregatePaginationService,
  landownerPropertyBidsPaginationService,
} from '../services/landowner.service.js';
import { Bids } from '../models/bids.model.js';
import { Property } from '../models/property.model.js';
import { TSort } from '../types/index.js';

// Add Landowner by email
const addLandowner = asyncHandler(async (req: Request, res: Response) => {
  const {
    name,
    email,
    phone,
    propertyName,
    propertyLocation,
    propertySize,
    files,
    startDate,
  } = req.body;

  // Start a transaction
  const session = await mongoose.startSession();
  session.startTransaction();

  // Generate system-generated password
  const password = generatePassword();

  const landownerData = {
    name,
    email,
    phone,
    password,
    roles: ROLES.LANDOWNER,
  };

  // Send the password to the user's email
  try {
    const user = await findOrUpdateUser(landownerData, session);

    const { property, uploadedPropertyFiles } =
      await findOrUpdatePropertySession(
        propertyName,
        propertyLocation,
        propertySize,
        files,
        user._id,
        startDate,
        session
      );

    // Commit transaction
    await session.commitTransaction();

    // Send email asynchronously (outside of transaction)
    sendEmail(
      email,
      'Your System Generated Password',
      `Welcome to ${PLATFORM_NAME}! Here is your system-generated password: ${password}`
    ).catch((err) => console.error('Email sending failed:', err));

    return res.status(201).json(
      new ApiResponse(
        201,
        {
          user,
          property,
          uploadedPropertyFiles,
        },
        'Landowner added successfully. Password has been sent to the email.'
      )
    );
  } catch (error: any) {
    // Rollback transaction
    await session.abortTransaction();
    throw new ApiError(500, error.message || 'Failed to create landowner!');
  } finally {
    // End session
    session.endSession();
  }
});

const updateLandowner = asyncHandler(async (req: Request, res: Response) => {
  const { id: userId } = req.params;
  const { name, email, password, phone }: IUpdateLandowner = req.body;

  // Start a transaction
  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    // Check if user exists
    const user = await User.findById(userId).session(session);
    if (!user) {
      throw new ApiError(404, 'User does not exist!');
    }

    // Update user details
    await updateUserDetails(
      userId,
      ROLES.LANDOWNER,
      { name, email, password, phone },
      session
    );

    // Commit transaction
    await session.commitTransaction();

    // Send response
    res.status(200).json(
      new ApiResponse(
        200,
        'Landowner updated successfully!'
        // { userWithProperty },
        // property.isNew
        //   ? 'Property created successfully!'
        //   : 'Property updated successfully!'
      )
    );
    // }
  } catch (error: any) {
    // Rollback transaction
    await session.abortTransaction();
    throw new ApiError(500, error.message || 'Failed to update property!');
  } finally {
    // End session
    session.endSession();
  }
});

const paginatedLandownerData = asyncHandler(
  async (req: Request, res: Response) => {
    const {
      page = 1,
      limit = 10,
      search = '',
      isArchived = null,
      assigned = null,
      sort,
    } = req.query;

    const { roles } = req.user;

    const renamedResult = await landownerAggregatePaginationService({
      assigned: parseBooleanQueryParam(assigned),
      isArchived: parseBooleanQueryParam(isArchived),
      limit: Number(limit),
      page: Number(page),
      search: search.toString(),
      roles,
      sort: sort?.toString() as TSort,
    });

    res
      .status(200)
      .json(
        new ApiResponse(
          200,
          renamedResult,
          'Paginated data fetched successfully'
        )
      );
  }
);

const getSingleLandowner = asyncHandler(async (req: Request, res: Response) => {
  const { id: landownerId } = req.params;

  const landowner = await User.findById(landownerId);

  if (!landowner) {
    res.status(200).json(new ApiError(400, 'Landowner not found!'));
  }

  res
    .status(200)
    .json(new ApiResponse(200, landowner, 'Landowner fetched successfully'));
});

const paginatedPropertyData = asyncHandler(
  async (req: Request, res: Response) => {
    const {
      page = 1,
      limit = 10,
      search = '',
      assigned = null,
      landownerId,
      sort,
    } = req.query;
    const { _id: userId, roles } = req.user;

    const renamedResult = await landownerPropertyAggregatePaginationService({
      assigned: parseBooleanQueryParam(assigned),
      limit: Number(limit),
      page: Number(page),
      search: search.toString(),
      userId: landownerId ? landownerId : userId,
      roles,
      sort: sort?.toString() as TSort,
    });

    res
      .status(200)
      .json(
        new ApiResponse(
          200,
          renamedResult,
          'Paginated data fetched successfully'
        )
      );
  }
);

const paginatedPropertyBidsData = asyncHandler(
  async (req: Request, res: Response) => {
    const { page = 1, limit = 10, search = '', propertyId } = req.query;
    const { roles } = req.user;

    const renamedResult = await landownerPropertyBidsPaginationService({
      propertyId: propertyId as string,
      limit: Number(limit),
      page: Number(page),
      search: search.toString(),
      roles,
    });

    res
      .status(200)
      .json(
        new ApiResponse(
          200,
          renamedResult,
          'Paginated data fetched successfully'
        )
      );
  }
);

const archiveLandowner = asyncHandler(async (req: Request, res: Response) => {
  const { id: landownerId } = req.params;

  const archivedLandowner = await User.findByIdAndUpdate(
    {
      _id: landownerId,
    },
    [
      {
        $set: {
          isArchived: { $not: '$isArchived' },
        },
      },
    ]
  );

  if (!archivedLandowner) {
    return res
      .status(201)
      .json(
        new ApiError(400, `Something went wrong while archiving landowner!`)
      );
  }

  res
    .status(200)
    .json(
      new ApiResponse(
        200,
        archivedLandowner,
        'Landowner archived successfully!'
      )
    );
});

const deleteLandowner = asyncHandler(async (req: Request, res: Response) => {
  const { id: landownerId } = req.params;

  // Start a transaction
  const session = await mongoose.startSession();
  session.startTransaction();

  const properties = await Property.find({ landowner: landownerId });

  try {
    // Check if user exists
    if (properties.length > 0) {
      const propertyIds = properties.map((property) => property._id);

      // Delete properties
      await Property.deleteMany({ _id: { $in: propertyIds } }, session);
    }

    const deletedLandowner = await User.findByIdAndDelete(
      {
        _id: landownerId,
      },
      session
    );

    if (!deletedLandowner) {
      return res
        .status(201)
        .json(
          new ApiError(400, `Something went wrong while deleting landowner!`)
        );
    }

    // Commit transaction
    await session.commitTransaction();

    // Send response
    res
      .status(200)
      .json(
        new ApiResponse(
          200,
          deletedLandowner,
          'Landowner deleted successfully!'
        )
      );
  } catch (error: any) {
    // Rollback transaction
    await session.abortTransaction();
    throw new ApiError(500, error.message || 'Failed to update landowner!');
  } finally {
    session.endSession();
  }
});

const changeResearchersBidStatus = asyncHandler(
  async (req: Request, res: Response) => {
    const { id: bidId } = req.params;
    const { status, researcherId, assignDate } = req.body;

    const [findBid] = await Bids.find({
      _id: bidId,
      researcher: researcherId,
    });

    if (!findBid) {
      return res.status(201).json(new ApiError(400, `This user has not bid!`));
    }

    const session = await mongoose.startSession();
    session.startTransaction();

    try {
      const updatedBidStatus = await Bids.findByIdAndUpdate(
        {
          _id: bidId,
        },
        { status },
        {
          new: true,
        }
      ).session(session);

      if (!updatedBidStatus) {
        return res
          .status(201)
          .json(new ApiError(400, `Something went wrong while updating bid!`));
      }

      if (findBid.property) {
        try {
          const assignedResearcherProperty =
            await assignResearcherPropertyService(
              String(findBid.property),
              researcherId,
              assignDate
            );

          if (!assignedResearcherProperty) {
            return res
              .status(201)
              .json(
                new ApiError(
                  400,
                  `Something went wrong while assigning researcher property!`
                )
              );
          }
        } catch (error: any) {
          if (error.statusCode === 409) {
            console.log(
              'Researcher already assigned to property:',
              error.message
            );
          } else {
            throw error;
          }
        }
      }

      await session.commitTransaction();

      res
        .status(200)
        .json(
          new ApiResponse(200, updatedBidStatus, 'Bid updated successfully!')
        );
    } catch (error: any) {
      await session.abortTransaction();
      throw new ApiError(500, error.message || 'Failed to update bid!');
    } finally {
      session.endSession();
    }
  }
);

const updateLandownerNote = asyncHandler(
  async (req: Request, res: Response) => {
    const { id: landownerId } = req.params;
    const { note } = req.body;
    const { _id: userId } = req.user;

    // Find the landowner
    const landowner = await User.findById(landownerId);

    if (!landowner) {
      return res.status(404).json(new ApiError(404, 'Landowner not found!'));
    }

    if (landowner.roles !== 'landowner') {
      return res
        .status(400)
        .json(new ApiError(400, 'User is not a landowner!'));
    }

    // Set the user context for the middleware
    (landowner as any).__user = req.user;

    // Update the note
    landowner.note = note;
    landowner.noteUpdatedBy = userId;

    await landowner.save();

    res
      .status(200)
      .json(
        new ApiResponse(200, landowner, 'Landowner note updated successfully')
      );
  }
);

export {
  addLandowner,
  updateLandowner,
  paginatedLandownerData,
  archiveLandowner,
  deleteLandowner,
  paginatedPropertyData,
  changeResearchersBidStatus,
  paginatedPropertyBidsData,
  getSingleLandowner,
  updateLandownerNote,
};
