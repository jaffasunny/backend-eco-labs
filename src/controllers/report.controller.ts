import { Response, Request } from 'express';
import { ApiResponse } from '../utils/ApiResponse.js';
import { asyncHandler } from '../utils/asyncHandler.js';
import {
  getReportService,
  toggleArchiveReportService,
} from '../services/report.service.js';
import { ApiError } from '../utils/ApiError.js';

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

const toggleArchiveReport = asyncHandler(
  async (req: Request, res: Response) => {
    const { id: reportId } = req.params;

    const toggleArchivedReport = await toggleArchiveReportService(reportId);

    return res.status(200).json(new ApiResponse(200, toggleArchivedReport));
  }
);

export { getReport, toggleArchiveReport };
