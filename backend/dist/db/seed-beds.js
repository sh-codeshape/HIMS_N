"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const database_1 = require("../config/database");
const logger_1 = require("../config/logger");
async function seedBeds() {
    const client = await database_1.db.getClient();
    try {
        await client.query('BEGIN');
        logger_1.logger.info('Starting real-time hospital bed and ward structure setup...');
        const orgId = '00000000-0000-0000-0000-000000000000';
        const facilityId = orgId;
        // 1. Bed Categories Master
        const categoriesToSeed = [
            { code: 'GEN', name: 'General Ward Category', rank: 1, is_icu: false },
            { code: 'SEMI', name: 'Semi-Private Category', rank: 2, is_icu: false },
            { code: 'PVT', name: 'Private Deluxe Category', rank: 3, is_icu: false },
            { code: 'ICU', name: 'Intensive Care Unit (ICU)', rank: 4, is_icu: true },
            { code: 'NICU', name: 'Neonatal ICU (NICU)', rank: 4, is_icu: true },
            { code: 'EMG', name: 'Emergency / Casualty', rank: 2, is_icu: false },
            { code: 'DAY', name: 'Day Care Unit', rank: 1, is_icu: false },
        ];
        for (const cat of categoriesToSeed) {
            await client.query(`
        INSERT INTO bed_categories (organization_id, code, name, rank, is_icu)
        VALUES ($1, $2, $3, $4, $5)
        ON CONFLICT (organization_id, code) DO UPDATE SET
          name = EXCLUDED.name,
          rank = EXCLUDED.rank,
          is_icu = EXCLUDED.is_icu;
      `, [orgId, cat.code, cat.name, cat.rank, cat.is_icu]);
        }
        const catRows = (await client.query(`SELECT id, code FROM bed_categories WHERE organization_id = $1`, [orgId])).rows;
        const catMap = new Map();
        catRows.forEach(r => catMap.set(r.code, r.id));
        // 2. Wards Infrastructure
        const wardsToSeed = [
            { code: 'W-GEN-M', name: 'General Ward (Male)', ward_type: 'general', floor: 'Ground Floor', gender: 'male', cat: 'GEN' },
            { code: 'W-GEN-F', name: 'General Ward (Female)', ward_type: 'general', floor: 'Ground Floor', gender: 'female', cat: 'GEN' },
            { code: 'W-SEMI', name: 'Semi-Private Ward', ward_type: 'semi_private', floor: '1st Floor', gender: 'any', cat: 'SEMI' },
            { code: 'W-PVT', name: 'Private Deluxe Ward', ward_type: 'private', floor: '2nd Floor', gender: 'any', cat: 'PVT' },
            { code: 'W-ICU', name: 'Intensive Care Unit (ICU)', ward_type: 'icu', floor: '3rd Floor', gender: 'any', cat: 'ICU' },
            { code: 'W-EMG', name: 'Emergency & Trauma Ward', ward_type: 'emergency', floor: 'Ground Floor', gender: 'any', cat: 'EMG' },
        ];
        for (const w of wardsToSeed) {
            await client.query(`
        INSERT INTO wards (organization_id, facility_id, code, name, ward_type, floor, gender_policy, bed_category_id)
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
        ON CONFLICT (facility_id, code) DO UPDATE SET
          name = EXCLUDED.name,
          ward_type = EXCLUDED.ward_type,
          floor = EXCLUDED.floor,
          gender_policy = EXCLUDED.gender_policy,
          bed_category_id = EXCLUDED.bed_category_id;
      `, [orgId, facilityId, w.code, w.name, w.ward_type, w.floor, w.gender, catMap.get(w.cat)]);
        }
        const wardRows = (await client.query(`SELECT id, code FROM wards WHERE facility_id = $1`, [facilityId])).rows;
        const wardMap = new Map();
        wardRows.forEach(r => wardMap.set(r.code, r.id));
        // 3. Rooms
        const roomsToSeed = [
            { ward: 'W-GEN-M', room_no: '101', room_type: 'General Shared' },
            { ward: 'W-GEN-M', room_no: '102', room_type: 'General Shared' },
            { ward: 'W-GEN-F', room_no: '103', room_type: 'General Shared' },
            { ward: 'W-GEN-F', room_no: '104', room_type: 'General Shared' },
            { ward: 'W-SEMI', room_no: '201', room_type: 'Twin Sharing' },
            { ward: 'W-SEMI', room_no: '202', room_type: 'Twin Sharing' },
            { ward: 'W-SEMI', room_no: '203', room_type: 'Twin Sharing' },
            { ward: 'W-PVT', room_no: '301', room_type: 'Single Deluxe Suite' },
            { ward: 'W-PVT', room_no: '302', room_type: 'Single Deluxe Suite' },
            { ward: 'W-PVT', room_no: '303', room_type: 'Single Deluxe Suite' },
            { ward: 'W-PVT', room_no: '304', room_type: 'Single Deluxe Suite' },
            { ward: 'W-ICU', room_no: 'ICU-Pod-A', room_type: 'Critical Care Isolation' },
            { ward: 'W-ICU', room_no: 'ICU-Pod-B', room_type: 'Critical Care Monitoring' },
            { ward: 'W-EMG', room_no: 'ER-Trauma', room_type: 'Triage & Resuscitation' },
        ];
        for (const rm of roomsToSeed) {
            const wardId = wardMap.get(rm.ward);
            if (wardId) {
                await client.query(`
          INSERT INTO rooms (ward_id, room_no, room_type)
          VALUES ($1, $2, $3)
          ON CONFLICT (ward_id, room_no) DO UPDATE SET
            room_type = EXCLUDED.room_type;
        `, [wardId, rm.room_no, rm.room_type]);
            }
        }
        const roomRows = (await client.query(`
      SELECT r.id, r.room_no, w.code as ward_code 
      FROM rooms r 
      JOIN wards w ON r.ward_id = w.id 
      WHERE w.facility_id = $1
    `, [facilityId])).rows;
        const roomKey = (wCode, rNo) => `${wCode}:${rNo}`;
        const roomMap = new Map();
        roomRows.forEach(r => roomMap.set(roomKey(r.ward_code, r.room_no), r.id));
        const bedsToSeed = [
            // General Ward Male (Rooms 101, 102)
            { wardCode: 'W-GEN-M', roomNo: '101', bedNo: 'GWM-101-A', catCode: 'GEN', status: 'available', features: { oxygen: true, manual_crank: true } },
            { wardCode: 'W-GEN-M', roomNo: '101', bedNo: 'GWM-101-B', catCode: 'GEN', status: 'available', features: { oxygen: true, manual_crank: true } },
            { wardCode: 'W-GEN-M', roomNo: '101', bedNo: 'GWM-101-C', catCode: 'GEN', status: 'available', features: { oxygen: false, manual_crank: true } },
            { wardCode: 'W-GEN-M', roomNo: '101', bedNo: 'GWM-101-D', catCode: 'GEN', status: 'available', features: { oxygen: false, manual_crank: true } },
            { wardCode: 'W-GEN-M', roomNo: '102', bedNo: 'GWM-102-A', catCode: 'GEN', status: 'available', features: { oxygen: true, manual_crank: true } },
            { wardCode: 'W-GEN-M', roomNo: '102', bedNo: 'GWM-102-B', catCode: 'GEN', status: 'available', features: { oxygen: true, manual_crank: true } },
            { wardCode: 'W-GEN-M', roomNo: '102', bedNo: 'GWM-102-C', catCode: 'GEN', status: 'available', features: { oxygen: false, manual_crank: true } },
            // General Ward Female (Rooms 103, 104)
            { wardCode: 'W-GEN-F', roomNo: '103', bedNo: 'GWF-103-A', catCode: 'GEN', status: 'available', features: { oxygen: true, manual_crank: true } },
            { wardCode: 'W-GEN-F', roomNo: '103', bedNo: 'GWF-103-B', catCode: 'GEN', status: 'available', features: { oxygen: true, manual_crank: true } },
            { wardCode: 'W-GEN-F', roomNo: '103', bedNo: 'GWF-103-C', catCode: 'GEN', status: 'available', features: { oxygen: false, manual_crank: true } },
            { wardCode: 'W-GEN-F', roomNo: '104', bedNo: 'GWF-104-A', catCode: 'GEN', status: 'available', features: { oxygen: true, manual_crank: true } },
            { wardCode: 'W-GEN-F', roomNo: '104', bedNo: 'GWF-104-B', catCode: 'GEN', status: 'available', features: { oxygen: false, manual_crank: true } },
            { wardCode: 'W-GEN-F', roomNo: '104', bedNo: 'GWF-104-C', catCode: 'GEN', status: 'available', features: { oxygen: true, manual_crank: true } },
            // Semi-Private Ward (Rooms 201, 202, 203)
            { wardCode: 'W-SEMI', roomNo: '201', bedNo: 'SP-201-A', catCode: 'SEMI', status: 'available', features: { oxygen: true, monitor: true, semi_motorized: true } },
            { wardCode: 'W-SEMI', roomNo: '201', bedNo: 'SP-201-B', catCode: 'SEMI', status: 'available', features: { oxygen: true, monitor: true, semi_motorized: true } },
            { wardCode: 'W-SEMI', roomNo: '202', bedNo: 'SP-202-A', catCode: 'SEMI', status: 'available', features: { oxygen: true, monitor: false, semi_motorized: true } },
            { wardCode: 'W-SEMI', roomNo: '202', bedNo: 'SP-202-B', catCode: 'SEMI', status: 'available', features: { oxygen: true, monitor: false, semi_motorized: true } },
            { wardCode: 'W-SEMI', roomNo: '203', bedNo: 'SP-203-A', catCode: 'SEMI', status: 'available', features: { oxygen: true, monitor: true, semi_motorized: true } },
            { wardCode: 'W-SEMI', roomNo: '203', bedNo: 'SP-203-B', catCode: 'SEMI', status: 'available', features: { oxygen: true, monitor: false, semi_motorized: true } },
            // Private Deluxe Ward (Rooms 301 - 304)
            { wardCode: 'W-PVT', roomNo: '301', bedNo: 'PVT-301', catCode: 'PVT', status: 'available', features: { oxygen: true, monitor: true, motorized: true, ac: true, tv: true } },
            { wardCode: 'W-PVT', roomNo: '302', bedNo: 'PVT-302', catCode: 'PVT', status: 'available', features: { oxygen: true, monitor: true, motorized: true, ac: true, tv: true } },
            { wardCode: 'W-PVT', roomNo: '303', bedNo: 'PVT-303', catCode: 'PVT', status: 'available', features: { oxygen: true, monitor: true, motorized: true, ac: true, tv: true } },
            { wardCode: 'W-PVT', roomNo: '304', bedNo: 'PVT-304', catCode: 'PVT', status: 'available', features: { oxygen: true, monitor: true, motorized: true, ac: true, tv: true } },
            // ICU (Rooms ICU-Pod-A, ICU-Pod-B)
            { wardCode: 'W-ICU', roomNo: 'ICU-Pod-A', bedNo: 'ICU-01', catCode: 'ICU', status: 'available', features: { ventilator: true, monitor: true, oxygen: true, infusion_pump: true, motorized: true } },
            { wardCode: 'W-ICU', roomNo: 'ICU-Pod-A', bedNo: 'ICU-02', catCode: 'ICU', status: 'available', features: { ventilator: true, monitor: true, oxygen: true, infusion_pump: true, motorized: true } },
            { wardCode: 'W-ICU', roomNo: 'ICU-Pod-A', bedNo: 'ICU-03', catCode: 'ICU', status: 'available', features: { ventilator: true, monitor: true, oxygen: true, infusion_pump: true, motorized: true } },
            { wardCode: 'W-ICU', roomNo: 'ICU-Pod-B', bedNo: 'ICU-04', catCode: 'ICU', status: 'available', features: { ventilator: false, monitor: true, oxygen: true, motorized: true } },
            { wardCode: 'W-ICU', roomNo: 'ICU-Pod-B', bedNo: 'ICU-05', catCode: 'ICU', status: 'available', features: { ventilator: true, monitor: true, oxygen: true, motorized: true } },
            { wardCode: 'W-ICU', roomNo: 'ICU-Pod-B', bedNo: 'ICU-06', catCode: 'ICU', status: 'available', features: { ventilator: false, monitor: true, oxygen: true, motorized: true } },
            // Emergency & Trauma Ward (Room ER-Trauma)
            { wardCode: 'W-EMG', roomNo: 'ER-Trauma', bedNo: 'EMG-01', catCode: 'EMG', status: 'available', features: { oxygen: true, monitor: true, defibrillator: true } },
            { wardCode: 'W-EMG', roomNo: 'ER-Trauma', bedNo: 'EMG-02', catCode: 'EMG', status: 'available', features: { oxygen: true, monitor: true } },
            { wardCode: 'W-EMG', roomNo: 'ER-Trauma', bedNo: 'EMG-03', catCode: 'EMG', status: 'available', features: { oxygen: true, monitor: true } },
            { wardCode: 'W-EMG', roomNo: 'ER-Trauma', bedNo: 'EMG-04', catCode: 'EMG', status: 'available', features: { oxygen: false, monitor: false } },
        ];
        for (const b of bedsToSeed) {
            const wardId = wardMap.get(b.wardCode);
            const roomId = roomMap.get(roomKey(b.wardCode, b.roomNo));
            const catId = catMap.get(b.catCode);
            if (wardId && catId) {
                await client.query(`
          INSERT INTO beds (organization_id, facility_id, ward_id, room_id, bed_category_id, bed_no, status, features, is_active)
          VALUES ($1, $2, $3, $4, $5, $6, $7, $8, true)
          ON CONFLICT (ward_id, bed_no) DO UPDATE SET
            room_id = EXCLUDED.room_id,
            bed_category_id = EXCLUDED.bed_category_id,
            status = EXCLUDED.status,
            features = EXCLUDED.features,
            is_active = true;
        `, [orgId, facilityId, wardId, roomId || null, catId, b.bedNo, b.status, JSON.stringify(b.features)]);
            }
        }
        // 5. Clean up any leftover mock test admissions and mock patients for real production operation
        await client.query(`
      DELETE FROM bed_assignments WHERE admission_id IN (
        SELECT id FROM admissions WHERE admission_no LIKE 'ADM-IPD-%'
      );
    `);
        await client.query(`
      DELETE FROM discharge_summaries WHERE admission_id IN (
        SELECT id FROM admissions WHERE admission_no LIKE 'ADM-IPD-%'
      );
    `);
        await client.query(`
      DELETE FROM admissions WHERE admission_no LIKE 'ADM-IPD-%';
    `);
        await client.query(`
      DELETE FROM encounters WHERE encounter_no LIKE 'ENC-IPD-%';
    `);
        await client.query(`
      DELETE FROM patients WHERE uhid LIKE 'UHID-IPD-%';
    `);
        // Reset bed statuses to available (excluding real active admissions if any)
        await client.query(`
      UPDATE beds 
      SET status = 'available', updated_at = NOW()
      WHERE id NOT IN (
        SELECT bed_id FROM bed_assignments WHERE assigned_to IS NULL
      );
    `);
        await client.query('COMMIT');
        logger_1.logger.info(`Initialized ${bedsToSeed.length} hospital beds as available without mock data.`);
    }
    catch (error) {
        await client.query('ROLLBACK');
        logger_1.logger.error({ err: error }, 'Failed to seed beds and inpatient structure');
        throw error;
    }
    finally {
        client.release();
    }
}
seedBeds().then(() => process.exit(0)).catch(() => process.exit(1));
