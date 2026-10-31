import { Request, Response } from 'express';
import { SettingsService } from './settings.service';
import { ValidationError } from '../../shared/errors/AppError';

export class SettingsController {
  static async getSettingByKey(req: Request, res: Response) {
    const key = String(req.params.key || '');
    if (!key) {
      throw new ValidationError('Setting key is required');
    }

    const orgId = req.user?.organizationId;
    const facId = req.user?.facilityId;

    const data = await SettingsService.getSetting(key, orgId, facId);

    res.json({
      success: true,
      data,
    });
  }

  static async updateSettingByKey(req: Request, res: Response) {
    const key = String(req.params.key || '');
    const { value } = req.body;

    if (!key) {
      throw new ValidationError('Setting key is required');
    }
    if (value === undefined || value === null) {
      throw new ValidationError('Setting value payload is required');
    }

    const orgId = req.user?.organizationId;
    const facId = req.user?.facilityId;
    const userId = req.user?.userId;

    const updated = await SettingsService.upsertSetting(key, value, orgId, facId, userId);

    res.json({
      success: true,
      message: `Setting ${key} updated successfully`,
      data: updated.value,
    });
  }

  static async uploadLogo(req: Request, res: Response) {
    const { image } = req.body; // Can be base64 data URI or image URL
    if (!image) {
      throw new ValidationError('Image payload (base64 string or URL) is required');
    }

    const result = await SettingsService.uploadLogo(image);

    res.json({
      success: true,
      data: result,
    });
  }
}
