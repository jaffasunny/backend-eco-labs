import { Response, Request } from 'express';
import { ApiResponse } from '../utils/ApiResponse.js';
import { asyncHandler } from '../utils/asyncHandler.js';
import { ApiError } from '../utils/ApiError.js';
import {
  assignResearcherPropertyService,
  deletePropertyFileService,
  deletePropertyService,
  findOrUpdateProperty,
  getPropertyService,
} from '../services/property.service.js';
import {
  stringToObjectId,
  transformPaginatedResponse,
} from '../utils/utils.js';
import { MODELS } from '../constants.js';
import { AssignResearcherProperty } from '../models/assigned-properties.model.js';
import { AssignUniversityProperty } from '../models/assigned-university-properties.model.js';

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
    };

    const searchQuery = search
      ? {
          $or: [
            { 'property.name': { $regex: search, $options: 'i' } }, // Assuming `report` has a `name` field
            { 'researchers.name': { $regex: search, $options: 'i' } }, // Assuming `User` has a `name` field
          ],
        }
      : {};

    const pipeline = [
      {
        $match: {
          researchers: { $in: [stringToObjectId(researcherId)] },
          ...searchQuery,
        },
      },
      {
        $lookup: {
          from: MODELS.PROPERTIES,
          localField: 'property',
          foreignField: '_id',
          as: 'property',
          pipeline: [
            {
              $lookup: {
                from: MODELS.USERS,
                localField: 'landowner',
                foreignField: '_id',
                as: 'landowner',
                pipeline: [
                  {
                    $project: { _id: 1, name: 1, email: 1, phone: 1 },
                  },
                ],
              },
            },
            {
              $unwind: {
                path: '$landowner',
                preserveNullAndEmptyArrays: true,
              },
            },
          ],
        },
      },
      {
        $lookup: {
          from: MODELS.USERS,
          localField: 'researchers',
          foreignField: '_id',
          as: 'researchers',
          pipeline: [
            {
              $project: { _id: 1, name: 1, email: 1, phone: 1 },
            },
          ],
        },
      },
    ];

    const aggregateData = AssignResearcherProperty.aggregate(pipeline);

    const result = await AssignResearcherProperty.aggregatePaginate(
      aggregateData,
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
      page,
      limit,
    };

    const searchQuery = search
      ? {
          $or: [
            { 'report.name': { $regex: search, $options: 'i' } },
            { 'researchers.name': { $regex: search, $options: 'i' } },
          ],
        }
      : {};

    const pipeline = [
      {
        $match: {
          universities: { $in: [universityId] },
          ...searchQuery,
        },
      },
      {
        $lookup: {
          from: 'reports', // Name of the Report collection
          localField: 'report',
          foreignField: '_id',
          as: 'report',
          pipeline: [
            {
              $lookup: {
                from: 'properties',
                localField: 'property',
                foreignField: '_id',
                as: 'property',
              },
            },
            {
              $addFields: {
                property: { $arrayElemAt: ['$property', 0] },
                landAssessmentReport: {
                  $arrayElemAt: ['$landAssessmentReport', 0],
                },
              },
            },
            {
              $lookup: {
                from: MODELS.USERS, // Name of the User collection
                localField: 'property.landowner',
                foreignField: '_id',
                as: 'property.landowner',
                pipeline: [
                  {
                    $project: {
                      _id: 1,
                      name: 1,
                      email: 1,
                      phone: 1,
                    },
                  },
                ],
              },
            },
            {
              $addFields: {
                'property.landowner': {
                  $arrayElemAt: ['$property.landowner', 0],
                },
              },
            },
            {
              $lookup: {
                from: MODELS.BIDS,
                let: { reportId: '$_id' },
                pipeline: [
                  {
                    $match: {
                      $expr: { $eq: ['$report', '$$reportId'] },
                    },
                  },
                ],
                as: 'bid',
              },
            },
            {
              $addFields: {
                bid: { $arrayElemAt: ['$bid', 0] },
              },
            },
            {
              $project: {
                _id: 1,
                property: 1,
                landAssessmentReport: {
                  url: 1,
                  name: 1,
                },
                createdAt: 1,
                updatedAt: 1,
                landowner: {
                  _id: 1,
                  name: 1,
                  email: 1,
                  phone: 1,
                },
                bid: 1,
              },
            },
          ],
        },
      },
      {
        $lookup: {
          from: MODELS.USERS, // Name of the User collection
          localField: 'researchers',
          foreignField: '_id',
          as: 'researchers',
          pipeline: [
            {
              $project: {
                _id: 1,
                name: 1,
                email: 1,
                phone: 1,
              },
            },
          ],
        },
      },
      {
        $unwind: '$report', // Unwind if you expect only one report per document
      },
      {
        $project: {
          _id: 1,
          report: 1,
          universities: 1,
          createdAt: 1,
          updatedAt: 1,
        },
      },
    ];

    const aggregateData = AssignUniversityProperty.aggregate(pipeline);

    const result = await AssignUniversityProperty.aggregatePaginate(
      aggregateData,
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

export {
  addProperty,
  removeFiles,
  assignResearcherProperty,
  paginatedAssignedResearcherProperties,
  paginatedAssignedUniversityProperties,
  deleteProperty,
  getProperty,
};
