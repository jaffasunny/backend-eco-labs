import { generatePassword, parseBooleanQueryParam } from '../utils/utils.js';
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
  findOrUpdateUser,
  getPaginatedUniversityResearchersService,
  getSingleUniversityService,
  universityAggregatePaginationService,
} from '../services/landowner.service.js';
import {
  IAddUniversityParams,
  IUpdateUniversity,
} from '../interface/university.interface.js';

// Add University by email
const addUniversity = asyncHandler(async (req: Request, res: Response) => {
  const { name, email, phone ,contactName}: IAddUniversityParams = req.body;

  // Start a transaction
  const session = await mongoose.startSession();
  session.startTransaction();

  // Generate system-generated password
  const password = generatePassword();

  const universityData = {
    name,
    email,
    phone,
    password,
    contactName,
    roles: ROLES.UNIVERSITY,
  };

  // Send the password to the user's email
  try {
    const user = await findOrUpdateUser(universityData, session);

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
          { user },
          'University added successfully. Password has been sent to the email.'
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

const updateUniversity = asyncHandler(async (req: Request, res: Response) => {
  const { id: userId } = req.params;
  const { name, email, password, phone,contactName }: IUpdateUniversity = req.body;

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
      ROLES.UNIVERSITY,
      { name, email, password, phone ,contactName},
      session
    );

    // Commit transaction
    await session.commitTransaction();

    // Send response
    res
      .status(200)
      .json(new ApiResponse(200, 'University updated successfully!'));
  } catch (error: any) {
    // Rollback transaction
    await session.abortTransaction();
    throw new ApiError(500, error.message || 'Failed to update property!');
  } finally {
    // End session
    session.endSession();
  }
});

const paginatedUniversityData = asyncHandler(
  async (req: Request, res: Response) => {
    const {
      page = 1,
      limit = 10,
      search = '',
      isArchived = null,
      assigned = null,
    } = req.query;

    const renamedResult = await universityAggregatePaginationService({
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

const getSingleUniversity = asyncHandler(
  async (req: Request, res: Response) => {
    const { id } = req.params;

    const fetchedUni = await getSingleUniversityService(id as string);

    res
      .status(200)
      .json(new ApiResponse(200, fetchedUni, 'data fetched successfully'));
  }
);

const getPaginatedUniversityResearchers = asyncHandler(
  async (req: Request, res: Response) => {
    const {
      page = 1,
      limit = 10,
      search = '',
      isArchived = null,
      assigned = null,
    } = req.query;

    const { id: uniId } = req.params;

    const renamedResult = await getPaginatedUniversityResearchersService({
      assigned: parseBooleanQueryParam(assigned),
      isArchived: parseBooleanQueryParam(isArchived),
      limit: Number(limit),
      page: Number(page),
      search: search.toString(),
      uniId: uniId as string,
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

const archiveUniversity = asyncHandler(async (req: Request, res: Response) => {
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
        'University archived successfully!'
      )
    );
});

const deleteUniversity = asyncHandler(async (req: Request, res: Response) => {
  const { id: landownerId } = req.params;

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
      new ApiResponse(200, deletedLandowner, 'University deleted successfully!')
    );
});

export {
  addUniversity,
  updateUniversity,
  paginatedUniversityData,
  archiveUniversity,
  deleteUniversity,
  getPaginatedUniversityResearchers,
  getSingleUniversity,
};
