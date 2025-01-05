import { generatePassword, parseBooleanQueryParam } from './../utils/utils.js';
import { Response, Request } from 'express';
import { User } from '../models/user.model.js';
import { ApiError } from '../utils/ApiError.js';
import { ApiResponse } from '../utils/ApiResponse.js';
import { asyncHandler } from '../utils/asyncHandler.js';
import sendEmail from '../utils/sendMail.js';
import { PLATFORM_NAME, ROLES } from '../constants.js';
import mongoose, { isValidObjectId } from 'mongoose';
import { updateUserDetails } from '../services/user.service.js';
import {
  fetchPopulatedProperty,
  findOrUpdateProperty,
} from '../services/property.service.js';
import { createOrUpdateReportsService } from '../services/report.service.js';
import {
  IAssignReport,
  IUpdateLandowner,
} from '../interface/property.interface.js';
import {
  findOrUpdateLandowner,
  landownerAggregatePaginationService,
  landownerReportAggregatePaginationService,
} from '../services/landowner.service.js';
import { IAddLandownerParams } from '../interface/landowner.interface.js';
import { Bids } from '../models/bids.model.js';

// Add Landowner by email
const addLandowner = asyncHandler(async (req: Request, res: Response) => {
  const {
    name,
    email,
    phone,
    propertyName,
    propertyLocation,
    propertySize,
  }: IAddLandownerParams = req.body;

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
    const user = await findOrUpdateLandowner(landownerData, session);

    const property = await findOrUpdateProperty(
      propertyName,
      propertyLocation,
      propertySize,
      user._id,
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

    return res
      .status(201)
      .json(
        new ApiResponse(
          201,
          { user, property },
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
  const {
    name,
    email,
    password,
    propertyName,
    propertyLocation,
    propertySize,
    landAssessmentReport,
    phone,
  }: IUpdateLandowner = req.body;

  // const files = req.files as Express.Multer.File[];

  // if (!files || !files.length) {
  //   throw new ApiError(400, 'No files uploaded');
  // }

  if (!userId || !isValidObjectId(userId)) {
    return res
      .status(201)
      .json(new ApiError(400, `Please enter a valid user id!`));
  }

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

    // Check if property exists
    const property = await findOrUpdateProperty(
      propertyName,
      propertyLocation,
      propertySize,
      // files,
      // landAssessmentReport,
      userId,
      session
    );

    if (property) {
      const reportData = {
        landAssessmentReport: landAssessmentReport || [],
        property: property._id,
      };

      const createdReport = await createOrUpdateReportsService(
        reportData,
        session
      );

      // Fetch updated property details
      const userWithProperty = await fetchPopulatedProperty(
        property._id.toString(),
        session
      );

      // Commit transaction
      await session.commitTransaction();

      // Send response
      res
        .status(200)
        .json(
          new ApiResponse(
            200,
            { userWithProperty, createdReport },
            property.isNew
              ? 'Property created successfully!'
              : 'Property updated successfully!'
          )
        );
    }
  } catch (error: any) {
    // Rollback transaction
    await session.abortTransaction();
    throw new ApiError(500, error.message || 'Failed to update property!');
  } finally {
    // End session
    session.endSession();
  }
});

const assignReport = asyncHandler(async (req: Request, res: Response) => {
  const { property, landAssessmentReport }: IAssignReport = req.body;

  // Start a transaction
  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    if (property) {
      const reportData = {
        landAssessmentReport: landAssessmentReport || [],
        property: property as string,
      };

      const createdReport = await createOrUpdateReportsService(
        reportData,
        session
      );

      // Fetch updated property details
      const userWithProperty = await fetchPopulatedProperty(
        property as string,
        session
      );

      // Commit transaction
      await session.commitTransaction();

      // Send response
      res
        .status(200)
        .json(new ApiResponse(200, { userWithProperty, createdReport }));
    }
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
    } = req.query;

    const renamedResult = await landownerAggregatePaginationService({
      assigned: parseBooleanQueryParam(assigned),
      isArchived: parseBooleanQueryParam(isArchived),
      limit: Number(limit),
      page: Number(page),
      search: search.toString(),
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

const paginatedReportData = asyncHandler(
  async (req: Request, res: Response) => {
    const { page = 1, limit = 10, search = '', assigned = null } = req.query;
    const { _id: userId } = req.user;

    const renamedResult = await landownerReportAggregatePaginationService({
      assigned: parseBooleanQueryParam(assigned),
      limit: Number(limit),
      page: Number(page),
      search: search.toString(),
      userId,
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

  if (!landownerId || !isValidObjectId(landownerId)) {
    return res
      .status(201)
      .json(new ApiError(400, `Please enter a valid landowner id!`));
  }

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

  if (!landownerId || !isValidObjectId(landownerId)) {
    return res
      .status(201)
      .json(new ApiError(400, `Please enter a valid landowner id!`));
  }

  const deletedLandowner = await User.findByIdAndDelete({
    _id: landownerId,
  });

  if (!deletedLandowner) {
    return res
      .status(201)
      .json(
        new ApiError(400, `Something went wrong while deleting landowner!`)
      );
  }

  res
    .status(200)
    .json(
      new ApiResponse(200, deletedLandowner, 'Landowner deleted successfully!')
    );
});

const changeResearchersBidStatus = asyncHandler(
  async (req: Request, res: Response) => {
    const { id: bidId } = req.params;
    const { status, researcherId } = req.body;

    const [findBid] = await Bids.find({
      _id: bidId,
      researcher: researcherId,
    });

    if (!findBid) {
      return res.status(201).json(new ApiError(400, `This user has not bid!`));
    }

    const updatedBidStatus = await Bids.findByIdAndUpdate(
      {
        _id: bidId,
      },
      { status },
      {
        new: true,
      }
    );

    if (!updatedBidStatus) {
      return res
        .status(201)
        .json(new ApiError(400, `Something went wrong while updating bid!`));
    }

    res
      .status(200)
      .json(
        new ApiResponse(200, updatedBidStatus, 'Bid updated successfully!')
      );
  }
);

export {
  addLandowner,
  updateLandowner,
  paginatedLandownerData,
  archiveLandowner,
  deleteLandowner,
  paginatedReportData,
  assignReport,
  changeResearchersBidStatus,
};
