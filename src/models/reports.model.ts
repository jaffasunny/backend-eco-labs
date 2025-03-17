import aggregatePaginate from 'mongoose-aggregate-paginate-v2';
import { handleDeleteMiddleware } from '../utils/utils.js';
import mongoose, { PaginateModel, Schema } from 'mongoose';
import { IReports } from '../interface/property.interface.js';
import { MODELS } from '../constants.js';

const reportSchema = new Schema<IReports>(
  {
    name: {
      type: String,
      required: function () {
        return this.researcher !== undefined && this.researcher !== null;
      },
    },
    description: {
      type: String,
      required: function () {
        return this.researcher !== undefined && this.researcher !== null;
      },
    },
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
        originalName: {
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

reportSchema.plugin(aggregatePaginate);

// Attach the generic middleware to all delete-related operations
const deleteOperations: Array<
  'deleteMany' | 'deleteOne' | 'findOneAndDelete' | 'findByIdAndDelete'
> = ['deleteMany', 'deleteOne', 'findOneAndDelete', 'findByIdAndDelete'];

deleteOperations.forEach((operation: any) => {
  reportSchema.pre(
    operation,
    { document: false, query: true },
    function (next) {
      handleDeleteMiddleware.call(this, next, Reports);
    }
  );
});

export const Reports = mongoose.model<IReports, PaginateModel<IReports>>(
  MODELS.REPORTS,
  reportSchema
);
