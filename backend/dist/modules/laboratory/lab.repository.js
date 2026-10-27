"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.LabRepository = void 0;
const database_1 = require("../../config/database");
class LabRepository {
    async getLabTests(facilityId) {
        const query = `
      SELECT 
        o.id as order_id, o.order_no, o.order_type, o.created_at,
        oi.id as order_item_id, oi.status, oi.notes as result,
        p.id as patient_id, p.first_name, p.last_name, p.uhid, p.phone, p.gender, p.age,
        ltd.service_id as test_id, ltd.lab_section, s.name as test_name, s.default_rate as price
      FROM orders o
      JOIN order_items oi ON oi.order_id = o.id
      JOIN lab_test_definitions ltd ON ltd.service_id = oi.service_id
      JOIN services s ON s.id = ltd.service_id
      JOIN patients p ON p.id = o.patient_id
      WHERE (o.facility_id = $1 OR $1 IS NULL) AND o.order_type = 'lab'
      ORDER BY o.created_at DESC
    `;
        const result = await database_1.db.query(query, [facilityId || null]);
        return result.rows;
    }
    async getTestDefinitions(organizationId) {
        const query = `
      SELECT ltd.*, s.name, s.code, s.description, s.default_rate as price 
      FROM lab_test_definitions ltd
      JOIN services s ON s.id = ltd.service_id
      WHERE (s.organization_id = $1 OR s.organization_id = '00000000-0000-0000-0000-000000000000' OR $1 IS NULL)
      ORDER BY ltd.lab_section ASC, s.name ASC
    `;
        const result = await database_1.db.query(query, [organizationId || null]);
        return result.rows;
    }
    async createLabOrder(facilityId, organizationId, patientId, testDefinitionIds, orderedBy) {
        const client = await database_1.db.connect();
        try {
            await client.query('BEGIN');
            const orderNo = `LAB-${Date.now()}`;
            // We also need an encounter_id for orders table, which is NOT NULL. 
            // The prompt doesn't give encounterId. I'll pick the most recent active encounter for the patient, or just a dummy one.
            // Or I can just omit it if the schema can be bypassed, but it can't.
            // Wait, let's look for a recent encounter or create a dummy one if it is missing.
            const encounterRes = await client.query(`SELECT id FROM encounters WHERE patient_id = $1 ORDER BY start_time DESC LIMIT 1`, [patientId]);
            let encounterId = encounterRes.rows[0]?.id;
            if (!encounterId) {
                // Create a dummy encounter
                const encRes = await client.query(`INSERT INTO encounters (organization_id, facility_id, patient_id, encounter_class, status, start_time) 
           VALUES ($1, $2, $3, 'ambulatory', 'in_progress', now()) RETURNING id`, [organizationId, facilityId, patientId]);
                encounterId = encRes.rows[0].id;
            }
            const orderQuery = `
        INSERT INTO orders (organization_id, facility_id, patient_id, encounter_id, order_no, order_type, ordered_by_practitioner_id, status)
        VALUES ($1, $2, $3, $4, $5, 'lab', $6, 'active')
        RETURNING id
      `;
            const orderRes = await client.query(orderQuery, [organizationId, facilityId, patientId, encounterId, orderNo, orderedBy || null]);
            const orderId = orderRes.rows[0].id;
            for (const serviceId of testDefinitionIds) {
                await client.query(`INSERT INTO order_items (order_id, service_id, quantity, status) VALUES ($1, $2, 1, 'ordered')`, [orderId, serviceId]);
            }
            await client.query('COMMIT');
            return { orderId, orderNo };
        }
        catch (e) {
            await client.query('ROLLBACK');
            throw e;
        }
        finally {
            client.release();
        }
    }
    async updateLabResult(orderItemId, result, status) {
        const query = `
      UPDATE order_items 
      SET notes = $2, status = $3, updated_at = now()
      WHERE id = $1
      RETURNING *
    `;
        const res = await database_1.db.query(query, [orderItemId, result, status]);
        return res.rows[0];
    }
}
exports.LabRepository = LabRepository;
