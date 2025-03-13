import mongoose, { Schema } from 'mongoose';
import { MODELS } from '../constants.js';
import { IResetPasswordToken } from '../types/index.js';

const resetPasswordTokenSchema = new Schema<IResetPasswordToken>(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: MODELS.USERS,
      required: [true, 'User is required!'],
    },
    token: {
      type: String,
      required: [true, 'Reset Password Token is required!'],
    },
  },
  {
    timestamps: true,
    expireAfterSeconds: Date.now() + 3 * 60 * 1000,
  }
);

export const ResetPasswordToken = mongoose.model<IResetPasswordToken>(
  MODELS.RESETPASSWORD_TOKENS,
  resetPasswordTokenSchema
);
