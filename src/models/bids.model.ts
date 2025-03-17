import aggregatePaginate from 'mongoose-aggregate-paginate-v2';
import mongoose, { PaginateModel, Schema } from 'mongoose';
import { IBids } from '../interface/bids.interface.js';
import { MODELS, PROPOSAL_STATUS } from '../constants.js';

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

bidsSchema.plugin(aggregatePaginate);

export const Bids = mongoose.model<IBids, PaginateModel<IBids>>(
  MODELS.BIDS,
  bidsSchema
);
