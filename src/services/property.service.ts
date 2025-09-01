import mongoose, { ClientSession, ObjectId } from 'mongoose';
import { MODELS, ROLES } from '../constants.js';
import { IPagination } from '../interface/index.interface.js';
import { AssignResearcherProperty } from '../models/assignResearcherProperties.model.js';
import { Bids } from '../models/bids.model.js';
import { Reports } from '../models/reports.model.js';
import { Property } from '../models/property.model.js';
import { ApiError } from '../utils/ApiError.js';
import { parseSortParameter, toMongoId } from '../utils/utils.js';

const findOrUpdatePropertySession = async (
  propertyName: string,
  propertyLocation: string,
  propertySize: string | undefined = undefined,
  files: Express.Multer.File[] | null,
  userId: mongoose.Schema.Types.ObjectId | string,
  startDate: string,
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
      startDate,
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
          startDate,
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
  });

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
  userId: mongoose.Schema.Types.ObjectId | string,
  startDate: string,
  propertyId: mongoose.Schema.Types.ObjectId | string | null = null
) => {
  const findCondition = propertyId
    ? {
        _id: propertyId,
      }
    : {
        propertyName,
        landowner: userId,
      };

  let property = await Property.findOne(findCondition);

  console.log({
    findCondition,
    startDate,
    propertyId,
  });

  let uploadedPropertyFiles = null;

  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    if (property) {
      property.set({
        propertyName,
        propertyLocation,
        propertySize,
        startDate,
      });

      await property.save({ session, validateModifiedOnly: true });
      property.isNew = false;
    } else {
      const [createdProperty] = await Property.create(
        [
          {
            propertyName,
            propertyLocation,
            propertySize,
            landowner: userId,
            startDate,
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
    } else if (existingFiles && files) {
      // Push new files to existing reports array
      const newFiles = files.map((file) => ({
        url: file.path,
        name: file.filename,
        type: file.mimetype,
        originalName: file.originalname,
      }));

      await Reports.findByIdAndUpdate(
        existingFiles._id,
        { $push: { files: { $each: newFiles } } },
        { new: true, session }
      );

      uploadedPropertyFiles = newFiles;
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

const deletePropertyFileService = async (
  id: string,
  fileId: string,
  propertyId: string
) => {
  let newId: string;

  if (propertyId) {
    const findReport = await Reports.findOne({
      property: toMongoId(propertyId),
      'files._id': fileId,
    });

    if (!findReport) {
      throw new Error('Report with the specified file not found');
    }

    newId = String(findReport._id);
  } else {
    newId = id;
  }

  const updatedDocument = await Reports.findByIdAndUpdate(
    toMongoId(newId),
    { $pull: { files: { _id: fileId } } }, // Remove the file with the specified ID
    { new: true } // Return the updated document
  );

  if (!updatedDocument) {
    throw new Error('Reports document not found');
  }

  if (!updatedDocument.files.length) {
    // Delete the entire Reports document
    return await Reports.findByIdAndDelete(newId);
  }

  return updatedDocument;
};

const assignResearcherPropertyService = async (
  propertyId: string,
  researcherId: string,
  assignDate: string
) => {
  const existingProperty = await AssignResearcherProperty.findOne({
    property: propertyId,
    'researchers.researcher': researcherId,
  }).populate('researchers.researcher');

  if (existingProperty) {
    throw new ApiError(409, `Researcher is already assigned to this property!`);
  }

  const property = await AssignResearcherProperty.findOne({
    property: propertyId,
  });

  if (property) {
    const updatedProperty = await AssignResearcherProperty.findOneAndUpdate(
      { property: propertyId },
      {
        $addToSet: {
          researchers: {
            researcher: researcherId,
            assignDate: assignDate,
          },
        },
      },
      { new: true, runValidators: true }
    ).populate('researchers.researcher');
    return updatedProperty;
  }

  const assignedResearcherProperty = await AssignResearcherProperty.create({
    property: propertyId,
    researchers: [
      {
        researcher: researcherId,
        assignDate: assignDate,
      },
    ],
  });

  // Populate researchers in the created property
  const populatedProperty = await AssignResearcherProperty.findById(
    assignedResearcherProperty._id
  ).populate('researchers.researcher');

  return populatedProperty;
};

const unassignResearcherPropertyService = async (
  propertyId: string,
  researcherId: string
) => {
  const existingProperty = await AssignResearcherProperty.findOne({
    property: toMongoId(propertyId),
    'researchers.researcher': toMongoId(researcherId),
  }).populate('researchers.researcher');

  if (!existingProperty) {
    throw new ApiError(404, `Researcher is not assigned to this property!`);
  }

  const property = await AssignResearcherProperty.findOne({
    property: toMongoId(propertyId),
  });

  if (!property) {
    throw new ApiError(404, 'Property not found!');
  }

  if (researcherId) {
    if (existingProperty.researchers.length === 1) {
      await AssignResearcherProperty.findOneAndDelete({
        property: toMongoId(propertyId),
      });

      return;
    }

    const updatedProperty = await AssignResearcherProperty.findOneAndUpdate(
      { property: toMongoId(propertyId) },
      {
        $pull: {
          researchers: {
            researcher: toMongoId(researcherId),
          },
        },
      },
      { new: true, runValidators: true }
    ).populate('researchers.researcher');

    return updatedProperty;
  }
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

const getPropertyService = async (propertyId: string, roles?: string) => {
  // const property = await Property.findById(toMongoId(propertyId)).populate({
  //   path: 'landowner',
  //   select: '_id name email phone status',
  // });

  const property = await Property.aggregate([
    {
      $match: {
        _id: toMongoId(propertyId),
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
        startDate: 1,
        ...(roles === ROLES.ADMIN ? { note: 1, noteUpdatedBy: 1 } : {}),
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

  return property;
};

const toggleArchivePropertyService = async (reportId: string) => {
  const property = await Property.findById(toMongoId(reportId));

  if (!property) {
    throw new Error('Property not found');
  }

  property.archived = !property.archived;

  const updatedProperty = await property.save();

  if (updatedProperty.archived) {
    return 'Property archived successfully';
  } else {
    return 'Property unarchived successfully';
  }
};

const transferPropertyService = async (
  propertyId: string,
  newLandowner: string
) => {
  console.log({
    propertyId,
    newLandowner,
  });
  const property = await Property.findById(toMongoId(propertyId));

  if (!property) {
    throw new Error('Property not found');
  }

  const updatedLandowner = toMongoId(newLandowner);

  if (updatedLandowner) {
    property.landowner =
      updatedLandowner as unknown as mongoose.Schema.Types.ObjectId;
  }

  const updatedProperty = await property.save();

  return updatedProperty;
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
  },
  roles: string
) => {
  const searchQuery = search
    ? {
        $or: [{ 'property.propertyName': { $regex: search, $options: 'i' } }],
      }
    : {};

  const pipeline = [
    {
      $match: {
        'researchers.researcher': toMongoId(researcherId),
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
          ...(roles !== ROLES.ADMIN ? [{ $match: { archived: false } }] : []),
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
                    ...(roles === ROLES.ADMIN
                      ? { note: 1, noteUpdatedBy: 1 }
                      : {}),
                  },
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
          {
            $project: {
              _id: 1,
              propertyName: 1,
              propertyLocation: 1,
              propertySize: 1,
              startDate: 1,
              ...(roles === ROLES.ADMIN ? { note: 1, noteUpdatedBy: 1 } : {}),
              landowner: 1,
            },
          },
        ],
      },
    },
    {
      $addFields: {
        property: { $arrayElemAt: ['$property', 0] },
      },
    },
    {
      $lookup: {
        from: MODELS.USERS,
        localField: 'researchers.researcher',
        foreignField: '_id',
        as: 'populatedResearchers',
        pipeline: [
          {
            $project: {
              _id: 1,
              name: 1,
              email: 1,
              phone: 1,
              status: 1,
              roles: 1,
              advisor: 1,
              universityName: 1,
              isArchived: 1,
              createdAt: 1,
              updatedAt: 1,
            },
          },
        ],
      },
    },
    {
      $addFields: {
        researchers: {
          $cond: {
            if: { $isArray: '$researchers' },
            then: {
              $map: {
                input: '$researchers',
                as: 'researcher',
                in: {
                  $mergeObjects: [
                    '$$researcher',
                    {
                      researcher: {
                        $arrayElemAt: [
                          {
                            $filter: {
                              input: '$populatedResearchers',
                              as: 'populatedResearcher',
                              cond: {
                                $eq: [
                                  '$$populatedResearcher._id',
                                  '$$researcher.researcher',
                                ],
                              },
                            },
                          },
                          0,
                        ],
                      },
                    },
                  ],
                },
              },
            },
            else: [],
          },
        },
      },
    },
    {
      $project: {
        populatedResearchers: 0,
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
  },
  roles: string
) => {
  const searchQuery = search
    ? {
        $or: [{ 'property.propertyName': { $regex: search, $options: 'i' } }],
      }
    : {};

  const pipeline = [
    {
      $match: {
        property: toMongoId(propertyId),
        ...searchQuery,
      },
    },
    {
      $unwind: '$researchers',
    },
    {
      $lookup: {
        from: MODELS.PROPERTIES,
        localField: 'property',
        foreignField: '_id',
        as: 'property',
        pipeline: [
          ...(roles !== ROLES.ADMIN ? [{ $match: { archived: false } }] : []),
          {
            $project: {
              _id: 1,
              propertyName: 1,
              propertyLocation: 1,
              propertySize: 1,
              startDate: 1,
              ...(roles === ROLES.ADMIN ? { note: 1, noteUpdatedBy: 1 } : {}),
            },
          },
        ],
      },
    },
    {
      $addFields: {
        property: { $arrayElemAt: ['$property', 0] },
      },
    },
    {
      $lookup: {
        from: MODELS.USERS,
        localField: 'researchers.researcher',
        foreignField: '_id',
        as: 'researcher',
        pipeline: [
          {
            $project: {
              _id: 1,
              name: 1,
              email: 1,
              phone: 1,
              status: 1,
              roles: 1,
              advisor: 1,
              universityName: 1,
              isArchived: 1,
              createdAt: 1,
              updatedAt: 1,
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
      $replaceRoot: {
        newRoot: {
          $mergeObjects: [
            '$researcher',
            {
              assignDate: '$researchers.assignDate',
              propertyDetails: {
                propertyName: '$property.propertyName',
                _id: '$property._id',
                propertyLocation: '$property.propertyLocation',
                propertySize: '$property.propertySize',
                startDate: '$property.startDate',
                ...(roles === ROLES.ADMIN
                  ? {
                      note: '$property.note',
                      noteUpdatedBy: '$property.noteUpdatedBy',
                    }
                  : {}),
              },
            },
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
        status: 1,
        roles: 1,
        advisor: 1,
        universityName: 1,
        isArchived: 1,
        assignDate: 1,
        propertyDetails: 1,
        createdAt: 1,
        updatedAt: 1,
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
        $or: [{ 'property.propertyName': { $regex: search, $options: 'i' } }],
      }
    : {};

  const pipeline = [
    {
      $match: {
        property: toMongoId(propertyId),
        'researchers.researcher': toMongoId(researcherId),
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
          ...(roles !== ROLES.ADMIN ? [{ $match: { archived: false } }] : []),
          {
            $project: {
              _id: 1,
              propertyName: 1,
              propertyLocation: 1,
              propertySize: 1,
              startDate: 1,
              landowner: 1,
              ...(roles === ROLES.ADMIN ? { note: 1, noteUpdatedBy: 1 } : {}),
            },
          },
        ],
      },
    },
    {
      $addFields: {
        property: { $arrayElemAt: ['$property', 0] },
      },
    },
    {
      $lookup: {
        from: MODELS.USERS,
        localField: 'researchers.researcher',
        foreignField: '_id',
        as: 'populatedResearchers',
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
                    property: toMongoId(propertyId),
                    researcher: { $exists: true },
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
                    archived: 1,
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
      $addFields: {
        assignedResearchers: { $arrayElemAt: ['$populatedResearchers', 0] },
      },
    },
    {
      $project: {
        _id: '$property._id',
        propertyName: '$property.propertyName',
        propertyLocation: '$property.propertyLocation',
        propertySize: '$property.propertySize',
        landowner: '$property.landowner',
        startDate: '$property.startDate',
        ...(roles === ROLES.ADMIN
          ? {
              note: '$property.note',
              noteUpdatedBy: '$property.noteUpdatedBy',
            }
          : {}),
        assignedResearchers: 1,
        createdAt: '$property.createdAt',
        updatedAt: '$property.updatedAt',
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

const getAllPaginatedPropertiesService = async (
  search: string,
  options: IPagination,
  roles: string,
  sort: string
) => {
  const searchQuery = search
    ? {
        $or: [
          { propertyName: { $regex: search, $options: 'i' } },
          { propertyLocation: { $regex: search, $options: 'i' } },
          { propertySize: { $regex: search, $options: 'i' } },
          { startDate: { $regex: search, $options: 'i' } },
        ],
      }
    : {};

  const assignedFilter: Record<string, any> = {};

  // Parse the sort parameter using the helper function
  const { field: sortField, order: sortOrder } = parseSortParameter(sort);

  const aggregatedProperties = Property.aggregate([
    ...(roles !== ROLES.ADMIN ? [{ $match: { archived: false } }] : []),
    {
      $match: {
        ...searchQuery,
        ...assignedFilter,
      },
    },
    {
      $sort: {
        [sortField]: sortOrder,
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
        startDate: 1,
        ...(roles === ROLES.ADMIN ? { note: 1, noteUpdatedBy: 1 } : {}),
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
  toggleArchivePropertyService,
  transferPropertyService,
  unassignResearcherPropertyService,
};
