import { User } from './../models/user.model.js';
import { ROLES } from '../constants.js';

export const seedSuperAdmin = async () => {
  try {
    // Check if a super admin already exists
    const existingSuperAdmin = await User.findOne({ role: ROLES.ADMIN });
    if (existingSuperAdmin) {
      console.log('Super admin already exists:', existingSuperAdmin.email);
      return;
    }

    const superAdmin = new User({
      name: 'Super Admin',
      email: process.env.SUPER_ADMIN_EMAIL,
      password: process.env.SUPER_ADMIN_PASSWORD,
      roles: ROLES.ADMIN,
    });

    await superAdmin.save();
    console.log('Super admin created successfully:', superAdmin.email);
  } catch (error: any) {
    console.error('Error seeding super admin:', error.message);
  }
};
