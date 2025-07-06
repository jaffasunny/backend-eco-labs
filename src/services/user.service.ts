import { MODELS, RoleType, ROLES } from './../constants.js';
import { ClientSession } from 'mongoose';
import { User } from '../models/user.model.js';
import {
  parseSortParameter,
  transformPaginatedResponse,
} from '../utils/utils.js';
import { getUsersInfoServiceParams } from '../interface/user.interface.js';

const updateUserDetails = async (
  userId: string,
  roles: RoleType,
  userDetails: Partial<{
    name: string;
    email: string;
    password: string;
    phone: string;
    //new fields added
    contactName:string;
    universityName:string;
    advisor:string
  }>,
  session: ClientSession
) => {
  await User.updateOne({ _id: userId }, { ...userDetails, roles }, { session });
};

const getUsersInfoService = async ({
  role,
  sort,
  page,
  limit,
  search,
  roles,
}: getUsersInfoServiceParams & { roles?: string }): Promise<any> => {
  const options = {
    page,
    limit,
  };

  const searchQuery = search
    ? {
        $or: [
          { name: { $regex: search, $options: 'i' } },
          { email: { $regex: search, $options: 'i' } },
        ],
      }
    : {};

  const matchQuery = {
    ...searchQuery,
    roles: role,
  };

  // Parse the sort parameter using the helper function
  const { field: sortField, order: sortOrder } = parseSortParameter(sort);

  const aggregatePipeline = [
    {
      $match: matchQuery,
    },
    {
      $sort: {
        [sortField]: sortOrder,
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
      $project: {
        _id: 1,
        name: 1,
        email: 1,
        phone: 1,
        ...(roles === ROLES.ADMIN ? { note: 1, noteUpdatedBy: 1 } : {}),
      },
    },
  ];

  const aggregateUsersData = User.aggregate(aggregatePipeline);

  const result = await User.aggregatePaginate(aggregateUsersData, options);

  return transformPaginatedResponse(result, MODELS.USERS);
};

export { updateUserDetails, getUsersInfoService };
