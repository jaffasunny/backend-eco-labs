import { transformPaginatedResponse } from '../utils/utils.js';
import { Response, Request } from 'express';
import { ApiResponse } from '../utils/ApiResponse.js';
import { asyncHandler } from '../utils/asyncHandler.js';
import { Report } from '../models/reports.model.js';
import {
  deleteReportsService,
  getReportService,
} from '../services/report.service.js';
import { ApiError } from '../utils/ApiError.js';

const paginatedReports = asyncHandler(async (req: Request, res: Response) => {
  const {
    page = 1,
    limit = 10,
    search = '',
    isArchived = null,
    assigned = null,
  } = req.query;

  const assignedFilter: Record<string, any> = {};

  const options = {
    page,
    limit,
  };

  const searchQuery = search
    ? {
        $or: [],
      }
    : {};

  const matchQuery = assignedFilter
    ? {
        ...searchQuery,
        ...assignedFilter,
      }
    : {
        ...searchQuery,
      };

  const aggregateLandownerData = Report.aggregate([
    {
      $unwind: {
        path: '$landAssessmentReport',
        preserveNullAndEmptyArrays: true,
      },
    },
    {
      $lookup: {
        from: 'properties',
        localField: 'property',
        foreignField: '_id',
        as: 'properties',
      },
    },
    {
      $unwind: {
        path: '$properties',
        preserveNullAndEmptyArrays: true,
      },
    },
    {
      $lookup: {
        from: 'users',
        localField: 'properties.landowner',
        foreignField: '_id',
        as: 'properties.landowner',
      },
    },
    {
      $unwind: {
        path: '$properties.landowner',
        preserveNullAndEmptyArrays: true,
      },
    },
    {
      $lookup: {
        from: 'bids',
        let: { reportId: '$_id' }, // Pass the current report ID
        pipeline: [
          {
            $match: {
              $expr: { $eq: ['$report', '$$reportId'] }, // Match bids where report equals current report ID
            },
          },
        ],
        as: 'bids', // Add matched bids to the `bids` field
      },
    },
    {
      $project: {
        _id: 1,
        landAssessmentReport: {
          url: 1,
          name: 1,
        },
        properties: {
          propertyName: 1,
          propertyLocation: 1,
          propertySize: 1,
          createdAt: 1,
          updatedAt: 1,
          landowner: {
            _id: 1,
            name: 1,
            email: 1, // Include any additional fields you want from the landowner
          },
        },
        bids: {
          _id: 1,
          researcher: 1,
          status: 1,
          createdAt: 1,
          updatedAt: 1,
        },
        createdAt: 1,
        updatedAt: 1,
      },
    },
    {
      $match: matchQuery,
    },
  ]);

  const result = await Report.aggregatePaginate(
    aggregateLandownerData,
    options
  );

  const renamedResult = transformPaginatedResponse(result, 'reports');

  res
    .status(200)
    .json(
      new ApiResponse(200, renamedResult, 'Paginated data fetched successfully')
    );
});

const deleteReport = asyncHandler(async (req: Request, res: Response) => {
  const { id: reportId } = req.params;

  const deletedReport = await deleteReportsService(reportId);

  if (!deletedReport) {
    return res
      .status(201)
      .json(new ApiError(400, `Something went wrong while deleting report!`));
  }

  res
    .status(200)
    .json(new ApiResponse(200, deletedReport, 'Report deleted successfully'));
});

const getReport = asyncHandler(async (req: Request, res: Response) => {
  const { id: reportId } = req.params;

  const report = await getReportService(reportId);

  if (!report) {
    return res.status(201).json(new ApiError(400, `Report not found!`));
  }

  res
    .status(200)
    .json(new ApiResponse(200, report, 'Report fetched successfully'));
});

export { paginatedReports, deleteReport, getReport };
