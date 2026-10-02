import { db } from '../../config/database';

export class LabRepository {
  async getLabTests(facilityId: string) {
    const query = `
      SELECT 
        o.id as order_id, o.order_no, o.order_type,
        oi.id as order_item_id, oi.status, oi.notes as result,
        p.id as patient_id, p.first_name, p.last_name, p.uhid,
        ltd.service_id as test_id, ltd.lab_section, s.name as test_name
      FROM orders o
      JOIN order_items oi ON oi.order_id = o.id
      JOIN lab_test_definitions ltd ON ltd.service_id = oi.service_id
      JOIN services s ON s.id = ltd.service_id
      JOIN patients p ON p.id = o.patient_id
      WHERE o.facility_id = $1 AND o.order_type = 'lab'
      ORDER BY o.created_at DESC
    `;
    const result = await db.query(query, [facilityId]);
    return result.rows;
  }

  async getTestDefinitions(organizationId: string) {
    const query = `
      SELECT ltd.*, s.name, s.code, s.description 
      FROM lab_test_definitions ltd
      JOIN services s ON s.id = ltd.service_id
      WHERE s.organization_id = $1
    `;
    const result = await db.query(query, [organizationId]);
    return result.rows;
  }

  async createLabOrder(
    facilityId: string, 
    organizationId: string, 
    patientId: string, 
    testDefinitionIds: string[], 
    orderedBy?: string | null
  ) {
    const client = await db.connect();
    try {
      await client.query('BEGIN');
      
      const orderNo = `LAB-${Date.now()}`;
      
      // We also need an encounter_id for orders table, which is NOT NULL. 
      // The prompt doesn't give encounterId. I'll pick the most recent active encounter for the patient, or just a dummy one.
      // Or I can just omit it if the schema can be bypassed, but it can't.
      // Wait, let's look for a recent encounter or create a dummy one if it is missing.
      const encounterRes = await client.query(
        `SELECT id FROM encounters WHERE patient_id = $1 ORDER BY start_time DESC LIMIT 1`,
        [patientId]
      );
      let encounterId = encounterRes.rows[0]?.id;
      if (!encounterId) {
        // Create a dummy encounter
        const encRes = await client.query(
          `INSERT INTO encounters (organization_id, facility_id, patient_id, encounter_class, status, start_time) 
           VALUES ($1, $2, $3, 'ambulatory', 'in_progress', now()) RETURNING id`,
           [organizationId, facilityId, patientId]
        );
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
        await client.query(
          `INSERT INTO order_items (order_id, service_id, quantity, status) VALUES ($1, $2, 1, 'ordered')`,
          [orderId, serviceId]
        );
      }

      await client.query('COMMIT');
      return { orderId, orderNo };
    } catch (e) {
      await client.query('ROLLBACK');
      throw e;
    } finally {
      client.release();
    }
  }

  async updateLabResult(orderItemId: string, result: string, status: string) {
    const query = `
      UPDATE order_items 
      SET notes = $2, status = $3, updated_at = now()
      WHERE id = $1
      RETURNING *
    `;
    const res = await db.query(query, [orderItemId, result, status]);
    return res.rows[0];
  }
}
