export const DB_NAME: string = 'eco-labs';

export const nameless: string = 'xyz';

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
  PENDING = 'pending',
  APPROVED = 'approved',
  REJECTED = 'rejected',
  NOTSENT = 'not-sent',
}

export type RoleType = `${ROLES}`;

export enum RESEARCHER_STATUS {
  PENDING = 'pending',
  APPROVED = 'approved',
  REJECTED = 'rejected',
}

export type ResearchStatusType = `${RESEARCHER_STATUS}`;
