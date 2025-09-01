import { ApiError } from '../utils/ApiError.js';
import { ApiResponse } from '../utils/ApiResponse.js';
import { asyncHandler } from '../utils/asyncHandler.js';
import { User } from '../models/user.model.js';
import { ResetPasswordToken } from '../models/resetPasswordToken.model.js';
import sendEmail from '../utils/sendMail.js';
import { Request, Response } from 'express';
import { RESEARCHER_STATUS, ROLES, RoleType } from '../constants.js';
import {
  downloadResource,
  extractFieldNames,
  isPasswordCorrect,
} from '../utils/utils.js';
import { getUsersInfoService } from '../services/user.service.js';
import { TSort } from '../types/index.js';

// Generate New Refresh Token and Access Token
const generateAccessAndRefreshTokens = async (userId: string) => {
  try {
    const user = await User.findById(userId);
    if (!user) {
      throw new ApiError(404, 'User not found');
    }

    const accessToken = await user.generateAccessToken();
    const refreshToken = await user.generateRefreshToken();

    if (!accessToken || !refreshToken) {
      throw new ApiError(
        500,
        'Access token or refresh token generation failed'
      );
    }

    user.refreshToken = refreshToken;
    await user.save({ validateBeforeSave: false });

    return { accessToken, refreshToken };
  } catch (error) {
    throw new ApiError(
      500,
      'Something went wrong while generating refresh and access token!'
    );
  }
};

// Signup
const registerUser = asyncHandler(async (req: Request, res: Response) => {
  const {
    name,
    email,
    password,
    roles,
    phone,
    university,
    advisor,
    contactName,
    universityName,
  } = req.body;

  if (!name || !email || !password) {
    throw new ApiError(400, 'Please fill all details!');
  }

  const existedUser = await User.findOne({ $or: [{ email }] });

  if (existedUser) {
    throw new ApiError(409, `Username or Email has already been used.`);
  }

  let user = null;

  if (roles === ROLES.RESEARCHER) {
    user = await User.create({
      name,
      email,
      password,
      roles,
      phone,
      isApproved: false,
      university,
      advisor,
      universityName,
    });
    sendEmail(
      email,
      'Welcome to Texas Eco Labs!',
      `Your researcher account has been created and is pending approval. We will notify you once your account is approved.`
    ).catch((err) => console.error('Email sending failed:', err));
    sendEmail(
      'texasecolabprogram@braungresham.com',
      'New User SignUp Notification',
      `New Researcher account has been created and is pending approval. once your account is approved.
      Name: ${name}
      Email: ${email}
      `
    ).catch((err) => console.error('Email sending failed:', err));
  } else if (roles === ROLES.UNIVERSITY) {
    user = await User.create({
      name,
      email,
      password,
      roles,
      phone,
      contactName,
    });
  } else {
    user = await User.create({
      name,
      email,
      password,
      roles,
      phone,
    });
  }

  return res
    .status(201)
    .json(new ApiResponse(200, user, 'User registered Successfully!'));
});

// Login
const loginUser = asyncHandler(async (req: Request, res: Response) => {
  const { email, password, roles } = req.body;

  if (!email || !password) {
    throw new ApiError(400, 'Please fill all details!');
  }

  const user = await User.findOne({ email: email.trim() });

  if (!user) {
    throw new ApiError(400, 'User with given email address doesnot exist!');
  }

  if (user.isArchived) {
    throw new ApiError(400, 'User is archived!');
  }

  // compare password with hashed password
  const matched = await user.isPasswordCorrect(password);

  if (!user) {
    throw new ApiError(401, `User doesnot exist!`);
  }

  if (!matched) {
    throw new ApiError(401, `Invalid user credentials!`);
  }

  if (roles && user.roles === ROLES.RESEARCHER) {
    if (user.status !== RESEARCHER_STATUS.APPROVED) {
      throw new ApiError(401, `Researcher status is ${user.status}!`);
    }
  }

  const { accessToken, refreshToken } = await generateAccessAndRefreshTokens(
    user._id.toString()
  );

  user.refreshTokens.push({ token: refreshToken });

  // remove password from response
  delete user._doc.password;

  await user.save({ validateBeforeSave: false });

  const options = {
    httpOnly: true,
    secure: true,
  };

  return res
    .status(200)
    .cookie('accessToken', accessToken, options)
    .cookie('refreshToken', refreshToken, options)
    .json(
      new ApiResponse(
        200,
        {
          user,
          accessToken,
          refreshToken,
        },
        'Login Successful!'
      )
    );
});

// Logout
const logoutUser = asyncHandler(async (req: Request, res: Response) => {
  const { _id } = req.user;

  await User.findByIdAndUpdate(
    _id,
    {
      $set: { refreshTokens: [] },
      // $pull: { fcmToken },
    },
    {
      new: true,
    }
  );

  const options = {
    httpOnly: true,
    secure: true,
  };

  return res
    .status(200)
    .clearCookie('accessToken', options)
    .cookie('refreshToken', options)
    .json(new ApiResponse(200, {}, 'User logged out successfully!'));
});

// User Profile
const userProfile = asyncHandler(async (req: Request, res: Response) => {
  const { username } = req.user;

  const user = await User.findOne({ username }).select('-password');

  if (!user) {
    throw new ApiError(404, `User not found!`);
  }

  return res
    .status(200)
    .json(new ApiResponse(200, user, 'User profile fetched successfully!'));
});

const updateUserProfile = asyncHandler(async (req: Request, res: Response) => {
  const { _id } = req.user;
  const { userId } = req.body;

  if (!userId && req.body.roles) {
    throw new ApiError(400, 'Only admin can update role!');
  }

  const updatedUser = await User.findOneAndUpdate(
    { _id: userId ? userId : _id },
    req.body,
    { new: true, runValidators: true }
  );

  if (!updatedUser) {
    throw new ApiError(404, `Something went wrong while updated User!`);
  }

  return res
    .status(200)
    .json(
      new ApiResponse(200, updatedUser, 'User profile updated successfully!')
    );
});

const checkPassword = asyncHandler(async (req: Request, res: Response) => {
  const { _id } = req.user;
  const { userId, password } = req.query;

  const findUser = await User.findById({ _id: userId ? userId : _id }).lean();

  if (!findUser) {
    throw new ApiError(404, `User not found!`);
  }

  if (!password) {
    throw new ApiError(400, 'Please enter password!');
  }

  const isCorrect = await isPasswordCorrect(
    findUser.password,
    password as string
  );

  if (!isCorrect) {
    throw new ApiError(400, 'Invalid current password!');
  }

  return res
    .status(200)
    .json(new ApiResponse(200, 'Current Password matched!'));
});

// Refresh Access Token if access token expires
const refreshAccessToken = asyncHandler(async (req: Request, res: Response) => {
  const incomingRefreshToken =
    req.cookies.refreshToken || req.body.refreshToken;

  if (!incomingRefreshToken) {
    throw new ApiError(401, 'Unauthorized request!');
  }

  try {
    const user = await User.findById(req.user._id);

    if (!user) {
      throw new ApiError(401, `User doesnot exist!`);
    }

    const matchingRefreshToken = user.refreshTokens.find(
      (token: any) => token.token === incomingRefreshToken
    );

    if (!matchingRefreshToken) {
      throw new ApiError(401, 'Invalid Refresh Token!');
    }

    user.refreshTokens = user.refreshTokens.filter(
      (token: any) => token.token !== incomingRefreshToken
    );

    const options = {
      httpOnly: true,
      secure: true,
    };

    const { accessToken, refreshToken: newRefreshToken } =
      await generateAccessAndRefreshTokens(user._id.toString());

    console.log('access token refresh token refreshed');

    // new refreshtoken
    user.refreshTokens.push({ token: newRefreshToken });

    await user.save({ validateBeforeSave: false });

    return res
      .status(200)
      .cookie('accessToken', accessToken, options)
      .cookie('refreshToken', newRefreshToken, options)
      .json(
        new ApiResponse(
          200,
          {
            accessToken,
            refreshToken: newRefreshToken,
          },
          'Access token refreshed successfully!'
        )
      );
  } catch (error: any) {
    throw new ApiError(401, error.message || 'Invalid Refresh Token!');
  }
});

const sendResetPasswordToken = asyncHandler(
  async (req: Request, res: Response) => {
    const { email } = req.body;

    const user = await User.findOne({ email });
    if (!user) {
      throw new ApiError(400, 'User with given email address doesnot exist!');
    }

    let token = await ResetPasswordToken.findOne({ userId: user._id });

    if (!token) {
      const otp = Math.floor(100000 + Math.random() * 900000).toString(); // Generate a 6-digit OTP
      token = await new ResetPasswordToken({
        userId: user._id,
        token: otp,
      }).save();
    } else {
      // If a token already exists, update it with a new OTP and reset the expiration time
      token.token = Math.floor(100000 + Math.random() * 900000).toString();
      await token.save();
    }

    await sendEmail(
      user.email,
      'Password reset OTP',
      `Your OTP is ${token.token}`
    );

    return res
      .status(200)
      .json(
        new ApiResponse(200, 'Reset password token sent to your email address!')
      );
  }
);

const verifyResetPasswordOTP = asyncHandler(
  async (req: Request, res: Response) => {
    const { otp } = req.body;

    const token = await ResetPasswordToken.findOne({
      token: otp,
    });

    if (!token) {
      throw new ApiError(400, 'Invalid or expired OTP');
    }

    return res
      .status(200)
      .json(new ApiResponse(200, 'OTP verified successfully'));
  }
);

const resetPassword = asyncHandler(async (req: Request, res: Response) => {
  const { email, password } = req.body;

  const user = await User.find({ email });

  if (!user) {
    throw new ApiError(400, 'Reset password timeout!');
  }

  let resetPasswordToken = await ResetPasswordToken.findOne({
    userId: user[0]._id,
  });

  if (!resetPasswordToken) {
    throw new ApiError(400, 'Reset password timeout!');
  }

  user[0].password = password;
  await user[0].save();
  await ResetPasswordToken.findOneAndDelete({
    userId: user[0]._id,
  });

  return res
    .status(200)
    .json(new ApiResponse(200, 'Password Reset Successfully!'));
});

const getUsersInfo = asyncHandler(async (req: Request, res: Response) => {
  const { role, isExport, page, limit, search = '', sort } = req.query;
  const { roles } = req.user;

  let updatedLimit = isExport ? Number.MAX_SAFE_INTEGER : Number(limit) || 10;

  const usersData = await getUsersInfoService({
    role: role?.toString() as RoleType,
    sort: sort?.toString() as TSort,
    limit: updatedLimit,
    page: Number(page),
    search: search?.toString(),
    roles,
  });

  if (isExport) {
    const fieldNames = extractFieldNames(usersData.users);

    return downloadResource(
      res,
      `${role}-users.csv`,
      fieldNames,
      usersData.users
    );
  }

  return res
    .status(200)
    .json(new ApiResponse(200, usersData, 'User fetched successfully!'));
});

// Update user password by admin
const updateUserPassword = asyncHandler(async (req: Request, res: Response) => {
  const { userId, newPassword } = req.body;

  if (!userId || !newPassword) {
    throw new ApiError(400, 'User ID and new password are required!');
  }

  // Find the user by ID
  const user = await User.findById(userId);
  if (!user) {
    throw new ApiError(404, 'User not found!');
  }

  // Update the password
  user.password = newPassword;
  await user.save();

  // Send email notification to the user
  const emailSubject = 'Password Updated';
  const emailText = `Hello ${user.name},\n\nYour password has been updated by an administrator.\n\nYour new password is: ${newPassword}\n\nPlease change your password after your next login for security purposes.\n\nBest regards,\nEco Labs Team`;

  await sendEmail(user.email, emailSubject, emailText);

  return res
    .status(200)
    .json(
      new ApiResponse(
        200,
        { userId: user._id },
        'Password updated successfully and email notification sent!'
      )
    );
});

export {
  registerUser,
  loginUser,
  logoutUser,
  userProfile,
  refreshAccessToken,
  sendResetPasswordToken,
  resetPassword,
  verifyResetPasswordOTP,
  updateUserProfile,
  checkPassword,
  getUsersInfo,
  updateUserPassword,
};
