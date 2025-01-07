import { ApiError } from '../utils/ApiError.js';
import { ApiResponse } from '../utils/ApiResponse.js';
import { asyncHandler } from '../utils/asyncHandler.js';
import { User } from '../models/user.model.js';
import { ResetPasswordToken } from '../models/resetPasswordToken.model.js';
import sendEmail from '../utils/sendMail.js';
import { Request, Response } from 'express';
import { RESEARCHER_STATUS, ROLES } from '../constants.js';

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
  const { name, email, password, roles, phone } = req.body;

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

  const user = await User.findOne({
    $or: [{ email }],
  });

  if (!user) {
    throw new ApiError(404, 'User not found');
  }

  // compare password with hashed password
  // const matched = await bcrypt.compare(password, user.password);
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

  // const token = jwt.sign({ _id: user._id }, process.env.JWT_SECRET_KEY);

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

export {
  registerUser,
  loginUser,
  logoutUser,
  userProfile,
  refreshAccessToken,
  sendResetPasswordToken,
  resetPassword,
  verifyResetPasswordOTP,
};
