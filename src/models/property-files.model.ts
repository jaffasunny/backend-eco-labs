import aggregatePaginate from 'mongoose-aggregate-paginate-v2';
import { handleDeleteMiddleware } from '../utils/utils.js';
import mongoose, { PaginateModel, Schema } from 'mongoose';
import { IPropertyFilesDocument } from '../interface/property.interface.js';
import { MODELS } from '../constants.js';

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
        type: {
          type: String,
        },
      },
    ],
    property: {
      type: mongoose.Schema.Types.ObjectId,
      ref: MODELS.PROPERTIES,
      required: [true, 'Property is required!'],
    },
    researcher: { type: mongoose.Schema.Types.ObjectId, ref: MODELS.USERS },
  },
  {
    timestamps: true,
  }
);

propertyFilesSchema.plugin(aggregatePaginate);

// Attach the generic middleware to all delete-related operations
const deleteOperations: Array<
  'deleteMany' | 'deleteOne' | 'findOneAndDelete' | 'findByIdAndDelete'
> = ['deleteMany', 'deleteOne', 'findOneAndDelete', 'findByIdAndDelete'];

deleteOperations.forEach((operation: any) => {
  propertyFilesSchema.pre(
    operation,
    { document: false, query: true },
    function (next) {
      handleDeleteMiddleware.call(this, next, PropertyFiles);
    }
  );
});

export const PropertyFiles = mongoose.model<
  IPropertyFilesDocument,
  PaginateModel<IPropertyFilesDocument>
>(MODELS.PROPERTIES_FILES, propertyFilesSchema);
