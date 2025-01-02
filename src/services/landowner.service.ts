import { AggregatePaginateResult, ClientSession } from 'mongoose';
import { ROLES } from '../constants.js';
import { User } from '../models/user.model.js';
import { transformPaginatedResponse } from '../utils/utils.js';
import { IlandownerAggregatePaginationServiceParams } from '../interface/landowner.interface.js';

const findOrUpdateLandowner = async (
  landownerData: {
    name: string;
    email: string;
    phone: string | undefined;
    password: string;
    roles: ROLES;
  },
  session: ClientSession
) => {
  let existedUser = await User.findOne({
    $or: [{ email: landownerData.email }],
  }).session(session);

  if (existedUser) {
    // Update existing property
    existedUser.name = landownerData.name;
    existedUser.email = landownerData.email;
    existedUser.phone = landownerData.phone;
    existedUser.roles = landownerData.roles;
    await existedUser.save({ session });
    existedUser.isNew = false; // Flag for response
  } else {
    // Create a new property
    const [createdUser] = await User.create(
      [
        {
          name: landownerData.name,
          email: landownerData.email,
          phone: landownerData.phone,
          password: landownerData.password,
          roles: landownerData.roles,
        },
      ],
      { session }
    );
    existedUser = createdUser;
    existedUser.isNew = true; // Flag for response
  }
  return existedUser;
};

const landownerAggregatePaginationService = async ({
  page,
  limit,
  search,
  isArchived,
  assigned,
}: IlandownerAggregatePaginationServiceParams): Promise<any> => {
  const assignedFilter: Record<string, any> = {};

  if (assigned !== null) {
    assignedFilter.assigned = assigned;
  }

  if (isArchived !== null) {
    assignedFilter.isArchived = isArchived;
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
      $lookup: {
        from: 'reports',
        localField: 'properties._id',
        foreignField: 'property',
        as: 'properties.reports',
      },
    },
    {
      $unwind: {
        path: '$properties.reports.landAssessmentReport',
        preserveNullAndEmptyArrays: true,
      },
    },
    {
      $project: {
        name: 1,
        email: 1,
        phone: 1,
        properties: {
          _id: 1,
          propertyName: 1,
          propertyLocation: 1,
          propertySize: 1,
          landAssessmentReport: 1,
          reports: {
            $map: {
              input: '$properties.reports',
              as: 'report',
              in: {
                _id: '$$report._id',
                landAssessmentReport: {
                  url: '$$report.landAssessmentReport.url',
                  name: '$$report.landAssessmentReport.name',
                },
                createdAt: '$$report.createdAt',
                updatedAt: '$$report.updatedAt',
              },
            },
          },
        },
        isArchived: 1,
        assigned: {
          $cond: {
            if: {
              $gt: [{ $size: '$properties.reports.landAssessmentReport' }, 0],
            },
            then: true,
            else: false,
          },
        },
        createdAt: 1,
      },
    },
    {
      $match: matchQuery,
    },
  ]);

  const result = await User.aggregatePaginate(aggregateLandownerData, options);

  return transformPaginatedResponse(result, 'landowner');
};

export { findOrUpdateLandowner, landownerAggregatePaginationService };
