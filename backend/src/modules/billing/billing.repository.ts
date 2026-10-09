import { db } from '../../config/database';

export class BillingRepository {
  async createInvoice(data: any) {
    const client = await db.getClient();
    try {
      await client.query('BEGIN');

      const invoiceNo = `INV-${Date.now()}`;
      
      const invoiceQuery = `
        INSERT INTO invoices (
          organization_id, facility_id, patient_id, invoice_no, invoice_type, status,
          subtotal, discount_total, total_amount, due_amount, paid_amount, issued_at
        ) VALUES (
          $1, $2, $3, $4, $5, 'draft',
          $6, $7, $8, $8, 0, NOW()
        ) RETURNING *;
      `;

      const invoiceRes = await client.query(invoiceQuery, [
        data.organization_id,
        data.facility_id,
        data.patient_id,
        invoiceNo,
        data.invoice_type,
        data.subtotal,
        data.discount_total,
        data.total_amount
      ]);
      const invoice = invoiceRes.rows[0];

      let lineNo = 1;
      for (const item of data.items) {
        const taxableAmount = item.qty * item.price;
        const lineTotal = taxableAmount;
        const lineQuery = `
          INSERT INTO invoice_lines (
            invoice_id, line_no, description, quantity, unit_price, taxable_amount, line_total
          ) VALUES (
            $1, $2, $3, $4, $5, $6, $7
          )
        `;
        await client.query(lineQuery, [
          invoice.id,
          lineNo++,
          item.name,
          item.qty,
          item.price,
          taxableAmount,
          lineTotal
        ]);
      }

      if (data.payment_mode && data.total_amount > 0) {
        const methodRes = await client.query('SELECT id FROM payment_methods WHERE name ILIKE $1 OR method_type ILIKE $1 LIMIT 1', [`%${data.payment_mode}%`]);
        let methodId = methodRes.rows[0]?.id;
        
        if (!methodId) {
          const anyMethodRes = await client.query('SELECT id FROM payment_methods LIMIT 1');
          methodId = anyMethodRes.rows[0]?.id;
        }
        
        if (methodId) {
          const receiptNo = `REC-${Date.now()}`;
          const paymentQuery = `
            INSERT INTO payments (
              organization_id, facility_id, receipt_no, patient_id, direction, payment_type, payment_method_id,
              amount, allocated_amount, status
            ) VALUES (
              $1, $2, $3, $4, 'in', 'invoice_payment', $5,
              $6, $6, 'completed'
            ) RETURNING *;
          `;
          const payRes = await client.query(paymentQuery, [
            data.organization_id,
            data.facility_id,
            receiptNo,
            data.patient_id,
            methodId,
            data.total_amount
          ]);
          const payment = payRes.rows[0];
          
          await client.query(`
            INSERT INTO payment_allocations (payment_id, invoice_id, amount)
            VALUES ($1, $2, $3)
          `, [payment.id, invoice.id, data.total_amount]);
        }

        // Update invoice status to paid after lines and payment allocations are created
        const updateInvoiceRes = await client.query(`
          UPDATE invoices 
          SET status = 'paid', due_amount = 0, paid_amount = $1
          WHERE id = $2
          RETURNING *;
        `, [data.total_amount, invoice.id]);
        
        invoice.status = updateInvoiceRes.rows[0].status;
        invoice.due_amount = updateInvoiceRes.rows[0].due_amount;
        invoice.paid_amount = updateInvoiceRes.rows[0].paid_amount;
      }

      await client.query('COMMIT');
      return invoice;
    } catch (e) {
      await client.query('ROLLBACK');
      throw e;
    } finally {
      client.release();
    }
  }

  async listInvoices(facilityId: string) {
    const query = `
      SELECT i.*, p.first_name, p.last_name, p.uhid 
      FROM invoices i
      JOIN patients p ON i.patient_id = p.id
      WHERE i.facility_id = $1
      ORDER BY i.created_at DESC
    `;
    const res = await db.query(query, [facilityId]);
    return res.rows;
  }

  async getInvoice(id: string, facilityId: string) {
    const query = `
      SELECT i.*, p.first_name, p.last_name, p.uhid
      FROM invoices i
      JOIN patients p ON i.patient_id = p.id
      WHERE i.id = $1 AND i.facility_id = $2
    `;
    const res = await db.query(query, [id, facilityId]);
    if (res.rows.length === 0) return null;

    const invoice = res.rows[0];

    const linesQuery = `
      SELECT * FROM invoice_lines WHERE invoice_id = $1 ORDER BY line_no ASC
    `;
    const linesRes = await db.query(linesQuery, [id]);
    invoice.items = linesRes.rows;

    return invoice;
  }

  async addCharge(data: any) {
    const query = `
      INSERT INTO charges (
        organization_id, facility_id, patient_id, encounter_id,
        service_id, item_id, description, department_id,
        quantity, unit_price, discount_percent, discount_amount,
        taxable_amount, tax_amount, net_amount, status, created_by
      ) VALUES (
        $1, $2, $3, $4,
        $5, $6, $7, $8,
        $9, $10, $11, $12,
        $13, $14, $15, 'billable', $16
      ) RETURNING *;
    `;
    const qty = data.quantity || 1;
    const price = data.unit_price;
    const gross = qty * price;
    const discPct = data.discount_percent || 0;
    const discAmt = data.discount_amount || (gross * discPct / 100);
    const taxable = gross - discAmt;
    const taxAmt = data.tax_amount || 0;
    const net = taxable + taxAmt;

    const res = await db.query(query, [
      data.organization_id, data.facility_id, data.patient_id, data.encounter_id,
      data.service_id || null, data.item_id || null, data.description, data.department_id || null,
      qty, price, discPct, discAmt,
      taxable, taxAmt, net, data.user_id
    ]);
    return res.rows[0];
  }

  async removeCharge(id: string, facilityId: string) {
    const query = `
      UPDATE charges 
      SET status = 'cancelled', updated_at = NOW()
      WHERE id = $1 AND facility_id = $2 AND status = 'billable'
      RETURNING *;
    `;
    const res = await db.query(query, [id, facilityId]);
    return res.rows[0];
  }

  async getRunningBill(encounterId: string, facilityId: string) {
    const query = `
      SELECT c.*, s.name as service_name, i.name as item_name
      FROM charges c
      LEFT JOIN services s ON c.service_id = s.id
      LEFT JOIN items i ON c.item_id = i.id
      WHERE c.encounter_id = $1 AND c.facility_id = $2 AND c.status = 'billable'
      ORDER BY c.charged_at DESC
    `;
    const res = await db.query(query, [encounterId, facilityId]);
    return res.rows;
  }

  async recordAdvancePayment(data: any) {
    const receiptNo = \`ADV-\${Date.now()}\`;
    
    // Fallback payment method logic
    let methodId = data.payment_method_id;
    if (!methodId) {
       const methodRes = await db.query('SELECT id FROM payment_methods WHERE name ILIKE $1 OR method_type ILIKE $1 LIMIT 1', [\`%\${data.payment_mode}%\`]);
       methodId = methodRes.rows[0]?.id;
       if (!methodId) {
         const anyMethodRes = await db.query('SELECT id FROM payment_methods LIMIT 1');
         methodId = anyMethodRes.rows[0]?.id;
       }
    }

    const query = `
      INSERT INTO payments (
        organization_id, facility_id, receipt_no, patient_id, encounter_id,
        direction, payment_type, payment_method_id, amount, status, received_by
      ) VALUES (
        $1, $2, $3, $4, $5,
        'in', 'advance', $6, $7, 'completed', $8
      ) RETURNING *;
    `;
    const res = await db.query(query, [
      data.organization_id, data.facility_id, receiptNo, data.patient_id, data.encounter_id,
      methodId, data.amount, data.user_id
    ]);
    return res.rows[0];
  }

  async getEncounterPayments(encounterId: string, facilityId: string) {
    const query = `
      SELECT p.*, pm.name as payment_method_name
      FROM payments p
      LEFT JOIN payment_methods pm ON p.payment_method_id = pm.id
      WHERE p.encounter_id = $1 AND p.facility_id = $2 AND p.payment_type = 'advance'
      ORDER BY p.paid_at DESC
    `;
    const res = await db.query(query, [encounterId, facilityId]);
    return res.rows;
  }
}
