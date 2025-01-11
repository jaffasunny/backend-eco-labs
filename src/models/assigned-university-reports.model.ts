import aggregatePaginate from 'mongoose-aggregate-paginate-v2';
import mongoose, { PaginateModel, Schema } from 'mongoose';
import { IAssignUniversityReport } from '../interface/assigned-university-reports.interface.js';

const assignUniversityReports = new Schema<IAssignUniversityReport>(
  {
    report: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Report',
    },
    universities: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
  },
  {
    timestamps: true,
  }
);

assignUniversityReports.plugin(aggregatePaginate);

export const AssignUniversityReport = mongoose.model<
  IAssignUniversityReport,
  PaginateModel<IAssignUniversityReport>
>('AssignUniversityReport', assignUniversityReports);
