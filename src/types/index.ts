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

export type FilesType = {
  url: string;
  name: string;
};

export type TUploadedFileType = {
  fieldname: string;
  originalname: string;
  encoding: string;
  mimetype: string;
  path: string;
  size: number;
  filename: string;
};
