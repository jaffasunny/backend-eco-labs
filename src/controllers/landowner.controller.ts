import { generatePassword } from './../utils/utils';
import { Response, Request } from 'express';
import { User } from '../models/user.model';
import { ApiError } from '../utils/ApiError';
import { ApiResponse } from '../utils/ApiResponse';
import { asyncHandler } from '../utils/asyncHandler';
import sendEmail from '../utils/sendMail';
import { ROLES } from '../constants';

// Add Landowner by email
const addLandowner = asyncHandler(async (req: Request, res: Response) => {
  const { email } = req.body;

  const existedUser = await User.findOne({ $or: [{ email }] });

  // Check if the email already exists (replace with actual DB logic)
  if (existedUser) {
    return res.status(400).json({ message: 'Email already exists' });
  }

  // Generate system-generated password
  const password = generatePassword();

  const user = await User.create({
    name: 'Auto generated Landowner',
    email,
    password,
    roles: ROLES.LANDOWNER,
  });

  // Send the password to the user's email
  try {
    await sendEmail(
      email,
      'Your System Generated Password',
      `Welcome! Here is your system-generated password: ${password}`
    );

    return res
      .status(201)
      .json(
        new ApiResponse(
          201,
          user,
          'Email added successfully. Password has been sent to the email.'
        )
      );
  } catch (error: any) {
    return res
      .status(201)
      .json(new ApiError(500, `Error sending email ${error.message}`));
  }
});

export { addLandowner };
