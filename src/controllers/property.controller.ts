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
  getBidService,
  getPaginatedAssignedResearcherProperties,
  getPaginatedPropertiesAssignedToResearcher,
  getPaginatedResearcherReportsOnProperty,
  getPropertyService,
  toggleArchivePropertyService,
} from '../services/property.service.js';
import { transformPaginatedResponse } from '../utils/utils.js';
import { IPagination } from '../interface/index.interface.js';
import { ROLES } from '../constants.js';

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

const assignedResearchersToProperty = asyncHandler(
  async (req: Request, res: Response) => {
    const { page = 1, limit = 10, search = '', propertyId } = req.query;

    const options = {
      page,
      limit,
    } as IPagination;

    const result = await getPaginatedPropertiesAssignedToResearcher(
      search as string,
      propertyId as string,
      options
    );

    const renamedResult = transformPaginatedResponse(
      result,
      'researchersToProperty'
    );

    res
      .status(200)
      .json(
        new ApiResponse(
          200,
          renamedResult,
          'Properties assigned to researcher fetched successfully'
        )
      );
  }
);

const researcherSubmittedReports = asyncHandler(
  async (req: Request, res: Response) => {
    const { page = 1, limit = 10, search = '', propertyId } = req.query;
    const { researcherId } = req.params;
    const { roles } = req.user;

    const options = {
      page,
      limit,
    } as IPagination;

    const result = await getPaginatedResearcherReportsOnProperty(
      search as string,
      propertyId as string,
      researcherId as string,
      options,
      roles
    );

    const renamedResult = transformPaginatedResponse(
      result,
      'researcherReports'
    );

    res
      .status(200)
      .json(
        new ApiResponse(
          200,
          renamedResult,
          'Researcher Submitted Reports fetched successfully'
        )
      );
  }
);

const paginatedAssignedResearcherProperties = asyncHandler(
  async (req: Request, res: Response) => {
    const { page = 1, limit = 10, search = '', researcher } = req.query;
    const { _id: researcherId, roles } = req.user;

    const options = {
      page,
      limit,
    } as IPagination;

    const result = await getPaginatedAssignedResearcherProperties(
      search as string,
      roles === ROLES.RESEARCHER ? researcherId : researcher,
      options,
      roles
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

const toggleArchiveProperty = asyncHandler(
  async (req: Request, res: Response) => {
    const { id: propertyId } = req.params;

    const toggleArchivedProperty =
      await toggleArchivePropertyService(propertyId);

    return res.status(200).json(new ApiResponse(200, toggleArchivedProperty));
  }
);

const getProperty = asyncHandler(async (req: Request, res: Response) => {
  const { id: propertyId } = req.params;

  const property = await getPropertyService(propertyId);

  if (!property || !property.length) {
    return res.status(201).json(new ApiError(400, `Property not found!`));
  }

  res
    .status(200)
    .json(new ApiResponse(200, property[0], 'Property fetched successfully'));
});

const paginatedProperties = asyncHandler(
  async (req: Request, res: Response) => {
    const { page = 1, limit = 10, search = '' } = req.query;
    const { roles } = req.user;

    const options = {
      page,
      limit,
    } as IPagination;

    const result = await getAllPaginatedPropertiesService(
      search as string,
      options,
      roles
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

const getSingleBid = asyncHandler(async (req: Request, res: Response) => {
  const { id } = req.params;

  const foundBid = await getBidService(id);

  if (!foundBid) {
    return res.status(201).json(new ApiError(400, `Bid not found!`));
  }

  res
    .status(200)
    .json(new ApiResponse(200, foundBid, 'Bid fetched successfully!'));
});

export {
  addProperty,
  removeFiles,
  assignResearcherProperty,
  paginatedAssignedResearcherProperties,
  deleteProperty,
  getProperty,
  paginatedProperties,
  assignedResearchersToProperty,
  researcherSubmittedReports,
  getSingleBid,
  toggleArchiveProperty,
};
