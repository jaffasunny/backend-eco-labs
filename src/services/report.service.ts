import mongoose, { ClientSession } from 'mongoose';
import { ApiError } from '../utils/ApiError';
import { Report } from '../models/reports.model';

const createReportService = async (
  reportData: {
    landAssessmentReport: {
      url: string;
      name: string;
    }[];
    property: mongoose.Types.ObjectId;
  },
  session: ClientSession
) => {
  const report = await Report.create([reportData], { session });

  if (!report) {
    throw new ApiError(500, 'Failed to create report!');
  }

  return report;
};

export { createReportService };
