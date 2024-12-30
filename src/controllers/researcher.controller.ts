import { Request, Response } from 'express';
import { asyncHandler } from '../utils/asyncHandler.js';
import { isValidObjectId, transformPaginatedResponse } from '../utils/utils.js';
import { ApiResponse } from '../utils/ApiResponse.js';
import { ApiError } from '../utils/ApiError.js';
import { Property } from '../models/property.model.js';
import { Bids } from '../models/bids.model.js';
import { User } from '../models/user.model.js';

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
        $match: {
          ...matchQuery,
        },
      },
      {
        $project: {
          refreshTokens: 0,
          password: 0,
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
          'Paginated data fetched successfully helloooo'
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
  const { id: propertyId } = req.params;
  const { _id: userId } = req.user;
  const { status } = req.body;

  if (!propertyId || !isValidObjectId(propertyId)) {
    return res
      .status(201)
      .json(new ApiError(400, `Please enter a valid property id!`));
  }

  const findBid = await Bids.find({
    researcher: userId,
    property: propertyId,
  });

  if (findBid.length) {
    return res
      .status(201)
      .json(new ApiResponse(400, findBid[0], `Bid already exists!`));
  }

  const createdBid = await Bids.create({
    property: propertyId,
    researcher: userId,
    status,
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

    if (!researcherId || !isValidObjectId(researcherId)) {
      return res
        .status(201)
        .json(new ApiError(400, `Please enter a valid researcher id!`));
    }

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

export {
  paginatedResearcherReportData,
  placeBidResearch,
  paginatedResearchers,
  changeResearchersStatus,
};
