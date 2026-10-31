"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.settingsRoutes = void 0;
const express_1 = require("express");
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const settings_controller_1 = require("./settings.controller");
const authenticate_1 = require("../../middleware/authenticate");
const authorize_1 = require("../../middleware/authorize");
const JWT_SECRET = process.env.JWT_SECRET || 'super-secret-key';
/**
 * Optional authentication middleware:
 * Populates req.user if a valid token is provided, but allows public read if omitted.
 */
function optionalAuthenticate(req, res, next) {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
        return next();
    }
    const token = authHeader.split(' ')[1];
    try {
        const payload = jsonwebtoken_1.default.verify(token, JWT_SECRET);
        req.user = {
            userId: payload.userId,
            organizationId: payload.organizationId || payload.organization_id,
            facilityId: payload.facilityId || payload.facility_id,
            roles: payload.roles,
            permissions: payload.permissions,
        };
    }
    catch (e) {
        // Ignore invalid token on optional route
    }
    next();
}
exports.settingsRoutes = (0, express_1.Router)();
// Read setting by key (available with or without auth for receipts/slips)
exports.settingsRoutes.get('/:key', optionalAuthenticate, settings_controller_1.SettingsController.getSettingByKey);
// Update setting (requires authentication & administrative permission)
exports.settingsRoutes.put('/:key', authenticate_1.authenticate, (0, authorize_1.authorize)(['admin.settings']), settings_controller_1.SettingsController.updateSettingByKey);
// Upload logo
exports.settingsRoutes.post('/upload-logo', authenticate_1.authenticate, (0, authorize_1.authorize)(['admin.settings']), settings_controller_1.SettingsController.uploadLogo);
exports.default = exports.settingsRoutes;
