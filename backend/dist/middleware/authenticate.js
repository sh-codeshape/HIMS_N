"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.authenticate = void 0;
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const AppError_1 = require("../shared/errors/AppError");
const JWT_SECRET = process.env.JWT_SECRET || 'super-secret-key';
const authenticate = (req, res, next) => {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
        return next(new AppError_1.UnauthorizedError('Missing or invalid authorization token'));
    }
    const token = authHeader.split(' ')[1];
    try {
        const payload = jsonwebtoken_1.default.verify(token, JWT_SECRET);
        const organizationId = payload.organizationId || payload.organization_id;
        const facilityId = payload.facilityId || payload.facility_id;
        if (!organizationId) {
            return next(new AppError_1.UnauthorizedError('Token is missing organization context'));
        }
        req.user = {
            userId: payload.userId,
            organizationId,
            facilityId,
            roles: payload.roles,
            permissions: payload.permissions,
        };
        next();
    }
    catch (error) {
        return next(new AppError_1.UnauthorizedError('Invalid or expired token'));
    }
};
exports.authenticate = authenticate;
