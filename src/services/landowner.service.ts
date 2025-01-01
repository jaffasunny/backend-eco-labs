import { ClientSession } from 'mongoose';
import { ROLES } from '../constants.js';
import { User } from '../models/user.model.js';

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

export { findOrUpdateLandowner };
