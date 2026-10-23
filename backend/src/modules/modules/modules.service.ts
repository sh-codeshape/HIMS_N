import { db } from '../../config/database';
import { NotFoundError, ConflictError } from '../../shared/errors/AppError';

export class ModulesService {
  /* ------------------------------------------------------------
   * Module registry CRUD
   * ------------------------------------------------------------ */

  async getModules() {
    const query = `
      SELECT id, module_key, label, is_enabled, disabled_by, disabled_at, updated_at
      FROM module_registry
      ORDER BY module_key ASC
    `;
    const result = await db.query(query);
    return result.rows;
  }

  async getEnabledModules() {
    const query = `
      SELECT module_key
      FROM module_registry
      WHERE is_enabled = true
    `;
    const result = await db.query(query);
    return result.rows.map((row) => row.module_key);
  }

  async isModuleEnabled(moduleKey: string): Promise<boolean> {
    const query = `
      SELECT is_enabled
      FROM module_registry
      WHERE module_key = $1
    `;
    const result = await db.query(query, [moduleKey]);
    if (result.rows.length === 0) {
      return false; // Unknown module = disabled by default
    }
    return result.rows[0].is_enabled;
  }

  async toggleModule(moduleKey: string, enabled: boolean, userId?: string | null) {
    const existing = await db.query(
      `SELECT id FROM module_registry WHERE module_key = $1`,
      [moduleKey]
    );

    if (existing.rows.length === 0) {
      throw new NotFoundError(`Module "${moduleKey}" not found in registry`);
    }

    const now = new Date();
    const disabledBy = enabled ? null : userId ?? null;
    const disabledAt = enabled ? null : now;

    const query = `
      UPDATE module_registry
      SET is_enabled = $1,
          disabled_by = $2,
          disabled_at = $3,
          updated_at = now()
      WHERE module_key = $4
      RETURNING id, module_key, label, is_enabled, disabled_by, disabled_at, updated_at
    `;
    const result = await db.query(query, [enabled, disabledBy, disabledAt, moduleKey]);
    return result.rows[0];
  }

  async seedModuleRegistry(modules: { module_key: string; label: string }[]) {
    const client = await db.getClient();
    try {
      await client.query('BEGIN');
      for (const m of modules) {
        await client.query(`
          INSERT INTO module_registry (module_key, label, is_enabled, updated_at)
          VALUES ($1, $2, true, now())
          ON CONFLICT (module_key) DO UPDATE SET
            label = EXCLUDED.label;
        `, [m.module_key, m.label]);
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

export const modulesService = new ModulesService();
