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
  transferPropertyService,
} from '../services/property.service.js';
import {
  parseBooleanQueryParam,
  toMongoId,
  transformPaginatedResponse,
} from '../utils/utils.js';
import { IPagination } from '../interface/index.interface.js';
import { PROPOSAL_STATUS, ROLES } from '../constants.js';
import { Bids } from '../models/bids.model.js';
import { Property } from '../models/property.model.js';

const addProperty = asyncHandler(async (req: Request, res: Response) => {
  const {
    propertyName,
    propertyLocation,
    propertySize,
    landownerId,
    files,
    startDate,
  } = req.body;

  const property = await findOrUpdateProperty(
    propertyName,
    propertyLocation,
    propertySize,
    files,
    landownerId,
    startDate
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

const updateProperty = asyncHandler(async (req: Request, res: Response) => {
  const {
    propertyName,
    propertyLocation,
    propertySize,
    landownerId,
    files,
    startDate,
  } = req.body;

  const { id } = req.params;

  const property = await findOrUpdateProperty(
    propertyName,
    propertyLocation,
    propertySize,
    files,
    landownerId,
    startDate,
    id
  );

  if (!property) {
    return res
      .status(201)
      .json(new ApiError(400, 'Something went wrong while creating property!'));
  }

  return res
    .status(201)
    .json(new ApiResponse(201, { property }, 'Property Updated successfully!'));
});

const removeFiles = asyncHandler(async (req: Request, res: Response) => {
  const { fileId } = req.params;
  const { propertyFilesId, propertyId } = req.query;

  // propertyFilesId = reportId
  const deletedFile = await deletePropertyFileService(
    propertyFilesId as string,
    fileId,
    propertyId as string
  );

  console.log({
    deletedFile,
  });

  if (!deletedFile) {
    return res
      .status(201)
      .json(new ApiError(400, 'Something went wrong while creating property!'));
  }

  return res
    .status(201)
    .json(
      new ApiResponse(201, { deletedFile }, 'Report Deleted successfully!')
    );
});

const assignResearcherProperty = asyncHandler(
  async (req: Request, res: Response) => {
    const { propertyIds, researcherId, assignDate } = req.body; // array of property IDs
    const { roles, _id } = req.user;

    if (!Array.isArray(propertyIds) || propertyIds.length === 0) {
      return res
        .status(400)
        .json(new ApiError(400, 'propertyIds must be a non-empty array.'));
    }

    const results = [];

    for (const propertyId of propertyIds) {
      try {
        if (roles === ROLES.ADMIN) {
          const [findBid] = await Bids.find({
            researcher: toMongoId(_id),
            property: propertyId,
          });

          if (!findBid) {
            const createdBid = await Bids.create({
              property: propertyId,
              researcher: toMongoId(_id),
              status: PROPOSAL_STATUS.APPROVED,
              description: 'This is a bid created by admin for researcher',
            });

            if (!createdBid) {
              results.push({ propertyId, error: 'Bid creation failed' });
              continue;
            }
          }
        }

        const assigned = await assignResearcherPropertyService(
          propertyId,
          researcherId,
          assignDate
        );

        if (!assigned) {
          results.push({ propertyId, error: 'Assignment failed' });
        } else {
          results.push({ propertyId, success: true });
        }
      } catch (error) {
        const errorMessage =
          error instanceof Error ? error.message : String(error);
        results.push({ propertyId, error: errorMessage });
      }
    }

    res
      .status(200)
      .json(
        new ApiResponse(200, results, 'Researcher assignment process completed')
      );
  }
);

const assignedResearchersToProperty = asyncHandler(
  async (req: Request, res: Response) => {
    const { page = 1, limit = 10, search = '', propertyId } = req.query;
    const { roles } = req.user;

    const options = {
      page,
      limit,
    } as IPagination;

    const result = await getPaginatedPropertiesAssignedToResearcher(
      search as string,
      propertyId as string,
      options,
      roles
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

const transferProperty = asyncHandler(async (req: Request, res: Response) => {
  const { id: propertyId } = req.params;
  const { landowner } = req.query;

  const transferedProperty = await transferPropertyService(
    propertyId,
    landowner as string
  );

  return res.status(200).json(new ApiResponse(200, transferedProperty));
});

const getProperty = asyncHandler(async (req: Request, res: Response) => {
  const { id: propertyId } = req.params;
  const { roles } = req.user;

  const property = await getPropertyService(propertyId, roles);

  if (!property || !property.length) {
    return res.status(201).json(new ApiError(400, `Property not found!`));
  }

  res
    .status(200)
    .json(new ApiResponse(200, property[0], 'Property fetched successfully'));
});

const paginatedProperties = asyncHandler(
  async (req: Request, res: Response) => {
    const { page = 1, limit = 10, search = '', sort } = req.query;
    const { roles } = req.user;

    const options = {
      page,
      limit,
    } as IPagination;

    const result = await getAllPaginatedPropertiesService(
      search as string,
      options,
      roles,
      sort as string
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

const updatePropertyNote = asyncHandler(async (req: Request, res: Response) => {
  const { id: propertyId } = req.params;
  const { note } = req.body;
  const { _id: userId } = req.user;

  // Find the property
  const property = await Property.findById(propertyId);

  if (!property) {
    return res.status(404).json(new ApiError(404, 'Property not found!'));
  }

  // Set the user context for the middleware
  (property as any).__user = req.user;

  // Update the note
  property.note = note;
  property.noteUpdatedBy = userId;

  await property.save();

  res
    .status(200)
    .json(new ApiResponse(200, property, 'Property note updated successfully'));
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
  transferProperty,
  updatePropertyNote,
  updateProperty,
};
