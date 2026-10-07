import { db } from '../../config/database';

export class RolesService {
  async getRoles(organizationId: string) {
    const query = `
      SELECT id, code, name, description, is_system
      FROM roles
      WHERE organization_id = $1
      ORDER BY name ASC
    `;
    const result = await db.query(query, [organizationId]);
    return result.rows;
  }

  async getPermissions() {
    const query = `
      SELECT id, code, module, description
      FROM permissions
      ORDER BY module ASC, code ASC
    `;
    const result = await db.query(query);
    return result.rows;
  }

  async getRolePermissions(roleId: string) {
    const query = `
      SELECT p.id, p.code, p.module, p.description
      FROM role_permissions rp
      JOIN permissions p ON rp.permission_id = p.id
      WHERE rp.role_id = $1
    `;
    const result = await db.query(query, [roleId]);
    return result.rows;
  }

  async updateRolePermissions(roleId: string, permissionIds: string[]) {
    const client = await db.getClient();
    try {
      await client.query('BEGIN');
      
      // Delete existing
      await client.query('DELETE FROM role_permissions WHERE role_id = $1', [roleId]);
      
      // Insert new
      if (permissionIds.length > 0) {
        const values = permissionIds.map((id, index) => `($1, $${index + 2})`).join(', ');
        const query = `INSERT INTO role_permissions (role_id, permission_id) VALUES ${values}`;
        await client.query(query, [roleId, ...permissionIds]);
      }
      
      await client.query('COMMIT');
    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }
  }
}
