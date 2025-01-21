import { Response, Request } from 'express';
import { ApiResponse } from '../utils/ApiResponse.js';
import { asyncHandler } from '../utils/asyncHandler.js';
import { ApiError } from '../utils/ApiError.js';
import {
  deletePropertyFileService,
  findOrUpdateProperty,
} from '../services/property.service.js';

const addProperty = asyncHandler(async (req: Request, res: Response) => {
  const { propertyName, propertyLocation, propertySize, landownerId, files } =
    req.body;

  const property = await findOrUpdateProperty(
    propertyName,
    propertyLocation,
    propertySize,
    files,
    landownerId
  );

  if (!property) {
    return res
      .status(201)
      .json(new ApiError(400, 'Something went wrong while creating property!'));
  }

  return res
    .status(201)
    .json(new ApiResponse(201, { property }, 'Property Added successfully!'));
});

const removeFiles = asyncHandler(async (req: Request, res: Response) => {
  const { fileId } = req.params;
  const { propertyFilesId } = req.query;

  const deletedFile = await deletePropertyFileService(
    propertyFilesId as string,
    fileId
  );

  if (!deletedFile) {
    return res
      .status(201)
      .json(new ApiError(400, 'Something went wrong while creating property!'));
  }

  return res
    .status(201)
    .json(
      new ApiResponse(201, { deletedFile }, 'Property Added successfully!')
    );
});

export { addProperty, removeFiles };
