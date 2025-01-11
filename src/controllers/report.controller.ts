import {
  isValidObjectId,
  stringToObjectId,
  transformPaginatedResponse,
} from '../utils/utils.js';
import { Response, Request } from 'express';
import { ApiResponse } from '../utils/ApiResponse.js';
import { asyncHandler } from '../utils/asyncHandler.js';
import { Report } from '../models/reports.model.js';
import {
  assignResearcherReportsService,
  assignUniversityReportsService,
  deleteReportsService,
  getReportService,
} from '../services/report.service.js';
import { ApiError } from '../utils/ApiError.js';
import { AssignResearcherReport } from '../models/assigned-reports.model.js';
import { AssignUniversityReport } from '../models/assigned-university-reports.model.js';

const paginatedReports = asyncHandler(async (req: Request, res: Response) => {
  const { page = 1, limit = 10, search = '' } = req.query;

  const assignedFilter: Record<string, any> = {};

  const options = {
    page,
    limit,
  };

  const searchQuery = search
    ? {
        $or: [
          { 'landAssessmentReport.name': { $regex: search, $options: 'i' } },
        ],
      }
    : {};

  const aggregateLandownerData = Report.aggregate([
    {
      $unwind: {
        path: '$landAssessmentReport',
        preserveNullAndEmptyArrays: true,
      },
    },
    {
      $match: { ...searchQuery },
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

const assignResearcherReport = asyncHandler(
  async (req: Request, res: Response) => {
    const { reportId, researcherId } = req.body;

    const assignedResearcherReport = await assignResearcherReportsService(
      reportId,
      researcherId
    );

    if (!assignedResearcherReport) {
      return res
        .status(201)
        .json(
          new ApiError(
            400,
            `Something went wrong while assigning researcher report!`
          )
        );
    }

    res
      .status(200)
      .json(
        new ApiResponse(
          200,
          assignedResearcherReport,
          'Assigned researcher successfully'
        )
      );
  }
);

const assignUniversityReport = asyncHandler(
  async (req: Request, res: Response) => {
    const { reportId, universityId } = req.body;

    const assignedResearcherReport = await assignUniversityReportsService(
      reportId,
      universityId
    );

    if (!assignedResearcherReport) {
      return res
        .status(201)
        .json(
          new ApiError(
            400,
            `Something went wrong while assigning university report!`
          )
        );
    }

    res
      .status(200)
      .json(
        new ApiResponse(
          200,
          assignedResearcherReport,
          'Assigned university successfully'
        )
      );
  }
);

const paginatedAssignedResearcherReports = asyncHandler(
  async (req: Request, res: Response) => {
    const { page = 1, limit = 10, search = '' } = req.query;
    const { _id: researcherId } = req.user;

    const options = {
      page,
      limit,
    };

    const searchQuery = search
      ? {
          $or: [
            { 'report.name': { $regex: search, $options: 'i' } }, // Assuming `report` has a `name` field
            { 'researchers.name': { $regex: search, $options: 'i' } }, // Assuming `User` has a `name` field
          ],
        }
      : {};

    const pipeline = [
      {
        $match: {
          researchers: { $in: [researcherId] },
          ...searchQuery,
        },
      },
      {
        $lookup: {
          from: 'reports', // Name of the Report collection
          localField: 'report',
          foreignField: '_id',
          as: 'report',
          pipeline: [
            {
              $lookup: {
                from: 'properties',
                localField: 'property',
                foreignField: '_id',
                as: 'property',
              },
            },
            {
              $unwind: {
                path: '$property',
                preserveNullAndEmptyArrays: true,
              },
            },
            {
              $lookup: {
                from: 'users', // Name of the User collection
                localField: 'property.landowner',
                foreignField: '_id',
                as: 'property.landowner',
              },
            },
            {
              $lookup: {
                from: 'bids',
                let: { reportId: '$_id' },
                pipeline: [
                  {
                    $match: {
                      $expr: { $eq: ['$report', '$$reportId'] },
                    },
                  },
                ],
                as: 'bid',
              },
            },
            {
              $unwind: {
                path: '$bid',
                preserveNullAndEmptyArrays: true,
              },
            },
            {
              $project: {
                _id: 1,
                property: 1,
                landAssessmentReport: {
                  url: 1,
                  name: 1,
                },
                createdAt: 1,
                updatedAt: 1,
                landowner: {
                  _id: 1,
                  name: 1,
                  email: 1,
                  phone: 1,
                },
                bid: 1,
              },
            },
          ],
        },
      },
      {
        $lookup: {
          from: 'users', // Name of the User collection
          localField: 'researchers',
          foreignField: '_id',
          as: 'researchers',
          pipeline: [
            {
              $project: {
                _id: 1,
                name: 1,
                email: 1,
                phone: 1,
              },
            },
          ],
        },
      },
      {
        $unwind: '$report', // Unwind if you expect only one report per document
      },
    ];

    const aggregateData = AssignResearcherReport.aggregate(pipeline);

    const result = await AssignResearcherReport.aggregatePaginate(
      aggregateData,
      options
    );

    const renamedResult = transformPaginatedResponse(result, 'assignedReports');

    res
      .status(200)
      .json(
        new ApiResponse(
          200,
          renamedResult,
          'Paginated data fetched successfully'
        )
      );
  }
);

const paginatedAssignedUniversityReports = asyncHandler(
  async (req: Request, res: Response) => {
    const { page = 1, limit = 10, search = '' } = req.query;
    const { _id: universityId } = req.user;

    const options = {
      page,
      limit,
    };

    const searchQuery = search
      ? {
          $or: [
            { 'report.name': { $regex: search, $options: 'i' } },
            { 'researchers.name': { $regex: search, $options: 'i' } },
          ],
        }
      : {};

    const pipeline = [
      {
        $match: {
          universities: { $in: [universityId] },
          ...searchQuery,
        },
      },
      {
        $lookup: {
          from: 'reports', // Name of the Report collection
          localField: 'report',
          foreignField: '_id',
          as: 'report',
          pipeline: [
            {
              $lookup: {
                from: 'properties',
                localField: 'property',
                foreignField: '_id',
                as: 'property',
              },
            },
            {
              $addFields: {
                property: { $arrayElemAt: ['$property', 0] },
                landAssessmentReport: {
                  $arrayElemAt: ['$landAssessmentReport', 0],
                },
              },
            },
            {
              $lookup: {
                from: 'users', // Name of the User collection
                localField: 'property.landowner',
                foreignField: '_id',
                as: 'property.landowner',
                pipeline: [
                  {
                    $project: {
                      _id: 1,
                      name: 1,
                      email: 1,
                      phone: 1,
                    },
                  },
                ],
              },
            },
            {
              $addFields: {
                'property.landowner': {
                  $arrayElemAt: ['$property.landowner', 0],
                },
              },
            },
            {
              $lookup: {
                from: 'bids',
                let: { reportId: '$_id' },
                pipeline: [
                  {
                    $match: {
                      $expr: { $eq: ['$report', '$$reportId'] },
                    },
                  },
                ],
                as: 'bid',
              },
            },
            {
              $addFields: {
                bid: { $arrayElemAt: ['$bid', 0] },
              },
            },
            {
              $project: {
                _id: 1,
                property: 1,
                landAssessmentReport: {
                  url: 1,
                  name: 1,
                },
                createdAt: 1,
                updatedAt: 1,
                landowner: {
                  _id: 1,
                  name: 1,
                  email: 1,
                  phone: 1,
                },
                bid: 1,
              },
            },
          ],
        },
      },
      {
        $lookup: {
          from: 'users', // Name of the User collection
          localField: 'researchers',
          foreignField: '_id',
          as: 'researchers',
          pipeline: [
            {
              $project: {
                _id: 1,
                name: 1,
                email: 1,
                phone: 1,
              },
            },
          ],
        },
      },
      {
        $unwind: '$report', // Unwind if you expect only one report per document
      },
      {
        $project: {
          _id: 1,
          report: 1,
          universities: 1,
          createdAt: 1,
          updatedAt: 1,
        },
      },
    ];

    const aggregateData = AssignUniversityReport.aggregate(pipeline);

    const result = await AssignUniversityReport.aggregatePaginate(
      aggregateData,
      options
    );

    const renamedResult = transformPaginatedResponse(result, 'assignedReports');

    res
      .status(200)
      .json(
        new ApiResponse(
          200,
          renamedResult,
          'Paginated data fetched successfully'
        )
      );
  }
);

export {
  paginatedReports,
  deleteReport,
  getReport,
  assignResearcherReport,
  paginatedAssignedResearcherReports,
  assignUniversityReport,
  paginatedAssignedUniversityReports,
};
