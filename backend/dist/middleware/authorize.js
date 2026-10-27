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
        // Super admin, admin, and developer override permission checks
        if (user.roles?.includes('developer') || user.roles?.includes('super_admin') || user.roles?.includes('admin')) {
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
