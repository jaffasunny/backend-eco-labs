import aggregatePaginate from 'mongoose-aggregate-paginate-v2';
import mongoose, { PaginateModel, Schema } from 'mongoose';
import { IReport } from '../interface/report.interface.js';
import { PROPOSAL_STATUS } from '../constants.js';

const reportSchema = new Schema<IReport>(
  {
    landAssessmentReport: [
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
    property: { type: mongoose.Schema.Types.ObjectId, ref: 'Property' },
    status: {
      type: String,
      enum: PROPOSAL_STATUS,
      default: PROPOSAL_STATUS.UNASSIGNED,
    },
  },
  {
    timestamps: true,
  }
);

reportSchema.plugin(aggregatePaginate);

export const Report = mongoose.model<IReport, PaginateModel<IReport>>(
  'Report',
  reportSchema
);
