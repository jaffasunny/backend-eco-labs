import mongoose, { ClientSession } from 'mongoose';
import { PropertyFiles } from '../models/property-files.model.js';
import { Property } from '../models/property.model.js';
import { ApiError } from '../utils/ApiError.js';

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

export {
  fetchPopulatedProperty,
  findOrUpdatePropertySession,
  findOrUpdateProperty,
  deletePropertyFileService,
};
