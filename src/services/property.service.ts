import mongoose, { ClientSession } from 'mongoose';
import { Property } from '../models/property.model.js';
import { ApiError } from '../utils/ApiError.js';
// import { IReport } from '../interface/report.interface.js';

const findOrUpdateProperty = async (
  propertyName: string,
  propertyLocation: string,
  propertySize: string | undefined = undefined,
  // files: Express.Multer.File[],
  // landAssessmentReport: IReport['landAssessmentReport'],
  userId: mongoose.Schema.Types.ObjectId | string,
  session: ClientSession
) => {
  let property = await Property.findOne({
    propertyName,
    landowner: userId,
  }).session(session);

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
          // landAssessmentReport: files.map((file) => ({
          //   url: file.path,
          //   public_id: file.filename,
          // })),
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
