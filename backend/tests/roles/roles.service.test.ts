import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { RolesService } from '../../src/modules/roles/roles.service';
import { db } from '../../src/config/database';
import { ConflictError, NotFoundError, ForbiddenError } from '../../src/shared/errors/AppError';

vi.mock('../../src/config/database', () => ({
  db: {
    query: vi.fn(),
    getClient: vi.fn(),
  },
}));

describe('RolesService', () => {
  const mockOrgId = '00000000-0000-0000-0000-000000000000';
  const mockRoleId = 'role-1';
  const mockUserId = 'user-1';
  const mockPermissionId = 'perm-1';

  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('getRoles', () => {
    it('should return roles for an organization', async () => {
      const mockRows = [{ id: mockRoleId, code: 'doctor', name: 'Doctor', description: 'OPD, IPD & EMR', is_system: true }];
      vi.mocked(db.query).mockResolvedValueOnce({ rows: mockRows, rowCount: 1 } as any);

      const service = new RolesService();
      const result = await service.getRoles(mockOrgId);

      expect(db.query).toHaveBeenCalledWith(
        expect.stringContaining('FROM roles'),
        [mockOrgId]
      );
      expect(result).toEqual(mockRows);
    });
  });

  describe('createRole', () => {
    it('should create a role and return the role data (not null)', async () => {
      const mockNewRole = {
        id: mockRoleId,
        code: 'nurse',
        name: 'Nurse',
        description: 'Nursing staff',
        is_system: false,
      };

      // First query: check existing role (returns empty)
      vi.mocked(db.query).mockResolvedValueOnce({ rows: [], rowCount: 0 } as any);
      // Second query: insert and return
      vi.mocked(db.query).mockResolvedValueOnce({ rows: [mockNewRole], rowCount: 1 } as any);

      const service = new RolesService();
      const result = await service.createRole(mockOrgId, {
        code: 'nurse',
        name: 'Nurse',
        description: 'Nursing staff',
        createdBy: mockUserId,
        updatedBy: mockUserId,
      });

      expect(result).not.toBeNull();
      expect(result.code).toBe('nurse');
      expect(result.name).toBe('Nurse');
      expect(db.query).toHaveBeenCalledTimes(2);
    });

    it('should throw ConflictError if role code already exists', async () => {
      vi.mocked(db.query).mockResolvedValueOnce({ rows: [{ id: 'existing' }], rowCount: 1 } as any);

      const service = new RolesService();
      await expect(service.createRole(mockOrgId, {
        code: 'doctor',
        name: 'Doctor',
        createdBy: mockUserId,
        updatedBy: mockUserId,
      })).rejects.toThrow(ConflictError);
    });
  });

  describe('getPermissions', () => {
    it('should return all permissions', async () => {
      const mockPermissions = [
        { id: 'perm-1', code: 'roles.view', module: 'roles', description: 'View roles' },
        { id: 'perm-2', code: 'roles.manage', module: 'roles', description: 'Manage roles' },
      ];
      vi.mocked(db.query).mockResolvedValueOnce({ rows: mockPermissions, rowCount: 2 } as any);

      const service = new RolesService();
      const result = await service.getPermissions();

      expect(result).toHaveLength(2);
      expect(result[0].code).toBe('roles.view');
    });
  });

  describe('getRolePermissions', () => {
    it('should return permissions assigned to a role', async () => {
      const mockRolePerms = [
        { id: 'perm-1', code: 'opd.view', module: 'opd', description: 'View OPD' },
      ];
      vi.mocked(db.query).mockResolvedValueOnce({ rows: mockRolePerms, rowCount: 1 } as any);

      const service = new RolesService();
      const result = await service.getRolePermissions(mockRoleId);

      expect(db.query).toHaveBeenCalledWith(
        expect.stringContaining('role_permissions'),
        [mockRoleId]
      );
      expect(result).toHaveLength(1);
      expect(result[0].code).toBe('opd.view');
    });
  });

  describe('updateRolePermissions', () => {
    it('should update role permissions in a transaction', async () => {
      const mockClient = {
        query: vi.fn(),
        release: vi.fn(),
      };
      vi.mocked(db.getClient).mockResolvedValueOnce(mockClient as any);

      // Role exists check (uses db.query, not client)
      vi.mocked(db.query).mockResolvedValueOnce({ rows: [{ id: mockRoleId }], rowCount: 1 } as any);
      // DELETE existing
      vi.mocked(mockClient.query).mockResolvedValueOnce({ rowCount: 1 } as any);
      // INSERT new permissions
      vi.mocked(mockClient.query).mockResolvedValueOnce({ rowCount: 1 } as any);
      // COMMIT
      vi.mocked(mockClient.query).mockResolvedValueOnce({} as any);

      const service = new RolesService();
      await service.updateRolePermissions(mockRoleId, [mockPermissionId]);

      expect(db.query).toHaveBeenCalledWith(
        `SELECT id FROM roles WHERE id = $1`,
        [mockRoleId]
      );
      expect(mockClient.query).toHaveBeenCalledWith('BEGIN');
      expect(mockClient.query).toHaveBeenCalledWith(
        'DELETE FROM role_permissions WHERE role_id = $1',
        [mockRoleId]
      );
      expect(mockClient.query).toHaveBeenCalledWith('COMMIT');
      expect(mockClient.release).toHaveBeenCalled();
    });

    it('should rollback on error', async () => {
      const mockClient = {
        query: vi.fn(),
        release: vi.fn(),
      };
      vi.mocked(db.getClient).mockResolvedValueOnce(mockClient as any);
      vi.mocked(db.query).mockResolvedValueOnce({ rows: [{ id: mockRoleId }], rowCount: 1 } as any);
      vi.mocked(mockClient.query).mockRejectedValueOnce(new Error('DB error'));

      const service = new RolesService();
      await expect(service.updateRolePermissions(mockRoleId, [mockPermissionId]))
        .rejects.toThrow('DB error');

      expect(mockClient.query).toHaveBeenCalledWith('ROLLBACK');
      expect(mockClient.release).toHaveBeenCalled();
    });
  });

  describe('assignUserRole', () => {
    it('should assign a role to a user', async () => {
      vi.mocked(db.query)
        .mockResolvedValueOnce({ rows: [{ id: mockUserId, organization_id: mockOrgId }], rowCount: 1 } as any) // user exists
        .mockResolvedValueOnce({ rows: [{ id: mockRoleId, organization_id: mockOrgId }], rowCount: 1 } as any) // role exists
        .mockResolvedValueOnce({ rows: [{ id: 'ur-1' }], rowCount: 1 } as any); // insert

      const service = new RolesService();
      const result = await service.assignUserRole(mockUserId, mockRoleId);

      expect(result).not.toBeNull();
      expect(db.query).toHaveBeenCalledWith(
        expect.stringContaining('INSERT INTO user_roles'),
        [mockUserId, mockRoleId, null]
      );
    });

    it('should throw NotFoundError if user does not exist', async () => {
      vi.mocked(db.query).mockResolvedValueOnce({ rows: [], rowCount: 0 } as any);

      const service = new RolesService();
      await expect(service.assignUserRole('nonexistent', mockRoleId))
        .rejects.toThrow(NotFoundError);
    });

    it('should throw ConflictError if user and role are in different organizations', async () => {
      vi.mocked(db.query)
        .mockResolvedValueOnce({ rows: [{ id: mockUserId, organization_id: 'org-a' }], rowCount: 1 } as any)
        .mockResolvedValueOnce({ rows: [{ id: mockRoleId, organization_id: 'org-b' }], rowCount: 1 } as any);

      const service = new RolesService();
      await expect(service.assignUserRole(mockUserId, mockRoleId))
        .rejects.toThrow(ConflictError);
    });
  });

  describe('grantUserPermission', () => {
    it('should grant a direct permission to a user', async () => {
      vi.mocked(db.query)
        .mockResolvedValueOnce({ rows: [{ id: mockUserId }], rowCount: 1 } as any) // user exists
        .mockResolvedValueOnce({ rows: [{ id: mockPermissionId }], rowCount: 1 } as any) // permission exists
        .mockResolvedValueOnce({ rows: [{ id: 'up-1' }], rowCount: 1 } as any); // insert

      const service = new RolesService();
      const result = await service.grantUserPermission(mockUserId, mockPermissionId, mockUserId);

      expect(result).not.toBeNull();
      expect(db.query).toHaveBeenCalledWith(
        expect.stringContaining('INSERT INTO user_permissions'),
        [mockUserId, mockPermissionId, mockUserId, null]
      );
    });

    it('should throw NotFoundError if permission does not exist', async () => {
      vi.mocked(db.query)
        .mockResolvedValueOnce({ rows: [{ id: mockUserId }], rowCount: 1 } as any)
        .mockResolvedValueOnce({ rows: [], rowCount: 0 } as any);

      const service = new RolesService();
      await expect(service.grantUserPermission(mockUserId, 'nonexistent-perm', mockUserId))
        .rejects.toThrow(NotFoundError);
    });
  });

  describe('revokeUserPermission', () => {
    it('should revoke a direct permission from a user', async () => {
      vi.mocked(db.query).mockResolvedValueOnce({ rows: [{ id: 'up-1' }], rowCount: 1 } as any);

      const service = new RolesService();
      const result = await service.revokeUserPermission(mockUserId, mockPermissionId);

      expect(result).toEqual({ success: true });
      expect(db.query).toHaveBeenCalledWith(
        'DELETE FROM user_permissions WHERE user_id = $1 AND permission_id = $2 RETURNING id',
        [mockUserId, mockPermissionId]
      );
    });

    it('should throw NotFoundError if user does not have the permission', async () => {
      vi.mocked(db.query).mockResolvedValueOnce({ rows: [], rowCount: 0 } as any);

      const service = new RolesService();
      await expect(service.revokeUserPermission(mockUserId, mockPermissionId))
        .rejects.toThrow(NotFoundError);
    });
  });

  describe('deleteRole', () => {
    it('should delete a non-system role that is not assigned', async () => {
      vi.mocked(db.query)
        .mockResolvedValueOnce({ rows: [{ id: mockRoleId, is_system: false }], rowCount: 1 } as any) // role exists, not system
        .mockResolvedValueOnce({ rows: [], rowCount: 0 } as any) // not assigned to any user
        .mockResolvedValueOnce({ rowCount: 1 } as any); // delete

      const service = new RolesService();
      const result = await service.deleteRole(mockRoleId);

      expect(result).toEqual({ success: true });
    });

    it('should throw ForbiddenError for system roles', async () => {
      vi.mocked(db.query).mockResolvedValueOnce({ rows: [{ id: mockRoleId, is_system: true }], rowCount: 1 } as any);

      const service = new RolesService();
      await expect(service.deleteRole(mockRoleId)).rejects.toThrow(ForbiddenError);
    });

    it('should throw ConflictError if role is assigned to users', async () => {
      vi.mocked(db.query)
        .mockResolvedValueOnce({ rows: [{ id: mockRoleId, is_system: false }], rowCount: 1 } as any)
        .mockResolvedValueOnce({ rows: [{ user_id: mockUserId }], rowCount: 1 } as any); // assigned

      const service = new RolesService();
      await expect(service.deleteRole(mockRoleId)).rejects.toThrow(ConflictError);
    });
  });
});
