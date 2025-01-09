import aggregatePaginate from 'mongoose-aggregate-paginate-v2';
import mongoose, { PaginateModel, Schema } from 'mongoose';
import { IAssignResearcherReport } from '../interface/assigned-reports.interface.js';

const assignResearcherReports = new Schema<IAssignResearcherReport>(
  {
    report: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Report',
    },
    researchers: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
  },
  {
    timestamps: true,
  }
);

assignResearcherReports.plugin(aggregatePaginate);

export const AssignResearcherReport = mongoose.model<
  IAssignResearcherReport,
  PaginateModel<IAssignResearcherReport>
>('AssignResearcherReport', assignResearcherReports);
