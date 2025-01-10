import { Request, Response } from 'express';
import { asyncHandler } from '../utils/asyncHandler.js';
import {
  generatePassword,
  isValidObjectId,
  transformPaginatedResponse,
} from '../utils/utils.js';
import { ApiResponse } from '../utils/ApiResponse.js';
import { ApiError } from '../utils/ApiError.js';
import { Property } from '../models/property.model.js';
import { Bids } from '../models/bids.model.js';
import { User } from '../models/user.model.js';
import { Report } from '../models/reports.model.js';
import { IUpdateResearcher } from '../interface/researcher.interface.js';
import { PLATFORM_NAME, ROLES } from '../constants.js';
import mongoose from 'mongoose';
import { findOrUpdateLandowner } from '../services/landowner.service.js';
import sendEmail from '../utils/sendMail.js';

const paginatedResearchers = asyncHandler(
  async (req: Request, res: Response) => {
    const { page = 1, limit = 10, search = '', isApproved = null } = req.query;

    const assignedFilter: Record<string, any> = {};

    if (isApproved !== null && isApproved !== '') {
      assignedFilter.isApproved = isApproved === 'true';
    }

    assignedFilter.roles = 'researcher';

    const options = {
      page,
      limit,
    };

    const searchQuery = search
      ? {
          $or: [
            { name: { $regex: search, $options: 'i' } },
            { email: { $regex: search, $options: 'i' } },
            { phone: { $regex: search, $options: 'i' } },
          ],
        }
      : {};

    const matchQuery = assignedFilter
      ? {
          ...searchQuery,
          ...assignedFilter,
        }
      : {
          ...searchQuery,
        };

    const aggregateResearcherData = User.aggregate([
      {
        $match: matchQuery,
      },
      {
        $lookup: {
          from: 'assignresearcherreports',
          let: { userId: '$_id' },
          pipeline: [
            {
              $match: {
                $expr: {
                  $in: ['$$userId', '$researchers'],
                },
              },
            },
            {
              $group: {
                _id: null,
                count: { $sum: 1 },
              },
            },
            {
              $project: {
                _id: 0,
                count: 1,
              },
            },
          ],
          as: 'assigned',
        },
      },
      {
        $addFields: {
          assigned: { $arrayElemAt: ['$assigned.count', 0] },
        },
      },
      {
        $lookup: {
          from: 'bids',
          let: { researcherId: '$_id' },
          pipeline: [
            {
              $match: {
                $expr: { $eq: ['$researcher', '$$researcherId'] },
              },
            },
            {
              $group: {
                _id: '$status',
                count: { $sum: 1 },
              },
            },
            {
              $project: {
                status: '$_id',
                count: 1,
                _id: 0,
              },
            },
          ],
          as: 'bidCounts',
        },
      },
      {
        $addFields: {
          bidCounts: {
            $arrayToObject: {
              $map: {
                input: '$bidCounts',
                as: 'item',
                in: {
                  k: '$$item.status',
                  v: '$$item.count',
                },
              },
            },
          },
        },
      },
      {
        $addFields: {
          pending: { $ifNull: ['$bidCounts.pending', 0] },
          inprogress: { $ifNull: ['$bidCounts.inprogress', 0] },
          completed: { $ifNull: ['$bidCounts.completed', 0] },
          rejected: { $ifNull: ['$bidCounts.rejected', 0] },
        },
      },
      {
        $project: {
          _id: 1,
          name: 1,
          email: 1,
          phone: 1,
          assigned: 1,
          pending: 1,
          inprogress: 1,
          completed: 1,
          rejected: 1,
        },
      },
    ]);

    const result = await User.aggregatePaginate(
      aggregateResearcherData,
      options
    );

    const renamedResult = transformPaginatedResponse(result, 'researchers');

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

const paginatedResearcherReportData = asyncHandler(
  async (req: Request, res: Response) => {
    const { page = 1, limit = 10, search = '', assigned = null } = req.query;

    const assignedFilter = assigned === 'true';

    const options = {
      page,
      limit,
    };

    const searchQuery = search
      ? {
          $or: [
            { landownerName: { $regex: search, $options: 'i' } },
            { landownerEmail: { $regex: search, $options: 'i' } },
            { reportName: { $regex: search, $options: 'i' } },
            {
              reportUrl: { $regex: search, $options: 'i' },
            },
          ],
        }
      : {};

    const matchQuery = assigned
      ? {
          assigned: assignedFilter,
          ...searchQuery,
        }
      : {
          ...searchQuery,
        };

    const aggregateLandownerData = Property.aggregate([
      {
        $lookup: {
          from: 'bids',
          localField: '_id',
          foreignField: 'property',
          as: 'bidDetails',
        },
      },
      {
        $unwind: {
          path: '$landAssessmentReport',
          preserveNullAndEmptyArrays: true,
        },
      },
      {
        $lookup: {
          from: 'users',
          localField: 'landowner',
          foreignField: '_id',
          as: 'landownerDetails',
        },
      },
      {
        $addFields: {
          reportId: '$landAssessmentReport._id',
          landownerName: {
            $arrayElemAt: ['$landownerDetails.name', 0],
          },
          landownerEmail: {
            $arrayElemAt: ['$landownerDetails.email', 0],
          },
          reportName: '$propertyName',
          reportUrl: '$landAssessmentReport.url',
          propertyId: '$_id',
          bidId: {
            $ifNull: [{ $arrayElemAt: ['$bidDetails._id', 0] }, null], // Extract only `_id` from `bidDetails`
          },
          bidStatus: {
            $ifNull: [{ $arrayElemAt: ['$bidDetails.status', 0] }, null], // Extract only `_id` from `bidDetails`
          },
        },
      },
      {
        $project: {
          reportId: 1,
          landownerName: 1,
          landownerEmail: 1,
          reportName: 1,
          reportUrl: 1,
          propertyId: 1,
          _id: 0,
          bidId: 1,
          bidStatus: 1,
        },
      },
      {
        $match: {
          ...matchQuery,
        },
      },
    ]);

    const result = await Property.aggregatePaginate(
      aggregateLandownerData,
      options
    );

    const renamedResult = transformPaginatedResponse(result, 'bidsResult');

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

const placeBidResearch = asyncHandler(async (req: Request, res: Response) => {
  const { id: reportId } = req.params;
  const { _id: userId } = req.user;
  const { status, description } = req.body;

  if (!reportId || !isValidObjectId(reportId)) {
    return res
      .status(201)
      .json(new ApiError(400, `Please enter a valid property id!`));
  }

  const findReport = await Report.findById(reportId);

  if (!findReport) {
    return res
      .status(201)
      .json(new ApiResponse(400, findReport, `Report doesnot exists!`));
  }

  const [findBid] = await Bids.find({
    researcher: userId,
    report: reportId,
  });

  if (findBid) {
    return res
      .status(201)
      .json(new ApiResponse(400, findBid, `Bid already exists!`));
  }

  const createdBid = await Bids.create({
    report: reportId,
    researcher: userId,
    status,
    description,
  });

  if (!createdBid) {
    return res
      .status(201)
      .json(new ApiError(400, `Something went wrong while creating bid!`));
  }

  res
    .status(200)
    .json(new ApiResponse(200, createdBid, 'Bid created successfully!'));
});

const changeResearchersStatus = asyncHandler(
  async (req: Request, res: Response) => {
    const { id: researcherId } = req.params;
    const { status } = req.body;

    const findUser = await User.findById(researcherId);

    if (!findUser) {
      return res
        .status(201)
        .json(new ApiError(400, `Please enter a valid researcher id!`));
    }

    const updatedUserStatus = await User.findByIdAndUpdate(
      {
        _id: researcherId,
      },
      { status },
      {
        new: true,
      }
    );

    if (!updatedUserStatus) {
      return res
        .status(201)
        .json(new ApiError(400, `Something went wrong while updating User!`));
    }

    res
      .status(200)
      .json(
        new ApiResponse(200, updatedUserStatus, 'User updated successfully!')
      );
  }
);

const archiveResearcher = asyncHandler(async (req: Request, res: Response) => {
  const { id: researcherId } = req.params;

  const archivedResearcher = await User.findByIdAndUpdate(
    {
      _id: researcherId,
    },
    [
      {
        $set: {
          isArchived: { $not: '$isArchived' },
        },
      },
    ],
    {
      new: true,
      runValidators: true,
    }
  );

  if (!archivedResearcher) {
    return res
      .status(201)
      .json(
        new ApiError(400, `Something went wrong while archiving researcher!`)
      );
  }

  res
    .status(200)
    .json(
      new ApiResponse(
        200,
        archivedResearcher,
        'Researcher archived successfully!'
      )
    );
});

const deleteResearcher = asyncHandler(async (req: Request, res: Response) => {
  const { id: researcherId } = req.params;

  const deletedResearcher = await User.findByIdAndDelete({
    _id: researcherId,
  });

  if (!deletedResearcher) {
    return res
      .status(201)
      .json(
        new ApiError(400, `Something went wrong while deleting researcher!`)
      );
  }

  res
    .status(200)
    .json(
      new ApiResponse(
        200,
        deletedResearcher,
        'Researcher deleted successfully!'
      )
    );
});

const updateResearcher = asyncHandler(async (req: Request, res: Response) => {
  const { id: userId } = req.params;

  // Check if user exists
  const user = await User.findById(userId);
  if (!user) {
    throw new ApiError(404, 'User does not exist!');
  }

  // Update user details
  const updatedResearcher = await User.findByIdAndUpdate(user, req.body, {
    new: true,
    runValidators: true,
  });

  // Send response
  res
    .status(200)
    .json(
      new ApiResponse(200, updatedResearcher, 'Researcher updated successfully')
    );
});

// Add Landowner by email
const addResearcher = asyncHandler(async (req: Request, res: Response) => {
  const { name, email, phone }: IUpdateResearcher = req.body;

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
    roles: ROLES.RESEARCHER,
  };

  // Send the password to the user's email
  try {
    const user = await findOrUpdateLandowner(landownerData, session);

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
          'Researcher added successfully. Password has been sent to the email.'
        )
      );
  } catch (error: any) {
    // Rollback transaction
    await session.abortTransaction();
    throw new ApiError(500, error.message || 'Failed to create Researcher!');
  } finally {
    // End session
    session.endSession();
  }
});

const fetchResearcher = asyncHandler(async (req: Request, res: Response) => {
  const { id: userId } = req.params;

  const user = await User.aggregate([
    {
      $match: {
        _id: new mongoose.Types.ObjectId(userId),
      },
    },
    {
      $lookup: {
        from: 'assignresearcherreports',
        let: { userId: '$_id' },
        pipeline: [
          {
            $match: {
              $expr: {
                $in: ['$$userId', '$researchers'],
              },
            },
          },
          {
            $group: {
              _id: null,
              count: { $sum: 1 },
            },
          },
          {
            $project: {
              _id: 0,
              count: 1,
            },
          },
        ],
        as: 'assigned',
      },
    },
    {
      $addFields: {
        assigned: { $arrayElemAt: ['$assigned.count', 0] },
      },
    },
    {
      $lookup: {
        from: 'bids',
        let: { researcherId: '$_id' },
        pipeline: [
          {
            $match: {
              $expr: { $eq: ['$researcher', '$$researcherId'] },
            },
          },
          {
            $group: {
              _id: '$status',
              count: { $sum: 1 },
            },
          },
          {
            $project: {
              status: '$_id',
              count: 1,
              _id: 0,
            },
          },
        ],
        as: 'bidCounts',
      },
    },
    {
      $addFields: {
        bidCounts: {
          $arrayToObject: {
            $map: {
              input: '$bidCounts',
              as: 'item',
              in: {
                k: '$$item.status',
                v: '$$item.count',
              },
            },
          },
        },
      },
    },
    {
      $addFields: {
        pending: { $ifNull: ['$bidCounts.pending', 0] },
        inprogress: { $ifNull: ['$bidCounts.inprogress', 0] },
        completed: { $ifNull: ['$bidCounts.completed', 0] },
        rejected: { $ifNull: ['$bidCounts.rejected', 0] },
      },
    },
    {
      $project: {
        _id: 1,
        name: 1,
        email: 1,
        phone: 1,
        assigned: 1,
        pending: 1,
        inprogress: 1,
        completed: 1,
        rejected: 1,
      },
    },
  ]);

  if (!user.length) {
    throw new ApiError(404, 'User does not exist!');
  }

  // Send response
  res
    .status(200)
    .json(new ApiResponse(200, user[0], 'Researcher user data successfully'));
});

export {
  paginatedResearcherReportData,
  placeBidResearch,
  paginatedResearchers,
  changeResearchersStatus,
  archiveResearcher,
  deleteResearcher,
  updateResearcher,
  addResearcher,
  fetchResearcher,
};
