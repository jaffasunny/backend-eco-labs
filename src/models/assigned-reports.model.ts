import aggregatePaginate from 'mongoose-aggregate-paginate-v2';
import mongoose, { PaginateModel, Schema } from 'mongoose';
import { IAssignResearcherReport } from '../interface/assigned-reports.interface.js';
import { MODELS } from '../constants.js';

const assignResearcherReports = new Schema<IAssignResearcherReport>(
  {
    report: {
      type: mongoose.Schema.Types.ObjectId,
      ref: MODELS.REPORTS,
    },
    researchers: [{ type: mongoose.Schema.Types.ObjectId, ref: MODELS.USERS }],
  },
  {
    timestamps: true,
  }
);

assignResearcherReports.plugin(aggregatePaginate);

export const AssignResearcherReport = mongoose.model<
  IAssignResearcherReport,
  PaginateModel<IAssignResearcherReport>
>(MODELS.ASSIGNED_RESEARCH_REPORTS, assignResearcherReports);
