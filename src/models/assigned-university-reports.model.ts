import aggregatePaginate from 'mongoose-aggregate-paginate-v2';
import mongoose, { PaginateModel, Schema } from 'mongoose';
import { IAssignUniversityReport } from '../interface/assigned-university-reports.interface.js';
import { MODELS } from '../constants.js';

const assignUniversityReports = new Schema<IAssignUniversityReport>(
  {
    report: {
      type: mongoose.Schema.Types.ObjectId,
      ref: MODELS.REPORTS,
    },
    universities: [{ type: mongoose.Schema.Types.ObjectId, ref: MODELS.USERS }],
  },
  {
    timestamps: true,
  }
);

assignUniversityReports.plugin(aggregatePaginate);

export const AssignUniversityReport = mongoose.model<
  IAssignUniversityReport,
  PaginateModel<IAssignUniversityReport>
>(MODELS.ASSIGNED_UNIVERSITY_REPORTS, assignUniversityReports);
