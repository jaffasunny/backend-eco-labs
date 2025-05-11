import cloudinary from 'cloudinary';
// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-ignore
import DataURIParser from 'datauri/parser';
import { Parser } from 'json2csv';
import { Express, Response } from 'express';
import mongoose, { Query, Schema } from 'mongoose';
import { ENVIRONMENT, ROLES } from '../constants.js';
import morgan from 'morgan';
import { ApiError } from './ApiError.js';
import bcrypt from 'bcrypt';
import crypto from 'crypto';
import { DataItem, FieldDefinition } from '../types/index.js';

export const uploadCloudinary = async (fileUri: DataURIParser) => {
  const mycloud = await cloudinary.v2.uploader.upload(
    fileUri.content as string
  );

  return mycloud;
};

export const generatePassword = () => {
  const lowercase = 'abcdefghijklmnopqrstuvwxyz';
  const uppercase = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
  const digits = '0123456789';
  const specialChars = '@#$!';

  const allChars = lowercase + uppercase + digits + specialChars;

  let password = [
    lowercase[Math.floor(Math.random() * lowercase.length)],
    uppercase[Math.floor(Math.random() * uppercase.length)],
    digits[Math.floor(Math.random() * digits.length)],
    specialChars[Math.floor(Math.random() * specialChars.length)],
  ];

  while (password.length < 10) {
    const randomIndex = crypto.randomInt(0, allChars.length);
    password.push(allChars[randomIndex]);
  }

  password = password.sort(() => Math.random() - 0.5);

  return password.join('');
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

export function toMongoId(stringId: string) {
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

export const cloudinaryDestroy = async (publicId: string) => {
  await cloudinary.v2.uploader.destroy(publicId);
};

// Utility function to extract public_id from a Cloudinary URL
export function extractPublicIdFromUrl(url: string): string | null {
  const regex = /\/v\d+\/(.+)\.\w+$/; // Extracts the public_id
  const match = url.match(regex);
  return match ? match[1] : null;
}

export const handleDeleteMiddleware = async function <
  T extends { files: { url: string }[] },
>(this: Query<any, T>, next: (err?: any) => void, model: any): Promise<void> {
  try {
    const queryFilter = this.getFilter();

    // Use the dynamically passed model to find documents
    const documents = await model.find(queryFilter);

    for (const document of documents) {
      if (!document.files) continue;
      if (!Array.isArray(document.files)) document.files = [document.files];

      for (const file of document.files) {
        const publicId = extractPublicIdFromUrl(file.url); // Extract public ID
        if (publicId) {
          await cloudinaryDestroy(publicId); // Delete file from Cloudinary
        }
      }
    }

    next();
  } catch (error: any) {
    console.error('Error deleting files from Cloudinary:', error);
    next(error);
  }
};

export const isPasswordCorrect = async function (
  oldPassword: string,
  enteredPassword: string
) {
  let correct = await bcrypt.compare(enteredPassword, oldPassword);

  return correct;
};

export const normalizeEmailForGmail = (email: string): string => {
  const [localPart, domain] = email.split('@');
  const normalizedLocalPart = localPart.replace(/\./g, ''); // Remove all periods
  return `${normalizedLocalPart}@${domain}`;
};

export function enumToArray<T extends Record<string, any>>(
  enumObject: T
): T[keyof T][] {
  return Object.values(enumObject) as T[keyof T][];
}

export const downloadResource = (
  res: Response,
  fileName: string,
  fields: FieldDefinition[],
  data: DataItem[]
) => {
  const json2csv = new Parser({ fields });
  const csv = json2csv.parse(data);
  res.header('Content-Type', 'text/csv');
  res.attachment(fileName);
  return res.send(csv);
};

export const extractAllFieldNames = (data: any): string[] => {
  const keysSet = new Set<string>();

  const extractKeys = (obj: any) => {
    if (typeof obj === 'object' && obj !== null) {
      for (const key in obj) {
        if (obj.hasOwnProperty(key)) {
          keysSet.add(key);
          extractKeys(obj[key]); // Recursively extract keys from nested objects
        }
      }
    }
  };

  if (Array.isArray(data)) {
    data.forEach((item) => extractKeys(item));
  } else {
    extractKeys(data);
  }

  return [...keysSet];
};

export const extractFieldNames = (data: Record<string, any>[]): string[] => {
  return data.length > 0 ? [...new Set(Object.keys(data[0]))] : [];
};

export const parseSortParameter = (
  sort: string | undefined,
  defaultField: string = 'createdAt',
  defaultOrder: 1 | -1 = -1
): { field: string; order: 1 | -1 } => {
  let sortField = defaultField;
  let sortOrder = defaultOrder;

  if (sort) {
    const [field, order] = sort.split(':'); // Expected format: "field:asc" or "field:desc"
    if (field && (order === 'asc' || order === 'desc')) {
      sortField = field;
      sortOrder = order === 'asc' ? 1 : -1;
    }
  }

  return { field: sortField, order: sortOrder };
};
