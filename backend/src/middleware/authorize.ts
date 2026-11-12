import { Request, Response, NextFunction } from 'express';
import { UnauthorizedError } from '../shared/errors/AppError';

export const authorize = (allowedPermissions: string[]) => {
  return (req: Request, res: Response, next: NextFunction) => {
    const user = req.user;

    if (!user) {
      return next(new UnauthorizedError('Not authenticated'));
    }

    const isDeveloper = user.roles?.includes('developer');
    const isSuperAdminOrAdmin = user.roles?.includes('super_admin') || user.roles?.includes('admin');
    const requiresDeveloperOnly = allowedPermissions.some(
      (permission) => permission.startsWith('developer.') || permission === 'developer'
    );

    // Developer role has universal access across all permissions
    if (isDeveloper) {
      return next();
    }

    // Developer-only endpoints are strictly reserved for developer role — super_admin and admin CANNOT bypass
    if (requiresDeveloperOnly) {
      return next(new UnauthorizedError('Developer access required'));
    }

    // Super admin and admin override general hospital permissions
    if (isSuperAdminOrAdmin) {
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
