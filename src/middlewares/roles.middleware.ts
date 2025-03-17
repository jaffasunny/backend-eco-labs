import { NextFunction, Request, Response } from 'express';
import { ApiResponse } from '../utils/ApiResponse.js';
import { ROLES, RoleType } from '../constants.js';

const roleCheck = (role: RoleType[] | RoleType) => {
  const checkRole = Array.isArray(role) ? role : [role];

  return (req: Request, res: Response, next: NextFunction) => {
    if (req.user.roles !== ROLES.ADMIN) {
      if (!checkRole.includes(req.user.roles)) {
        return res
          .status(403)
          .json(new ApiResponse(403, 'Access denied, Incorrect role!'));
      }
    }

    next();
  };
};

export { roleCheck };
