"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.seedFloorMapData = seedFloorMapData;
const database_1 = require("../config/database");
const logger_1 = require("../config/logger");
async function seedFloorMapData() {
    const client = await database_1.db.getClient();
    try {
        await client.query('BEGIN');
        logger_1.logger.info('Starting fresh hospital floor map and inpatient data seeding...');
        // 1. Resolve Organization & Facility
        const orgRes = await client.query(`
      SELECT id FROM organizations WHERE code = 'DEFAULT' OR id = '00000000-0000-0000-0000-000000000000' LIMIT 1;
    `);
        let orgId = orgRes.rows[0]?.id || '00000000-0000-0000-0000-000000000000';
        const facRes = await client.query(`
      SELECT id FROM facilities WHERE organization_id = $1 OR id = '00000000-0000-0000-0000-000000000000' LIMIT 1;
    `, [orgId]);
        let facilityId = facRes.rows[0]?.id || orgId;
        // Ensure Default Org & Facility exist in DB
        await client.query(`
      INSERT INTO organizations (id, code, name)
      VALUES ($1, 'DEFAULT', 'Apex Multispeciality Hospital & Research Center')
      ON CONFLICT (id) DO UPDATE SET name = EXCLUDED.name;
    `, [orgId]);
        await client.query(`
      INSERT INTO facilities (id, organization_id, code, name, facility_type)
      VALUES ($1, $2, 'MAIN', 'Apex Super Speciality Hospital - Central Campus', 'hospital')
      ON CONFLICT (id) DO UPDATE SET name = EXCLUDED.name;
    `, [facilityId, orgId]);
        // 2. Departments
        const departmentsToSeed = [
            { code: 'EMG', name: 'Emergency & Trauma Care' },
            { code: 'MED', name: 'General & Internal Medicine' },
            { code: 'SURG', name: 'General & Laparoscopic Surgery' },
            { code: 'ICU', name: 'Critical Care & Pulmonology' },
            { code: 'CARD', name: 'Cardiology & Cardiac Surgery' },
            { code: 'OBG', name: 'Obstetrics & Gynecology' },
            { code: 'PED', name: 'Pediatrics & Neonatology' },
            { code: 'ONC', name: 'Medical Oncology & Daycare' },
        ];
        for (const d of departmentsToSeed) {
            await client.query(`
        INSERT INTO departments (organization_id, facility_id, code, name, is_active)
        VALUES ($1, $2, $3, $4, true)
        ON CONFLICT (facility_id, code) DO UPDATE SET name = EXCLUDED.name;
      `, [orgId, facilityId, d.code, d.name]);
        }
        const deptRows = (await client.query(`SELECT id, code FROM departments WHERE facility_id = $1`, [facilityId])).rows;
        const deptMap = new Map();
        deptRows.forEach((r) => deptMap.set(r.code, r.id));
        // 3. Bed Categories
        const categoriesToSeed = [
            { code: 'GEN', name: 'General Ward Category', rank: 1, is_icu: false },
            { code: 'SEMI', name: 'Semi-Private Category', rank: 2, is_icu: false },
            { code: 'PVT', name: 'Private Deluxe Suite', rank: 3, is_icu: false },
            { code: 'ICU', name: 'Intensive Care Unit (ICU)', rank: 4, is_icu: true },
            { code: 'NICU', name: 'Neonatal ICU (NICU)', rank: 4, is_icu: true },
            { code: 'HDU', name: 'High Dependency Unit (HDU)', rank: 3, is_icu: false },
            { code: 'EMG', name: 'Emergency & Casualty Bay', rank: 2, is_icu: false },
            { code: 'DAY', name: 'Day Care Observation', rank: 1, is_icu: false },
        ];
        for (const cat of categoriesToSeed) {
            await client.query(`
        INSERT INTO bed_categories (organization_id, code, name, rank, is_icu, is_active)
        VALUES ($1, $2, $3, $4, $5, true)
        ON CONFLICT (organization_id, code) DO UPDATE SET
          name = EXCLUDED.name,
          rank = EXCLUDED.rank,
          is_icu = EXCLUDED.is_icu,
          is_active = true;
      `, [orgId, cat.code, cat.name, cat.rank, cat.is_icu]);
        }
        const catRows = (await client.query(`SELECT id, code FROM bed_categories WHERE organization_id = $1`, [orgId])).rows;
        const catMap = new Map();
        catRows.forEach((r) => catMap.set(r.code, r.id));
        // 4. Daily Bed Charge Services
        const bedServicesToSeed = [
            { code: 'BED-GEN-DAY', name: 'General Ward Bed Charge - Per Day', rate: 1000.0, cat: 'GEN' },
            { code: 'BED-SEMI-DAY', name: 'Semi-Private Bed Charge - Per Day', rate: 2500.0, cat: 'SEMI' },
            { code: 'BED-PVT-DAY', name: 'Private Deluxe Suite Charge - Per Day', rate: 5000.0, cat: 'PVT' },
            { code: 'BED-ICU-DAY', name: 'Intensive Care Bed Charge - Per Day', rate: 8500.0, cat: 'ICU' },
            { code: 'BED-NICU-DAY', name: 'Neonatal ICU Bed Charge - Per Day', rate: 9000.0, cat: 'NICU' },
            { code: 'BED-HDU-DAY', name: 'High Dependency Bed Charge - Per Day', rate: 4500.0, cat: 'HDU' },
            { code: 'BED-EMG-DAY', name: 'Emergency Casualty Bed Charge - Per Day', rate: 2000.0, cat: 'EMG' },
            { code: 'BED-DAY-DAY', name: 'Day Care Stay Charge - Per Day', rate: 1500.0, cat: 'DAY' },
        ];
        for (const s of bedServicesToSeed) {
            await client.query(`
        INSERT INTO services (
          organization_id, code, name, service_type, billing_unit, default_rate, is_active
        ) VALUES (
          $1, $2, $3, 'bed', 'per_day', $4, true
        )
        ON CONFLICT (organization_id, code) DO UPDATE SET
          name = EXCLUDED.name,
          default_rate = EXCLUDED.default_rate,
          is_active = true;
      `, [orgId, s.code, s.name, s.rate]);
        }
        const srvRows = (await client.query(`SELECT id, code FROM services WHERE organization_id = $1 AND service_type = 'bed'`, [orgId])).rows;
        const srvMap = new Map();
        srvRows.forEach((r) => srvMap.set(r.code, r.id));
        // 5. Doctors & Practitioners
        const doctorsToSeed = [
            { empNo: 'DOC-101', name: 'Rajesh Varma', spec: 'Cardiology', reg: 'MCI-18291', dept: 'CARD' },
            { empNo: 'DOC-102', name: 'Sunita Rao', spec: 'Critical Care & Pulmonology', reg: 'MCI-29381', dept: 'ICU' },
            { empNo: 'DOC-103', name: 'Amit Saxena', spec: 'General & Laparoscopic Surgery', reg: 'MCI-40192', dept: 'SURG' },
            { empNo: 'DOC-104', name: 'Priya Nair', spec: 'Internal Medicine', reg: 'MCI-51029', dept: 'MED' },
            { empNo: 'DOC-105', name: 'Ananya Sen', spec: 'Obstetrics & Gynecology', reg: 'MCI-62183', dept: 'OBG' },
        ];
        const practitionerIds = [];
        for (const doc of doctorsToSeed) {
            const [first, ...rest] = doc.name.split(' ');
            const last = rest.join(' ');
            const deptId = deptMap.get(doc.dept) || null;
            const staffRes = await client.query(`
        INSERT INTO staff (organization_id, staff_code, first_name, last_name, staff_type, department_id, is_active)
        VALUES ($1, $2, $3, $4, 'doctor', $5, true)
        ON CONFLICT (organization_id, staff_code) DO UPDATE SET
          first_name = EXCLUDED.first_name,
          last_name = EXCLUDED.last_name,
          department_id = EXCLUDED.department_id
        RETURNING id;
      `, [orgId, doc.empNo, first, last, deptId]);
            const staffId = staffRes.rows[0].id;
            const pracRes = await client.query(`
        INSERT INTO practitioners (staff_id, registration_no, qualifications)
        VALUES ($1, $2, $3)
        ON CONFLICT (staff_id) DO UPDATE SET
          registration_no = EXCLUDED.registration_no,
          qualifications = EXCLUDED.qualifications
        RETURNING id;
      `, [staffId, doc.reg, doc.spec]);
            practitionerIds.push(pracRes.rows[0].id);
        }
        // 6. Hospital Wards across Floors
        const wardsToSeed = [
            // Ground Floor
            { code: 'W-EMG', name: 'Emergency & Trauma Care', type: 'emergency', floor: 'Ground Floor', gender: 'any', cat: 'EMG', dept: 'EMG' },
            { code: 'W-GEN-M', name: 'General Medical Ward (Male)', type: 'general', floor: 'Ground Floor', gender: 'male', cat: 'GEN', dept: 'MED' },
            { code: 'W-GEN-F', name: 'General Medical Ward (Female)', type: 'general', floor: 'Ground Floor', gender: 'female', cat: 'GEN', dept: 'MED' },
            // 1st Floor
            { code: 'W-SEMI', name: 'Semi-Private Surgical Ward', type: 'semi_private', floor: '1st Floor', gender: 'any', cat: 'SEMI', dept: 'SURG' },
            { code: 'W-MAT', name: 'Maternity & Obstetric Ward', type: 'maternity', floor: '1st Floor', gender: 'female', cat: 'GEN', dept: 'OBG' },
            // 2nd Floor
            { code: 'W-PVT', name: 'Private Deluxe Wing', type: 'private', floor: '2nd Floor', gender: 'any', cat: 'PVT', dept: 'MED' },
            { code: 'W-DAY', name: 'Day Care Oncology & Dialysis', type: 'daycare', floor: '2nd Floor', gender: 'any', cat: 'DAY', dept: 'ONC' },
            // 3rd Floor
            { code: 'W-ICU', name: 'Intensive Care Unit (ICU)', type: 'icu', floor: '3rd Floor', gender: 'any', cat: 'ICU', dept: 'ICU' },
            { code: 'W-HDU', name: 'High Dependency Unit (HDU)', type: 'hdu', floor: '3rd Floor', gender: 'any', cat: 'HDU', dept: 'ICU' },
        ];
        for (const w of wardsToSeed) {
            const catId = catMap.get(w.cat) || null;
            const deptId = deptMap.get(w.dept) || null;
            await client.query(`
        INSERT INTO wards (
          organization_id, facility_id, code, name, ward_type, gender_policy, floor, bed_category_id, department_id, is_active
        ) VALUES (
          $1, $2, $3, $4, $5, $6, $7, $8, $9, true
        )
        ON CONFLICT (facility_id, code) DO UPDATE SET
          name = EXCLUDED.name,
          ward_type = EXCLUDED.ward_type,
          gender_policy = EXCLUDED.gender_policy,
          floor = EXCLUDED.floor,
          bed_category_id = EXCLUDED.bed_category_id,
          department_id = EXCLUDED.department_id,
          is_active = true;
      `, [orgId, facilityId, w.code, w.name, w.type, w.gender, w.floor, catId, deptId]);
        }
        const wardRows = (await client.query(`SELECT id, code, name FROM wards WHERE facility_id = $1 AND is_active = true`, [facilityId])).rows;
        const wardMap = new Map();
        wardRows.forEach((r) => wardMap.set(r.code, r.id));
        // 7. Rooms
        const roomsToSeed = [
            // Ground Floor
            { ward: 'W-EMG', room_no: 'ER-Triage', type: 'emergency' },
            { ward: 'W-EMG', room_no: 'ER-Resus', type: 'emergency' },
            { ward: 'W-GEN-M', room_no: '101', type: 'general' },
            { ward: 'W-GEN-M', room_no: '102', type: 'general' },
            { ward: 'W-GEN-F', room_no: '103', type: 'general' },
            { ward: 'W-GEN-F', room_no: '104', type: 'general' },
            // 1st Floor
            { ward: 'W-SEMI', room_no: '201', type: 'semi_private' },
            { ward: 'W-SEMI', room_no: '202', type: 'semi_private' },
            { ward: 'W-SEMI', room_no: '203', type: 'semi_private' },
            { ward: 'W-MAT', room_no: '204', type: 'maternity' },
            { ward: 'W-MAT', room_no: '205', type: 'maternity' },
            // 2nd Floor
            { ward: 'W-PVT', room_no: 'Suite-301', type: 'private' },
            { ward: 'W-PVT', room_no: 'Suite-302', type: 'private' },
            { ward: 'W-PVT', room_no: 'Suite-303', type: 'private' },
            { ward: 'W-DAY', room_no: 'Day-01', type: 'daycare' },
            { ward: 'W-DAY', room_no: 'Day-02', type: 'daycare' },
            // 3rd Floor
            { ward: 'W-ICU', room_no: 'ICU-Pod-A', type: 'icu' },
            { ward: 'W-ICU', room_no: 'ICU-Pod-B', type: 'icu' },
            { ward: 'W-HDU', room_no: 'HDU-Bay-1', type: 'hdu' },
            { ward: 'W-HDU', room_no: 'HDU-Bay-2', type: 'hdu' },
        ];
        for (const rm of roomsToSeed) {
            const wardId = wardMap.get(rm.ward);
            if (wardId) {
                await client.query(`
          INSERT INTO rooms (ward_id, room_no, room_type, is_active)
          VALUES ($1, $2, $3, true)
          ON CONFLICT (ward_id, room_no) DO UPDATE SET
            room_type = EXCLUDED.room_type,
            is_active = true;
        `, [wardId, rm.room_no, rm.type]);
            }
        }
        const roomRows = (await client.query(`
      SELECT r.id, r.room_no, w.code as ward_code 
      FROM rooms r
      JOIN wards w ON r.ward_id = w.id
      WHERE w.facility_id = $1 AND r.is_active = true
    `, [facilityId])).rows;
        const roomKey = (wCode, rNo) => `${wCode}:${rNo}`;
        const roomMap = new Map();
        roomRows.forEach((r) => roomMap.set(roomKey(r.ward_code, r.room_no), r.id));
        const bedsToSeed = [
            // Ground Floor - Emergency
            { wardCode: 'W-EMG', roomNo: 'ER-Triage', bedNo: 'EMG-01', catCode: 'EMG', srvCode: 'BED-EMG-DAY', status: 'occupied', features: { oxygen: true, monitor: true, iv_pole: true, emergency_call_bell: true } },
            { wardCode: 'W-EMG', roomNo: 'ER-Triage', bedNo: 'EMG-02', catCode: 'EMG', srvCode: 'BED-EMG-DAY', status: 'available', features: { oxygen: true, monitor: true, iv_pole: true, emergency_call_bell: true } },
            { wardCode: 'W-EMG', roomNo: 'ER-Resus', bedNo: 'EMG-03', catCode: 'EMG', srvCode: 'BED-EMG-DAY', status: 'available', features: { oxygen: true, monitor: true, ventilator: true, defibrillator: true } },
            { wardCode: 'W-EMG', roomNo: 'ER-Resus', bedNo: 'EMG-04', catCode: 'EMG', srvCode: 'BED-EMG-DAY', status: 'cleaning', features: { oxygen: true, monitor: true, suction: true } },
            // Ground Floor - General Ward Male
            { wardCode: 'W-GEN-M', roomNo: '101', bedNo: 'GWM-101-A', catCode: 'GEN', srvCode: 'BED-GEN-DAY', status: 'available', features: { oxygen: true, iv_pole: true, emergency_call_bell: true } },
            { wardCode: 'W-GEN-M', roomNo: '101', bedNo: 'GWM-101-B', catCode: 'GEN', srvCode: 'BED-GEN-DAY', status: 'occupied', features: { oxygen: true, iv_pole: true, emergency_call_bell: true } },
            { wardCode: 'W-GEN-M', roomNo: '101', bedNo: 'GWM-101-C', catCode: 'GEN', srvCode: 'BED-GEN-DAY', status: 'cleaning', features: { oxygen: false, iv_pole: true } },
            { wardCode: 'W-GEN-M', roomNo: '102', bedNo: 'GWM-102-A', catCode: 'GEN', srvCode: 'BED-GEN-DAY', status: 'available', features: { oxygen: true, iv_pole: true, emergency_call_bell: true } },
            { wardCode: 'W-GEN-M', roomNo: '102', bedNo: 'GWM-102-B', catCode: 'GEN', srvCode: 'BED-GEN-DAY', status: 'occupied', features: { oxygen: true, iv_pole: true, emergency_call_bell: true } },
            { wardCode: 'W-GEN-M', roomNo: '102', bedNo: 'GWM-102-C', catCode: 'GEN', srvCode: 'BED-GEN-DAY', status: 'maintenance', features: { oxygen: true, iv_pole: false } },
            // Ground Floor - General Ward Female
            { wardCode: 'W-GEN-F', roomNo: '103', bedNo: 'GWF-103-A', catCode: 'GEN', srvCode: 'BED-GEN-DAY', status: 'available', features: { oxygen: true, iv_pole: true, emergency_call_bell: true } },
            { wardCode: 'W-GEN-F', roomNo: '103', bedNo: 'GWF-103-B', catCode: 'GEN', srvCode: 'BED-GEN-DAY', status: 'occupied', features: { oxygen: true, iv_pole: true, emergency_call_bell: true } },
            { wardCode: 'W-GEN-F', roomNo: '103', bedNo: 'GWF-103-C', catCode: 'GEN', srvCode: 'BED-GEN-DAY', status: 'available', features: { oxygen: false, iv_pole: true, emergency_call_bell: true } },
            { wardCode: 'W-GEN-F', roomNo: '104', bedNo: 'GWF-104-A', catCode: 'GEN', srvCode: 'BED-GEN-DAY', status: 'reserved', features: { oxygen: true, iv_pole: true, emergency_call_bell: true } },
            { wardCode: 'W-GEN-F', roomNo: '104', bedNo: 'GWF-104-B', catCode: 'GEN', srvCode: 'BED-GEN-DAY', status: 'occupied', features: { oxygen: true, iv_pole: true, emergency_call_bell: true } },
            { wardCode: 'W-GEN-F', roomNo: '104', bedNo: 'GWF-104-C', catCode: 'GEN', srvCode: 'BED-GEN-DAY', status: 'available', features: { oxygen: false, iv_pole: true } },
            // 1st Floor - Semi-Private
            { wardCode: 'W-SEMI', roomNo: '201', bedNo: 'SP-201-A', catCode: 'SEMI', srvCode: 'BED-SEMI-DAY', status: 'available', features: { oxygen: true, monitor: true, motorized: true, ac: true } },
            { wardCode: 'W-SEMI', roomNo: '201', bedNo: 'SP-201-B', catCode: 'SEMI', srvCode: 'BED-SEMI-DAY', status: 'occupied', features: { oxygen: true, monitor: true, motorized: true, ac: true } },
            { wardCode: 'W-SEMI', roomNo: '202', bedNo: 'SP-202-A', catCode: 'SEMI', srvCode: 'BED-SEMI-DAY', status: 'available', features: { oxygen: true, monitor: false, motorized: true, ac: true } },
            { wardCode: 'W-SEMI', roomNo: '202', bedNo: 'SP-202-B', catCode: 'SEMI', srvCode: 'BED-SEMI-DAY', status: 'occupied', features: { oxygen: true, monitor: true, motorized: true, ac: true } },
            { wardCode: 'W-SEMI', roomNo: '203', bedNo: 'SP-203-A', catCode: 'SEMI', srvCode: 'BED-SEMI-DAY', status: 'cleaning', features: { oxygen: true, monitor: false, motorized: true } },
            { wardCode: 'W-SEMI', roomNo: '203', bedNo: 'SP-203-B', catCode: 'SEMI', srvCode: 'BED-SEMI-DAY', status: 'available', features: { oxygen: true, monitor: true, motorized: true } },
            // 1st Floor - Maternity
            { wardCode: 'W-MAT', roomNo: '204', bedNo: 'MAT-204-A', catCode: 'GEN', srvCode: 'BED-GEN-DAY', status: 'occupied', features: { oxygen: true, monitor: true, baby_cradle: true, call_bell: true } },
            { wardCode: 'W-MAT', roomNo: '204', bedNo: 'MAT-204-B', catCode: 'GEN', srvCode: 'BED-GEN-DAY', status: 'available', features: { oxygen: true, baby_cradle: true, call_bell: true } },
            { wardCode: 'W-MAT', roomNo: '205', bedNo: 'MAT-205-A', catCode: 'GEN', srvCode: 'BED-GEN-DAY', status: 'available', features: { oxygen: true, fetal_monitor: true, baby_cradle: true } },
            // 2nd Floor - Private Deluxe
            { wardCode: 'W-PVT', roomNo: 'Suite-301', bedNo: 'PVT-301', catCode: 'PVT', srvCode: 'BED-PVT-DAY', status: 'occupied', features: { oxygen: true, monitor: true, motorized: true, tv: true, ac: true, sofa_bed: true } },
            { wardCode: 'W-PVT', roomNo: 'Suite-302', bedNo: 'PVT-302', catCode: 'PVT', srvCode: 'BED-PVT-DAY', status: 'available', features: { oxygen: true, monitor: true, motorized: true, tv: true, ac: true, sofa_bed: true } },
            { wardCode: 'W-PVT', roomNo: 'Suite-303', bedNo: 'PVT-303', catCode: 'PVT', srvCode: 'BED-PVT-DAY', status: 'reserved', features: { oxygen: true, monitor: true, motorized: true, tv: true, ac: true, sofa_bed: true } },
            // 2nd Floor - Day Care
            { wardCode: 'W-DAY', roomNo: 'Day-01', bedNo: 'DAY-01-A', catCode: 'DAY', srvCode: 'BED-DAY-DAY', status: 'available', features: { oxygen: true, motorized_recliner: true, iv_infusion: true } },
            { wardCode: 'W-DAY', roomNo: 'Day-01', bedNo: 'DAY-01-B', catCode: 'DAY', srvCode: 'BED-DAY-DAY', status: 'occupied', features: { oxygen: true, motorized_recliner: true, iv_infusion: true } },
            { wardCode: 'W-DAY', roomNo: 'Day-02', bedNo: 'DAY-02-A', catCode: 'DAY', srvCode: 'BED-DAY-DAY', status: 'available', features: { oxygen: true, dialysis_port: true, iv_infusion: true } },
            // 3rd Floor - ICU
            { wardCode: 'W-ICU', roomNo: 'ICU-Pod-A', bedNo: 'ICU-01', catCode: 'ICU', srvCode: 'BED-ICU-DAY', status: 'occupied', features: { ventilator: true, monitor: true, oxygen: true, suction: true, motorized: true } },
            { wardCode: 'W-ICU', roomNo: 'ICU-Pod-A', bedNo: 'ICU-02', catCode: 'ICU', srvCode: 'BED-ICU-DAY', status: 'available', features: { ventilator: true, monitor: true, oxygen: true, suction: true, motorized: true } },
            { wardCode: 'W-ICU', roomNo: 'ICU-Pod-A', bedNo: 'ICU-03', catCode: 'ICU', srvCode: 'BED-ICU-DAY', status: 'occupied', features: { ventilator: true, monitor: true, oxygen: true, suction: true, motorized: true } },
            { wardCode: 'W-ICU', roomNo: 'ICU-Pod-B', bedNo: 'ICU-04', catCode: 'ICU', srvCode: 'BED-ICU-DAY', status: 'available', features: { ventilator: true, monitor: true, oxygen: true, suction: true, motorized: true } },
            { wardCode: 'W-ICU', roomNo: 'ICU-Pod-B', bedNo: 'ICU-05', catCode: 'ICU', srvCode: 'BED-ICU-DAY', status: 'cleaning', features: { ventilator: true, monitor: true, oxygen: true, suction: true, motorized: true } },
            { wardCode: 'W-ICU', roomNo: 'ICU-Pod-B', bedNo: 'ICU-06', catCode: 'ICU', srvCode: 'BED-ICU-DAY', status: 'blocked', features: { ventilator: false, monitor: false, oxygen: false } },
            // 3rd Floor - HDU
            { wardCode: 'W-HDU', roomNo: 'HDU-Bay-1', bedNo: 'HDU-01', catCode: 'HDU', srvCode: 'BED-HDU-DAY', status: 'occupied', features: { monitor: true, oxygen: true, suction: true, motorized: true } },
            { wardCode: 'W-HDU', roomNo: 'HDU-Bay-1', bedNo: 'HDU-02', catCode: 'HDU', srvCode: 'BED-HDU-DAY', status: 'available', features: { monitor: true, oxygen: true, suction: true, motorized: true } },
            { wardCode: 'W-HDU', roomNo: 'HDU-Bay-2', bedNo: 'HDU-03', catCode: 'HDU', srvCode: 'BED-HDU-DAY', status: 'available', features: { monitor: true, oxygen: true, suction: true, motorized: true } },
            { wardCode: 'W-HDU', roomNo: 'HDU-Bay-2', bedNo: 'HDU-04', catCode: 'HDU', srvCode: 'BED-HDU-DAY', status: 'available', features: { monitor: true, oxygen: true, suction: true, motorized: true } },
        ];
        for (const b of bedsToSeed) {
            const wardId = wardMap.get(b.wardCode);
            const roomId = roomMap.get(roomKey(b.wardCode, b.roomNo)) || null;
            const catId = catMap.get(b.catCode) || null;
            const srvId = srvMap.get(b.srvCode) || null;
            if (wardId) {
                await client.query(`
          INSERT INTO beds (
            organization_id, facility_id, ward_id, room_id, bed_category_id, bed_charge_service_id,
            bed_no, status, features, is_active
          ) VALUES (
            $1, $2, $3, $4, $5, $6, $7, $8, $9, true
          )
          ON CONFLICT (ward_id, bed_no) DO UPDATE SET
            room_id = EXCLUDED.room_id,
            bed_category_id = EXCLUDED.bed_category_id,
            bed_charge_service_id = EXCLUDED.bed_charge_service_id,
            status = EXCLUDED.status,
            features = EXCLUDED.features,
            is_active = true;
        `, [orgId, facilityId, wardId, roomId, catId, srvId, b.bedNo, b.status, JSON.stringify(b.features)]);
            }
        }
        logger_1.logger.info(`Seeded ${bedsToSeed.length} structured hospital beds successfully.`);
        // 9. Seed Inpatients for Occupied Beds
        const doc1 = practitionerIds[0] || null;
        const doc2 = practitionerIds[1] || doc1;
        const doc3 = practitionerIds[2] || doc1;
        const doc4 = practitionerIds[3] || doc1;
        const doc5 = practitionerIds[4] || doc1;
        const sampleInpatients = [
            {
                uhid: 'UHID-2026-00101',
                first: 'Aarav',
                last: 'Sharma',
                gender: 'male',
                dob: '1984-03-12',
                phone: '9811223344',
                bedNo: 'GWM-101-B',
                dx: 'Acute Appendicitis with Mild Localized Peritonitis',
                type: 'emergency',
                daysAgo: 2,
                doc: doc3,
            },
            {
                uhid: 'UHID-2026-00102',
                first: 'Rajesh',
                last: 'Verma',
                gender: 'male',
                dob: '1972-07-25',
                phone: '9822334455',
                bedNo: 'GWM-102-B',
                dx: 'Acute Exacerbation of Chronic Obstructive Pulmonary Disease (COPD)',
                type: 'emergency',
                daysAgo: 4,
                doc: doc2,
            },
            {
                uhid: 'UHID-2026-00103',
                first: 'Sunita',
                last: 'Devi',
                gender: 'female',
                dob: '1991-11-04',
                phone: '9833445566',
                bedNo: 'GWF-103-B',
                dx: 'Dengue Fever with Severe Thrombocytopenia & Dehydration',
                type: 'emergency',
                daysAgo: 3,
                doc: doc4,
            },
            {
                uhid: 'UHID-2026-00104',
                first: 'Pooja',
                last: 'Singh',
                gender: 'female',
                dob: '1988-06-19',
                phone: '9844556677',
                bedNo: 'GWF-104-B',
                dx: 'Acute Biliary Pancreatitis with Elevation of Serum Lipase',
                type: 'emergency',
                daysAgo: 5,
                doc: doc3,
            },
            {
                uhid: 'UHID-2026-00105',
                first: 'Vikram',
                last: 'Malhotra',
                gender: 'male',
                dob: '1965-02-14',
                phone: '9855667788',
                bedNo: 'SP-201-B',
                dx: 'Uncontrolled Type 2 Diabetes with Diabetic Foot Cellulitis',
                type: 'elective',
                daysAgo: 6,
                doc: doc4,
            },
            {
                uhid: 'UHID-2026-00106',
                first: 'Meera',
                last: 'Kapoor',
                gender: 'female',
                dob: '1979-09-30',
                phone: '9866778899',
                bedNo: 'SP-202-B',
                dx: 'Laparoscopic Cholecystectomy Post-Operative Recovery',
                type: 'elective',
                daysAgo: 1,
                doc: doc3,
            },
            {
                uhid: 'UHID-2026-00107',
                first: 'Lakshmi',
                last: 'Iyer',
                gender: 'female',
                dob: '1995-05-18',
                phone: '9877112233',
                bedNo: 'MAT-204-A',
                dx: 'Primigravida at 39 Weeks - Elective Lower Segment Cesarean Section',
                type: 'maternity',
                daysAgo: 2,
                doc: doc5,
            },
            {
                uhid: 'UHID-2026-00108',
                first: 'Amitabh',
                last: 'Singhania',
                gender: 'male',
                dob: '1958-12-08',
                phone: '9877889900',
                bedNo: 'PVT-301',
                dx: 'Post-PTCA Stenting & Cardiac Hemodynamic Monitoring',
                type: 'elective',
                daysAgo: 3,
                doc: doc1,
            },
            {
                uhid: 'UHID-2026-00109',
                first: 'Mohammed',
                last: 'Farooq',
                gender: 'male',
                dob: '1961-04-10',
                phone: '9888112233',
                bedNo: 'DAY-01-B',
                dx: 'Daycare Chemotherapy Cycle 4 (FOLFOX Protocol)',
                type: 'daycare',
                daysAgo: 0,
                doc: doc4,
            },
            {
                uhid: 'UHID-2026-00110',
                first: 'Harsh',
                last: 'Gupta',
                gender: 'male',
                dob: '1952-04-17',
                phone: '9888990011',
                bedNo: 'ICU-01',
                dx: 'Severe ARDS secondary to Atypical Viral Pneumonia on Mechanical Ventilation',
                type: 'emergency',
                daysAgo: 5,
                doc: doc2,
            },
            {
                uhid: 'UHID-2026-00111',
                first: 'Kiran',
                last: 'Patel',
                gender: 'female',
                dob: '1963-08-22',
                phone: '9899001122',
                bedNo: 'ICU-03',
                dx: 'Septic Shock with Multi-Organ Dysfunction Syndrome on Inotrope Support',
                type: 'emergency',
                daysAgo: 4,
                doc: doc2,
            },
            {
                uhid: 'UHID-2026-00112',
                first: 'Sanjay',
                last: 'Rao',
                gender: 'male',
                dob: '1995-10-10',
                phone: '9900112233',
                bedNo: 'EMG-01',
                dx: 'High-Velocity Road Traffic Accident with Blunt Abdominal Trauma',
                type: 'emergency',
                daysAgo: 1,
                doc: doc3,
            },
            {
                uhid: 'UHID-2026-00113',
                first: 'Deepak',
                last: 'Joshi',
                gender: 'male',
                dob: '1970-01-20',
                phone: '9911002233',
                bedNo: 'HDU-01',
                dx: 'Severe Sepsis Post-Urolithiasis - Step-Down HDU Monitoring',
                type: 'emergency',
                daysAgo: 3,
                doc: doc2,
            },
        ];
        for (const inp of sampleInpatients) {
            // 9a. Upsert Patient
            await client.query(`
        INSERT INTO patients (organization_id, uhid, first_name, last_name, date_of_birth, gender, phone)
        VALUES ($1, $2, $3, $4, $5, $6, $7)
        ON CONFLICT (organization_id, uhid) DO UPDATE SET
          first_name = EXCLUDED.first_name,
          last_name = EXCLUDED.last_name,
          phone = EXCLUDED.phone;
      `, [orgId, inp.uhid, inp.first, inp.last, inp.dob, inp.gender, inp.phone]);
            const patientId = (await client.query(`SELECT id FROM patients WHERE uhid = $1`, [inp.uhid])).rows[0].id;
            const encNo = `ENC-IPD-${inp.uhid.slice(-5)}`;
            // 9b. Upsert Encounter
            await client.query(`
        INSERT INTO encounters (
          organization_id, facility_id, encounter_no, patient_id, encounter_type, status,
          primary_practitioner_id, chief_complaint, started_at
        ) VALUES (
          $1, $2, $3, $4, 'ipd', 'in_progress', $5, $6, NOW() - ($7 || ' days')::interval
        )
        ON CONFLICT (facility_id, encounter_no) DO UPDATE SET
          status = EXCLUDED.status,
          chief_complaint = EXCLUDED.chief_complaint;
      `, [orgId, facilityId, encNo, patientId, inp.doc, inp.dx, inp.daysAgo]);
            const encounterId = (await client.query(`SELECT id FROM encounters WHERE encounter_no = $1 AND facility_id = $2`, [encNo, facilityId])).rows[0].id;
            const admNo = `ADM-IPD-${inp.uhid.slice(-5)}`;
            // 9c. Upsert Admission
            await client.query(`
        INSERT INTO admissions (
          organization_id, facility_id, encounter_id, patient_id, admission_no,
          admitting_practitioner_id, attending_practitioner_id, admission_diagnosis,
          admission_type, status, admitted_at
        ) VALUES (
          $1, $2, $3, $4, $5, $6, $6, $7, $8, 'admitted', NOW() - ($9 || ' days')::interval
        )
        ON CONFLICT (facility_id, admission_no) DO UPDATE SET
          status = 'admitted',
          admission_diagnosis = EXCLUDED.admission_diagnosis,
          attending_practitioner_id = EXCLUDED.attending_practitioner_id;
      `, [orgId, facilityId, encounterId, patientId, admNo, inp.doc, inp.dx, inp.type, inp.daysAgo]);
            const admissionId = (await client.query(`SELECT id FROM admissions WHERE admission_no = $1 AND facility_id = $2`, [admNo, facilityId])).rows[0].id;
            // 9d. Find target Bed & link Bed Assignment
            const bedRow = (await client.query(`SELECT id FROM beds WHERE bed_no = $1 AND facility_id = $2`, [inp.bedNo, facilityId])).rows[0];
            if (bedRow) {
                const bedId = bedRow.id;
                // Clean previous active assignments for this bed & admission
                await client.query(`
          DELETE FROM bed_assignments WHERE admission_id = $1 OR (bed_id = $2 AND assigned_to IS NULL);
        `, [admissionId, bedId]);
                // Insert fresh active assignment
                await client.query(`
          INSERT INTO bed_assignments (admission_id, bed_id, assigned_from)
          VALUES ($1, $2, NOW() - ($3 || ' days')::interval);
        `, [admissionId, bedId, inp.daysAgo]);
                // Ensure bed status is occupied
                await client.query(`
          UPDATE beds SET status = 'occupied', updated_at = NOW() WHERE id = $1;
        `, [bedId]);
            }
        }
        logger_1.logger.info(`Seeded ${sampleInpatients.length} active inpatient admissions and bed assignments.`);
        // 10. Synchronize all beds to inventory equipment assets
        const activeBeds = await client.query(`SELECT * FROM beds WHERE facility_id = $1 AND is_active = true;`, [facilityId]);
        for (const bed of activeBeds.rows) {
            const itemCode = `EQ-BED-${String(bed.bed_no || '').replace(/\s+/g, '-').toUpperCase()}`;
            const itemName = `Hospital Bed Asset - ${bed.bed_no}`;
            const customFields = {
                bed_id: bed.id,
                bed_no: bed.bed_no,
                ward_id: bed.ward_id,
                room_id: bed.room_id,
                status: bed.status,
                is_bed_asset: true,
                features: bed.features || {},
            };
            const existItem = await client.query(`SELECT id FROM items WHERE organization_id = $1 AND code = $2 LIMIT 1;`, [orgId, itemCode]);
            let itemId;
            if (existItem.rows.length > 0) {
                itemId = existItem.rows[0].id;
                await client.query(`UPDATE items SET name = $2, is_active = true, custom_fields = $3, updated_at = NOW() WHERE id = $1;`, [itemId, itemName, JSON.stringify(customFields)]);
            }
            else {
                const ins = await client.query(`INSERT INTO items (
             organization_id, code, name, generic_name, item_type,
             service_id, base_uom, pack_size, track_batches, track_expiry,
             is_active, custom_fields, created_at, updated_at
           ) VALUES (
             $1, $2, $3, 'IPD Hospital Bed Asset', 'equipment',
             $4, 'unit', 1, false, false,
             true, $5, NOW(), NOW()
           ) RETURNING id;`, [orgId, itemCode, itemName, bed.bed_charge_service_id || null, JSON.stringify(customFields)]);
                itemId = ins.rows[0].id;
            }
            const features = { ...(bed.features || {}), inventory_item_id: itemId };
            await client.query(`UPDATE beds SET features = $2 WHERE id = $1;`, [bed.id, JSON.stringify(features)]);
        }
        await client.query('COMMIT');
        logger_1.logger.info('Hospital Floor Map, Beds, Wards, and Inpatients seeding completed successfully!');
    }
    catch (error) {
        await client.query('ROLLBACK');
        logger_1.logger.error({ err: error }, 'Failed to seed floor map data');
        throw error;
    }
    finally {
        client.release();
    }
}
if (require.main === module || process.argv[1]?.includes('seed-floor-map')) {
    seedFloorMapData()
        .then(() => {
        console.log('Seed executed successfully.');
        process.exit(0);
    })
        .catch((err) => {
        console.error('Seed execution failed:', err);
        process.exit(1);
    });
}
