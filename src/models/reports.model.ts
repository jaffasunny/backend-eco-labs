import aggregatePaginate from 'mongoose-aggregate-paginate-v2';
import mongoose, { PaginateModel, Schema } from 'mongoose';
import { IReport } from '../interface/report.interface.js';

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
    proposals: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
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
