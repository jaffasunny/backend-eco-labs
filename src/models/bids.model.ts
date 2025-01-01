import aggregatePaginate from 'mongoose-aggregate-paginate-v2';
import mongoose, { PaginateModel, Schema } from 'mongoose';
import { IBids } from '../interface/bids.interface.js';
import { PROPOSAL_STATUS } from '../constants.js';

const bidsSchema = new Schema<IBids>(
  {
    report: { type: mongoose.Schema.Types.ObjectId, ref: 'Report' },
    researcher: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    status: {
      type: String,
      enum: PROPOSAL_STATUS,
      default: PROPOSAL_STATUS.NOTSENT,
    },
  },
  {
    timestamps: true,
  }
);

bidsSchema.plugin(aggregatePaginate);

export const Bids = mongoose.model<IBids, PaginateModel<IBids>>(
  'Bids',
  bidsSchema
);
