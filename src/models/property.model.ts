import aggregatePaginate from 'mongoose-aggregate-paginate-v2';
import mongoose, { PaginateModel, Schema } from 'mongoose';
import { IProperty } from '../interface/property.interface.js';

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
      trim: true,
    },
    landowner: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  },
  {
    timestamps: true,
  }
);

propertySchema.plugin(aggregatePaginate);

propertySchema.set('toJSON', {
  transform: (doc, ret) => {
    // Conditionally include `isApproved`
    if (!ret.propertySize) {
      delete ret.propertySize;
    }

    return ret;
  },
});

propertySchema.set('toObject', {
  transform: (doc, ret) => {
    // Conditionally include `isApproved`
    if (!ret.propertySize) {
      delete ret.propertySize;
    }

    return ret;
  },
});

export const Property = mongoose.model<IProperty, PaginateModel<IProperty>>(
  'Property',
  propertySchema
);
