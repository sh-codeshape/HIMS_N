import { Router, Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { SettingsController } from './settings.controller';
import { authenticate } from '../../middleware/authenticate';
import { authorize } from '../../middleware/authorize';

const JWT_SECRET = process.env.JWT_SECRET || 'super-secret-key';

/**
 * Optional authentication middleware:
 * Populates req.user if a valid token is provided, but allows public read if omitted.
 */
function optionalAuthenticate(req: Request, res: Response, next: NextFunction) {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return next();
  }

  const token = authHeader.split(' ')[1];
  try {
    const payload = jwt.verify(token, JWT_SECRET) as any;
    req.user = {
      userId: payload.userId,
      organizationId: payload.organizationId || payload.organization_id,
      facilityId: payload.facilityId || payload.facility_id,
      roles: payload.roles,
      permissions: payload.permissions,
    };
  } catch (e) {
    // Ignore invalid token on optional route
  }
  next();
}

export const settingsRoutes = Router();

// Read setting by key (available with or without auth for receipts/slips)
settingsRoutes.get('/:key', optionalAuthenticate, SettingsController.getSettingByKey);

// Update setting (requires authentication & administrative permission)
settingsRoutes.put(
  '/:key',
  authenticate,
  authorize(['admin.settings']),
  SettingsController.updateSettingByKey
);

// Upload logo
settingsRoutes.post(
  '/upload-logo',
  authenticate,
  authorize(['admin.settings']),
  SettingsController.uploadLogo
);

export default settingsRoutes;
