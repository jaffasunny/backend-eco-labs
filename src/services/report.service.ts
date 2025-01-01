import mongoose, { ClientSession, isValidObjectId } from 'mongoose';
import { Report } from '../models/reports.model.js';
import { ApiError } from '../utils/ApiError.js';

const createOrUpdateReportsService = async (
  reportData: {
    landAssessmentReport: {
      url: string;
      name: string;
    }[];
    property: mongoose.Types.ObjectId;
  },
  session: ClientSession
) => {
  const { landAssessmentReport, property } = reportData;

  // First, check if any of the reports already exist with the same URL for the property
  const existingReports = await Report.find({
    property,
    'landAssessmentReport.url': {
      $in: landAssessmentReport.map((report) => report.url),
    },
  }).session(session);

  // Prepare bulk operations array
  const bulkOps = landAssessmentReport.map((report) => {
    // Find an existing report with the same URL
    const existingReport = existingReports.find((r) =>
      r.landAssessmentReport.some(
        (rpt) => rpt.url === report.url || rpt.name === report.name
      )
    );

    if (existingReport) {
      // If report exists, update the URL and/or name
      return {
        updateOne: {
          filter: {
            _id: existingReport._id,
            'landAssessmentReport.url': report.url,
          },
          update: {
            $set: {
              'landAssessmentReport.$.url': report.url, // Update URL
              'landAssessmentReport.$.name': report.name, // Update Name
            },
          },
          upsert: false, // Do not insert if not found
        },
      };
    } else {
      // If no existing report is found, create a new one
      return {
        insertOne: {
          document: {
            landAssessmentReport: [report],
            property,
          },
        },
      };
    }
  });

  // Perform the bulk operations
  const result = await Report.bulkWrite(bulkOps, { session });

  return result;
};

const deleteReportsService = async (
  reportId: mongoose.Types.ObjectId | string
) => {
  if (!isValidObjectId(reportId)) {
    new ApiError(400, `Something went wrong while deleting landowner!`);
  }

  const deletedReport = await Report.findByIdAndDelete(reportId);

  return deletedReport;
};

export { createOrUpdateReportsService, deleteReportsService };
