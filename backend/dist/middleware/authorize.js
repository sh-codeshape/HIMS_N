"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.authorize = void 0;
const AppError_1 = require("../shared/errors/AppError");
const authorize = (allowedPermissions) => {
    return (req, res, next) => {
        const user = req.user;
        if (!user) {
            return next(new AppError_1.UnauthorizedError('Not authenticated'));
        }
        const isDeveloper = user.roles?.includes('developer');
        const isSuperAdminOrAdmin = user.roles?.includes('super_admin') || user.roles?.includes('admin');
        const requiresDeveloperOnly = allowedPermissions.some((permission) => permission.startsWith('developer.') || permission === 'developer');
        // Developer role has universal access across all permissions
        if (isDeveloper) {
            return next();
        }
        // Developer-only endpoints are strictly reserved for developer role — super_admin and admin CANNOT bypass
        if (requiresDeveloperOnly) {
            return next(new AppError_1.UnauthorizedError('Developer access required'));
        }
        // Super admin and admin override general hospital permissions
        if (isSuperAdminOrAdmin) {
            return next();
        }
        if (!user.permissions || user.permissions.length === 0) {
            return next(new AppError_1.UnauthorizedError('Insufficient permissions'));
        }
        const hasPermission = allowedPermissions.some(permission => user.permissions?.includes(permission));
        if (!hasPermission) {
            return next(new AppError_1.UnauthorizedError('Insufficient permissions'));
        }
        next();
    };
};
exports.authorize = authorize;
