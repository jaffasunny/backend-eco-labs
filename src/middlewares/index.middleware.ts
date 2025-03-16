// middleware/mapFilesToBody.ts
import { Request, Response, NextFunction } from 'express';

export const mapFilesToBody = (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  if (req.files) {
    req.body.files = req.files; // Map files to body
  }
  next();
};
