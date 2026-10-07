import { Request, Response, NextFunction } from 'express';
import { RolesService } from './roles.service';
import { sendSuccess } from '../../shared/utils/response';

export class RolesController {
  private service: RolesService;

  constructor() {
    this.service = new RolesService();
  }

  getRoles = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const organizationId = req.user?.organizationId as string;
      const roles = await this.service.getRoles(organizationId);
      sendSuccess(res, roles, 'Roles retrieved successfully', 200);
    } catch (error) {
      next(error);
    }
  };

  getPermissions = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const permissions = await this.service.getPermissions();
      sendSuccess(res, permissions, 'Permissions retrieved successfully', 200);
    } catch (error) {
      next(error);
    }
  };

  getRolePermissions = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const roleId = req.params.roleId as string;
      const permissions = await this.service.getRolePermissions(roleId);
      sendSuccess(res, permissions, 'Role permissions retrieved successfully', 200);
    } catch (error) {
      next(error);
    }
  };

  updateRolePermissions = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const roleId = req.params.roleId as string;
      const { permissionIds } = req.body;
      await this.service.updateRolePermissions(roleId, permissionIds);
      sendSuccess(res, null, 'Role permissions updated successfully', 200);
    } catch (error) {
      next(error);
    }
  };
}
