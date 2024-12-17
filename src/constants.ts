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
