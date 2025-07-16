import mongoose, { ClientSession, Schema } from 'mongoose';
import { CONSTANTS, MODELS, ResearchStatusType, ROLES } from '../constants.js';
import { User } from '../models/user.model.js';
import {
  createDynamicFilter,
  parseSortParameter,
  toMongoId,
  transformPaginatedResponse,
} from '../utils/utils.js';
import {
  IlandownerAggregatePaginationServiceParams,
  IlandownerPropertyBidsAggregatePaginationServiceParams,
  IlandownerPropertyAggregatePaginationServiceParams,
  IUniversityAggregatePaginationServiceParams,
} from '../interface/landowner.interface.js';
import { Bids } from '../models/bids.model.js';
import { Property } from '../models/property.model.js';
import { ApiError } from '../utils/ApiError.js';

const findOrUpdateUser = async (
  userData: {
    name: string;
    email: string;
    phone: string | undefined;
    password: string;
    contactName?: string;
    status?: ResearchStatusType;
    roles: ROLES;
    university?: Schema.Types.ObjectId;
  },
  session: ClientSession
) => {
  let existedUser = await User.findOne({
    $or: [{ email: userData.email }],
  }).session(session);

  if (existedUser) {
    // Update existing property
    existedUser.name = userData.name;
    existedUser.email = userData.email;
    existedUser.phone = userData.phone;
    existedUser.roles = userData.roles;
    if (userData.university) {
      existedUser.university = userData.university;
    }
    if (userData.status) {
      existedUser.status = userData.status;
    }
    await existedUser.save({ session });
    existedUser.isNew = false; // Flag for response
  } else {
    // Create a new property
    const [createdUser] = await User.create(
      [
        {
          name: userData.name,
          email: userData.email,
          phone: userData.phone,
          password: userData.password,
          contactName: userData.contactName,
          roles: userData.roles,
          status: userData.status,
          university: userData.university,
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
  roles,
  sort,
}: IlandownerAggregatePaginationServiceParams): Promise<any> => {
  const assignedFilter = createDynamicFilter({ assigned, isArchived });

  const options = {
    page,
    limit,
  };

  // Parse the sort parameter using the helper function
  const { field: sortField, order: sortOrder } = parseSortParameter(sort);

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
      $sort: {
        [sortField]: sortOrder,
      },
    },
    {
      $lookup: {
        from: MODELS.PROPERTIES,
        let: { landownerId: '$_id' },
        pipeline: [
          ...(roles !== ROLES.ADMIN ? [{ $match: { archived: false } }] : []),
          { $match: { $expr: { $eq: ['$landowner', '$$landownerId'] } } },
          {
            $lookup: {
              from: MODELS.REPORTS,
              let: { propertyId: '$_id' },
              pipeline: [
                {
                  $match: {
                    $expr: { $eq: ['$property', '$$propertyId'] },
                    researcher: { $exists: false },
                  },
                },
                ...(roles !== ROLES.ADMIN
                  ? [{ $match: { archived: false } }]
                  : []),
                {
                  $project: {
                    _id: 0,
                    files: 1,
                    name: 1,
                    description: 1,
                    createdAt: 1,
                    updatedAt: 1,
                  },
                },
              ],
              as: 'docs',
            },
          },
          {
            $addFields: {
              docs: { $arrayElemAt: ['$docs', 0] },
            },
          },
          {
            $project: {
              _id: 1,
              propertyName: 1,
              propertyLocation: 1,
              startDate: 1,
              propertySize: 1,
              ...(roles === ROLES.ADMIN ? { note: 1, noteUpdatedBy: 1 } : {}),
              docs: '$docs.files',
            },
          },
        ],
        as: 'properties',
      },
    },
    {
      $addFields: {
        assigned: {
          $anyElementTrue: {
            $map: {
              input: '$properties',
              as: 'property',
              in: {
                $gt: [{ $size: { $ifNull: ['$$property.docs', []] } }, 0],
              },
            },
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
        ...(roles === ROLES.ADMIN ? { note: 1, noteUpdatedBy: 1 } : {}),
      },
    },
  ];

  const aggregateLandownerData = User.aggregate(aggregatePipeline);

  const result = await User.aggregatePaginate(aggregateLandownerData, options);

  return transformPaginatedResponse(result, 'landowner');
};

const universityAggregatePaginationService = async ({
  page,
  limit,
  search,
  isArchived,
  assigned,
}: {
  page: number;
  limit: number;
  search: string;
  isArchived: boolean | null;
  assigned: boolean | null;
}): Promise<any> => {
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
    roles: ROLES.UNIVERSITY,
    ...beforeMatchQuery,
  };

  const aggregatePipeline = [
    { $match: filters },
    {
      $lookup: {
        from: MODELS.USERS,
        localField: '_id',
        foreignField: 'university',
        as: CONSTANTS.RESEARCHERS,
        pipeline: [
          {
            $project: {
              _id: 1,
              name: 1,
              email: 1,
              status: 1,
              createdAt: 1,
            },
          },
        ],
      },
    },
    {
      $project: {
        _id: 1,
        name: 1,
        email: 1,
        phone: 1,
        contactName:1,
        researchers: 1,
        isArchived: 1,
        createdAt: 1,
      },
    },
  ];

  const aggregateLandownerData = User.aggregate(aggregatePipeline);

  const result = await User.aggregatePaginate(aggregateLandownerData, options);

  return transformPaginatedResponse(result, CONSTANTS.UNIVERSITIES);
};

const landownerPropertyAggregatePaginationService = async ({
  page,
  limit,
  search,
  assigned,
  userId,
  roles,
  sort,
}: IlandownerPropertyAggregatePaginationServiceParams): Promise<any> => {
  const assignedFilter = createDynamicFilter({ assigned });

  const options = {
    page,
    limit,
  };

  // Parse the sort parameter using the helper function
  const { field: sortField, order: sortOrder } = parseSortParameter(sort);

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

  const filters = {
    landowner: toMongoId(userId),
  };

  const matchQuery = assignedFilter
    ? {
        ...filters,
        ...searchQuery,
      }
    : {
        ...searchQuery,
      };

  const aggregatePipeline = [
    { $match: matchQuery },
    {
      $sort: {
        [sortField]: sortOrder,
      },
    },
    {
      $lookup: {
        from: MODELS.REPORTS,
        let: { propertyId: '$_id' },
        pipeline: [
          {
            $match: {
              $expr: { $eq: ['$property', '$$propertyId'] },
              researcher: { $exists: false },
            },
          },
          ...(roles !== ROLES.ADMIN ? [{ $match: { archived: false } }] : []),
          {
            $project: {
              _id: 1,
              files: 1,
              name: 1,
              description: 1,
              createdAt: 1,
              updatedAt: 1,
            },
          },
        ],
        as: 'docs',
      },
    },
    {
      $addFields: {
        docs: { $arrayElemAt: ['$docs', 0] },
      },
    },
    {
      $project: {
        _id: 1,
        propertyName: 1,
        archived: 1,
        propertyLocation: 1,
        propertySize: 1,
        ...(roles === ROLES.ADMIN ? { note: 1, noteUpdatedBy: 1 } : {}),
        docs: { _id: '$docs._id', files: '$docs.files' },
      },
    },
    {
      $lookup: {
        from: MODELS.BIDS,
        let: { propertyId: '$_id' },
        pipeline: [
          { $match: { $expr: { $eq: ['$property', '$$propertyId'] } } },
          {
            $project: {
              _id: 1,
              property: 1,
              reseacher: 1,
              status: 1,
              files: 1,
              description: 1,
              createdAt: 1,
              updatedAt: 1,
            },
          },
        ],
        as: 'bids',
      },
    },
  ];

  const aggregateLandownerData = Property.aggregate(aggregatePipeline);

  const result = await Property.aggregatePaginate(
    aggregateLandownerData,
    options
  );

  return transformPaginatedResponse(result, 'properties');
};

const getPaginatedUniversityResearchersService = async ({
  page = 1,
  limit = 10,
  search = '',
  isArchived = null,
  assigned = null,
  uniId,
}: IUniversityAggregatePaginationServiceParams): Promise<any> => {
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

  const beforeMatchQuery = { ...searchQuery };

  const filters = {
    university: toMongoId(uniId as string),
    ...beforeMatchQuery,
  };

  const aggregatePipeline = [
    { $match: filters },
    {
      $lookup: {
        from: MODELS.USERS,
        localField: '_id',
        foreignField: 'university',
        as: CONSTANTS.RESEARCHERS,
        pipeline: [
          {
            $project: {
              _id: 1,
              name: 1,
              email: 1,
              status: 1,
              createdAt: 1,
            },
          },
        ],
      },
    },
    {
      $project: {
        _id: 1,
        name: 1,
        email: 1,
        phone: 1,
        createdAt: 1,
      },
    },
  ];

  const aggregateLandownerData = User.aggregate(aggregatePipeline);

  const result = await User.aggregatePaginate(aggregateLandownerData, options);

  return transformPaginatedResponse(result, CONSTANTS.RESEARCHERS);
};

const getSingleUniversityService = async (id: string): Promise<any> => {
  const fetchUniversity = await User.findById(id, '_id name email roles phone');

  if (!fetchUniversity) {
    throw new ApiError(404, 'University doesnot exist!');
  }

  return fetchUniversity;
};

const landownerPropertyBidsPaginationService = async ({
  page,
  limit,
  search,
  propertyId,
  roles,
}: IlandownerPropertyBidsAggregatePaginationServiceParams): Promise<any> => {
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

  const matchQuery = propertyId
    ? {
        ...searchQuery,
        property: toMongoId(propertyId),
      }
    : {
        ...searchQuery,
      };

  const aggregatePipeline = [
    {
      $match: matchQuery,
    },
    {
      $lookup: {
        from: MODELS.PROPERTIES,
        localField: 'property',
        foreignField: '_id',
        as: 'property',
        pipeline: [
          ...(roles !== ROLES.ADMIN ? [{ $match: { archived: false } }] : []),
          {
            $lookup: {
              from: MODELS.REPORTS,
              let: { propertyId: '$_id' },
              as: 'docs',
              pipeline: [
                {
                  $match: {
                    $expr: { $eq: ['$property', '$$propertyId'] },
                    researcher: { $exists: false },
                  },
                },
                ...(roles !== ROLES.ADMIN
                  ? [{ $match: { archived: false } }]
                  : []),
                {
                  $project: {
                    _id: 1,
                    files: 1,
                    name: 1,
                    originalName: 1,
                    description: 1,
                    createdAt: 1,
                    updatedAt: 1,
                  },
                },
              ],
            },
          },
          {
            $lookup: {
              from: MODELS.ASSIGNED_RESEARCH_PROPERTIES,
              let: { propertyId: '$_id' },
              pipeline: [
                {
                  $match: {
                    $expr: { $eq: ['$property', '$$propertyId'] },
                  },
                },
                {
                  $unwind: '$researchers',
                },
                {
                  $lookup: {
                    from: MODELS.USERS,
                    localField: 'researchers.researcher',
                    foreignField: '_id',
                    as: 'researcher',
                    pipeline: [
                      {
                        $project: {
                          _id: 1,
                          name: 1,
                          email: 1,
                          phone: 1,
                        },
                      },
                    ],
                  },
                },
                {
                  $addFields: {
                    researcher: { $arrayElemAt: ['$researcher', 0] },
                    assignDate: '$researchers.assignDate',
                  },
                },
                {
                  $replaceRoot: {
                    newRoot: {
                      $mergeObjects: [
                        '$researcher',
                        { assignDate: '$assignDate' },
                      ],
                    },
                  },
                },
              ],
              as: 'assignedResearchers',
            },
          },
          {
            $lookup: {
              from: MODELS.USERS,
              localField: 'landowner',
              foreignField: '_id',
              as: 'landowner',
              pipeline: [
                {
                  $project: {
                    _id: 1,
                    name: 1,
                    email: 1,
                    phone: 1,
                  },
                },
              ],
            },
          },
          {
            $addFields: {
              docs: { $arrayElemAt: ['$docs', 0] },
              landowner: { $arrayElemAt: ['$landowner', 0] },
            },
          },
          {
            $project: {
              _id: 1,
              propertyName: 1,
              propertyLocation: 1,
              propertySize: 1,
              startDate: 1,
              landowner: 1,
              assignedResearchers: 1,
              ...(roles === ROLES.ADMIN ? { note: 1, noteUpdatedBy: 1 } : {}),
              docs: '$docs.files',
            },
          },
        ],
      },
    },
    {
      $lookup: {
        from: MODELS.USERS,
        localField: 'researcher',
        foreignField: '_id',
        as: 'researcher',
        pipeline: [
          {
            $project: {
              _id: 1,
              name: 1,
              email: 1,
              phone: 1,
            },
          },
        ],
      },
    },
    {
      $addFields: {
        property: { $arrayElemAt: ['$property', 0] },
        researcher: { $arrayElemAt: ['$researcher', 0] },
      },
    },
    {
      $project: {
        _id: 1,
        description: 1,
        status: 1,
        createdAt: 1,
        updatedAt: 1,
        property: 1,
        files: 1,
        researcher: 1,
      },
    },
  ];

  const aggregateReportBidsData = Bids.aggregate(aggregatePipeline);

  const result = await Bids.aggregatePaginate(aggregateReportBidsData, options);

  return transformPaginatedResponse(result, MODELS.BIDS);
};

export {
  findOrUpdateUser,
  landownerAggregatePaginationService,
  landownerPropertyAggregatePaginationService,
  landownerPropertyBidsPaginationService,
  universityAggregatePaginationService,
  getPaginatedUniversityResearchersService,
  getSingleUniversityService,
};
