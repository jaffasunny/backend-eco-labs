import aggregatePaginate from 'mongoose-aggregate-paginate-v2';
import mongoose, { PaginateModel, Schema } from 'mongoose';
import { IProperty } from '../interface/property.interface.js';
import { deleteOperations, MODELS } from '../constants.js';
import { Reports } from './reports.model.js';
import { Bids } from './bids.model.js';
import { handleDeleteMiddleware } from '../utils/utils.js';

interface IPropertyDocument extends IProperty, Document {
  isNew: boolean; // Add Mongoose's isNew property
  archived: boolean;
}

const propertySchema = new Schema<IPropertyDocument>(
  {
    propertyName: {
      type: String,
      validate: {
        validator: function (this: IPropertyDocument, value: string) {
          // Ensure `propertyName` is required only when the document is new
          if (this.isNew && !value) {
            return false;
          }
          return true;
        },
        message: 'Property name is required when creating a new property.',
      },
      trim: true,
    },
    propertyLocation: {
      type: String,
      validate: {
        validator: function (this: IPropertyDocument, value: string) {
          // Ensure `propertyLocation` is required only when the document is new
          if (this.isNew && !value) {
            return false;
          }
          return true;
        },
        message: 'Property location is required when creating a new property.',
      },
      trim: true,
    },
    propertySize: {
      type: String, // Use String to accommodate flexible size formats (e.g., "500 sq ft")
      trim: true,
    },
    startDate: {
      type: String,
      required: [true, 'Start Date is required'],
    },
    landowner: { type: mongoose.Schema.Types.ObjectId, ref: MODELS.USERS },
    assignedResearchers: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: MODELS.USERS,
      },
    ],
    archived: {
      type: Boolean,
      default: false,
    },
  },
  {
    timestamps: true,
  }
);

propertySchema.pre('deleteOne', { document: true }, async function (next) {
  const propertyId = this._id;

  try {
    // Delete all reports associated with this property
    await Reports.deleteMany({ property: propertyId });

    // Delete all bids associated with this property
    await Bids.deleteMany({ property: propertyId });

    next();
  } catch (error: any) {
    next(error);
  }
});

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

deleteOperations.forEach((operation: any) => {
  propertySchema.pre(
    operation,
    { document: false, query: true },
    function (next) {
      handleDeleteMiddleware.call(this, next, Property);
    }
  );
});

export const Property = mongoose.model<
  IPropertyDocument,
  PaginateModel<IPropertyDocument>
>(MODELS.PROPERTIES, propertySchema);
