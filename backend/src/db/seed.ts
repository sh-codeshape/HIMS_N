import bcrypt from 'bcrypt';
import { db } from '../config/database';
import { logger } from '../config/logger';

async function seed() {
  const client = await db.getClient();
  try {
    await client.query('BEGIN');

    const orgId = '00000000-0000-0000-0000-000000000000';
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

    const adminUsername = 'admin@kgnandahospital.com';
    const password = 'password123';
    const passwordHash = await bcrypt.hash(password, 10);

    await client.query(`
      INSERT INTO users (
        organization_id,
        username,
        email,
        password_hash,
        full_name,
        is_active,
        is_superadmin,
        default_facility_id,
        phone
      ) VALUES ($1, $2, $3, $4, $5, true, true, $6, '+91-0000000000')
      ON CONFLICT (organization_id, username) DO UPDATE SET
        email = EXCLUDED.email,
        password_hash = EXCLUDED.password_hash,
        full_name = EXCLUDED.full_name,
        is_active = EXCLUDED.is_active,
        is_superadmin = EXCLUDED.is_superadmin,
        default_facility_id = EXCLUDED.default_facility_id,
        phone = EXCLUDED.phone;
    `, [orgId, adminUsername, adminUsername, passwordHash, 'HIMS Administrator', facilityId]);

    // ---------------------------------------------------------
    // BED CATEGORIES
    // ---------------------------------------------------------
    await client.query(`
      INSERT INTO bed_categories (organization_id, code, name, rank, is_icu)
      VALUES 
        ($1, 'GEN', 'General Category', 1, false),
        ($1, 'ICU', 'ICU Category', 2, true)
      ON CONFLICT (organization_id, code) DO NOTHING;
    `, [orgId]);

    const bedCategories = await client.query(`SELECT id, code FROM bed_categories WHERE organization_id = $1`, [orgId]);
    const genCatId = bedCategories.rows.find(r => r.code === 'GEN')?.id;
    const icuCatId = bedCategories.rows.find(r => r.code === 'ICU')?.id;

    // ---------------------------------------------------------
    // WARDS
    // ---------------------------------------------------------
    await client.query(`
      INSERT INTO wards (organization_id, facility_id, code, name, ward_type)
      VALUES 
        ($1, $2, 'W-GEN', 'General Ward', 'general'),
        ($1, $2, 'W-ICU', 'ICU Ward', 'icu')
      ON CONFLICT (facility_id, code) DO NOTHING;
    `, [orgId, facilityId]);

    const wards = await client.query(`SELECT id, code FROM wards WHERE facility_id = $1`, [facilityId]);
    const genWardId = wards.rows.find(r => r.code === 'W-GEN')?.id;
    const icuWardId = wards.rows.find(r => r.code === 'W-ICU')?.id;

    // ---------------------------------------------------------
    // ROOMS
    // ---------------------------------------------------------
    if (genWardId && icuWardId) {
      await client.query(`
        INSERT INTO rooms (ward_id, room_no, room_type)
        VALUES 
          ($1, '101', 'General'),
          ($1, '102', 'General'),
          ($2, '201', 'ICU'),
          ($2, '202', 'ICU')
        ON CONFLICT (ward_id, room_no) DO NOTHING;
      `, [genWardId, icuWardId]);

      const rooms = await client.query(`SELECT id, room_no, ward_id FROM rooms WHERE ward_id IN ($1, $2)`, [genWardId, icuWardId]);
      const room101Id = rooms.rows.find(r => r.room_no === '101')?.id;
      const room102Id = rooms.rows.find(r => r.room_no === '102')?.id;
      const room201Id = rooms.rows.find(r => r.room_no === '201')?.id;
      const room202Id = rooms.rows.find(r => r.room_no === '202')?.id;

      // ---------------------------------------------------------
      // BEDS
      // ---------------------------------------------------------
      await client.query(`
        INSERT INTO beds (organization_id, facility_id, ward_id, room_id, bed_category_id, bed_no, status)
        VALUES 
          ($1, $2, $3, $5, $7, 'B101-1', 'available'),
          ($1, $2, $3, $5, $7, 'B101-2', 'occupied'),
          ($1, $2, $3, $6, $7, 'B102-1', 'available'),
          ($1, $2, $3, $6, $7, 'B102-2', 'maintenance'),
          ($1, $2, $4, $8, $9, 'ICU-1', 'available'),
          ($1, $2, $4, $8, $9, 'ICU-2', 'occupied'),
          ($1, $2, $4, $10, $9, 'ICU-3', 'available')
        ON CONFLICT (ward_id, bed_no) DO NOTHING;
      `, [
        orgId, facilityId, genWardId, icuWardId, 
        room101Id, room102Id, genCatId, room201Id, icuCatId, room202Id
      ]);
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

    await client.query('COMMIT');
    logger.info('Database seeded successfully with default organization, facility, and admin credentials.');
    logger.info({ username: adminUsername, password }, 'Default admin login');
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
