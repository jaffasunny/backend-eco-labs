import mongoose from 'mongoose';

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
  refreshTokens: { token: string }[];
  _id?: mongoose.Schema.Types.ObjectId; // Optional for inferred _id type
  createdAt?: Date;
  updatedAt?: Date;
  _doc: any;
  skills?: string;

  // Instance methods
  isPasswordCorrect(password: string): Promise<boolean>;
  generateAccessToken(): string;
  generateRefreshToken(): string;
}
