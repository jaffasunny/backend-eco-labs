import mongoose, { Schema } from 'mongoose';
import { IProperty } from '../interface/property.interface';

const propertySchema = new Schema<IProperty>(
  {
    propertyName: {
      type: String,
      required: true,
      trim: true,
    },
    propertyLocation: {
      type: String,
      required: true,
      trim: true,
    },
    propertySize: {
      type: String, // Use String to accommodate flexible size formats (e.g., "500 sq ft")
      required: true,
      trim: true,
    },
    landAssessmentReport: [
      {
        public_id: {
          type: String,
          required: true,
        },
        url: {
          type: String,
          required: true,
        },
      },
    ],
    landowner: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  },
  {
    timestamps: true,
  }
);

export const Property = mongoose.model<IProperty>('Property', propertySchema);
