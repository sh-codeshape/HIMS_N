import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { RolesController } from '../../src/modules/roles/roles.controller';
import { RolesService } from '../../src/modules/roles/roles.service';
import { sendSuccess } from '../../src/shared/utils/response';

// Mock RolesService as a proper class so `new RolesService()` works
vi.mock('../../src/modules/roles/roles.service', () => ({
  RolesService: vi.fn().mockImplementation(class {
    getRoles = vi.fn();
    createRole = vi.fn();
    updateRole = vi.fn();
    deleteRole = vi.fn();
    getPermissions = vi.fn();
    getRolePermissions = vi.fn();
    updateRolePermissions = vi.fn();
    getUsersWithRoles = vi.fn();
    getUserById = vi.fn();
    getUserRoles = vi.fn();
    getRoleUsers = vi.fn();
    assignUserRole = vi.fn();
    removeUserRole = vi.fn();
    getUserPermissions = vi.fn();
    grantUserPermission = vi.fn();
    revokeUserPermission = vi.fn();
  }),
}));

vi.mock('../../src/shared/utils/response', () => ({
  sendSuccess: vi.fn(),
}));

describe('RolesController', () => {
  let controller: RolesController;
  let mockService: any;
  let mockSendSuccess: any;

  beforeEach(() => {
    vi.clearAllMocks();
    mockSendSuccess = vi.fn();
    vi.mocked(sendSuccess).mockImplementation(mockSendSuccess);
    controller = new RolesController();
    // The controller creates its own RolesService instance; grab it to set mocks
    mockService = (controller as any).service;
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('getRoles', () => {
    it('should return roles with data (not null)', async () => {
      const mockRoles = [{ id: 'role-1', code: 'doctor', name: 'Doctor' }];
      mockService.getRoles.mockResolvedValue(mockRoles);

      const mockReq: any = { user: { organizationId: 'org-1' } };
      const mockRes: any = { status: vi.fn().mockReturnThis(), json: vi.fn() };

      await controller.getRoles(mockReq, mockRes, vi.fn());

      expect(mockService.getRoles).toHaveBeenCalledWith('org-1');
      expect(mockSendSuccess).toHaveBeenCalledWith(mockRes, mockRoles, 'Roles retrieved successfully', 200);
    });
  });

  describe('createRole', () => {
    it('should create role and return role data (not null)', async () => {
      const mockRole = { id: 'role-1', code: 'nurse', name: 'Nurse' };
      mockService.createRole.mockResolvedValue(mockRole);

      const mockReq: any = {
        user: { organizationId: 'org-1', userId: 'user-1' },
        body: { code: 'nurse', name: 'Nurse' },
      };
      const mockRes: any = { status: vi.fn().mockReturnThis(), json: vi.fn() };

      await controller.createRole(mockReq, mockRes, vi.fn());

      expect(mockService.createRole).toHaveBeenCalledWith('org-1', {
        code: 'nurse',
        name: 'Nurse',
        createdBy: 'user-1',
        updatedBy: 'user-1',
      });
      expect(mockSendSuccess).toHaveBeenCalledWith(mockRes, mockRole, 'Role created successfully', 201);
      // Verify data is not null
      expect(mockSendSuccess.mock.calls[0][1]).not.toBeNull();
    });
  });

  describe('updateRolePermissions', () => {
    it('should update role permissions (data: null is expected)', async () => {
      mockService.updateRolePermissions.mockResolvedValue(undefined);

      const mockReq: any = {
        params: { roleId: 'role-1' },
        body: { permissionIds: ['perm-1', 'perm-2'] },
      };
      const mockRes: any = { status: vi.fn().mockReturnThis(), json: vi.fn() };

      await controller.updateRolePermissions(mockReq, mockRes, vi.fn());

      expect(mockService.updateRolePermissions).toHaveBeenCalledWith('role-1', ['perm-1', 'perm-2']);
      expect(mockSendSuccess).toHaveBeenCalledWith(mockRes, null, 'Role permissions updated successfully', 200);
    });
  });

  describe('getUserById', () => {
    it('should return user details with roles and permissions', async () => {
      const mockUser = { id: 'user-1', username: 'admin@test.com', full_name: 'Admin' };
      const mockRoles = [{ id: 'role-1', code: 'admin', name: 'Admin' }];
      const mockPermissions = [
        { id: 'perm-1', code: 'opd.view', module: 'opd', source: 'role' },
        { id: 'perm-2', code: 'staff.view', module: 'staff', source: 'direct' },
      ];

      mockService.getUserById.mockResolvedValue(mockUser);
      mockService.getUserRoles.mockResolvedValue(mockRoles);
      mockService.getUserPermissions.mockResolvedValue(mockPermissions);

      const mockReq: any = { params: { userId: 'user-1' } };
      const mockRes: any = { status: vi.fn().mockReturnThis(), json: vi.fn() };

      await controller.getUserById(mockReq, mockRes, vi.fn());

      expect(mockService.getUserById).toHaveBeenCalledWith('user-1');
      expect(mockService.getUserRoles).toHaveBeenCalledWith('user-1');
      expect(mockService.getUserPermissions).toHaveBeenCalledWith('user-1');
      expect(mockSendSuccess).toHaveBeenCalledWith(
        mockRes,
        { user: mockUser, roles: mockRoles, permissions: mockPermissions },
        'User details retrieved successfully',
        200
      );
    });
  });

  describe('assignUserRole', () => {
    it('should assign role to user', async () => {
      mockService.assignUserRole.mockResolvedValue({ id: 'ur-1' });

      const mockReq: any = {
        params: { userId: 'user-1' },
        body: { roleId: 'role-1', facilityId: null },
      };
      const mockRes: any = { status: vi.fn().mockReturnThis(), json: vi.fn() };

      await controller.assignUserRole(mockReq, mockRes, vi.fn());

      expect(mockService.assignUserRole).toHaveBeenCalledWith('user-1', 'role-1', null);
      expect(mockSendSuccess).toHaveBeenCalledWith(mockRes, null, 'Role assigned to user successfully', 200);
    });
  });

  describe('grantUserPermission', () => {
    it('should grant direct permission to user', async () => {
      mockService.grantUserPermission.mockResolvedValue({ id: 'up-1' });

      const mockReq: any = {
        params: { userId: 'user-1' },
        user: { userId: 'admin-1' },
        body: { permissionId: 'perm-1', expiresAt: null },
      };
      const mockRes: any = { status: vi.fn().mockReturnThis(), json: vi.fn() };

      await controller.grantUserPermission(mockReq, mockRes, vi.fn());

      expect(mockService.grantUserPermission).toHaveBeenCalledWith('user-1', 'perm-1', 'admin-1', null);
      expect(mockSendSuccess).toHaveBeenCalledWith(mockRes, null, 'Permission granted to user successfully', 200);
    });
  });
});
