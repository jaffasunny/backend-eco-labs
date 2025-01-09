import mongoose, { ClientSession, isValidObjectId } from 'mongoose';
import { AssignResearcherReport } from '../models/assigned-reports.model.js';
import { Property } from '../models/property.model.js';
import { Report } from '../models/reports.model.js';
import { ApiError } from '../utils/ApiError.js';
import { stringToObjectId } from '../utils/utils.js';

const createOrUpdateReportsService = async (
  reportData: {
    landAssessmentReport: {
      url: string;
      name: string;
    }[];
    property: mongoose.Types.ObjectId | string;
  },
  session: ClientSession
) => {
  const { landAssessmentReport, property } = reportData;

  const fetchedProperty = await Property.findById(property).session(session);

  if (!fetchedProperty) {
    throw new ApiError(401, 'Property not found!');
  }

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

const findReportService = async (
  reportId: mongoose.Types.ObjectId | string,
  propertyId: mongoose.Types.ObjectId | string
) => {
  if (!isValidObjectId(reportId)) {
    new ApiError(400, `Please enter valid Report Id!`);
  }

  const report = await Report.find({ _id: reportId, property: propertyId });

  if (!report.length) {
    new ApiError(400, `Report not found!`);
  }

  return report;
};

const deleteReportsService = async (
  reportId: mongoose.Types.ObjectId | string
) => {
  const report = await Report.findById(reportId);

  if (!report) {
    new ApiError(401, `Report not found!`);
  }

  const deletedReport = await Report.findByIdAndDelete(reportId);

  return deletedReport;
};

const getReportService = async (reportId: mongoose.Types.ObjectId | string) => {
  if (!isValidObjectId(reportId)) {
    new ApiError(400, `Please enter valid Report Id!`);
  }

  const report = await Report.findById(reportId)
    .select('landAssessmentReport.url landAssessmentReport.name')
    .populate({
      path: 'property',
      populate: {
        path: 'landowner',
        model: 'User',
        select: '_id name email phone status',
      },
    });

  return report;
};

const assignResearcherReportsService = async (
  reportId: string,
  researcherId: string
) => {
  const existingReport = await AssignResearcherReport.findOne({
    report: reportId,
    researchers: { $in: [researcherId] },
  }).populate('researchers');

  if (existingReport) {
    throw new ApiError(401, `Researcher is already assigned to this report!`);
  }

  const report = await AssignResearcherReport.findOne({ report: reportId });

  if (report) {
    const updatedReport = await AssignResearcherReport.findOneAndUpdate(
      { report: reportId },
      { $addToSet: { researchers: researcherId } },
      { new: true, runValidators: true }
    ).populate('researchers');
    return updatedReport;
  }

  const assignedResearcherReport = await AssignResearcherReport.create({
    report: reportId,
    researchers: [researcherId],
  });

  // Populate researchers in the created report
  const populatedReport = await AssignResearcherReport.findById(
    assignedResearcherReport._id
  ).populate('researchers');

  return populatedReport;
};

export {
  createOrUpdateReportsService,
  deleteReportsService,
  getReportService,
  findReportService,
  assignResearcherReportsService,
};
