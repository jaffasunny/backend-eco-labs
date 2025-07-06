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
  noteUpdatedBy?: mongoose.Schema.Types.ObjectId; // Track who updated the note
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
    note: {
      type: String,
    },
    noteUpdatedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: MODELS.USERS,
    },
  },
  {
    timestamps: true,
  }
);

// Pre-save middleware to check admin role for note updates
propertySchema.pre('save', function(next) {
  // Only check for note updates if this is an update operation (not a new document)
  if (!this.isNew && this.isModified('note')) {
    // Get the user from the request context
    // This will be set by the controller before calling save()
    const user = (this as any).__user;
    
    if (!user || user.roles !== 'super-admin') {
      return next(new Error('Only admins can update property notes'));
    }
    
    // Set the noteUpdatedBy field
    this.noteUpdatedBy = user._id;
  }
  
  next();
});

// Pre-update middleware for findOneAndUpdate operations
propertySchema.pre(['updateOne', 'findOneAndUpdate', 'updateMany'], function(next) {
  const update = this.getUpdate();
  
  // Check if note is being updated
  if (update && (update as any).note !== undefined) {
    const user = (this as any).__user;
    
    if (!user || user.roles !== 'super-admin') {
      return next(new Error('Only admins can update property notes'));
    }
    
    // Add noteUpdatedBy to the update
    (update as any).noteUpdatedBy = user._id;
  }
  
  next();
});

propertySchema.pre('deleteOne', { document: true }, async function (next) {
  const propertyId = this._id;

  try {
    // Delete all reports associated with this property
    await Reports.deleteMany({
      property: propertyId,
    });

    // Delete all bids associated with this property
    await Bids.deleteMany({ property: propertyId });

    next();
  } catch (error: any) {
    next(error);
  }
});
propertySchema.index({ archived: 1, landowner: 1 }); // Compound index for archived and landowner

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
    async function (
      this: mongoose.Query<any, any>,
      next: (err?: Error) => void
    ) {
      // const propertyId = this._id;
      const queryFilter = this.getFilter();

      // Find all documents that will be deleted
      const docs = await Property.find(queryFilter).lean();

      const propertyIds = docs.map((doc) => doc._id);

      await Reports.deleteMany({ property: { $in: propertyIds } });
      await Bids.deleteMany({ property: { $in: propertyIds } });

      await handleDeleteMiddleware.call(this, next, Property);
    }
  );
});

export const Property = mongoose.model<
  IPropertyDocument,
  PaginateModel<IPropertyDocument>
>(MODELS.PROPERTIES, propertySchema);
