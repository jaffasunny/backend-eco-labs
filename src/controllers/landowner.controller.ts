import { generatePassword } from './../utils/utils';
import { Response, Request } from 'express';
import { User } from '../models/user.model';
import { ApiError } from '../utils/ApiError';
import { ApiResponse } from '../utils/ApiResponse';
import { asyncHandler } from '../utils/asyncHandler';
import sendEmail from '../utils/sendMail';
import { ROLES } from '../constants';
import mongoose from 'mongoose';
import { updateUserDetails } from '../services/user.service';
import {
  fetchPopulatedProperty,
  findOrUpdateProperty,
} from '../services/property.service';

// Add Landowner by email
const addLandowner = asyncHandler(async (req: Request, res: Response) => {
  const { email } = req.body;

  const existedUser = await User.findOne({ $or: [{ email }] });

  // Check if the email already exists (replace with actual DB logic)
  if (existedUser) {
    return res.status(400).json({ message: 'Email already exists' });
  }

  // Generate system-generated password
  const password = generatePassword();

  const user = await User.create({
    name: 'Auto generated Landowner',
    email,
    password,
    roles: ROLES.LANDOWNER,
  });

  // Send the password to the user's email
  try {
    await sendEmail(
      email,
      'Your System Generated Password',
      `Welcome! Here is your system-generated password: ${password}`
    );

    return res
      .status(201)
      .json(
        new ApiResponse(
          201,
          user,
          'Email added successfully. Password has been sent to the email.'
        )
      );
  } catch (error: any) {
    return res
      .status(201)
      .json(new ApiError(500, `Error sending email ${error.message}`));
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
    phone,
  } = req.body;

  const files = req.files as Express.Multer.File[];

  if (!files || !files.length) {
    throw new ApiError(400, 'No files uploaded');
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
      files,
      userId,
      session
    );

    if (property) {
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
            userWithProperty,
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

const paginatedLandownerData = asyncHandler(
  async (req: Request, res: Response) => {
    const { page = 1, limit = 10 } = req.query;

    const options = {
      page,
      limit,
    };

    const aggregateLandownerData = User.aggregate([
      {
        $match: { roles: ROLES.LANDOWNER },
      },
      {
        $lookup: {
          from: 'properties',
          localField: '_id',
          foreignField: 'landowner',
          as: 'properties',
        },
      },
      {
        $unwind: {
          path: '$properties',
          preserveNullAndEmptyArrays: true,
        },
      },
      {
        $addFields: {
          sumOfDocs: {
            // Calculate the sum of landAssessmentReport documents
            $size: '$properties.landAssessmentReport',
          },
          assigned: {
            $gt: [{ $size: '$properties.landAssessmentReport' }, 0],
          },
        },
      },

      {
        $project: {
          name: 1,
          email: 1,
          phone: 1,
          properties: {
            // Only include relevant property fields
            propertyName: 1,
            propertyLocation: 1,
            propertySize: 1,
            landAssessmentReport: 1,
            property: 1,
          },
          sumOfDocs: 1,
          assigned: 1,
          createdAt: 1,
        },
      },
    ]);

    const result = await User.aggregatePaginate(
      aggregateLandownerData,
      options
    );

    const { docs, ...rest } = result;

    const renamedResult = {
      landowners: docs,
      ...rest,
    };

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

export { addLandowner, updateLandowner, paginatedLandownerData };
