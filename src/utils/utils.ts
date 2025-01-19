import cloudinary from 'cloudinary';
// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-ignore
import DataURIParser from 'datauri/parser';
import { Express } from 'express';
import mongoose, { Schema, Types } from 'mongoose';
import { ENVIRONMENT, ROLES } from '../constants.js';
import morgan from 'morgan';
import { ApiError } from './ApiError.js';

export const uploadCloudinary = async (fileUri: DataURIParser) => {
  const mycloud = await cloudinary.v2.uploader.upload(
    fileUri.content as string
  );

  return mycloud;
};

export const generatePassword = () => {
  const chars =
    'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789@#$!';
  let password = '';
  for (let i = 0; i < 10; i++) {
    password += chars[Math.floor(Math.random() * chars.length)];
  }
  return password;
};

export const transformPaginatedResponse = (
  result: mongoose.AggregatePaginateResult<any>,
  docName: string
) => {
  const { docs, totalDocs, ...rest } = result;

  const renamedResult = {
    [docName]: docs,
    totalItems: totalDocs,
    ...rest,
  };

  return renamedResult;
};

export const isValidObjectId = (id: string) => {
  return mongoose.Types.ObjectId.isValid(id);
};

export const parseBooleanQueryParam = (value: unknown): boolean | null => {
  if (value === 'true') return true;
  if (value === 'false') return false;
  return null;
};

export function createDynamicFilter(
  filters: Record<string, any>
): Record<string, any> {
  const filter: Record<string, any> = {};
  Object.entries(filters).forEach(([key, value]) => {
    if (value !== null && value !== undefined) {
      filter[key] = value;
    }
  });

  return filter;
}

export const loggerEnvironment = (app: Express) => {
  // Use 'dev' format for development
  if (process.env.NODE_ENV === ENVIRONMENT.DEVELOPMENT) {
    return app.use(morgan('dev'));
  } else {
    return app.use(morgan('combined'));
  }
};

export function stringToObjectId(stringId: string) {
  try {
    return new mongoose.Types.ObjectId(stringId as string);
  } catch (error) {
    return null;
  }
}

export function validateRoleAndUniversity(
  roles: string,
  university: Schema.Types.ObjectId
) {
  // If the role is RESEARCHER, ensure university is set
  if (roles === ROLES.RESEARCHER && !university) {
    throw new ApiError(
      400,
      'Researchers must be associated with a university.'
    );
  }

  // If the role is not RESEARCHER, ensure university is not set
  if (roles !== ROLES.RESEARCHER && university) {
    throw new ApiError(
      400,
      'Only researchers can be associated with a university.'
    );
  }
}
