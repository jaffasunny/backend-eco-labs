import { Response, Request } from 'express';
import { ApiResponse } from '../utils/ApiResponse.js';
import { asyncHandler } from '../utils/asyncHandler.js';
import { ApiError } from '../utils/ApiError.js';
import {
  assignResearcherPropertyService,
  deletePropertyFileService,
  deletePropertyService,
  findOrUpdateProperty,
  getAllPaginatedPropertiesService,
  getPaginatedAssignedResearcherProperties,
  getPaginatedAssignedUniversities,
  getPropertyService,
} from '../services/property.service.js';
import {
  stringToObjectId,
  transformPaginatedResponse,
} from '../utils/utils.js';
import { MODELS } from '../constants.js';
import { AssignResearcherProperty } from '../models/assigned-properties.model.js';
import { AssignUniversityProperty } from '../models/assigned-university-properties.model.js';
import { Report } from '../models/reports.model.js';
import { IPagination } from '../interface/index.interface.js';
import { Property } from '../models/property.model.js';
import { PropertyFiles } from '../models/property-files.model.js';

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

const assignResearcherProperty = asyncHandler(
  async (req: Request, res: Response) => {
    const { propertyId, researcherId } = req.body;

    const assignedResearcherProperty = await assignResearcherPropertyService(
      propertyId,
      researcherId
    );

    if (!assignedResearcherProperty) {
      return res
        .status(201)
        .json(
          new ApiError(
            400,
            `Something went wrong while assigning researcher property!`
          )
        );
    }

    res
      .status(200)
      .json(
        new ApiResponse(
          200,
          assignedResearcherProperty,
          'Assigned researcher successfully'
        )
      );
  }
);

const paginatedAssignedResearcherProperties = asyncHandler(
  async (req: Request, res: Response) => {
    const { page = 1, limit = 10, search = '' } = req.query;
    const { _id: researcherId } = req.user;

    const options = {
      page,
      limit,
    } as IPagination;

    const result = await getPaginatedAssignedResearcherProperties(
      search as string,
      researcherId,
      options
    );

    const renamedResult = transformPaginatedResponse(
      result,
      'assignedProperties'
    );

    res
      .status(200)
      .json(
        new ApiResponse(
          200,
          renamedResult,
          'Paginated data fetched successfully'
        )
      );
  }
);

// fix this later
const paginatedAssignedUniversityProperties = asyncHandler(
  async (req: Request, res: Response) => {
    const { page = 1, limit = 10, search = '' } = req.query;
    const { _id: universityId } = req.user;

    const options = {
      limit,
      page,
    } as IPagination;

    const result = await getPaginatedAssignedUniversities(
      search as string,
      universityId,
      options
    );

    const renamedResult = transformPaginatedResponse(
      result,
      'assignedUniversityProperties'
    );

    res
      .status(200)
      .json(
        new ApiResponse(
          200,
          renamedResult,
          'Paginated data fetched successfully'
        )
      );
  }
);

const deleteProperty = asyncHandler(async (req: Request, res: Response) => {
  const { id: propertyId } = req.params;

  const deletedProperty = await deletePropertyService(propertyId);

  if (!deletedProperty) {
    return res
      .status(201)
      .json(new ApiError(400, `Something went wrong while deleting property!`));
  }

  res
    .status(200)
    .json(
      new ApiResponse(200, deletedProperty, 'Property deleted successfully')
    );
});

const getProperty = asyncHandler(async (req: Request, res: Response) => {
  const { id: propertyId } = req.params;

  const property = await getPropertyService(propertyId);

  if (!property) {
    return res.status(201).json(new ApiError(400, `Property not found!`));
  }

  res
    .status(200)
    .json(new ApiResponse(200, property, 'Property fetched successfully'));
});

const paginatedProperties = asyncHandler(
  async (req: Request, res: Response) => {
    const { page = 1, limit = 10, search = '' } = req.query;

    const options = {
      page,
      limit,
    } as IPagination;

    const result = await getAllPaginatedPropertiesService(
      search as string,
      options
    );

    const renamedResult = transformPaginatedResponse(result, 'properties');

    res
      .status(200)
      .json(
        new ApiResponse(
          200,
          renamedResult,
          'Paginated data fetched successfully'
        )
      );
  }
);

export {
  addProperty,
  removeFiles,
  assignResearcherProperty,
  paginatedAssignedResearcherProperties,
  paginatedAssignedUniversityProperties,
  deleteProperty,
  getProperty,
  paginatedProperties,
};
