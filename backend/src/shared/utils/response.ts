import { Response } from 'express';

export const sendSuccess = <T>(res: Response, data: T, statusCode = 200) => {
  res.status(statusCode).json({
    success: true,
    data,
  });
};

export const sendPaginated = <T>(
  res: Response,
  data: T[],
  meta: { page: number; limit: number; total: number },
  statusCode = 200
) => {
  res.status(statusCode).json({
    success: true,
    data,
    meta,
  });
};
