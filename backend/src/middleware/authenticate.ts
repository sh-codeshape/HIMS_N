import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { UnauthorizedError } from '../shared/errors/AppError';

const JWT_SECRET = process.env.JWT_SECRET || 'super-secret-key';

declare global {
  namespace Express {
    interface Request {
      user?: {
        userId: string;
        organizationId: string;
        facilityId?: string;
        roles?: string[];
        permissions?: string[];
      };
    }
  }
}

export const authenticate = (req: Request, res: Response, next: NextFunction) => {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return next(new UnauthorizedError('Missing or invalid authorization token'));
  }

  const token = authHeader.split(' ')[1];

  try {
    const payload = jwt.verify(token, JWT_SECRET) as {
      userId: string;
      organizationId?: string;
      organization_id?: string;
      facilityId?: string;
      facility_id?: string;
      roles?: string[];
      permissions?: string[];
    };

    const organizationId = payload.organizationId || payload.organization_id;
    const facilityId = payload.facilityId || payload.facility_id;

    if (!organizationId) {
      return next(new UnauthorizedError('Token is missing organization context'));
    }

    req.user = {
      userId: payload.userId,
      organizationId,
      facilityId,
      roles: payload.roles,
      permissions: payload.permissions,
    };
    next();
  } catch (error) {
    return next(new UnauthorizedError('Invalid or expired token'));
  }
};
