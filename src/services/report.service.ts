import mongoose from 'mongoose';
import { MODELS } from '../constants.js';
import { Reports } from '../models/reports.model.js';
import { toMongoId } from '../utils/utils.js';

const getReportService = async (reportId: mongoose.Types.ObjectId | string) => {
  const report = await Reports.findById(reportId)
    .populate({
      path: 'property',
      populate: {
        path: 'landowner',
        model: MODELS.USERS,
        select: '_id name email phone status',
      },
    })
    .populate({
      path: 'researcher',
      select: '_id name email phone status',
    });

  return report;
};

const toggleArchiveReportService = async (reportId: string) => {
  const report = await Reports.findById(toMongoId(reportId));

  if (!report) {
    throw new Error('Report not found');
  }

  report.archived = !report.archived;

  const updatedReport = await report.save();

  if (updatedReport.archived) {
    return 'Report archived successfully';
  } else {
    return 'Report unarchived successfully';
  }
};

export { getReportService, toggleArchiveReportService };
