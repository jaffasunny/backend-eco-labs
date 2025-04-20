import { RoleType } from './../constants.js';
import { ClientSession } from 'mongoose';
import { User } from '../models/user.model.js';
import { ApiError } from '../utils/ApiError.js';
import { TSort } from '../types/index.js';

const updateUserDetails = async (
  userId: string,
  roles: RoleType,
  userDetails: Partial<{
    name: string;
    email: string;
    password: string;
    phone: string;
  }>,
  session: ClientSession
) => {
  await User.updateOne({ _id: userId }, { ...userDetails, roles }, { session });
};

const getUsersInfoService = async (
  role: RoleType,
  sort: TSort | null = null
) => {
  const query = User.find({
    roles: role,
  });

  if (sort === 'asc') {
    query.sort({ name: 1 });
  } else if (sort === 'desc') {
    query.sort({ name: -1 });
  }

  const users = await query;

  if (!users || !users.length) {
    throw new ApiError(400, 'Users with the specified roles not found!');
  }

  return users;
};

export { updateUserDetails, getUsersInfoService };
