"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.modulesService = exports.ModulesService = void 0;
const database_1 = require("../../config/database");
const AppError_1 = require("../../shared/errors/AppError");
class ModulesService {
    /* ------------------------------------------------------------
     * Module registry CRUD
     * ------------------------------------------------------------ */
    async getModules() {
        const query = `
      SELECT id, module_key, label, is_enabled, disabled_by, disabled_at, updated_at
      FROM module_registry
      ORDER BY module_key ASC
    `;
        const result = await database_1.db.query(query);
        return result.rows;
    }
    async getEnabledModules() {
        const query = `
      SELECT module_key
      FROM module_registry
      WHERE is_enabled = true
    `;
        const result = await database_1.db.query(query);
        return result.rows.map((row) => row.module_key);
    }
    async isModuleEnabled(moduleKey) {
        const query = `
      SELECT is_enabled
      FROM module_registry
      WHERE module_key = $1
    `;
        const result = await database_1.db.query(query, [moduleKey]);
        if (result.rows.length === 0) {
            return false; // Unknown module = disabled by default
        }
        return result.rows[0].is_enabled;
    }
    async toggleModule(moduleKey, enabled, userId) {
        const existing = await database_1.db.query(`SELECT id FROM module_registry WHERE module_key = $1`, [moduleKey]);
        if (existing.rows.length === 0) {
            throw new AppError_1.NotFoundError(`Module "${moduleKey}" not found in registry`);
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
        const result = await database_1.db.query(query, [enabled, disabledBy, disabledAt, moduleKey]);
        return result.rows[0];
    }
    async seedModuleRegistry(modules) {
        const client = await database_1.db.getClient();
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
        }
        catch (error) {
            await client.query('ROLLBACK');
            throw error;
        }
        finally {
            client.release();
        }
    }
}
exports.ModulesService = ModulesService;
exports.modulesService = new ModulesService();
