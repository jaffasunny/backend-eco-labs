import mongoose, { ClientSession } from 'mongoose';
import { MODELS, ROLES } from '../constants.js';
import { IPagination } from '../interface/index.interface.js';
import { AssignResearcherProperty } from '../models/assignResearcherProperties.model.js';
import { Bids } from '../models/bids.model.js';
import { Reports } from '../models/reports.model.js';
import { Property } from '../models/property.model.js';
import { ApiError } from '../utils/ApiError.js';
import { toMongoId } from '../utils/utils.js';

const findOrUpdatePropertySession = async (
  propertyName: string,
  propertyLocation: string,
  propertySize: string | undefined = undefined,
  files: Express.Multer.File[] | null,
  userId: mongoose.Schema.Types.ObjectId | string,
  session: ClientSession
) => {
  let property = await Property.findOne({
    propertyName,
    landowner: userId,
  }).session(session);

  let uploadedPropertyFiles = null;

  if (property) {
    property.set({
      propertyName,
      propertyLocation,
      propertySize,
    });

    // Ensure validation is skipped for required fields during updates
    await property.save({ session, validateModifiedOnly: true });
    property.isNew = false; // Flag for response
  } else {
    // Create a new property
    const [createdProperty] = await Property.create(
      [
        {
          propertyName,
          propertyLocation,
          propertySize,
          landowner: userId,
        },
      ],
      { session }
    );
    property = createdProperty;
    property.isNew = true; // Flag for response
  }

  // Check if property files already exist
  const existingFiles = await Reports.findOne({
    property: property._id,
  }).session(session);

  // Create property files only if they don't already exist
  if (!existingFiles && files) {
    const [createdPropertyFiles] = await Reports.create(
      [
        {
          files: files.map((file) => ({
            url: file.path,
            name: file.filename,
            type: file.mimetype,
            originalName: file.originalname,
          })),
          property: property._id,
        },
      ],
      { session }
    );
    uploadedPropertyFiles = createdPropertyFiles.files;
  }

  return { property, uploadedPropertyFiles };
};

const findOrUpdateProperty = async (
  propertyName: string,
  propertyLocation: string,
  propertySize: string | undefined = undefined,
  files: Express.Multer.File[],
  userId: mongoose.Schema.Types.ObjectId | string
) => {
  let property = await Property.findOne({
    propertyName,
    landowner: userId,
  });

  let uploadedPropertyFiles = null;

  // Start a transaction
  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    if (property) {
      property.set({
        propertyName,
        propertyLocation,
        propertySize,
      });

      // Ensure validation is skipped for required fields during updates
      await property.save({ session, validateModifiedOnly: true });
      property.isNew = false; // Flag for response
    } else {
      // Create a new property
      const [createdProperty] = await Property.create(
        [
          {
            propertyName,
            propertyLocation,
            propertySize,
            landowner: userId,
          },
        ],
        { session }
      );
      property = createdProperty;
      property.isNew = true; // Flag for response
    }

    // Check if property files already exist
    const existingFiles = await Reports.findOne({
      property: property._id,
    }).session(session);

    // Create property files only if they don't already exist
    if (!existingFiles && files) {
      const [createdPropertyFiles] = await Reports.create(
        [
          {
            files: files.map((file) => ({
              url: file.path,
              name: file.filename,
              type: file.mimetype,
              originalName: file.originalname,
            })),
            property: property._id,
          },
        ],
        { session }
      );
      uploadedPropertyFiles = createdPropertyFiles.files;
    }

    // Commit transaction
    await session.commitTransaction();

    return { property, uploadedPropertyFiles };
  } catch (error: any) {
    // Rollback transaction
    await session.abortTransaction();
    throw new ApiError(500, error.message || 'Failed to create landowner!');
  } finally {
    // End session
    session.endSession();
  }
};

const fetchPopulatedProperty = async (
  propertyId: string,
  session: ClientSession
) => {
  const property = await Property.findById(propertyId)
    .populate({
      path: 'landowner',
      select: '_id name email roles phone',
    })
    .session(session);

  if (!property) {
    throw new ApiError(500, 'Failed to fetch property details');
  }
  return property;
};

const deletePropertyFileService = async (id: string, fileId: string) => {
  const updatedDocument = await Reports.findByIdAndUpdate(
    id,
    { $pull: { files: { _id: fileId } } }, // Remove the file with the specified ID
    { new: true } // Return the updated document
  );

  if (!updatedDocument) {
    throw new Error('Reports document not found');
  }

  if (!updatedDocument.files.length) {
    // Delete the entire Reports document
    await Reports.findByIdAndDelete(id);
    return null; // Indicate that the document was deleted
  }

  return updatedDocument;
};

const assignResearcherPropertyService = async (
  propertyId: string,
  researcherId: string
) => {
  const existingProperty = await AssignResearcherProperty.findOne({
    property: propertyId,
    researchers: { $in: [researcherId] },
  }).populate('researchers');

  if (existingProperty) {
    throw new ApiError(409, `Researcher is already assigned to this property!`);
  }

  const property = await AssignResearcherProperty.findOne({
    property: propertyId,
  });

  if (property) {
    const updatedProperty = await AssignResearcherProperty.findOneAndUpdate(
      { property: propertyId },
      { $addToSet: { researchers: researcherId } },
      { new: true, runValidators: true }
    ).populate('researchers');
    return updatedProperty;
  }

  const assignedResearcherProperty = await AssignResearcherProperty.create({
    property: propertyId,
    researchers: [researcherId],
  });

  // Populate researchers in the created property
  const populatedProperty = await AssignResearcherProperty.findById(
    assignedResearcherProperty._id
  ).populate('researchers');

  return populatedProperty;
};

const deletePropertyService = async (
  propertyId: mongoose.Types.ObjectId | string
) => {
  const property = await Property.findById(propertyId);

  if (!property) {
    return new ApiError(401, `Property not found!`);
  }

  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    await Reports.deleteMany(
      {
        property: property._id,
      },
      session
    );

    await Bids.deleteMany(
      {
        property: property._id,
      },
      session
    );

    const deletedProperty = await Property.findByIdAndDelete(
      propertyId,
      session
    );

    return deletedProperty;
  } catch (error: any) {
    // Rollback transaction
    await session.abortTransaction();
    throw new ApiError(500, error.message || 'Failed to create landowner!');
  } finally {
    // End session
    session.endSession();
  }
};

const getPropertyService = async (propertyId: string) => {
  const property = await Property.findById(toMongoId(propertyId)).populate({
    path: 'landowner',
    select: '_id name email phone status',
  });

  return property;
};

const getBidService = async (id: string) => {
  const foundBid = await Bids.findById(id)
    .populate({
      path: 'property',
      model: MODELS.PROPERTIES,
      populate: {
        path: 'landowner',
        model: MODELS.USERS,
        select: '_id name email phone',
      },
    })
    .populate('researcher', '_id name email phone');

  return foundBid;
};

const getPaginatedAssignedResearcherProperties = async (
  search: string,
  researcherId: string,
  options: {
    page: number;
    limit: number;
  }
) => {
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
        researchers: { $in: [toMongoId(researcherId)] },
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
  ];

  const aggregateData = AssignResearcherProperty.aggregate(pipeline);

  const result = await AssignResearcherProperty.aggregatePaginate(
    aggregateData,
    options
  );

  return result;
};

const getPaginatedPropertiesAssignedToResearcher = async (
  search: string,
  propertyId: string,
  options: {
    page: number;
    limit: number;
  }
) => {
  const searchQuery = search
    ? {
        $or: [{ propertyName: { $regex: search, $options: 'i' } }],
      }
    : {};

  const pipeline = [
    {
      $match: {
        _id: toMongoId(propertyId),
        ...searchQuery,
      },
    },
    {
      $lookup: {
        from: MODELS.USERS,
        localField: 'assignedResearchers',
        foreignField: '_id',
        as: 'assignedResearchers',
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
      $unwind: '$assignedResearchers',
    },
    {
      $replaceRoot: {
        newRoot: {
          $mergeObjects: [
            '$assignedResearchers',
            { propertyDetails: { propertyName: '$propertyName', _id: '$_id' } },
          ],
        },
      },
    },
    {
      $project: {
        _id: 1,
        name: 1,
        email: 1,
        phone: 1,
      },
    },
  ];

  const aggregateData = Property.aggregate(pipeline);

  const result = await Property.aggregatePaginate(aggregateData, options);

  return result;
};

const getPaginatedResearcherReportsOnProperty = async (
  search: string,
  propertyId: string,
  researcherId: string,
  options: {
    page: number;
    limit: number;
  },
  roles: string
) => {
  const searchQuery = search
    ? {
        $or: [{ propertyName: { $regex: search, $options: 'i' } }],
      }
    : {};

  const pipeline = [
    {
      $match: {
        _id: toMongoId(propertyId),
        ...searchQuery,
      },
    },
    {
      $lookup: {
        from: MODELS.USERS,
        localField: 'assignedResearchers',
        foreignField: '_id',
        as: 'assignedResearchers',
        pipeline: [
          {
            $match: {
              _id: toMongoId(researcherId),
            },
          },
          {
            $lookup: {
              from: MODELS.REPORTS,
              localField: '_id',
              foreignField: 'researcher',
              as: 'reports',
              pipeline: [
                {
                  $match: {
                    researcher: { $exists: false },
                  },
                },
                ...(roles !== ROLES.ADMIN
                  ? [{ $match: { archived: false } }]
                  : []),
                {
                  $project: {
                    _id: 1,
                    files: 1,
                    name: 1,
                    description: 1,
                    createdAt: 1,
                    updatedAt: 1,
                  },
                },
              ],
            },
          },
          {
            $project: {
              _id: 1,
              name: 1,
              email: 1,
              phone: 1,
              reports: 1,
            },
          },
        ],
      },
    },
    {
      $unwind: '$assignedResearchers',
    },
  ];

  const aggregateData = Property.aggregate(pipeline);

  const result = await Property.aggregatePaginate(aggregateData, options);

  return result;
};

const getAllPaginatedPropertiesService = async (
  search: string,
  options: IPagination,
  roles: string
) => {
  const searchQuery = search
    ? {
        $or: [
          { propertyName: { $regex: search, $options: 'i' } },
          { propertyLocation: { $regex: search, $options: 'i' } },
          { propertySize: { $regex: search, $options: 'i' } },
        ],
      }
    : {};

  const assignedFilter: Record<string, any> = {};

  const aggregatedProperties = Property.aggregate([
    {
      $match: {
        ...searchQuery,
        ...assignedFilter,
      },
    },
    {
      $lookup: {
        from: MODELS.REPORTS,
        let: { propertyId: '$_id' },
        as: 'docs',
        pipeline: [
          {
            $match: {
              $expr: {
                $eq: ['$property', '$$propertyId'],
              },
              researcher: { $exists: false },
            },
          },
          ...(roles !== ROLES.ADMIN ? [{ $match: { archived: false } }] : []),
          {
            $project: {
              _id: 1,
              files: 1,
              name: 1,
              description: 1,
              createdAt: 1,
              updatedAt: 1,
            },
          },
        ],
      },
    },
    {
      $lookup: {
        from: MODELS.USERS,
        localField: 'landowner',
        foreignField: '_id',
        as: 'landowner',
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
        docs: { $arrayElemAt: ['$docs', 0] },
        landowner: { $arrayElemAt: ['$landowner', 0] },
      },
    },
    {
      $project: {
        _id: 1,
        propertyName: 1,
        propertyLocation: 1,
        propertySize: 1,
        landowner: 1,
        docs: '$docs.files',
      },
    },
    {
      $lookup: {
        from: MODELS.BIDS,
        let: { propertyId: '$_id' },
        pipeline: [
          {
            $match: {
              $expr: { $eq: ['$property', '$$propertyId'] },
            },
          },
          {
            $lookup: {
              from: MODELS.USERS,
              localField: 'researcher',
              foreignField: '_id',
              as: 'researcher',
              pipeline: [
                {
                  $project: {
                    _id: 1,
                    name: 1,
                    email: 1,
                  },
                },
              ],
            },
          },
          {
            $addFields: {
              researcher: { $arrayElemAt: ['$researcher', 0] },
            },
          },
          {
            $project: {
              _id: 1,
              researcher: 1,
              status: 1,
              description: 1,
              files: 1,
              createdAt: 1,
              updatedAt: 1,
            },
          },
        ],
        as: 'bids',
      },
    },
  ]);

  const result = await Property.aggregatePaginate(
    aggregatedProperties,
    options
  );

  return result;
};

export {
  fetchPopulatedProperty,
  findOrUpdatePropertySession,
  findOrUpdateProperty,
  deletePropertyFileService,
  assignResearcherPropertyService,
  deletePropertyService,
  getPropertyService,
  getPaginatedAssignedResearcherProperties,
  getAllPaginatedPropertiesService,
  getPaginatedPropertiesAssignedToResearcher,
  getPaginatedResearcherReportsOnProperty,
  getBidService,
};
