import jwt from 'jsonwebtoken';
import { User } from '../models/user.model.js';
import { asyncHandler } from '../utils/asyncHandler.js';
import { ApiError } from '../utils/ApiError.js';
import { Request, Response, NextFunction } from 'express';
import { JwtPayload } from '../types/index.js';

// in production code
// if we are not using any keys like for example
// (req,res,next)
// if i'm not using res key then we'll simply do smth like this
// (req,_,next)
const authMiddleware = asyncHandler(
  async (req: Request, _: Response, next: NextFunction) => {
    try {
      const token =
        req.cookies?.accessToken ||
        req.header('Authorization')?.replace('Bearer ', '');

      if (!token) {
        throw new ApiError(401, 'Unauthorized request');
      }

      const decoded = jwt.verify(
        token,
        process.env.ACCESS_TOKEN_SECRET as string
      ) as { _id: string };

      const user = await User.findById(decoded._id).select('-password');

      if (!user) {
        throw new ApiError(404, 'User not found');
      }

      req.user = user;
      next();
    } catch (error: any) {
      throw new ApiError(401, error?.message || 'Please Authenticate!');
    }
  }
);

// Verify refresh tokens
const verifyRefreshToken = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  const refreshToken = req.body.refreshToken;

  try {
    const decoded = jwt.verify(
      refreshToken,
      process.env.REFRESH_TOKEN_SECRET as string
    ) as JwtPayload;
    const user = await User.findById(decoded._id);
    if (!user) {
      return res.status(401).json({ message: 'Invalid refresh token' });
    }
    req.user = user;
    next();
  } catch (error) {
    return res.status(401).json({ message: 'Invalid refresh token' });
  }
};

export { authMiddleware, verifyRefreshToken };
