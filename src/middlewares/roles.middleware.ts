import { NextFunction, Request, Response } from 'express';
import { ApiResponse } from '../utils/ApiResponse';
import { ROLES, RoleType } from '../constants';

const roleCheck = (role: RoleType) => {
  return (req: Request, res: Response, next: NextFunction) => {
    if (req.user.roles !== ROLES.ADMIN) {
      if (req.user.roles !== role) {
        return res
          .status(403)
          .json(new ApiResponse(403, 'Access denied, Incorrect role!'));
      }
    }
    next();
  };
};

export { roleCheck };
