export const DB_NAME: string = 'eco-labs';

export const nameless: string = 'xyz';

export const PLATFORM_NAME: string = 'Eco-Labs';

export enum CONSTANTS {
  RESEARCHERS = 'researchers',
  UNIVERSITIES = 'universities',
}

export enum MODELS {
  USERS = 'users',
  REPORTS = 'reports',
  RESETPASSWORD_TOKENS = 'resetpasswordokens',
  PROPERTIES = 'properties',
  PROPERTIES_FILES = 'properties-files',
  BIDS = 'bids',
  ASSIGNED_UNIVERSITY_REPORTS = 'assignuniversityreports',
  ASSIGNED_RESEARCH_REPORTS = 'assignresearcherreports',
  ASSIGNED_RESEARCH_PROPERTIES = 'assignresearcherproperties',
}

export const ALLOWED_UPLOAD_FORMATS = [
  'pdf',
  'doc',
  'docx',
  'jpg',
  'jpeg',
  'png',
  'gif',
];

// Attach the generic middleware to all delete-related operations
export const deleteOperations: Array<
  'deleteMany' | 'deleteOne' | 'findOneAndDelete' | 'findByIdAndDelete'
> = ['deleteMany', 'deleteOne', 'findOneAndDelete', 'findByIdAndDelete'];

export const NotificationPayload = (title: string, body: string) => {
  return {
    notification: {
      title,
      body,
    },
  };
};

export enum ROLES {
  ADMIN = 'super-admin',
  LANDOWNER = 'landowner',
  RESEARCHER = 'researcher',
  UNIVERSITY = 'university',
}

export enum PROPOSAL_STATUS {
  UNASSIGNED = 'unassigned',
  PENDING = 'pending',
  INPROGRESS = 'inprogress',
  APPROVED = 'approved',
  REJECTED = 'rejected',
}

export type RoleType = `${ROLES}`;

export enum RESEARCHER_STATUS {
  PENDING = 'pending',
  APPROVED = 'approved',
  REJECTED = 'rejected',
}

export type ResearchStatusType = `${RESEARCHER_STATUS}`;

export enum ENVIRONMENT {
  DEVELOPMENT = 'development',
  PRODUCTION = 'production',
}
