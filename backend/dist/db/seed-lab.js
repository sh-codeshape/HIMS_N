"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.seedLabTests = seedLabTests;
const database_1 = require("../config/database");
async function seedLabTests() {
    const client = await database_1.db.getClient();
    try {
        await client.query('BEGIN');
        // Get all organizations
        const orgRes = await client.query(`SELECT id FROM organizations`);
        const orgIds = orgRes.rows.map((r) => r.id);
        if (!orgIds.includes('00000000-0000-0000-0000-000000000000')) {
            orgIds.push('00000000-0000-0000-0000-000000000000');
        }
        const tests = [
            { code: 'LAB-CBC', name: 'Complete Blood Count (CBC)', section: 'Hematology', sample: 'Blood (EDTA)', price: 350, tat: 4 },
            { code: 'LAB-FBS', name: 'Fasting Blood Sugar (FBS)', section: 'Biochemistry', sample: 'Blood (Fluoride)', price: 120, tat: 3, fasting: true },
            { code: 'LAB-HBA1C', name: 'HbA1c (Glycated Hemoglobin)', section: 'Biochemistry', sample: 'Blood (EDTA)', price: 550, tat: 6 },
            { code: 'LAB-LFT', name: 'Liver Function Test (LFT)', section: 'Biochemistry', sample: 'Serum', price: 750, tat: 6 },
            { code: 'LAB-KFT', name: 'Kidney Function Test (KFT / RFT)', section: 'Biochemistry', sample: 'Serum', price: 650, tat: 6 },
            { code: 'LAB-LIPID', name: 'Lipid Profile - Comprehensive', section: 'Biochemistry', sample: 'Serum', price: 800, tat: 8, fasting: true },
            { code: 'LAB-THYROID', name: 'Thyroid Profile (T3, T4, TSH)', section: 'Hormones', sample: 'Serum', price: 600, tat: 8 },
            { code: 'LAB-URINE', name: 'Urine Routine & Microscopy', section: 'Clinical Pathology', sample: 'Urine', price: 200, tat: 2 },
            { code: 'LAB-DENGUE', name: 'Dengue NS1 & IgM / IgG Combo', section: 'Serology', sample: 'Serum', price: 1100, tat: 4 },
            { code: 'LAB-ELECTRO', name: 'Serum Electrolytes (Na+, K+, Cl-)', section: 'Biochemistry', sample: 'Serum', price: 450, tat: 4 },
            { code: 'LAB-URIC', name: 'Serum Uric Acid', section: 'Biochemistry', sample: 'Serum', price: 250, tat: 3 },
            { code: 'LAB-WIDAL', name: 'Widal Test (Typhoid Slide)', section: 'Serology', sample: 'Serum', price: 280, tat: 3 },
            { code: 'LAB-ESR', name: 'ESR (Westergren Method)', section: 'Hematology', sample: 'Blood (Citrate)', price: 150, tat: 2 },
            { code: 'LAB-VITD', name: 'Vitamin D (25-OH) Total', section: 'Biochemistry', sample: 'Serum', price: 1200, tat: 24 },
            { code: 'LAB-VITB12', name: 'Vitamin B12 (Cyanocobalamin)', section: 'Biochemistry', sample: 'Serum', price: 900, tat: 24 },
        ];
        for (const orgId of orgIds) {
            for (const t of tests) {
                const sRes = await client.query(`INSERT INTO services (organization_id, code, name, service_type, default_rate, is_active)
           VALUES ($1, $2, $3, 'lab_test', $4, true)
           ON CONFLICT (organization_id, code) DO UPDATE SET default_rate = EXCLUDED.default_rate
           RETURNING id`, [orgId, t.code, t.name, t.price]);
                const serviceId = sRes.rows[0].id;
                await client.query(`INSERT INTO lab_test_definitions (service_id, lab_section, specimen_type, tat_hours, fasting_required)
           VALUES ($1, $2, $3, $4, $5)
           ON CONFLICT (service_id) DO UPDATE SET lab_section = EXCLUDED.lab_section, specimen_type = EXCLUDED.specimen_type`, [serviceId, t.section, t.sample, t.tat, !!t.fasting]);
            }
        }
        await client.query('COMMIT');
        console.log(`Seeded standard lab tests for ${orgIds.length} organizations successfully!`);
    }
    catch (err) {
        await client.query('ROLLBACK');
        console.error('Error seeding lab tests:', err);
    }
    finally {
        client.release();
    }
}
if (require.main === module || process.argv[1]?.includes('seed-lab')) {
    seedLabTests().then(() => process.exit(0)).catch(() => process.exit(1));
}
