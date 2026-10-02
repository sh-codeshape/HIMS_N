import { Response } from 'express';

export const sendSuccess = <T>(
  res: Response,
  data: T,
  messageOrStatus?: string | number,
  statusCodeOverride?: number,
) => {
  const status = typeof messageOrStatus === 'number' ? messageOrStatus : (statusCodeOverride ?? 200);
  const message = typeof messageOrStatus === 'string' ? messageOrStatus : undefined;

  res.status(status).json({
    success: true,
    ...(message ? { message } : {}),
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
