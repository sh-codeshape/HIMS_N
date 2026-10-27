"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const database_1 = require("../config/database");
const logger_1 = require("../config/logger");
async function seedBeds() {
    const client = await database_1.db.getClient();
    try {
        await client.query('BEGIN');
        logger_1.logger.info('Starting bed and inpatient data seeding...');
        const orgId = '00000000-0000-0000-0000-000000000000';
        const facilityId = orgId;
        // 1. Bed Categories
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
        // 2. Wards
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
            { wardCode: 'W-GEN-M', roomNo: '101', bedNo: 'GWM-101-B', catCode: 'GEN', status: 'occupied', features: { oxygen: true, manual_crank: true } },
            { wardCode: 'W-GEN-M', roomNo: '101', bedNo: 'GWM-101-C', catCode: 'GEN', status: 'available', features: { oxygen: false, manual_crank: true } },
            { wardCode: 'W-GEN-M', roomNo: '101', bedNo: 'GWM-101-D', catCode: 'GEN', status: 'cleaning', features: { oxygen: false, manual_crank: true } },
            { wardCode: 'W-GEN-M', roomNo: '102', bedNo: 'GWM-102-A', catCode: 'GEN', status: 'available', features: { oxygen: true, manual_crank: true } },
            { wardCode: 'W-GEN-M', roomNo: '102', bedNo: 'GWM-102-B', catCode: 'GEN', status: 'occupied', features: { oxygen: true, manual_crank: true } },
            { wardCode: 'W-GEN-M', roomNo: '102', bedNo: 'GWM-102-C', catCode: 'GEN', status: 'maintenance', features: { oxygen: false, manual_crank: true } },
            // General Ward Female (Rooms 103, 104)
            { wardCode: 'W-GEN-F', roomNo: '103', bedNo: 'GWF-103-A', catCode: 'GEN', status: 'available', features: { oxygen: true, manual_crank: true } },
            { wardCode: 'W-GEN-F', roomNo: '103', bedNo: 'GWF-103-B', catCode: 'GEN', status: 'occupied', features: { oxygen: true, manual_crank: true } },
            { wardCode: 'W-GEN-F', roomNo: '103', bedNo: 'GWF-103-C', catCode: 'GEN', status: 'available', features: { oxygen: false, manual_crank: true } },
            { wardCode: 'W-GEN-F', roomNo: '104', bedNo: 'GWF-104-A', catCode: 'GEN', status: 'available', features: { oxygen: true, manual_crank: true } },
            { wardCode: 'W-GEN-F', roomNo: '104', bedNo: 'GWF-104-B', catCode: 'GEN', status: 'cleaning', features: { oxygen: false, manual_crank: true } },
            { wardCode: 'W-GEN-F', roomNo: '104', bedNo: 'GWF-104-C', catCode: 'GEN', status: 'occupied', features: { oxygen: true, manual_crank: true } },
            // Semi-Private Ward (Rooms 201, 202, 203)
            { wardCode: 'W-SEMI', roomNo: '201', bedNo: 'SP-201-A', catCode: 'SEMI', status: 'available', features: { oxygen: true, monitor: true, semi_motorized: true } },
            { wardCode: 'W-SEMI', roomNo: '201', bedNo: 'SP-201-B', catCode: 'SEMI', status: 'occupied', features: { oxygen: true, monitor: true, semi_motorized: true } },
            { wardCode: 'W-SEMI', roomNo: '202', bedNo: 'SP-202-A', catCode: 'SEMI', status: 'available', features: { oxygen: true, monitor: false, semi_motorized: true } },
            { wardCode: 'W-SEMI', roomNo: '202', bedNo: 'SP-202-B', catCode: 'SEMI', status: 'available', features: { oxygen: true, monitor: false, semi_motorized: true } },
            { wardCode: 'W-SEMI', roomNo: '203', bedNo: 'SP-203-A', catCode: 'SEMI', status: 'occupied', features: { oxygen: true, monitor: true, semi_motorized: true } },
            { wardCode: 'W-SEMI', roomNo: '203', bedNo: 'SP-203-B', catCode: 'SEMI', status: 'maintenance', features: { oxygen: true, monitor: false, semi_motorized: true } },
            // Private Deluxe Ward (Rooms 301 - 304)
            { wardCode: 'W-PVT', roomNo: '301', bedNo: 'PVT-301', catCode: 'PVT', status: 'occupied', features: { oxygen: true, monitor: true, motorized: true, ac: true, tv: true } },
            { wardCode: 'W-PVT', roomNo: '302', bedNo: 'PVT-302', catCode: 'PVT', status: 'available', features: { oxygen: true, monitor: true, motorized: true, ac: true, tv: true } },
            { wardCode: 'W-PVT', roomNo: '303', bedNo: 'PVT-303', catCode: 'PVT', status: 'available', features: { oxygen: true, monitor: true, motorized: true, ac: true, tv: true } },
            { wardCode: 'W-PVT', roomNo: '304', bedNo: 'PVT-304', catCode: 'PVT', status: 'cleaning', features: { oxygen: true, monitor: true, motorized: true, ac: true, tv: true } },
            // ICU (Rooms ICU-Pod-A, ICU-Pod-B)
            { wardCode: 'W-ICU', roomNo: 'ICU-Pod-A', bedNo: 'ICU-01', catCode: 'ICU', status: 'occupied', features: { ventilator: true, monitor: true, oxygen: true, infusion_pump: true, motorized: true } },
            { wardCode: 'W-ICU', roomNo: 'ICU-Pod-A', bedNo: 'ICU-02', catCode: 'ICU', status: 'available', features: { ventilator: true, monitor: true, oxygen: true, infusion_pump: true, motorized: true } },
            { wardCode: 'W-ICU', roomNo: 'ICU-Pod-A', bedNo: 'ICU-03', catCode: 'ICU', status: 'occupied', features: { ventilator: true, monitor: true, oxygen: true, infusion_pump: true, motorized: true } },
            { wardCode: 'W-ICU', roomNo: 'ICU-Pod-B', bedNo: 'ICU-04', catCode: 'ICU', status: 'available', features: { ventilator: false, monitor: true, oxygen: true, motorized: true } },
            { wardCode: 'W-ICU', roomNo: 'ICU-Pod-B', bedNo: 'ICU-05', catCode: 'ICU', status: 'cleaning', features: { ventilator: true, monitor: true, oxygen: true, motorized: true } },
            { wardCode: 'W-ICU', roomNo: 'ICU-Pod-B', bedNo: 'ICU-06', catCode: 'ICU', status: 'available', features: { ventilator: false, monitor: true, oxygen: true, motorized: true } },
            // Emergency & Trauma Ward (Room ER-Trauma)
            { wardCode: 'W-EMG', roomNo: 'ER-Trauma', bedNo: 'EMG-01', catCode: 'EMG', status: 'occupied', features: { oxygen: true, monitor: true, defibrillator: true } },
            { wardCode: 'W-EMG', roomNo: 'ER-Trauma', bedNo: 'EMG-02', catCode: 'EMG', status: 'available', features: { oxygen: true, monitor: true } },
            { wardCode: 'W-EMG', roomNo: 'ER-Trauma', bedNo: 'EMG-03', catCode: 'EMG', status: 'available', features: { oxygen: true, monitor: true } },
            { wardCode: 'W-EMG', roomNo: 'ER-Trauma', bedNo: 'EMG-04', catCode: 'EMG', status: 'blocked', features: { oxygen: false, monitor: false } },
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
        logger_1.logger.info(`Seeded ${bedsToSeed.length} beds successfully.`);
        // 5. Query Practitioners
        const pracRows = (await client.query(`SELECT id FROM practitioners LIMIT 3`)).rows;
        const doc1 = pracRows[0]?.id;
        const doc2 = pracRows[1]?.id || doc1;
        const doc3 = pracRows[2]?.id || doc1;
        // 6. Test Patients for Occupied Beds & Discharged History
        const samplePatients = [
            { uhid: 'UHID-IPD-101', first: 'Aarav', last: 'Sharma', gender: 'male', dob: '1984-03-12', phone: '9811223344', bedNo: 'GWM-101-B', dx: 'Acute Appendicitis with Mild Peritonitis', daysAgo: 3 },
            { uhid: 'UHID-IPD-102', first: 'Rajesh', last: 'Verma', gender: 'male', dob: '1972-07-25', phone: '9822334455', bedNo: 'GWM-102-B', dx: 'Exacerbation of COPD with LRTI', daysAgo: 5 },
            { uhid: 'UHID-IPD-103', first: 'Sunita', last: 'Devi', gender: 'female', dob: '1991-11-04', phone: '9833445566', bedNo: 'GWF-103-B', dx: 'Dengue Fever with Severe Thrombocytopenia', daysAgo: 2 },
            { uhid: 'UHID-IPD-104', first: 'Pooja', last: 'Singh', gender: 'female', dob: '1988-06-19', phone: '9844556677', bedNo: 'GWF-104-C', dx: 'Acute Pancreatitis (Biliary etiology)', daysAgo: 4 },
            { uhid: 'UHID-IPD-105', first: 'Vikram', last: 'Malhotra', gender: 'male', dob: '1965-02-14', phone: '9855667788', bedNo: 'SP-201-B', dx: 'Uncontrolled Type 2 Diabetes & Foot Ulcer', daysAgo: 6 },
            { uhid: 'UHID-IPD-106', first: 'Meera', last: 'Kapoor', gender: 'female', dob: '1979-09-30', phone: '9866778899', bedNo: 'SP-203-A', dx: 'Laparoscopic Cholecystectomy Post-Op', daysAgo: 1 },
            { uhid: 'UHID-IPD-107', first: 'Amitabh', last: 'Singhania', gender: 'male', dob: '1958-12-08', phone: '9877889900', bedNo: 'PVT-301', dx: 'Post-PTCA Cardiac Observation', daysAgo: 2 },
            { uhid: 'UHID-IPD-108', first: 'Harsh', last: 'Gupta', gender: 'male', dob: '1952-04-17', phone: '9888990011', bedNo: 'ICU-01', dx: 'Severe ARDS secondary to Viral Pneumonia', daysAgo: 7 },
            { uhid: 'UHID-IPD-109', first: 'Kiran', last: 'Patel', gender: 'female', dob: '1963-08-22', phone: '9899001122', bedNo: 'ICU-03', dx: 'Septic Shock with Multi-organ Dysfunction', daysAgo: 4 },
            { uhid: 'UHID-IPD-110', first: 'Sanjay', last: 'Rao', gender: 'male', dob: '1995-10-10', phone: '9900112233', bedNo: 'EMG-01', dx: 'Road Traffic Accident - Multiple Contusions', daysAgo: 1 },
            // Discharged test patients
            { uhid: 'UHID-IPD-111', first: 'Rohan', last: 'Mehta', gender: 'male', dob: '1987-01-15', phone: '9911223344', bedNo: 'GWM-101-A', dx: 'Viral Gastroenteritis with Dehydration', daysAgo: 4, dischargedDaysAgo: 1, type: 'normal' },
            { uhid: 'UHID-IPD-112', first: 'Ananya', last: 'Deshmukh', gender: 'female', dob: '1993-05-20', phone: '9922334455', bedNo: 'GWF-103-A', dx: 'Acute Bronchial Asthma', daysAgo: 3, dischargedDaysAgo: 1, type: 'normal' },
        ];
        for (let i = 0; i < samplePatients.length; i++) {
            const p = samplePatients[i];
            const doc = i % 3 === 0 ? doc1 : (i % 3 === 1 ? doc2 : doc3);
            // Insert patient
            await client.query(`
        INSERT INTO patients (organization_id, uhid, first_name, last_name, date_of_birth, gender, phone)
        VALUES ($1, $2, $3, $4, $5, $6, $7)
        ON CONFLICT (organization_id, uhid) DO UPDATE SET
          first_name = EXCLUDED.first_name,
          last_name = EXCLUDED.last_name,
          phone = EXCLUDED.phone;
      `, [orgId, p.uhid, p.first, p.last, p.dob, p.gender, p.phone]);
            const patientId = (await client.query(`SELECT id FROM patients WHERE uhid = $1`, [p.uhid])).rows[0].id;
            const encNo = `ENC-IPD-${p.uhid.slice(-3)}`;
            // Insert encounter
            const encStatus = p.dischargedDaysAgo ? 'finished' : 'in_progress';
            await client.query(`
        INSERT INTO encounters (
          organization_id, facility_id, encounter_no, patient_id, encounter_type, status,
          primary_practitioner_id, chief_complaint, started_at
        )
        VALUES ($1, $2, $3, $4, 'ipd', $5, $6, $7, NOW() - ($8 || ' days')::interval)
        ON CONFLICT (facility_id, encounter_no) DO UPDATE SET
          status = EXCLUDED.status;
      `, [orgId, facilityId, encNo, patientId, encStatus, doc, p.dx, p.daysAgo]);
            const encounterId = (await client.query(`SELECT id FROM encounters WHERE encounter_no = $1 AND facility_id = $2`, [encNo, facilityId])).rows[0].id;
            const admNo = `ADM-IPD-${p.uhid.slice(-3)}`;
            const admStatus = p.dischargedDaysAgo ? 'discharged' : 'admitted';
            const dischargedAt = p.dischargedDaysAgo ? `NOW() - interval '${p.dischargedDaysAgo} days'` : null;
            const dischargeType = p.dischargedDaysAgo ? p.type : null;
            const dischargeCondition = p.dischargedDaysAgo ? 'Clinically Stable & Symptom Free' : null;
            // Insert admission
            await client.query(`
        INSERT INTO admissions (
          organization_id, facility_id, encounter_id, patient_id, admission_no,
          admitting_practitioner_id, attending_practitioner_id, admission_diagnosis,
          admission_type, status, admitted_at, discharged_at, discharge_type, discharge_condition
        )
        VALUES (
          $1, $2, $3, $4, $5, $6, $6, $7, 'emergency', $8,
          NOW() - ($9 || ' days')::interval,
          ${dischargedAt ? dischargedAt : 'NULL'},
          $10, $11
        )
        ON CONFLICT (facility_id, admission_no) DO UPDATE SET
          status = EXCLUDED.status,
          admission_diagnosis = EXCLUDED.admission_diagnosis,
          discharged_at = EXCLUDED.discharged_at,
          discharge_type = EXCLUDED.discharge_type,
          discharge_condition = EXCLUDED.discharge_condition;
      `, [orgId, facilityId, encounterId, patientId, admNo, doc, p.dx, admStatus, p.daysAgo, dischargeType, dischargeCondition]);
            const admissionId = (await client.query(`SELECT id FROM admissions WHERE admission_no = $1 AND facility_id = $2`, [admNo, facilityId])).rows[0].id;
            // Find bed
            const bedRow = (await client.query(`SELECT id FROM beds WHERE bed_no = $1 AND facility_id = $2`, [p.bedNo, facilityId])).rows[0];
            if (bedRow) {
                const bedId = bedRow.id;
                // Clean previous active bed assignments for this bed & admission
                await client.query(`
          DELETE FROM bed_assignments WHERE admission_id = $1 OR (bed_id = $2 AND assigned_to IS NULL);
        `, [admissionId, bedId]);
                if (p.dischargedDaysAgo) {
                    // Closed assignment
                    await client.query(`
            INSERT INTO bed_assignments (admission_id, bed_id, assigned_from, assigned_to)
            VALUES ($1, $2, NOW() - ($3 || ' days')::interval, NOW() - ($4 || ' days')::interval);
          `, [admissionId, bedId, p.daysAgo, p.dischargedDaysAgo]);
                    // Seed discharge summary for discharged patients
                    await client.query(`
            INSERT INTO discharge_summaries (
              admission_id, encounter_id, patient_id, final_diagnosis,
              history_of_present_illness, hospital_course, procedures_performed,
              condition_at_discharge, follow_up_instructions, follow_up_date,
              diet_advice, activity_advice, status, authored_by, signed_at, data
            ) VALUES (
              $1, $2, $3, $4,
              'Presented with acute symptoms. Vital signs stabilized after IV fluids and symptomatic care.',
              'Patient responded well to protocol treatment. Afebrile for 48 hours with normal laboratory vitals.',
              'Routine diagnostic workup and non-invasive monitoring.',
              'Stable, hemodynamically normal',
              'Review in OPD after 5 days with repeat blood work.',
              CURRENT_DATE + INTERVAL '5 days',
              'Soft diet, high fluid intake, avoid spicy food',
              'Adequate bed rest, avoid strenuous exercise',
              'finalized', $5, NOW() - INTERVAL '1 day',
              '{"medications": [{"name": "Tab Paracetamol 650mg", "dosage": "TDS", "days": "3 days"}, {"name": "Cap Pantoprazole 40mg", "dosage": "OD (Empty Stomach)", "days": "5 days"}]}'::jsonb
            )
            ON CONFLICT (admission_id) DO UPDATE SET
              final_diagnosis = EXCLUDED.final_diagnosis,
              status = EXCLUDED.status;
          `, [admissionId, encounterId, patientId, p.dx, doc]);
                }
                else {
                    // Active assignment
                    await client.query(`
            INSERT INTO bed_assignments (admission_id, bed_id, assigned_from)
            VALUES ($1, $2, NOW() - ($3 || ' days')::interval);
          `, [admissionId, bedId, p.daysAgo]);
                    // Ensure bed status is occupied
                    await client.query(`
            UPDATE beds SET status = 'occupied', updated_at = NOW() WHERE id = $1;
          `, [bedId]);
                }
            }
        }
        await client.query('COMMIT');
        logger_1.logger.info('Bed and inpatient seeding completed successfully!');
    }
    catch (error) {
        await client.query('ROLLBACK');
        logger_1.logger.error({ err: error }, 'Failed to seed beds and inpatient data');
        throw error;
    }
    finally {
        client.release();
    }
}
seedBeds().then(() => process.exit(0)).catch(() => process.exit(1));
