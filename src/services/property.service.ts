import { ClientSession } from 'mongoose';
import { Property } from '../models/property.model.js';
import { ApiError } from '../utils/ApiError.js';

const findOrUpdateProperty = async (
  propertyName: string,
  propertyLocation: string,
  propertySize: string,
  files: Express.Multer.File[],
  userId: string,
  session: ClientSession
) => {
  let property = await Property.findOne({
    propertyName,
    landowner: userId,
  }).session(session);

  if (property) {
    // Update existing property
    property.propertyLocation = propertyLocation;
    property.propertySize = propertySize;
    property.landAssessmentReport = files.map((file) => ({
      url: file.path,
      public_id: file.filename,
    }));
    await property.save({ session });
    property.isNew = false; // Flag for response
  } else {
    // Create a new property
    const [createdProperty] = await Property.create(
      [
        {
          propertyName,
          propertyLocation,
          propertySize,
          landAssessmentReport: files.map((file) => ({
            url: file.path,
            public_id: file.filename,
          })),
          landowner: userId,
        },
      ],
      { session }
    );
    property = createdProperty;
    property.isNew = true; // Flag for response
  }
  return property;
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

export { fetchPopulatedProperty, findOrUpdateProperty };
