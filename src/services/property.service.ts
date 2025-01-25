import mongoose, { ClientSession } from 'mongoose';
import { MODELS } from '../constants.js';
import { IPagination } from '../interface/index.interface.js';
import { AssignResearcherProperty } from '../models/assigned-properties.model.js';
import { AssignUniversityProperty } from '../models/assigned-university-properties.model.js';
import { Bids } from '../models/bids.model.js';
import { PropertyFiles } from '../models/property-files.model.js';
import { Property } from '../models/property.model.js';
import { ApiError } from '../utils/ApiError.js';
import { stringToObjectId } from '../utils/utils.js';

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
  const existingFiles = await PropertyFiles.findOne({
    property: property._id,
  }).session(session);

  // Create property files only if they don't already exist
  if (!existingFiles && files) {
    const [createdPropertyFiles] = await PropertyFiles.create(
      [
        {
          files: files.map((file) => ({
            url: file.path,
            name: file.filename,
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
    const existingFiles = await PropertyFiles.findOne({
      property: property._id,
    }).session(session);

    // Create property files only if they don't already exist
    if (!existingFiles && files) {
      const [createdPropertyFiles] = await PropertyFiles.create(
        [
          {
            files: files.map((file) => ({
              url: file.path,
              name: file.filename,
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
  const updatedDocument = await PropertyFiles.findByIdAndUpdate(
    id,
    { $pull: { files: { _id: fileId } } }, // Remove the file with the specified ID
    { new: true } // Return the updated document
  );

  if (!updatedDocument) {
    throw new Error('PropertyFiles document not found');
  }

  if (!updatedDocument.files.length) {
    // Delete the entire PropertyFiles document
    await PropertyFiles.findByIdAndDelete(id);
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
    throw new ApiError(401, `Researcher is already assigned to this property!`);
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
    await PropertyFiles.deleteMany(
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
  const property = await Property.findById(
    stringToObjectId(propertyId)
  ).populate({
    path: 'landowner',
    select: '_id name email phone status',
  });

  return property;
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

  return result;
};

const getPaginatedAssignedUniversities = async (
  search: string,
  universityId: string,
  options: IPagination
) => {
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

  return result;
};

const getAllPaginatedPropertiesService = async (
  search: string,
  options: IPagination
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
        from: MODELS.PROPERTIES_FILES,
        let: { propertyId: '$_id' },
        as: 'docs',
        pipeline: [
          { $match: { $expr: { $eq: ['$property', '$$propertyId'] } } },
          {
            $project: {
              _id: 1,
              files: 1,
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
  getPaginatedAssignedUniversities,
  getPaginatedAssignedResearcherProperties,
  getAllPaginatedPropertiesService,
};
