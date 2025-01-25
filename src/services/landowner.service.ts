import mongoose, { ClientSession, Schema } from 'mongoose';
import { MODELS, ResearchStatusType, ROLES } from '../constants.js';
import { User } from '../models/user.model.js';
import {
  createDynamicFilter,
  transformPaginatedResponse,
} from '../utils/utils.js';
import {
  IlandownerAggregatePaginationServiceParams,
  IlandownerReportAggregatePaginationServiceParams,
  IlandownerReportBidsAggregatePaginationServiceParams,
} from '../interface/landowner.interface.js';
import { Report } from '../models/reports.model.js';
import { Bids } from '../models/bids.model.js';

const findOrUpdateUser = async (
  userData: {
    name: string;
    email: string;
    phone: string | undefined;
    password: string;
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
        from: MODELS.PROPERTIES,
        let: { landownerId: '$_id' },
        pipeline: [
          { $match: { $expr: { $eq: ['$landowner', '$$landownerId'] } } },
          {
            $lookup: {
              from: MODELS.PROPERTIES_FILES,
              let: { propertyId: '$_id' },
              pipeline: [
                { $match: { $expr: { $eq: ['$property', '$$propertyId'] } } },
                {
                  $project: {
                    _id: 0,
                    files: 1,
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
              propertySize: 1,
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
      },
    },
    { $skip: (page - 1) * limit },
    { $limit: limit },
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

  const matchQuery = assignedFilter
    ? {
        ...searchQuery,
        ...assignedFilter,
      }
    : {
        ...searchQuery,
      };

  const aggregatePipeline = [
    {
      $unwind: {
        path: '$landAssessmentReport',
        preserveNullAndEmptyArrays: true,
      },
    },
    {
      $lookup: {
        from: 'properties',
        localField: 'property',
        foreignField: '_id',
        as: 'properties',
      },
    },
    {
      $match: {
        'properties.landowner': userId,
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
        from: MODELS.USERS,
        localField: 'properties.landowner',
        foreignField: '_id',
        as: 'properties.landowner',
      },
    },
    {
      $unwind: {
        path: '$properties.landowner',
        preserveNullAndEmptyArrays: true,
      },
    },
    {
      $lookup: {
        from: MODELS.BIDS,
        let: { reportId: '$_id' }, // Pass the current report ID
        pipeline: [
          {
            $match: {
              $expr: { $eq: ['$report', '$$reportId'] }, // Match bids where report equals current report ID
            },
          },
          {
            $lookup: {
              from: MODELS.USERS,
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
              'researcher._id': 1,
              'researcher.name': 1,
              'researcher.email': 1,
              'researcher.phone': 1,
            },
          },
        ],
        as: 'bids', // Add matched bids to the `bids` field
      },
    },
    {
      $project: {
        _id: 1,
        landAssessmentReport: {
          url: 1,
          name: 1,
        },
        properties: {
          _id: 1,
          propertyName: 1,
          propertyLocation: 1,
          propertySize: 1,
          createdAt: 1,
          updatedAt: 1,
          landowner: {
            _id: 1,
            name: 1,
            email: 1, // Include any additional fields you want from the landowner
          },
        },
        bids: {
          _id: 1,
          researcher: 1,
          status: 1,
          createdAt: 1,
          updatedAt: 1,
        },
        createdAt: 1,
        updatedAt: 1,
      },
    },
    {
      $match: matchQuery,
    },
  ];

  const aggregateLandownerData = Report.aggregate(aggregatePipeline);

  const result = await Report.aggregatePaginate(
    aggregateLandownerData,
    options
  );

  return transformPaginatedResponse(result, 'reports');
};

const landownerReportBidsPaginationService = async ({
  page,
  limit,
  search,
  reportId,
  userId,
}: IlandownerReportBidsAggregatePaginationServiceParams): Promise<any> => {
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

  const matchQuery = reportId
    ? {
        ...searchQuery,
        report: reportId,
      }
    : {
        ...searchQuery,
      };

  const aggregatePipeline = [
    {
      $match: {
        report: new mongoose.Types.ObjectId(reportId),
      },
    },
    {
      $lookup: {
        from: 'reports',
        localField: 'report',
        foreignField: '_id',
        as: 'report',
        pipeline: [
          {
            $project: {
              _id: 1,
              landAssessmentReport: {
                $arrayElemAt: ['$landAssessmentReport', 0], // Fetch only the first landAssessmentReport
              },
              property: 1,
            },
          },
        ],
      },
    },
    {
      $unwind: {
        path: '$report',
        preserveNullAndEmptyArrays: true,
      },
    },
    {
      $lookup: {
        from: 'properties',
        localField: 'report.property',
        foreignField: '_id',
        as: 'report.property',
        pipeline: [
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
            $unwind: {
              path: '$landowner',
              preserveNullAndEmptyArrays: true,
            },
          },
          {
            $project: {
              _id: 1,
              propertyName: 1,
              propertyLocation: 1,
              landowner: 1,
            },
          },
        ],
      },
    },
    {
      $unwind: {
        path: '$report.property',
        preserveNullAndEmptyArrays: true,
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
      $unwind: {
        path: '$researcher',
        preserveNullAndEmptyArrays: true,
      },
    },
    {
      $project: {
        _id: 1,
        description: 1,
        status: 1,
        createdAt: 1,
        updatedAt: 1,
        report: {
          _id: 1,
          landAssessmentReport: 1,
          property: 1,
        },
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
  landownerReportAggregatePaginationService,
  landownerReportBidsPaginationService,
};
