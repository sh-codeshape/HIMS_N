import bcrypt from 'bcrypt';
import { randomUUID } from 'crypto';
import { db } from '../config/database';
import { logger } from '../config/logger';

async function seed() {
  const client = await db.getClient();
  try {
    await client.query('BEGIN');

    const orgId = randomUUID();
    let facilityId = randomUUID();

    // Fix: role_permissions has no id column, so audit trigger fails. Drop it here.
    await client.query('DROP TRIGGER IF EXISTS trg_role_permissions_audit ON role_permissions');

    // Idempotent: reuse existing org if one with code 'DEFAULT' already exists
    let organizationId = orgId;
    const existingOrg = await client.query(`SELECT id FROM organizations WHERE code = 'DEFAULT' LIMIT 1`);
    if (existingOrg.rows.length > 0) {
      organizationId = existingOrg.rows[0].id;
    } else {
      await client.query(`
        INSERT INTO organizations (id, code, name)
        VALUES ($1, 'DEFAULT', 'Default Hospital Organization');
      `, [organizationId]);
    }

    await client.query(`
      INSERT INTO facilities (id, organization_id, code, name, facility_type)
      VALUES ($1, $2, 'MAIN', 'Main Hospital Branch', 'hospital')
      ON CONFLICT (organization_id, code) DO UPDATE SET
        name = EXCLUDED.name,
        facility_type = EXCLUDED.facility_type;
    `, [facilityId, organizationId]);

    // Idempotent: reuse existing facility id so downstream inserts (user_roles, beds) reference a real facility
    const existingFacility = await client.query(`SELECT id FROM facilities WHERE organization_id = $1 AND code = 'MAIN' LIMIT 1`, [organizationId]);
    if (existingFacility.rows.length > 0) {
      facilityId = existingFacility.rows[0].id;
    }

    const defaultSequenceRows = [
      { seq_key: 'ENCOUNTER', prefix: 'OPD-', suffix: '', include_year: true, padding: 4, reset_policy: 'yearly' },
      { seq_key: 'ADMISSION', prefix: 'ADM-', suffix: '', include_year: true, padding: 4, reset_policy: 'yearly' },
      { seq_key: 'INVOICE', prefix: 'INV-', suffix: '', include_year: true, padding: 4, reset_policy: 'yearly' },
      { seq_key: 'RECEIPT', prefix: 'REC-', suffix: '', include_year: true, padding: 4, reset_policy: 'yearly' },
    ];

    for (const row of defaultSequenceRows) {
      await client.query(`
        INSERT INTO number_sequences (
          organization_id,
          facility_id,
          seq_key,
          prefix,
          suffix,
          include_year,
          padding,
          current_value,
          reset_policy,
          last_reset_on
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, 0, $8, CURRENT_DATE)
        ON CONFLICT (organization_id, COALESCE(facility_id, '00000000-0000-0000-0000-000000000000'::uuid), seq_key)
        DO NOTHING;
      `, [organizationId, facilityId, row.seq_key, row.prefix, row.suffix, row.include_year, row.padding, row.reset_policy]);
    }

    const adminUsername = 'admin@narayanhospital.com';
    const superAdminUsername = 'superadmin@narayanhospital.com';
    const password = 'password123';
    const passwordHash = await bcrypt.hash(password, 10);

    await client.query(`
      INSERT INTO users (
        organization_id, username, email, password_hash, full_name, is_active, is_superadmin, default_facility_id, phone
      ) VALUES 
        ($1, $2, $3, $4, 'HIMS Administrator', true, false, $5, '+91-0000000000'),
        ($1, $6, $7, $4, 'Super Administrator', true, true, $5, '+91-0000000001')
      ON CONFLICT (organization_id, username) DO UPDATE SET
        email = EXCLUDED.email,
        password_hash = EXCLUDED.password_hash,
        full_name = EXCLUDED.full_name,
        is_active = EXCLUDED.is_active,
        is_superadmin = EXCLUDED.is_superadmin,
        default_facility_id = EXCLUDED.default_facility_id,
        phone = EXCLUDED.phone;
    `, [organizationId, adminUsername, adminUsername, passwordHash, facilityId, superAdminUsername, superAdminUsername]);

    const adminUserResult = await client.query(`SELECT id FROM users WHERE username = $1`, [adminUsername]);
    const adminUserId = adminUserResult.rows[0].id;

    const superAdminUserResult = await client.query(`SELECT id FROM users WHERE username = $1`, [superAdminUsername]);
    const superAdminUserId = superAdminUserResult.rows[0].id;

    // ---------------------------------------------------------
    // ROLES AND PERMISSIONS
    // ---------------------------------------------------------
    const rolesToSeed = [
      { code: 'super_admin', name: 'Super Admin', description: 'Full System Access', is_system: true },
      { code: 'admin', name: 'Admin', description: 'Hospital Admin & Masters', is_system: true },
      { code: 'doctor', name: 'Doctor', description: 'OPD, IPD & EMR', is_system: true },
      { code: 'reception', name: 'Reception', description: 'Patient Intake & Billing', is_system: true },
      { code: 'pharmacy', name: 'Pharmacy', description: 'POS & Drug Inventory', is_system: true },
    ];

    for (const r of rolesToSeed) {
      await client.query(`
        INSERT INTO roles (organization_id, code, name, description, is_system)
        VALUES ($1, $2, $3, $4, $5)
        ON CONFLICT (organization_id, code) DO NOTHING;
      `, [organizationId, r.code, r.name, r.description, r.is_system]);
    }

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

    for (const p of permissionsToSeed) {
      await client.query(`
        INSERT INTO permissions (code, module, description)
        VALUES ($1, $2, $3)
        ON CONFLICT (code) DO NOTHING;
      `, [p.code, p.module, p.description]);
    }

    // Load all permissions into a map: code -> id
    const allPerms = await client.query(`SELECT id, code FROM permissions`);
    const permByCode = new Map(allPerms.rows.map((r) => [r.code, r.id]));

    const assignPermsToRole = async (roleCode: string, permissionCodes: string[]) => {
      const roleRes = await client.query(`SELECT id FROM roles WHERE code = $1 AND organization_id = $2`, [roleCode, organizationId]);
      const roleId = roleRes.rows[0]?.id;
      if (!roleId) return;
      for (const code of permissionCodes) {
        const permId = permByCode.get(code);
        if (!permId) continue;
        await client.query(`
          INSERT INTO role_permissions (role_id, permission_id)
          VALUES ($1, $2)
          ON CONFLICT (role_id, permission_id) DO NOTHING;
        `, [roleId, permId]);
      }
    };

    // Default permission sets per role (super admin = everything except developer tooling;
    // the standalone developer role is seeded directly via seed-developer.ts)
    const allCodes = permissionsToSeed.map((p) => p.code).filter((c) => !c.startsWith('developer.'));
    await assignPermsToRole('super_admin', allCodes);

    // Clean up any developer tooling that may already be linked to the super admin role
    const superAdminRoleLookup = await client.query(`SELECT id FROM roles WHERE code = 'super_admin' AND organization_id = $1`, [organizationId]);
    const superAdminRoleIdForCleanup = superAdminRoleLookup.rows[0]?.id;
    if (superAdminRoleIdForCleanup) {
      await client.query(
        `DELETE FROM role_permissions
         WHERE role_id = $1
           AND permission_id IN (SELECT id FROM permissions WHERE code LIKE 'developer.%')`,
        [superAdminRoleIdForCleanup]
      );
    }

    const adminCodes = allCodes.filter((c) => c !== 'roles.manage' && c !== 'users.manage');
    await assignPermsToRole('admin', adminCodes);

    await assignPermsToRole('doctor', [
      'opd.view', 'opd.create',
      'ipd.view',
      'ward.view',
      'patients.view', 'patients.emr',
      'laboratory.view', 'laboratory.order', 'laboratory.report',
      'radiology.view', 'radiology.report',
      'emergency.view', 'emergency.create',
    ]);

    await assignPermsToRole('reception', [
      'registration.view', 'registration.create',
      'opd.view', 'opd.create',
      'billing.view', 'billing.create',
      'patients.view',
      'emergency.view',
    ]);

    await assignPermsToRole('pharmacy', [
      'pharmacy.view', 'pharmacy.pos', 'pharmacy.purchase', 'pharmacy.stock',
      'inventory.view',
    ]);

    // Assign Super Admin role to the super admin user
    const superAdminRoleRes = await client.query(`SELECT id FROM roles WHERE code = 'super_admin' AND organization_id = $1`, [organizationId]);
    const superAdminRoleId = superAdminRoleRes.rows[0]?.id;
    if (superAdminRoleId) {
      const checkSuperAdminUr = await client.query(`SELECT id FROM user_roles WHERE user_id = $1 AND role_id = $2`, [superAdminUserId, superAdminRoleId]);
      if (checkSuperAdminUr.rows.length === 0) {
        await client.query(`
          INSERT INTO user_roles (user_id, role_id, facility_id)
          VALUES ($1, $2, $3)
        `, [superAdminUserId, superAdminRoleId, facilityId]);
      }
    }

    const adminRoleRes = await client.query(`SELECT id FROM roles WHERE code = 'admin' AND organization_id = $1`, [organizationId]);
    const adminRoleId = adminRoleRes.rows[0]?.id;
    if (adminRoleId) {
      // Assign Admin role to the admin user
      const checkAdminUr = await client.query(`SELECT id FROM user_roles WHERE user_id = $1 AND role_id = $2`, [adminUserId, adminRoleId]);
      if (checkAdminUr.rows.length === 0) {
        await client.query(`
          INSERT INTO user_roles (user_id, role_id, facility_id)
          VALUES ($1, $2, $3)
        `, [adminUserId, adminRoleId, facilityId]);
      }
    }

    // ---------------------------------------------------------
    // BED CATEGORIES
    // ---------------------------------------------------------
    await client.query(`
      INSERT INTO bed_categories (organization_id, code, name, rank, is_icu)
      VALUES 
        ($1, 'GEN', 'General Category', 1, false),
        ($1, 'ICU', 'ICU Category', 2, true),
        ($1, 'PVT', 'Private Category', 3, false)
      ON CONFLICT (organization_id, code) DO NOTHING;
    `, [organizationId]);

    const bedCategories = await client.query(`SELECT id, code FROM bed_categories WHERE organization_id = $1`, [organizationId]);
    const genCatId = bedCategories.rows.find(r => r.code === 'GEN')?.id;
    const icuCatId = bedCategories.rows.find(r => r.code === 'ICU')?.id;
    const pvtCatId = bedCategories.rows.find(r => r.code === 'PVT')?.id;

    // ---------------------------------------------------------
    // WARDS
    // ---------------------------------------------------------
    await client.query(`
      INSERT INTO wards (organization_id, facility_id, code, name, ward_type)
      VALUES 
        ($1, $2, 'W-GEN', 'General Ward', 'general'),
        ($1, $2, 'W-ICU', 'ICU Ward', 'icu'),
        ($1, $2, 'W-PVT', 'Private Ward', 'general')
      ON CONFLICT (facility_id, code) DO NOTHING;
    `, [organizationId, facilityId]);

    const wards = await client.query(`SELECT id, code FROM wards WHERE facility_id = $1`, [facilityId]);
    const genWardId = wards.rows.find(r => r.code === 'W-GEN')?.id;
    const icuWardId = wards.rows.find(r => r.code === 'W-ICU')?.id;
    const pvtWardId = wards.rows.find(r => r.code === 'W-PVT')?.id;

    // ---------------------------------------------------------
    // ROOMS
    // ---------------------------------------------------------
    if (genWardId && icuWardId && pvtWardId) {
      await client.query(`
        INSERT INTO rooms (ward_id, room_no, room_type)
        VALUES 
          ($1, '101', 'General'),
          ($1, '102', 'General'),
          ($2, '201', 'ICU'),
          ($2, '202', 'ICU'),
          ($3, '301', 'Private')
        ON CONFLICT (ward_id, room_no) DO NOTHING;
      `, [genWardId, icuWardId, pvtWardId]);

      const rooms = await client.query(`SELECT id, room_no, ward_id FROM rooms WHERE ward_id IN ($1, $2, $3)`, [genWardId, icuWardId, pvtWardId]);
      const room101Id = rooms.rows.find(r => r.room_no === '101')?.id;
      const room102Id = rooms.rows.find(r => r.room_no === '102')?.id;
      const room201Id = rooms.rows.find(r => r.room_no === '201')?.id;
      const room202Id = rooms.rows.find(r => r.room_no === '202')?.id;
      const room301Id = rooms.rows.find(r => r.room_no === '301')?.id;

      // ---------------------------------------------------------
      // BEDS
      // ---------------------------------------------------------
      await client.query(`
        INSERT INTO beds (organization_id, facility_id, ward_id, room_id, bed_category_id, bed_no, status)
        VALUES 
          ($1, $2, $3, $6, $9, 'B101-1', 'available'),
          ($1, $2, $3, $6, $9, 'B101-2', 'occupied'),
          ($1, $2, $3, $7, $9, 'B102-1', 'available'),
          ($1, $2, $3, $7, $9, 'B102-2', 'maintenance'),
          ($1, $2, $4, $8, $10, 'ICU-1', 'available'),
          ($1, $2, $4, $8, $10, 'ICU-2', 'occupied'),
          ($1, $2, $4, $8, $10, 'ICU-3', 'available'),
          ($1, $2, $5, $11, $12, 'PVT-1', 'available'),
          ($1, $2, $5, $11, $12, 'PVT-2', 'occupied')
        ON CONFLICT (ward_id, bed_no) DO NOTHING;
      `, [
        organizationId, facilityId, genWardId, icuWardId, pvtWardId,
        room101Id, room102Id, room201Id, icuCatId, pvtCatId, room301Id, pvtCatId
      ]);
      // Fixed the index above:
      // B101-1, B101-2 -> room101Id ($6), genCatId ($9)
      // B102-1, B102-2 -> room102Id ($7), genCatId ($9)
      // ICU-1, ICU-2, ICU-3 -> room201Id ($8), icuCatId ($10)
      // PVT-1, PVT-2 -> room301Id ($11), pvtCatId ($12)
    }

    // ---------------------------------------------------------
    // STAFF & PRACTITIONERS
    // ---------------------------------------------------------
    await client.query(`
      INSERT INTO staff (organization_id, staff_code, first_name, last_name, staff_type, email, phone)
      VALUES 
        ($1, 'DOC-001', 'John', 'Doe', 'doctor', 'john.doe@hospital.com', '9998887771'),
        ($1, 'DOC-002', 'Jane', 'Smith', 'doctor', 'jane.smith@hospital.com', '9998887772'),
        ($1, 'DOC-003', 'Alice', 'Williams', 'doctor', 'alice.w@hospital.com', '9998887773'),
        ($1, 'NUR-001', 'Bob', 'Brown', 'nurse', 'bob.b@hospital.com', '9998887774')
      ON CONFLICT (organization_id, staff_code) DO NOTHING;
    `, [organizationId]);

    const staffList = await client.query(`SELECT id, staff_code FROM staff WHERE organization_id = $1`, [organizationId]);
    const doc1Id = staffList.rows.find(r => r.staff_code === 'DOC-001')?.id;
    const doc2Id = staffList.rows.find(r => r.staff_code === 'DOC-002')?.id;
    const doc3Id = staffList.rows.find(r => r.staff_code === 'DOC-003')?.id;

    if (doc1Id) {
      await client.query(`
        INSERT INTO practitioners (staff_id, registration_no, qualifications, experience_years, bio)
        VALUES ($1, 'REG-111', 'MBBS, MD Cardiology', 10, 'Expert in Cardiology')
        ON CONFLICT (staff_id) DO NOTHING;
      `, [doc1Id]);
    }
    if (doc2Id) {
      await client.query(`
        INSERT INTO practitioners (staff_id, registration_no, qualifications, experience_years, bio)
        VALUES ($1, 'REG-222', 'MBBS, MD General Medicine', 8, 'Experienced General Physician')
        ON CONFLICT (staff_id) DO NOTHING;
      `, [doc2Id]);
    }
    if (doc3Id) {
      await client.query(`
        INSERT INTO practitioners (staff_id, registration_no, qualifications, experience_years, bio)
        VALUES ($1, 'REG-333', 'MBBS, MD Pediatrics', 5, 'Specialist in child care')
        ON CONFLICT (staff_id) DO NOTHING;
      `, [doc3Id]);
    }

    // ---------------------------------------------------------
    // DUMMY PATIENTS & ADMISSIONS FOR OCCUPIED BEDS
    // ---------------------------------------------------------
    // Get practitioners again
    const practitionersRes = await client.query(`SELECT id FROM practitioners LIMIT 2`);
    const pract1 = practitionersRes.rows[0]?.id;
    const pract2 = practitionersRes.rows[1]?.id;

    // We have 3 occupied beds: B101-2, ICU-2, PVT-2
    // Let's create 3 patients
    await client.query(`
      INSERT INTO patients (organization_id, uhid, first_name, last_name, date_of_birth, gender, phone)
      VALUES 
        ($1, 'UHID-SEED-01', 'Test', 'Patient 1', '1980-01-01', 'male', '1111111111'),
        ($1, 'UHID-SEED-02', 'Test', 'Patient 2', '1990-05-15', 'female', '2222222222'),
        ($1, 'UHID-SEED-03', 'Test', 'Patient 3', '2000-10-20', 'male', '3333333333')
      ON CONFLICT (organization_id, uhid) DO NOTHING;
    `, [organizationId]);

    const patientsRes = await client.query(`SELECT id, uhid FROM patients WHERE uhid IN ('UHID-SEED-01', 'UHID-SEED-02', 'UHID-SEED-03')`);
    const pat1 = patientsRes.rows.find(r => r.uhid === 'UHID-SEED-01')?.id;
    const pat2 = patientsRes.rows.find(r => r.uhid === 'UHID-SEED-02')?.id;
    const pat3 = patientsRes.rows.find(r => r.uhid === 'UHID-SEED-03')?.id;

    if (pat1 && pat2 && pat3 && pract1) {
      // Create Encounters
      await client.query(`
        INSERT INTO encounters (organization_id, facility_id, encounter_no, patient_id, encounter_type, status, primary_practitioner_id)
        VALUES 
          ($1, $2, 'ENC-SEED-01', $3, 'ipd', 'in_progress', $6),
          ($1, $2, 'ENC-SEED-02', $4, 'ipd', 'in_progress', $7),
          ($1, $2, 'ENC-SEED-03', $5, 'ipd', 'in_progress', $6)
        ON CONFLICT (facility_id, encounter_no) DO NOTHING;
      `, [organizationId, facilityId, pat1, pat2, pat3, pract1, pract2 || pract1]);

      const encountersRes = await client.query(`SELECT id, encounter_no FROM encounters WHERE encounter_no IN ('ENC-SEED-01', 'ENC-SEED-02', 'ENC-SEED-03')`);
      const enc1 = encountersRes.rows.find(r => r.encounter_no === 'ENC-SEED-01')?.id;
      const enc2 = encountersRes.rows.find(r => r.encounter_no === 'ENC-SEED-02')?.id;
      const enc3 = encountersRes.rows.find(r => r.encounter_no === 'ENC-SEED-03')?.id;

      // Create Admissions
      if (enc1 && enc2 && enc3) {
        await client.query(`
          INSERT INTO admissions (organization_id, facility_id, encounter_id, patient_id, admission_no, admitting_practitioner_id, status)
          VALUES 
            ($1, $2, $3, $6, 'ADM-SEED-01', $9, 'admitted'),
            ($1, $2, $4, $7, 'ADM-SEED-02', $10, 'admitted'),
            ($1, $2, $5, $8, 'ADM-SEED-03', $9, 'admitted')
          ON CONFLICT (facility_id, admission_no) DO NOTHING;
        `, [organizationId, facilityId, enc1, enc2, enc3, pat1, pat2, pat3, pract1, pract2 || pract1]);

        const admissionsRes = await client.query(`SELECT id, admission_no FROM admissions WHERE admission_no IN ('ADM-SEED-01', 'ADM-SEED-02', 'ADM-SEED-03')`);
        const adm1 = admissionsRes.rows.find(r => r.admission_no === 'ADM-SEED-01')?.id;
        const adm2 = admissionsRes.rows.find(r => r.admission_no === 'ADM-SEED-02')?.id;
        const adm3 = admissionsRes.rows.find(r => r.admission_no === 'ADM-SEED-03')?.id;

        // Assign Beds (B101-2, ICU-2, PVT-2)
        const bedsRes = await client.query(`SELECT id, bed_no FROM beds WHERE bed_no IN ('B101-2', 'ICU-2', 'PVT-2')`);
        const bedGen = bedsRes.rows.find(r => r.bed_no === 'B101-2')?.id;
        const bedIcu = bedsRes.rows.find(r => r.bed_no === 'ICU-2')?.id;
        const bedPvt = bedsRes.rows.find(r => r.bed_no === 'PVT-2')?.id;

        if (adm1 && bedGen) {
          await client.query(`
            INSERT INTO bed_assignments (admission_id, bed_id, assigned_from)
            VALUES ($1, $2, now())
            ON CONFLICT DO NOTHING;
          `, [adm1, bedGen]);
        }
        if (adm2 && bedIcu) {
          await client.query(`
            INSERT INTO bed_assignments (admission_id, bed_id, assigned_from)
            VALUES ($1, $2, now())
            ON CONFLICT DO NOTHING;
          `, [adm2, bedIcu]);
        }
        if (adm3 && bedPvt) {
          await client.query(`
            INSERT INTO bed_assignments (admission_id, bed_id, assigned_from)
            VALUES ($1, $2, now())
            ON CONFLICT DO NOTHING;
          `, [adm3, bedPvt]);
        }
      }
    }

    // ---------------------------------------------------------
    // DEPARTMENTS
    // ---------------------------------------------------------
    const existingDepts = await client.query(
      'SELECT id, code FROM departments WHERE organization_id = $1',
      [organizationId]
    );
    if (existingDepts.rows.length === 0) {
      await client.query(
        `INSERT INTO departments (organization_id, facility_id, code, name, department_type, is_active)
         VALUES ($1, $2, $3, $4, $5, true)`,
        [organizationId, facilityId, 'GEN-MED', 'General Medicine', 'clinical']
      );
      await client.query(
        `INSERT INTO departments (organization_id, facility_id, code, name, department_type, is_active)
         VALUES ($1, $2, $3, $4, $5, true)`,
        [organizationId, facilityId, 'CARD', 'Cardiology', 'clinical']
      );
      await client.query(
        `INSERT INTO departments (organization_id, facility_id, code, name, department_type, is_active)
         VALUES ($1, $2, $3, $4, $5, true)`,
        [organizationId, facilityId, 'PEDS', 'Pediatrics', 'clinical']
      );
      await client.query(
        `INSERT INTO departments (organization_id, facility_id, code, name, department_type, is_active)
         VALUES ($1, $2, $3, $4, $5, true)`,
        [organizationId, facilityId, 'ORTHO', 'Orthopedics', 'clinical']
      );
      await client.query(
        `INSERT INTO departments (organization_id, facility_id, code, name, department_type, is_active)
         VALUES ($1, $2, $3, $4, $5, true)`,
        [organizationId, facilityId, 'GYN', 'Gynecology', 'clinical']
      );
    }

    const departments = await client.query(
      'SELECT id, code FROM departments WHERE organization_id = $1',
      [organizationId]
    );
    const genMedId = departments.rows.find(r => r.code === 'GEN-MED')?.id;
    const cardId = departments.rows.find(r => r.code === 'CARD')?.id;
    const pedsId = departments.rows.find(r => r.code === 'PEDS')?.id;

    // Bed categories are already declared earlier in seed.ts (genCatId, icuCatId, pvtCatId)
    // ---------------------------------------------------------
    // SERVICE CATEGORIES
    // ---------------------------------------------------------
    const existingCats = await client.query(
      'SELECT id, code FROM service_categories WHERE organization_id = $1',
      [organizationId]
    );
    if (existingCats.rows.length === 0) {
      await client.query(
        `INSERT INTO service_categories (organization_id, code, name, category_type, sort_order)
         VALUES ($1, $2, $3, $4, 1)`,
        [organizationId, 'CONSULT', 'Consultation', 'consultation']
      );
      await client.query(
        `INSERT INTO service_categories (organization_id, code, name, category_type, sort_order)
         VALUES ($1, $2, $3, $4, 2)`,
        [organizationId, 'BED', 'Bed Charges', 'bed_charge']
      );
    }
    const serviceCats = await client.query(
      'SELECT id, code FROM service_categories WHERE organization_id = $1',
      [organizationId]
    );
    const consultCatId = serviceCats.rows.find(r => r.code === 'CONSULT')?.id;
    const bedCatId = serviceCats.rows.find(r => r.code === 'BED')?.id;

    // ---------------------------------------------------------
    // TAX GROUPS (GST slabs)
    // ---------------------------------------------------------
    const existingTaxes = await client.query(
      'SELECT id, code FROM tax_groups WHERE organization_id = $1',
      [organizationId]
    );
    if (existingTaxes.rows.length === 0) {
      await client.query(
        `INSERT INTO tax_groups (organization_id, code, name, total_rate, is_exempt, is_active)
         VALUES ($1, $2, $3, 5.00, false, true)`,
        [organizationId, 'GST-5', 'GST 5%']
      );
      await client.query(
        `INSERT INTO tax_groups (organization_id, code, name, total_rate, is_exempt, is_active)
         VALUES ($1, $2, $3, 12.00, false, true)`,
        [organizationId, 'GST-12', 'GST 12%']
      );
    }
    const taxGroups = await client.query(
      'SELECT id, code FROM tax_groups WHERE organization_id = $1',
      [organizationId]
    );
    const gst5Id = taxGroups.rows.find(r => r.code === 'GST-5')?.id;
    const gst12Id = taxGroups.rows.find(r => r.code === 'GST-12')?.id;

    // ---------------------------------------------------------
    // SERVICES (Charge Master)
    // ---------------------------------------------------------
    const existingServices = await client.query(
      'SELECT id, code FROM services WHERE organization_id = $1',
      [organizationId]
    );
    if (existingServices.rows.length === 0) {
      await client.query(
        `INSERT INTO services (organization_id, category_id, department_id, tax_group_id, code, name, description, service_type, billing_unit, default_rate, is_rate_editable)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, 1500.00, true)`,
        [organizationId, bedCatId, genMedId, gst5Id, 'BED-GEN-DAY', 'General Ward Bed - Per Day', 'General ward bed charge per day', 'bed', 'per_day']
      );
      await client.query(
        `INSERT INTO services (organization_id, category_id, department_id, tax_group_id, code, name, description, service_type, billing_unit, default_rate, is_rate_editable)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, 5000.00, true)`,
        [organizationId, bedCatId, icuCatId, gst5Id, 'BED-ICU-DAY', 'ICU Bed - Per Day', 'ICU bed charge per day', 'bed', 'per_day']
      );
      await client.query(
        `INSERT INTO services (organization_id, category_id, department_id, tax_group_id, code, name, description, service_type, billing_unit, default_rate, is_rate_editable)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, 3000.00, true)`,
        [organizationId, bedCatId, pvtCatId, gst5Id, 'BED-PVT-DAY', 'Private Room - Per Day', 'Private room charge per day', 'bed', 'per_day']
      );
      await client.query(
        `INSERT INTO services (organization_id, category_id, department_id, tax_group_id, code, name, description, service_type, billing_unit, default_rate, is_rate_editable)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, 500.00, true)`,
        [organizationId, consultCatId, genMedId, gst12Id, 'CONS-GEN', 'General Physician Consultation', 'General physician consultation fee', 'consultation', 'per_visit']
      );
      await client.query(
        `INSERT INTO services (organization_id, category_id, department_id, tax_group_id, code, name, description, service_type, billing_unit, default_rate, is_rate_editable)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, 800.00, true)`,
        [organizationId, consultCatId, cardId, gst12Id, 'CONS-CARD', 'Cardiologist Consultation', 'Cardiologist consultation fee', 'consultation', 'per_visit']
      );
      await client.query(
        `INSERT INTO services (organization_id, category_id, department_id, tax_group_id, code, name, description, service_type, billing_unit, default_rate, is_rate_editable)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, 600.00, true)`,
        [organizationId, consultCatId, pedsId, gst12Id, 'CONS-PED', 'Pediatrician Consultation', 'Pediatrician consultation fee', 'consultation', 'per_visit']
      );
    }

    const services = await client.query(
      'SELECT id, code FROM services WHERE organization_id = $1',
      [organizationId]
    );
    const bedGenId = services.rows.find(r => r.code === 'BED-GEN-DAY')?.id;
    const bedIcuId = services.rows.find(r => r.code === 'BED-ICU-DAY')?.id;
    const bedPvtId = services.rows.find(r => r.code === 'BED-PVT-DAY')?.id;
    const consGenId = services.rows.find(r => r.code === 'CONS-GEN')?.id;
    const consCardId = services.rows.find(r => r.code === 'CONS-CARD')?.id;
    const consPedId = services.rows.find(r => r.code === 'CONS-PED')?.id;

    // ---------------------------------------------------------
    // TARIFF PLAN (Default)
    // ---------------------------------------------------------
    const existingPlan = await client.query(
      'SELECT id FROM tariff_plans WHERE organization_id = $1 AND is_default = true LIMIT 1',
      [organizationId]
    );
    let defaultTariffId = existingPlan.rows[0]?.id;
    if (!defaultTariffId) {
      await client.query(
        `INSERT INTO tariff_plans (organization_id, code, name, plan_type, currency, is_default, is_active)
         VALUES ($1, $2, $3, $4, $5, true, true) RETURNING id`,
        [organizationId, 'DEFAULT', 'Standard Tariff Plan', 'standard', 'INR']
      );
      defaultTariffId = (
        await client.query(
          'SELECT id FROM tariff_plans WHERE organization_id = $1 AND is_default = true LIMIT 1',
          [organizationId]
        )
      ).rows[0]?.id;
    }

    console.log('Tariff plan ID:', defaultTariffId);

    // ---------------------------------------------------------
    // TARIFF RATES
    // ---------------------------------------------------------
    if (defaultTariffId) {
      await client.query('DELETE FROM tariff_rates WHERE tariff_plan_id = $1', [defaultTariffId]);

      await client.query(
        `INSERT INTO tariff_rates (tariff_plan_id, service_id, bed_category_id, facility_id, rate, effective_from)
         VALUES ($1, $2, $3, $4, 1500.00, CURRENT_DATE)`,
        [defaultTariffId, bedGenId, genCatId, facilityId]
      );
      await client.query(
        `INSERT INTO tariff_rates (tariff_plan_id, service_id, bed_category_id, facility_id, rate, effective_from)
         VALUES ($1, $2, $3, $4, 5000.00, CURRENT_DATE)`,
        [defaultTariffId, bedIcuId, icuCatId, facilityId]
      );
      await client.query(
        `INSERT INTO tariff_rates (tariff_plan_id, service_id, bed_category_id, facility_id, rate, effective_from)
         VALUES ($1, $2, $3, $4, 3000.00, CURRENT_DATE)`,
        [defaultTariffId, bedPvtId, pvtCatId, facilityId]
      );
      await client.query(
        `INSERT INTO tariff_rates (tariff_plan_id, service_id, bed_category_id, facility_id, rate, effective_from)
         VALUES ($1, $2, NULL, $3, 500.00, CURRENT_DATE)`,
        [defaultTariffId, consGenId, facilityId]
      );
      await client.query(
        `INSERT INTO tariff_rates (tariff_plan_id, service_id, bed_category_id, facility_id, rate, effective_from)
         VALUES ($1, $2, NULL, $3, 800.00, CURRENT_DATE)`,
        [defaultTariffId, consCardId, facilityId]
      );
      await client.query(
        `INSERT INTO tariff_rates (tariff_plan_id, service_id, bed_category_id, facility_id, rate, effective_from)
         VALUES ($1, $2, NULL, $3, 600.00, CURRENT_DATE)`,
        [defaultTariffId, consPedId, facilityId]
      );
    }

    await client.query('COMMIT');
    logger.info('Database seeded successfully with default organization, facility, and admin/superadmin credentials.');
    logger.info({ admin: adminUsername, superAdmin: superAdminUsername, password }, 'Default logins');
  } catch (error) {
    await client.query('ROLLBACK');
    logger.error({ err: error }, 'Failed to seed database');
    process.exit(1);
  } finally {
    client.release();
    process.exit(0);
  }
}

seed();
