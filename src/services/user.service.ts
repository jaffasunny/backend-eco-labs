import { RoleType } from './../constants.js';
import { ClientSession } from 'mongoose';
import { User } from '../models/user.model.js';
import { ApiError } from '../utils/ApiError.js';

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

const getUsersInfoService = async (role: RoleType) => {
  const users = await User.find({
    roles: role,
  });

  if (!users || !users.length) {
    throw new ApiError(400, 'Users with the specified roles not found!');
  }

  return users;
};

export { updateUserDetails, getUsersInfoService };
