import { ClientSession } from 'mongoose';
import { ROLES } from '../constants.js';
import { User } from '../models/user.model.js';
import {
  createDynamicFilter,
  transformPaginatedResponse,
} from '../utils/utils.js';
import {
  IlandownerAggregatePaginationServiceParams,
  IlandownerReportAggregatePaginationServiceParams,
} from '../interface/landowner.interface.js';

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
  const assignedFilter = createDynamicFilter({ assigned, isArchived });

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

  const beforeMatchQuery = assignedFilter.isArchived
    ? { isArchived: assignedFilter.isArchived, ...searchQuery }
    : { ...searchQuery };

  const filters = {
    roles: ROLES.LANDOWNER,
    ...beforeMatchQuery,
  };

  const aggregatePipeline = [
    { $match: filters },
    {
      $lookup: {
        from: 'properties',
        let: { landownerId: '$_id' },
        pipeline: [
          { $match: { $expr: { $eq: ['$landowner', '$$landownerId'] } } },
          {
            $lookup: {
              from: 'reports',
              let: { propertyId: '$_id' },
              pipeline: [
                { $match: { $expr: { $eq: ['$property', '$$propertyId'] } } },
                {
                  $project: {
                    _id: 1,
                    'landAssessmentReport.url': 1,
                    'landAssessmentReport.name': 1,
                    createdAt: 1,
                    updatedAt: 1,
                  },
                },
              ],
              as: 'reports',
            },
          },
          {
            $project: {
              _id: 1,
              propertyName: 1,
              propertyLocation: 1,
              propertySize: 1,
              landAssessmentReport: 1,
              reports: 1,
            },
          },
        ],
        as: 'properties',
      },
    },
    {
      $addFields: {
        assigned: {
          $cond: {
            if: {
              $gt: [{ $size: { $ifNull: ['$properties.reports', []] } }, 0],
            },
            then: true,
            else: false,
          },
        },
      },
    },
    ...(Object.hasOwn(assignedFilter, 'assigned')
      ? [
          {
            $match: { assigned: assignedFilter.assigned },
          },
        ]
      : []),
    {
      $project: {
        name: 1,
        email: 1,
        phone: 1,
        properties: 1,
        isArchived: 1,
        assigned: 1,
        createdAt: 1,
      },
    },
  ];

  const aggregateLandownerData = User.aggregate(aggregatePipeline);

  const result = await User.aggregatePaginate(aggregateLandownerData, options);

  return transformPaginatedResponse(result, 'landowner');
};

const landownerReportAggregatePaginationService = async ({
  page,
  limit,
  search,
  assigned,
  userId,
}: IlandownerReportAggregatePaginationServiceParams): Promise<any> => {
  const assignedFilter = createDynamicFilter({ assigned });

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
          { 'properties.propertyLocation': { $regex: search, $options: 'i' } },
        ],
      }
    : {};

  const afterMatchQuery =
    assignedFilter.assigned !== undefined
      ? { assigned: assignedFilter.assigned }
      : {};

  const aggregatePipeline = [
    {
      $match: {
        ...searchQuery,
        _id: userId,
      },
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
        let: { propertyId: '$properties._id' },
        pipeline: [
          { $match: { $expr: { $eq: ['$property', '$$propertyId'] } } },
          {
            $lookup: {
              from: 'bids',
              let: { reportId: '$_id' },
              pipeline: [
                { $match: { $expr: { $eq: ['$report', '$$reportId'] } } },
                {
                  $lookup: {
                    from: 'users',
                    localField: 'researcher',
                    foreignField: '_id',
                    as: 'researcher',
                  },
                },
                {
                  $unwind: {
                    path: '$researcher',
                    preserveNullAndEmptyArrays: true,
                  },
                },
                {
                  $project: {
                    _id: 1,
                    researcher: {
                      _id: 1,
                      name: 1,
                      email: 1,
                    },
                    status: 1,
                    createdAt: 1,
                    updatedAt: 1,
                  },
                },
              ],
              as: 'bids',
            },
          },
          {
            $project: {
              _id: 1,
              landAssessmentReport: 1,
              createdAt: 1,
              updatedAt: 1,
              bids: 1,
            },
          },
        ],
        as: 'properties.reports',
      },
    },
    {
      $addFields: {
        numOfDocs: { $size: { $ifNull: ['$properties.reports', []] } },
        assigned: {
          $gt: [{ $size: { $ifNull: ['$properties.reports', []] } }, 0],
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
          reports: 1, // Includes populated reports with bids and researcher details
        },
        numOfDocs: 1,
        isArchived: 1,
        assigned: 1,
        createdAt: 1,
      },
    },
    {
      $match: {
        ...afterMatchQuery,
      },
    },
  ];

  const aggregateLandownerData = User.aggregate(aggregatePipeline);

  const result = await User.aggregatePaginate(aggregateLandownerData, options);

  return transformPaginatedResponse(result, 'reports');
};

export {
  findOrUpdateLandowner,
  landownerAggregatePaginationService,
  landownerReportAggregatePaginationService,
};
