import aggregatePaginate from 'mongoose-aggregate-paginate-v2';
import mongoose, { PaginateModel, Schema } from 'mongoose';
import { IPropertyFiles } from '../interface/property.interface.js';
import { MODELS } from '../constants.js';

interface IPropertyFilesDocument extends IPropertyFiles, Document {
  isNew: boolean; // Add Mongoose's isNew property
}

const propertyFilesSchema = new Schema<IPropertyFilesDocument>(
  {
    files: [
      {
        url: {
          type: String,
          required: true,
        },
        name: {
          type: String,
          required: true,
        },
      },
    ],
    property: { type: mongoose.Schema.Types.ObjectId, ref: MODELS.PROPERTIES },
  },
  {
    timestamps: true,
  }
);

propertyFilesSchema.plugin(aggregatePaginate);

propertyFilesSchema.set('toJSON', {
  transform: (doc, ret) => {
    // Conditionally include `isApproved`
    // if (!ret.propertySize) {
    //   delete ret.propertySize;
    // }

    return ret;
  },
});

propertyFilesSchema.set('toObject', {
  transform: (doc, ret) => {
    // Conditionally include `isApproved`
    // if (!ret.propertySize) {
    //   delete ret.propertySize;
    // }

    return ret;
  },
});

export const PropertyFiles = mongoose.model<
  IPropertyFilesDocument,
  PaginateModel<IPropertyFilesDocument>
>(MODELS.PROPERTIES_FILES, propertyFilesSchema);
