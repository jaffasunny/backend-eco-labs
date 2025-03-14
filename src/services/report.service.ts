import mongoose from 'mongoose';
import { MODELS } from '../constants.js';
import { Reports } from '../models/reports.model.js';

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

export { getReportService };
