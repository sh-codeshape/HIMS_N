import { Request, Response, NextFunction } from 'express';
import { RolesService } from './roles.service';
import { sendSuccess } from '../../shared/utils/response';

export class RolesController {
  private service: RolesService;

  constructor() {
    this.service = new RolesService();
  }

  /* ---------- Roles ---------- */

  getRoles = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const organizationId = req.user?.organizationId as string;
      const roles = await this.service.getRoles(organizationId);
      sendSuccess(res, roles, 'Roles retrieved successfully', 200);
    } catch (error) {
      next(error);
    }
  };

  createRole = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const organizationId = req.user?.organizationId as string;
      const createdBy = req.user?.userId as string;
      const role = await this.service.createRole(organizationId, {
        ...req.body,
        createdBy,
        updatedBy: createdBy,
      });
      sendSuccess(res, role, 'Role created successfully', 201);
    } catch (error) {
      next(error);
    }
  };

  updateRole = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const roleId = req.params.roleId as string;
      const updatedBy = req.user?.userId as string;
      const role = await this.service.updateRole(roleId, {
        ...req.body,
        updatedBy,
      });
      sendSuccess(res, role, 'Role updated successfully', 200);
    } catch (error) {
      next(error);
    }
  };

  deleteRole = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const roleId = req.params.roleId as string;
      await this.service.deleteRole(roleId);
      sendSuccess(res, null, 'Role deleted successfully', 200);
    } catch (error) {
      next(error);
    }
  };

  /* ---------- Permissions catalog ---------- */

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

  /* ---------- Users <-> Roles ---------- */

  getUsersWithRoles = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const organizationId = req.user?.organizationId as string;
      const users = await this.service.getUsersWithRoles(organizationId);
      sendSuccess(res, users, 'Users with roles retrieved successfully', 200);
    } catch (error) {
      next(error);
    }
  };

  getRoleUsers = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const roleId = req.params.roleId as string;
      const users = await this.service.getRoleUsers(roleId);
      sendSuccess(res, users, 'Role users retrieved successfully', 200);
    } catch (error) {
      next(error);
    }
  };

  assignUserRole = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { userId } = req.params as { userId: string };
      const { roleId, facilityId } = req.body;
      await this.service.assignUserRole(userId, roleId, facilityId);
      sendSuccess(res, null, 'Role assigned to user successfully', 200);
    } catch (error) {
      next(error);
    }
  };

  removeUserRole = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { userId, roleId } = req.params as { userId: string; roleId: string };
      await this.service.removeUserRole(userId, roleId);
      sendSuccess(res, null, 'Role removed from user successfully', 200);
    } catch (error) {
      next(error);
    }
  };

  /* ---------- Users <-> Permissions (direct grants) ---------- */

  getUserPermissions = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { userId } = req.params as { userId: string };
      const permissions = await this.service.getUserPermissions(userId);
      sendSuccess(res, permissions, 'User permissions retrieved successfully', 200);
    } catch (error) {
      next(error);
    }
  };

  grantUserPermission = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { userId } = req.params as { userId: string };
      const grantedBy = req.user?.userId as string;
      const { permissionId, expiresAt } = req.body;
      await this.service.grantUserPermission(userId, permissionId, grantedBy, expiresAt);
      sendSuccess(res, null, 'Permission granted to user successfully', 200);
    } catch (error) {
      next(error);
    }
  };

  revokeUserPermission = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { userId, permissionId } = req.params as { userId: string; permissionId: string };
      await this.service.revokeUserPermission(userId, permissionId);
      sendSuccess(res, null, 'Permission revoked from user successfully', 200);
    } catch (error) {
      next(error);
    }
  };
}
