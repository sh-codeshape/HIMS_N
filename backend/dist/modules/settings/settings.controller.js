"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.SettingsController = void 0;
const settings_service_1 = require("./settings.service");
const AppError_1 = require("../../shared/errors/AppError");
class SettingsController {
    static async getSettingByKey(req, res) {
        const key = String(req.params.key || '');
        if (!key) {
            throw new AppError_1.ValidationError('Setting key is required');
        }
        const orgId = req.user?.organizationId;
        const facId = req.user?.facilityId;
        const data = await settings_service_1.SettingsService.getSetting(key, orgId, facId);
        res.json({
            success: true,
            data,
        });
    }
    static async updateSettingByKey(req, res) {
        const key = String(req.params.key || '');
        const { value } = req.body;
        if (!key) {
            throw new AppError_1.ValidationError('Setting key is required');
        }
        if (value === undefined || value === null) {
            throw new AppError_1.ValidationError('Setting value payload is required');
        }
        const orgId = req.user?.organizationId;
        const facId = req.user?.facilityId;
        const userId = req.user?.userId;
        const updated = await settings_service_1.SettingsService.upsertSetting(key, value, orgId, facId, userId);
        res.json({
            success: true,
            message: `Setting ${key} updated successfully`,
            data: updated.value,
        });
    }
    static async uploadLogo(req, res) {
        const { image } = req.body; // Can be base64 data URI or image URL
        if (!image) {
            throw new AppError_1.ValidationError('Image payload (base64 string or URL) is required');
        }
        const result = await settings_service_1.SettingsService.uploadLogo(image);
        res.json({
            success: true,
            data: result,
        });
    }
}
exports.SettingsController = SettingsController;
