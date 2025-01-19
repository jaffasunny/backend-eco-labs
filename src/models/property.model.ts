import aggregatePaginate from 'mongoose-aggregate-paginate-v2';
import mongoose, { PaginateModel, Schema } from 'mongoose';
import { IProperty } from '../interface/property.interface.js';
import { MODELS } from '../constants.js';

interface IPropertyDocument extends IProperty, Document {
  isNew: boolean; // Add Mongoose's isNew property
}

const propertySchema = new Schema<IPropertyDocument>(
  {
    propertyName: {
      type: String,
      required: function (this: IPropertyDocument) {
        // Check if this is a new document or an update
        return this.isNew;
      },
      trim: true,
    },
    propertyLocation: {
      type: String,
      required: function (this: IPropertyDocument) {
        // Check if this is a new document or an update
        return this.isNew;
      },
      trim: true,
    },
    propertySize: {
      type: String, // Use String to accommodate flexible size formats (e.g., "500 sq ft")
      trim: true,
    },
    landowner: { type: mongoose.Schema.Types.ObjectId, ref: MODELS.USERS },
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

export const Property = mongoose.model<
  IPropertyDocument,
  PaginateModel<IPropertyDocument>
>(MODELS.PROPERTIES, propertySchema);
