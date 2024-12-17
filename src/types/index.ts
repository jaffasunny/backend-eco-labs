import mongoose from 'mongoose';

export type TCorsOptions = { origin: string; credentials: boolean };

export interface JwtPayload {
  _id: string;
}

export interface IResetPasswordToken extends Document {
  userId: mongoose.Schema.Types.ObjectId;
  token: string;
  createdAt: Date;
  expiresAt: Date;
}
