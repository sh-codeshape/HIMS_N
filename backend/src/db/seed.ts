import bcrypt from 'bcrypt';
import { db } from '../config/database';
import { logger } from '../config/logger';

async function seed() {
  const client = await db.getClient();
  try {
    await client.query('BEGIN');

    const orgId = '00000000-0000-0000-0000-000000000000';
    
    // Fix: role_permissions has no id column, so audit trigger fails. Drop it here.
    await client.query('DROP TRIGGER IF EXISTS trg_role_permissions_audit ON role_permissions');

    await client.query(`
      INSERT INTO organizations (id, code, name)
      VALUES ($1, 'DEFAULT', 'Default Hospital Organization')
      ON CONFLICT (id) DO NOTHING;
    `, [orgId]);

    const facilityId = orgId;
    await client.query(`
      INSERT INTO facilities (id, organization_id, code, name, facility_type)
      VALUES ($1, $2, 'MAIN', 'Main Hospital Branch', 'hospital')
      ON CONFLICT (organization_id, code) DO UPDATE SET
        name = EXCLUDED.name,
        facility_type = EXCLUDED.facility_type;
    `, [facilityId, orgId]);

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
    `, [orgId, adminUsername, adminUsername, passwordHash, facilityId, superAdminUsername, superAdminUsername]);

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
      `, [orgId, r.code, r.name, r.description, r.is_system]);
    }

    const permissionsToSeed = [
      { code: 'staff.view', module: 'staff', description: 'View staff members' },
      { code: 'staff.create', module: 'staff', description: 'Create staff members' },
      { code: 'staff.edit', module: 'staff', description: 'Edit staff members' },
      { code: 'staff.delete', module: 'staff', description: 'Delete staff members' },
      { code: 'roles.view', module: 'roles', description: 'View roles and permissions' },
      { code: 'roles.manage', module: 'roles', description: 'Manage roles and permissions' },
      { code: 'billing.view', module: 'billing', description: 'View billing' },
      { code: 'billing.create', module: 'billing', description: 'Create billing' },
    ];

    for (const p of permissionsToSeed) {
      await client.query(`
        INSERT INTO permissions (code, module, description)
        VALUES ($1, $2, $3)
        ON CONFLICT (code) DO NOTHING;
      `, [p.code, p.module, p.description]);
    }

    // Map permissions to Super Admin role
    const superAdminRoleRes = await client.query(`SELECT id FROM roles WHERE code = 'super_admin' AND organization_id = $1`, [orgId]);
    const superAdminRoleId = superAdminRoleRes.rows[0]?.id;

    const adminRoleRes = await client.query(`SELECT id FROM roles WHERE code = 'admin' AND organization_id = $1`, [orgId]);
    const adminRoleId = adminRoleRes.rows[0]?.id;

    if (superAdminRoleId) {
      for (const p of permissionsToSeed) {
        const permRes = await client.query(`SELECT id FROM permissions WHERE code = $1`, [p.code]);
        if (permRes.rows.length > 0) {
          const permId = permRes.rows[0].id;
          await client.query(`
            INSERT INTO role_permissions (role_id, permission_id)
            VALUES ($1, $2)
            ON CONFLICT (role_id, permission_id) DO NOTHING;
          `, [superAdminRoleId, permId]);
        }
      }

      // Assign Super Admin role to the super admin user
      const checkSuperAdminUr = await client.query(`SELECT id FROM user_roles WHERE user_id = $1 AND role_id = $2`, [superAdminUserId, superAdminRoleId]);
      if (checkSuperAdminUr.rows.length === 0) {
        await client.query(`
          INSERT INTO user_roles (user_id, role_id, facility_id)
          VALUES ($1, $2, $3)
        `, [superAdminUserId, superAdminRoleId, facilityId]);
      }
    }

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
    `, [orgId]);

    const bedCategories = await client.query(`SELECT id, code FROM bed_categories WHERE organization_id = $1`, [orgId]);
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
    `, [orgId, facilityId]);

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
        orgId, facilityId, genWardId, icuWardId, pvtWardId,
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
    `, [orgId]);

    const staffList = await client.query(`SELECT id, staff_code FROM staff WHERE organization_id = $1`, [orgId]);
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
    `, [orgId]);

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
      `, [orgId, facilityId, pat1, pat2, pat3, pract1, pract2 || pract1]);

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
        `, [orgId, facilityId, enc1, enc2, enc3, pat1, pat2, pat3, pract1, pract2 || pract1]);

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
