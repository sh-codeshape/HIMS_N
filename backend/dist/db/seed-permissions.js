"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const database_1 = require("../config/database");
const logger_1 = require("../config/logger");
async function seedPermissions() {
    const client = await database_1.db.getClient();
    try {
        await client.query('BEGIN');
        // Use the existing DEFAULT org
        const orgRes = await client.query(`SELECT id FROM organizations WHERE code = 'DEFAULT' LIMIT 1`);
        if (orgRes.rows.length === 0) {
            throw new Error('No organization with code DEFAULT found. Run db:seed first on a fresh DB.');
        }
        const orgId = orgRes.rows[0].id;
        // Use the existing MAIN facility
        const facRes = await client.query(`SELECT id FROM facilities WHERE organization_id = $1 AND code = 'MAIN' LIMIT 1`, [orgId]);
        const facilityId = facRes.rows.length > 0 ? facRes.rows[0].id : null;
        const permissionsToSeed = [
            // ---- Roles & Users ----
            { code: 'roles.view', module: 'roles', description: 'View roles and permissions' },
            { code: 'roles.manage', module: 'roles', description: 'Create/edit roles and manage role permissions' },
            { code: 'users.view', module: 'users', description: 'View users and their assigned roles' },
            { code: 'users.manage', module: 'users', description: 'Assign roles and direct permissions to users' },
            // ---- Staff ----
            { code: 'staff.view', module: 'staff', description: 'View staff members' },
            { code: 'staff.create', module: 'staff', description: 'Create staff members' },
            { code: 'staff.edit', module: 'staff', description: 'Edit staff members' },
            { code: 'staff.delete', module: 'staff', description: 'Delete staff members' },
            // ---- Registration / OPD ----
            { code: 'registration.view', module: 'registration', description: 'View patient registrations' },
            { code: 'registration.create', module: 'registration', description: 'Register new patients' },
            { code: 'opd.view', module: 'opd', description: 'View OPD records' },
            { code: 'opd.create', module: 'opd', description: 'Create OPD encounters' },
            // ---- IPD / Ward ----
            { code: 'ipd.view', module: 'ipd', description: 'View IPD admissions' },
            { code: 'ipd.create', module: 'ipd', description: 'Admit patients to IPD' },
            { code: 'ward.view', module: 'ward', description: 'View ward and bed status' },
            { code: 'bed.manage', module: 'ward', description: 'Allot and transfer beds' },
            // ---- Billing ----
            { code: 'billing.view', module: 'billing', description: 'View billing' },
            { code: 'billing.create', module: 'billing', description: 'Create billing invoices' },
            { code: 'billing.edit', module: 'billing', description: 'Edit billing invoices' },
            { code: 'billing.refund', module: 'billing', description: 'Process refunds and discounts' },
            // ---- Pharmacy ----
            { code: 'pharmacy.view', module: 'pharmacy', description: 'View pharmacy records' },
            { code: 'pharmacy.pos', module: 'pharmacy', description: 'Run medicine sales POS' },
            { code: 'pharmacy.purchase', module: 'pharmacy', description: 'Manage purchase orders' },
            { code: 'pharmacy.stock', module: 'pharmacy', description: 'Manage pharmacy stock' },
            // ---- Laboratory ----
            { code: 'laboratory.view', module: 'laboratory', description: 'View laboratory orders' },
            { code: 'laboratory.order', module: 'laboratory', description: 'Create lab test orders' },
            { code: 'laboratory.report', module: 'laboratory', description: 'Enter lab reports' },
            // ---- Radiology ----
            { code: 'radiology.view', module: 'radiology', description: 'View radiology records' },
            { code: 'radiology.schedule', module: 'radiology', description: 'Schedule imaging' },
            { code: 'radiology.report', module: 'radiology', description: 'Enter scan reports' },
            // ---- Inventory ----
            { code: 'inventory.view', module: 'inventory', description: 'View inventory' },
            { code: 'inventory.manage', module: 'inventory', description: 'Manage inventory items and stock' },
            // ---- Patients / EMR ----
            { code: 'patients.view', module: 'patients', description: 'View patient directory' },
            { code: 'patients.emr', module: 'patients', description: 'View patient EMR / medical history' },
            // ---- Emergency ----
            { code: 'emergency.view', module: 'emergency', description: 'View emergency dispatches' },
            { code: 'emergency.create', module: 'emergency', description: 'Create emergency / trauma cases' },
            // ---- Reports ----
            { code: 'reports.view', module: 'reports', description: 'View reports' },
        ];
        // Insert permissions (idempotent)
        for (const p of permissionsToSeed) {
            await client.query(`
        INSERT INTO permissions (code, module, description)
        VALUES ($1, $2, $3)
        ON CONFLICT (code) DO NOTHING;
      `, [p.code, p.module, p.description]);
        }
        // Load all permissions into a map
        const allPerms = await client.query(`SELECT id, code FROM permissions`);
        const permByCode = new Map(allPerms.rows.map((r) => [r.code, r.id]));
        const assignPermsToRole = async (roleCode, permissionCodes) => {
            const roleRes = await client.query(`SELECT id FROM roles WHERE code = $1 AND organization_id = $2`, [roleCode, orgId]);
            const roleId = roleRes.rows[0]?.id;
            if (!roleId) {
                logger_1.logger.warn({ roleCode }, 'Role not found, skipping permission assignment');
                return;
            }
            for (const code of permissionCodes) {
                const permId = permByCode.get(code);
                if (!permId)
                    continue;
                await client.query(`
          INSERT INTO role_permissions (role_id, permission_id)
          VALUES ($1, $2)
          ON CONFLICT (role_id, permission_id) DO NOTHING;
        `, [roleId, permId]);
            }
        };
        const allCodes = permissionsToSeed.map((p) => p.code);
        // Super admin = everything
        await assignPermsToRole('super_admin', allCodes);
        // Admin = everything except roles.manage and users.manage
        const adminCodes = allCodes.filter((c) => c !== 'roles.manage' && c !== 'users.manage');
        await assignPermsToRole('admin', adminCodes);
        // Doctor
        await assignPermsToRole('doctor', [
            'opd.view', 'opd.create',
            'ipd.view',
            'ward.view',
            'patients.view', 'patients.emr',
            'laboratory.view', 'laboratory.order', 'laboratory.report',
            'radiology.view', 'radiology.report',
            'emergency.view', 'emergency.create',
        ]);
        // Reception
        await assignPermsToRole('reception', [
            'registration.view', 'registration.create',
            'opd.view', 'opd.create',
            'billing.view', 'billing.create',
            'patients.view',
            'emergency.view',
        ]);
        // Pharmacy
        await assignPermsToRole('pharmacy', [
            'pharmacy.view', 'pharmacy.pos', 'pharmacy.purchase', 'pharmacy.stock',
            'inventory.view',
        ]);
        // Assign roles to existing users
        const adminUserRes = await client.query(`SELECT id FROM users WHERE username = 'admin@narayanhospital.com' LIMIT 1`);
        const superAdminUserRes = await client.query(`SELECT id FROM users WHERE username = 'superadmin@narayanhospital.com' LIMIT 1`);
        const adminRoleRes = await client.query(`SELECT id FROM roles WHERE code = 'admin' AND organization_id = $1`, [orgId]);
        const superAdminRoleRes = await client.query(`SELECT id FROM roles WHERE code = 'super_admin' AND organization_id = $1`, [orgId]);
        if (adminUserRes.rows.length > 0 && adminRoleRes.rows.length > 0 && facilityId) {
            await client.query(`
        INSERT INTO user_roles (user_id, role_id, facility_id)
        VALUES ($1, $2, $3)
        ON CONFLICT (user_id, role_id, COALESCE(facility_id, '00000000-0000-0000-0000-000000000000'::uuid)) DO NOTHING;
      `, [adminUserRes.rows[0].id, adminRoleRes.rows[0].id, facilityId]);
        }
        if (superAdminUserRes.rows.length > 0 && superAdminRoleRes.rows.length > 0 && facilityId) {
            await client.query(`
        INSERT INTO user_roles (user_id, role_id, facility_id)
        VALUES ($1, $2, $3)
        ON CONFLICT (user_id, role_id, COALESCE(facility_id, '00000000-0000-0000-0000-000000000000'::uuid)) DO NOTHING;
      `, [superAdminUserRes.rows[0].id, superAdminRoleRes.rows[0].id, facilityId]);
        }
        await client.query('COMMIT');
        logger_1.logger.info('Permissions and role-permission mappings seeded successfully.');
        logger_1.logger.info({ orgId, facilityId, permissionCount: permissionsToSeed.length }, 'Seed summary');
    }
    catch (error) {
        await client.query('ROLLBACK');
        logger_1.logger.error({ err: error }, 'Failed to seed permissions');
        process.exit(1);
    }
    finally {
        client.release();
        process.exit(0);
    }
}
seedPermissions();
