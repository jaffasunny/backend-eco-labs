import { ClientSession } from 'mongoose';
import { Property } from '../models/property.model';
import { ApiError } from '../utils/ApiError';

const findOrUpdateProperty = async (
  propertyName: string,
  propertyLocation: string,
  propertySize: string,
  file: Express.Multer.File,
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
    property.landAssessmentReport = {
      url: file.path,
      public_id: file.filename,
    };
    await property.save({ session });
    property.isNew = false; // Flag for response
  } else {
    // Create a new property
    property = await Property.create(
      [
        {
          propertyName,
          propertyLocation,
          propertySize,
          landAssessmentReport: {
            url: file.path,
            public_id: file.filename,
          },
          landowner: userId,
        },
      ],
      { session }
    );
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
