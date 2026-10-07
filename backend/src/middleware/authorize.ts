import { Request, Response, NextFunction } from 'express';
import { UnauthorizedError } from '../shared/errors/AppError';

export const authorize = (allowedPermissions: string[]) => {
  return (req: Request, res: Response, next: NextFunction) => {
    const user = req.user;

    if (!user) {
      return next(new UnauthorizedError('Not authenticated'));
    }

    // Super admin overrides permission checks
    if (user.roles?.includes('super_admin')) {
      return next();
    }

    if (!user.permissions || user.permissions.length === 0) {
      return next(new UnauthorizedError('Insufficient permissions'));
    }

    const hasPermission = allowedPermissions.some(permission => 
      user.permissions?.includes(permission)
    );

    if (!hasPermission) {
      return next(new UnauthorizedError('Insufficient permissions'));
    }

    next();
  };
};
