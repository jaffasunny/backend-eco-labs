import aggregatePaginate from 'mongoose-aggregate-paginate-v2';
import mongoose, { PaginateModel, Schema } from 'mongoose';
import { IBids } from '../interface/bids.interface';
import { PROPOSAL_STATUS } from '../constants';

const bidsSchema = new Schema<IBids>(
  {
    property: { type: mongoose.Schema.Types.ObjectId, ref: 'Property' },
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
