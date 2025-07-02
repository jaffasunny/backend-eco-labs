import aggregatePaginate from 'mongoose-aggregate-paginate-v2';
import mongoose, { PaginateModel, Schema } from 'mongoose';
import { IBids } from '../interface/bids.interface.js';
import { deleteOperations, MODELS, PROPOSAL_STATUS } from '../constants.js';
import { handleDeleteMiddleware } from '../utils/utils.js';

const bidsSchema = new Schema<IBids>(
  {
    property: { type: mongoose.Schema.Types.ObjectId, ref: MODELS.PROPERTIES },
    researcher: { type: mongoose.Schema.Types.ObjectId, ref: MODELS.USERS },
    status: {
      type: String,
      enum: PROPOSAL_STATUS,
      default: PROPOSAL_STATUS.PENDING,
    },
    description: {
      type: String,
      required: true,
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
  },
  {
    timestamps: true,
  }
);
bidsSchema.index({ property: 1, status: 1, researcher: 1 }); // Compound index for property and status

bidsSchema.plugin(aggregatePaginate);

deleteOperations.forEach((operation: any) => {
  bidsSchema.pre(operation, { document: false, query: true }, function (next) {
    handleDeleteMiddleware.call(this, next, Bids);
  });
});

export const Bids = mongoose.model<IBids, PaginateModel<IBids>>(
  MODELS.BIDS,
  bidsSchema
);
