import { RoleType } from './../constants.js';
import { ClientSession } from 'mongoose';
import { User } from '../models/user.model.js';

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

export { updateUserDetails };
