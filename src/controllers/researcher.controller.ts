import { Request, Response } from 'express';
import { asyncHandler } from '../utils/asyncHandler.js';
import {
  generatePassword,
  toMongoId,
  transformPaginatedResponse,
} from '../utils/utils.js';
import { ApiResponse } from '../utils/ApiResponse.js';
import { ApiError } from '../utils/ApiError.js';
import { Bids } from '../models/bids.model.js';
import { User } from '../models/user.model.js';
import { IUpdateResearcher } from '../interface/researcher.interface.js';
import {
  MODELS,
  PLATFORM_NAME,
  PROPOSAL_STATUS,
  RESEARCHER_STATUS,
  ROLES,
} from '../constants.js';
import mongoose from 'mongoose';
import { findOrUpdateUser } from '../services/landowner.service.js';
import sendEmail from '../utils/sendMail.js';
import { Property } from '../models/property.model.js';
import { Reports } from '../models/reports.model.js';
import { TUploadedFileType } from '../types/index.js';

const paginatedResearchers = asyncHandler(
  async (req: Request, res: Response) => {
    const {
      page = 1,
      limit = 10,
      search = '',
      isApproved = null,
      status = '', // this comes as a string from query
    } = req.query;

    const assignedFilter: Record<string, any> = {};

    if (isApproved !== null && isApproved !== '') {
      assignedFilter.isApproved = isApproved === 'true';
    }

    if (status && ['approved', 'pending', 'rejected'].includes(status as string)) {
      assignedFilter.status = status;
    }

    assignedFilter.roles = 'researcher';

    const options = {
      page: Number(page),
      limit: Number(limit),
    };

    const searchQuery = search
      ? {
        $or: [
          { name: { $regex: search, $options: 'i' } },
          { email: { $regex: search, $options: 'i' } },
          { phone: { $regex: search, $options: 'i' } },
        ],
      }
      : {};

    const matchQuery = {
      ...searchQuery,
      ...assignedFilter,
    };

    const aggregateResearcherData = User.aggregate([
      { $match: matchQuery },

      {
        $addFields: {
          statusPriority: {
            $switch: {
              branches: [
                {
                  case: { $eq: ['$status', RESEARCHER_STATUS.PENDING] },
                  then: 0,
                },
              ],
              default: 1, // All others
            },
          },
        },
      },
      {
        $sort: {
          statusPriority: 1, // pending on top
          name: 1,           // alphabetical A-Z
        },
      },

      {
        $lookup: {
          from: MODELS.ASSIGNED_RESEARCH_PROPERTIES,
          let: { researcherId: '$_id' },
          pipeline: [
            {
              $match: {
                $expr: {
                  $in: [{ $toObjectId: '$$researcherId' }, '$researchers.researcher'],
                },
              },
            },
            {
              $group: {
                _id: null,
                count: { $sum: 1 },
              },
            },
            { $project: { _id: 0, count: 1 } },
          ],
          as: 'assigned',
        },
      },
      {
        $addFields: {
          assigned: { $ifNull: [{ $arrayElemAt: ['$assigned.count', 0] }, 0] },
        },
      },
      {
        $lookup: {
          from: MODELS.BIDS,
          let: { researcherId: '$_id' },
          pipeline: [
            {
              $match: {
                $expr: { $eq: ['$researcher', '$$researcherId'] },
              },
            },
            {
              $group: {
                _id: '$status',
                count: { $sum: 1 },
              },
            },
            {
              $project: {
                status: '$_id',
                count: 1,
                _id: 0,
              },
            },
          ],
          as: 'bidCounts',
        },
      },
      {
        $addFields: {
          bidCounts: {
            $arrayToObject: {
              $map: {
                input: '$bidCounts',
                as: 'item',
                in: {
                  k: '$$item.status',
                  v: '$$item.count',
                },
              },
            },
          },
        },
      },
      {
        $addFields: {
          pending: { $ifNull: ['$bidCounts.pending', 0] },
          inprogress: { $ifNull: ['$bidCounts.inprogress', 0] },
          completed: { $ifNull: ['$bidCounts.completed', 0] },
          rejected: { $ifNull: ['$bidCounts.rejected', 0] },
        },
      },
      {
        $project: {
          _id: 1,
          name: 1,
          email: 1,
          advisor: 1,
          universityName: 1,
          isArchived: 1,
          phone: 1,
          status: 1,
          assigned: 1,
          pending: 1,
          inprogress: 1,
          completed: 1,
          rejected: 1,
        },
      },
    ]);

    const result = await User.aggregatePaginate(aggregateResearcherData, options);

    const renamedResult = transformPaginatedResponse(result, 'researchers');

    res.status(200).json(
      new ApiResponse(200, renamedResult, 'Paginated data fetched successfully')
    );
  }
);

const paginatedResearcherReportData = asyncHandler(
  async (req: Request, res: Response) => {
    const { page = 1, limit = 10, search = '' } = req.query;
    const { researcherId } = req.params;

    const options = {
      page,
      limit,
    };

    const searchQuery = search
      ? {
        $or: [
          { landownerName: { $regex: search, $options: 'i' } },
          { landownerEmail: { $regex: search, $options: 'i' } },
          { reportName: { $regex: search, $options: 'i' } },
          {
            reportUrl: { $regex: search, $options: 'i' },
          },
        ],
      }
      : {};

    const aggregateResearcherData = Bids.aggregate([
      {
        $match: {
          researcher: toMongoId(researcherId),
          // ...searchQuery,
        },
      },
      {
        $lookup: {
          from: MODELS.USERS,
          localField: 'researcher',
          foreignField: '_id',
          as: 'researcher',
          pipeline: [
            {
              $project: {
                _id: 1,
                name: 1,
                email: 1,
                phone: 1,
                advisor: 1,
                universityName: 1,
                isArchived: 1,
              },
            },
          ],
        },
      },
      {
        $addFields: {
          researcher: { $arrayElemAt: ['$researcher', 0] },
        },
      },
    ]);

    const result = await Bids.aggregatePaginate(
      aggregateResearcherData,
      options
    );

    const renamedResult = transformPaginatedResponse(result, 'researchReports');

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

// const placeBidResearch = asyncHandler(async (req: Request, res: Response) => {
//   const { id: propertyId } = req.params;
//   const { _id: userId } = req.user;
//   const { status, description, files } = req.body;

//   const findProperty = await Property.findById(propertyId);

//   if (!findProperty) {
//     return res
//       .status(201)
//       .json(new ApiResponse(400, findProperty, `Property doesnot exists!`));
//   }

//   //  NEW REQUIREMENT ANY RESEARCHER CAN BID ON ANY REPORT
//   // const isAssigned = await AssignResearcherProperty.find({
//   //   property: toMongoId(propertyId),
//   //   researchers: toMongoId(userId),
//   // });

//   // if (!isAssigned.length) {
//   //   return res
//   //     .status(400)
//   //     .json(
//   //       new ApiError(
//   //         400,
//   //         `Property must be assigned to researcher in order to place bid!`
//   //       )
//   //     );
//   // }

//   const [findBid] = await Bids.find({
//     researcher: userId,
//     property: propertyId,
//   });

//   if (findBid) {
//     return res
//       .status(201)
//       .json(new ApiResponse(400, findBid, `Bid already exists!`));
//   }

//   const filePayload = files.map((file: TUploadedFileType) => ({
//     name: file.filename,
//     url: file.path,
//     type: file.mimetype,
//     originalName: file.originalname,
//   }));

//   const createdBid = await Bids.create({
//     property: propertyId,
//     researcher: userId,
//     status,
//     description,
//     files: filePayload,
//   });

//   if (!createdBid) {
//     return res
//       .status(201)
//       .json(new ApiError(400, `Something went wrong while creating bid!`));
//   }

//   res
//     .status(200)
//     .json(new ApiResponse(200, createdBid, 'Bid created successfully!'));
// });
const placeBidResearch = asyncHandler(async (req: Request, res: Response) => {
  const { id: propertyId } = req.params;
  const { _id: userId } = req.user;
  const { status, description, files } = req.body;

  const findProperty = await Property.findById(propertyId);
  if (!findProperty) {
    return res
      .status(201)
      .json(new ApiResponse(400, null, `Property does not exist!`));
  }

  const [findBid] = await Bids.find({
    researcher: userId,
    property: propertyId,
  });

  if (findBid) {
    return res
      .status(201)
      .json(new ApiResponse(400, findBid, `Bid already exists!`));
  }

  const filePayload = files.map((file: TUploadedFileType) => ({
    name: file.filename,
    url: file.path,
    type: file.mimetype,
    originalName: file.originalname,
  }));

  const createdBid = await Bids.create({
    property: propertyId,
    researcher: userId,
    status,
    description,
    files: filePayload,
  });

  if (!createdBid) {
    return res
      .status(201)
      .json(new ApiError(400, `Something went wrong while creating bid!`));
  }

  // Fetch researcher details
  const researcher = await User.findById(userId);
  const propertyDetails = await Property.findById(propertyId);
  const propertyName = propertyDetails?.propertyName || 'Unnamed Property';
  // Format file links for email
  const fileLinks: string = filePayload.length > 0
    ? filePayload
      .map((data: { originalName: string; url: string }) => ` File Name :${data.originalName} \n File URL : ${data.url} \n \n`)
      .join('\n')
    : 'No files uploaded.';

  // Send notification email to admin
  await sendEmail(
    'texasecolabprogram@braungresham.com',
    'New Research Proposal Submitted',
    `Dear Admin,

      A new research proposal has been submitted.

    📌 Researcher:
    Name: ${researcher?.name || 'N/A'}
    Email: ${researcher?.email || 'N/A'}

    🏠 Property : ${propertyName}

    🧾 Description: ${description || 'No description provided'}

    📎Files:
    ${fileLinks}

    Please review the proposal in the admin dashboard.

    System Notification`,
  );

  res
    .status(200)
    .json(new ApiResponse(200, createdBid, 'Bid created successfully!'));
});
const removeBidResearch = asyncHandler(async (req: Request, res: Response) => {
  const { id: bidId } = req.params;

  const findBid = await Bids.findByIdAndDelete(bidId);

  if (!findBid) {
    return res
      .status(201)
      .json(new ApiResponse(400, findBid, `Bid does not exists!`));
  }

  res
    .status(200)
    .json(new ApiResponse(200, findBid, 'Bid removed successfully!'));
});

const addReports = asyncHandler(async (req: Request, res: Response) => {
  const { id: researcherId } = req.user;
  const { property, files, name, description } = req.body;

  const [researcherPermission] = await Bids.find({
    researcher: researcherId,
    property,
  });

  const filePayload = files.map((file: TUploadedFileType) => ({
    name: file.filename,
    url: file.path,
    type: file.mimetype,
    originalName: file.originalname,
  }));

  if (
    !researcherPermission ||
    researcherPermission.status !== PROPOSAL_STATUS.APPROVED
  ) {
    return res
      .status(201)
      .json(
        new ApiResponse(
          400,
          researcherPermission,
          'You are not authorized to add reports for this property!'
        )
      );
  }

  const addedPropertyFile = await Reports.create({
    name,
    description,
    files: filePayload,
    property,
    researcher: researcherId,
  });

  if (!addedPropertyFile) {
    return res
      .status(201)
      .json(
        new ApiResponse(400, `Something went wrong while adding property file!`)
      );
  }
  const researcher = await User.findById(researcherId);
  const propertyDetails = await Property.findById(property);
  const propertyName = propertyDetails?.propertyName || 'Unnamed Property';
  const fileLinks: string = filePayload.length > 0
    ? filePayload
      .map((data: { originalName: string; url: string }) =>
        `File Name: ${data.originalName}\nFile URL: ${data.url}\n`
      )
      .join('\n')
    : 'No files uploaded.';

  // ✅ Send admin email
  await sendEmail(
    'texasecolabprogram@braungresham.com',
    'New Report Uploaded by Researcher',
    `Dear Admin,

A new report has been submitted by a researcher.

📌 Researcher:
Name: ${researcher?.name || 'N/A'}
Email: ${researcher?.email || 'N/A'}

🏠 Property: ${propertyName} (ID: ${property})

📝 Report Title: ${name}
🧾 Description: ${description || 'No description provided.'}

📎 Files:
${fileLinks}

Please review the report in the admin dashboard.

System Notification`
  );
  res
    .status(200)
    .json(
      new ApiResponse(
        200,
        addedPropertyFile,
        'Property File added successfully!'
      )
    );
});

const updateReport = asyncHandler(async (req: Request, res: Response) => {
  const { id: reportId } = req.params;
  const { files, name, description } = req.body;

  const filePayload = files.map((file: TUploadedFileType) => ({
    name: file.filename,
    url: file.path,
    type: file.mimetype,
    originalName: file.originalname,
  }));

  // Dynamically build the update object
  const updatePayload: any = {
    $push: { files: filePayload }, // Always push new files
  };

  // Add `name` to the payload only if it is provided
  if (name !== undefined && name.trim() !== '') {
    updatePayload.name = name.trim();
  }

  // Add `description` to the payload only if it is provided
  if (description !== undefined && description.trim() !== '') {
    updatePayload.description = description.trim();
  }

  const addedPropertyFile = await Reports.findOneAndUpdate(
    {
      _id: toMongoId(reportId),
    },
    updatePayload,
    {
      new: true,
      upsert: true,
    }
  );

  if (!addedPropertyFile) {
    return res
      .status(201)
      .json(
        new ApiResponse(400, `Something went wrong while adding property file!`)
      );
  }

  res
    .status(200)
    .json(
      new ApiResponse(
        200,
        addedPropertyFile,
        'Property File added successfully!'
      )
    );
});

const changeResearchersStatus = asyncHandler(
  async (req: Request, res: Response) => {
    const { id: researcherId } = req.params;
    const { status } = req.body;

    const findUser = await User.findById(researcherId);

    if (!findUser) {
      return res
        .status(201)
        .json(new ApiError(400, `Please enter a valid researcher id!`));
    }

    const updatedUserStatus = await User.findByIdAndUpdate(
      {
        _id: researcherId,
      },
      { status },
      {
        new: true,
      }
    );

    if (!updatedUserStatus) {
      return res
        .status(201)
        .json(new ApiError(400, `Something went wrong while updating User!`));
    }
    if (status === 'approved') {
      await sendEmail(
        updatedUserStatus.email,
        'Researcher Approval Notification',
        `Dear ${updatedUserStatus.name},\n\nYour researcher account has been approved.\n\nYou may now proceed with accessing the system.\n\nBest regards,\nTexas Eco Labs`,
      );
    }
    res
      .status(200)
      .json(
        new ApiResponse(200, updatedUserStatus, 'User updated successfully!')
      );
  }
);

const archiveResearcher = asyncHandler(async (req: Request, res: Response) => {
  const { id: researcherId } = req.params;

  const archivedResearcher = await User.findByIdAndUpdate(
    {
      _id: researcherId,
    },
    [
      {
        $set: {
          isArchived: { $not: '$isArchived' },
        },
      },
    ],
    {
      new: true,
      runValidators: true,
    }
  );

  if (!archivedResearcher) {
    return res
      .status(201)
      .json(
        new ApiError(400, `Something went wrong while archiving researcher!`)
      );
  }

  res
    .status(200)
    .json(
      new ApiResponse(
        200,
        archivedResearcher,
        'Researcher archived successfully!'
      )
    );
});

const checkResearcherProposalStatus = asyncHandler(
  async (req: Request, res: Response) => {
    const { id: propertyId } = req.params;
    const { researcherId } = req.query;

    const [isValid] = await Bids.find({
      property: toMongoId(propertyId),
      researcher: toMongoId(researcherId as string),
    });

    if (!isValid) {
      return res
        .status(400)
        .json(
          new ApiError(400, `There is no bids for this property made by the researcher!`)
        );
    }

    res
      .status(200)
      .json(
        new ApiResponse(
          200,
          isValid,
          'Researcher bid fetched!'
        )
      );
  }
);

const deleteResearcher = asyncHandler(async (req: Request, res: Response) => {
  const { id: researcherId } = req.params;

  const deletedResearcher = await User.findByIdAndDelete({
    _id: researcherId,
  });

  if (!deletedResearcher) {
    return res
      .status(201)
      .json(
        new ApiError(400, `Something went wrong while deleting researcher!`)
      );
  }

  res
    .status(200)
    .json(
      new ApiResponse(
        200,
        deletedResearcher,
        'Researcher deleted successfully!'
      )
    );
});

const updateResearcher = asyncHandler(async (req: Request, res: Response) => {
  const { id: userId } = req.params;

  // Check if user exists
  const user = await User.findById(userId);
  if (!user) {
    throw new ApiError(404, 'User does not exist!');
  }

  // Update user details
  const updatedResearcher = await User.findByIdAndUpdate(user, req.body, {
    new: true,
    runValidators: true,
  });

  // Send response
  res
    .status(200)
    .json(
      new ApiResponse(200, updatedResearcher, 'Researcher updated successfully')
    );
});

// Add researcher by email
const addResearcher = asyncHandler(async (req: Request, res: Response) => {
  const { name, email, phone, university, advisor, isArchived, universityName }: IUpdateResearcher =
    req.body;

  // Start a transaction
  const session = await mongoose.startSession();
  session.startTransaction();

  // Generate system-generated password
  const password = generatePassword();
  const researcherData = {
    name,
    email,
    phone,
    password,
    roles: ROLES.RESEARCHER,
    status: RESEARCHER_STATUS.APPROVED,
    university,
    advisor,
    universityName,
    isArchived
  };

  // Send the password to the user's email
  try {
    const user = await findOrUpdateUser(researcherData, session);

    // Commit transaction
    await session.commitTransaction();

    // Send email asynchronously (outside of transaction)
    sendEmail(
      email,
      'Your System Generated Password',
      `Welcome to ${PLATFORM_NAME}! Here is your system-generated password: ${password}`
    ).catch((err) => console.error('Email sending failed:', err));

    return res
      .status(201)
      .json(
        new ApiResponse(
          201,
          { user },
          'Researcher added successfully. Password has been sent to the email.'
        )
      );
  } catch (error: any) {
    // Rollback transaction
    await session.abortTransaction();
    throw new ApiError(500, error.message || 'Failed to create Researcher!');
  } finally {
    // End session
    session.endSession();
  }
});

const fetchResearcher = asyncHandler(async (req: Request, res: Response) => {
  const { id: userId } = req.params;

  const user = await User.aggregate([
    {
      $match: {
        _id: new mongoose.Types.ObjectId(userId),
      },
    },
    {
      $lookup: {
        from: MODELS.ASSIGNED_RESEARCH_REPORTS,
        let: { userId: '$_id' },
        pipeline: [
          {
            $match: {
              $expr: {
                $in: ['$$userId', '$researchers'],
              },
            },
          },
          {
            $group: {
              _id: null,
              count: { $sum: 1 },
            },
          },
          {
            $project: {
              _id: 0,
              count: 1,
            },
          },
        ],
        as: 'assigned',
      },
    },
    {
      $addFields: {
        assigned: { $arrayElemAt: ['$assigned.count', 0] },
      },
    },
    {
      $lookup: {
        from: MODELS.USERS,
        localField: 'university',
        foreignField: '_id',
        as: 'university',
        pipeline: [
          {
            $project: {
              _id: 1,
              name: 1,
              email: 1,
              phone: 1

            },
          },
        ],
      },
    },
    {
      $unwind: {
        path: '$university',
        preserveNullAndEmptyArrays: true,
      },
    },
    {
      $lookup: {
        from: MODELS.BIDS,
        let: { researcherId: '$_id' },
        pipeline: [
          {
            $match: {
              $expr: { $eq: ['$researcher', '$$researcherId'] },
            },
          },
          {
            $group: {
              _id: '$status',
              count: { $sum: 1 },
            },
          },
          {
            $project: {
              status: '$_id',
              count: 1,
              _id: 0,
            },
          },
        ],
        as: 'bidCounts',
      },
    },
    {
      $addFields: {
        bidCounts: {
          $arrayToObject: {
            $map: {
              input: '$bidCounts',
              as: 'item',
              in: {
                k: '$$item.status',
                v: '$$item.count',
              },
            },
          },
        },
      },
    },
    {
      $addFields: {
        pending: { $ifNull: ['$bidCounts.pending', 0] },
        inprogress: { $ifNull: ['$bidCounts.inprogress', 0] },
        completed: { $ifNull: ['$bidCounts.completed', 0] },
        rejected: { $ifNull: ['$bidCounts.rejected', 0] },
      },
    },
    {
      $project: {
        _id: 1,
        name: 1,
        email: 1,
        phone: 1,
        advisor: 1,
        universityName: 1,
        isArchived: 1,
        university: 1,
        assigned: 1,
        pending: 1,
        inprogress: 1,
        completed: 1,
        rejected: 1,
      },
    },
  ]);

  if (!user.length) {
    throw new ApiError(404, 'User does not exist!');
  }

  // Send response
  res
    .status(200)
    .json(new ApiResponse(200, user[0], 'Researcher user data successfully'));
});

export {
  paginatedResearcherReportData,
  placeBidResearch,
  paginatedResearchers,
  changeResearchersStatus,
  archiveResearcher,
  deleteResearcher,
  updateResearcher,
  addResearcher,
  fetchResearcher,
  removeBidResearch,
  addReports,
  updateReport,
  checkResearcherProposalStatus,
};
