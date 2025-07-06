import mongoose, { Schema } from 'mongoose';
import { ResearchStatusType } from '../../constants.js';
import { IReportsInterface } from '../../interface/property.interface.js';

interface IUserDocument extends Document {
  // Your existing IUser properties here...
  isModified(paths?: string | string[] | undefined): boolean;
  refreshToken: string;
}

export interface IUser extends IUserDocument {
  name: string;
  username: string;
  fcmToken: string[];
  email: string;
  password: string;
  roles: string;
  assignedRole: string;
  phone?: string;
  gender?: string;
  bio?: string;
  isProfileComplete: boolean;
  isArchived: boolean;
  status: ResearchStatusType;
  refreshTokens: { token: string }[];
  university: mongoose.Schema.Types.ObjectId;
  _id?: mongoose.Schema.Types.ObjectId; // Optional for inferred _id type
  createdAt?: Date;
  updatedAt?: Date;
  _doc: any;
  skills?: string;
  advisor?: string;
  universityName?: string;
  contactName?: string;
  note?: string;
  noteUpdatedBy?: mongoose.Schema.Types.ObjectId;
  reportsSubmitted?: mongoose.PaginateModel<IReportsInterface>;

  // Instance methods
  isPasswordCorrect(password: string): Promise<boolean>;
  generateAccessToken(): string;
  generateRefreshToken(): string;
  getUpdate(): {
    password: string;
    roles: string;
    university: Schema.Types.ObjectId;
  };
}
