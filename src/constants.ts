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
  RESETPASSWORD_TOKENS = 'resetPasswordTokens',
  PROPERTIES = 'properties',
  PROPERTIES_FILES = 'properties-files',
  BIDS = 'bids',
  ASSIGNED_UNIVERSITY_REPORTS = 'assignUniversityReports',
  ASSIGNED_RESEARCH_REPORTS = 'assignResearcherReports',
  ASSIGNED_RESEARCH_PROPERTIES = 'assignResearcherProperties',
  ASSIGNED_UNIVERSITY_PROPERTIES = 'assignUniversityProperties',
}

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
