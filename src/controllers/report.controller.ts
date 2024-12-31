import { transformPaginatedResponse } from '../utils/utils.js';
import { Response, Request } from 'express';
import { User } from '../models/user.model.js';
import { ApiResponse } from '../utils/ApiResponse.js';
import { asyncHandler } from '../utils/asyncHandler.js';
import { ROLES } from '../constants.js';

const paginatedReports = asyncHandler(async (req: Request, res: Response) => {
  const {
    page = 1,
    limit = 10,
    search = '',
    isArchived = null,
    assigned = null,
  } = req.query;

  const assignedFilter: Record<string, any> = {};

  if (assigned !== null && assigned !== '') {
    assignedFilter.assigned = assigned === 'true';
  }

  if (isArchived !== null && isArchived !== '') {
    assignedFilter.isArchived = isArchived === 'true';
  }

  const options = {
    page,
    limit,
  };

  const searchQuery = search
    ? {
        $or: [
          { name: { $regex: search, $options: 'i' } },
          { email: { $regex: search, $options: 'i' } },
          { 'properties.propertyName': { $regex: search, $options: 'i' } },
          {
            'properties.propertyLocation': { $regex: search, $options: 'i' },
          },
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
        numOfDocs: {
          $size: {
            $ifNull: ['$properties.landAssessmentReport', []],
          },
        },
        assigned: {
          $gt: [
            {
              $size: {
                $ifNull: ['$properties.landAssessmentReport', []],
              },
            },
            0,
          ],
        },
      },
    },
    {
      $project: {
        name: 1,
        email: 1,
        phone: 1,
        properties: {
          propertyName: 1,
          propertyLocation: 1,
          propertySize: 1,
          landAssessmentReport: 1,
          property: 1,
        },
        numOfDocs: 1,
        isArchived: 1,
        assigned: 1,
        createdAt: 1,
      },
    },
    {
      $match: matchQuery,
    },
  ]);

  const result = await User.aggregatePaginate(aggregateLandownerData, options);

  const renamedResult = transformPaginatedResponse(result, 'landowner');

  res
    .status(200)
    .json(
      new ApiResponse(200, renamedResult, 'Paginated data fetched successfully')
    );
});

export { paginatedReports };
