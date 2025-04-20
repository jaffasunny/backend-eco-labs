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
  type: string;
  originalName: string;
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

// Define the type for the fields parameter
export type FieldDefinition = string | { label: string; value: string };

// Define the type for the data parameter
export type DataItem = Record<string, any>;

export type TSort = 'asc' | 'desc'