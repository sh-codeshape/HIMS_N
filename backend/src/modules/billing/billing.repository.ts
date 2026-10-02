import { db } from '../../config/database';

export class BillingRepository {
  async createInvoice(
    facilityId: string,
    organizationId: string,
    patientId: string,
    encounterId: string | undefined,
    items: { service_id?: string; description: string; quantity: number; rate: number }[],
    createdById: string
  ) {
    const client = await db.connect();
    
    try {
      await client.query('BEGIN');

      const invoiceNo = `INV-${Date.now()}`;
      
      let subtotal = 0;
      items.forEach(item => {
        subtotal += item.quantity * item.rate;
      });
      // simplified calculation
      const netAmount = subtotal; 

      // 1. Create Invoice
      const invoiceQuery = `
        INSERT INTO invoices (
          organization_id,
          facility_id,
          patient_id,
          encounter_id,
          invoice_no,
          invoice_date,
          due_date,
          status,
          subtotal,
          total_discount,
          total_tax,
          net_amount,
          amount_due,
          created_by
        ) VALUES ($1, $2, $3, $4, $5, NOW(), NOW(), 'draft', $6, 0, 0, $7, $8, $9)
        RETURNING *;
      `;
      
      const invoiceResult = await client.query(invoiceQuery, [
        organizationId,
        facilityId,
        patientId,
        encounterId,
        invoiceNo,
        subtotal,
        netAmount,
        netAmount,
        createdById
      ]);
      const invoice = invoiceResult.rows[0];

      // 2. Insert Invoice Lines
      for (const item of items) {
        const lineQuery = `
          INSERT INTO invoice_lines (
            invoice_id,
            service_id,
            description,
            quantity,
            unit_price,
            gross_amount,
            net_amount
          ) VALUES ($1, $2, $3, $4, $5, $6, $7)
        `;
        const lineGross = item.quantity * item.rate;
        await client.query(lineQuery, [
          invoice.id,
          item.service_id,
          item.description,
          item.quantity,
          item.rate,
          lineGross,
          lineGross
        ]);
      }

      await client.query('COMMIT');
      return invoice;
    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }
  }

  async getInvoices(facilityId: string) {
    const query = `
      SELECT i.*, p.first_name, p.last_name, p.uhid
      FROM invoices i
      JOIN patients p ON i.patient_id = p.id
      WHERE i.facility_id = $1
      ORDER BY i.created_at DESC;
    `;
    const result = await db.query(query, [facilityId]);
    return result.rows;
  }
}
