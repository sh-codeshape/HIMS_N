import { db } from '../../config/database';

export class PharmacyRepository {
  async getMedicines(facilityId: string, organizationId: string) {
    const query = `
      SELECT 
        i.id,
        i.name,
        i.generic_name,
        c.name as category_name,
        i.base_uom as unit_of_measure,
        COALESCE(SUM(sb.quantity_on_hand), 0) as stock,
        json_agg(json_build_object(
          'batch_no', sb.batch_no,
          'expiry_date', sb.expiry_date,
          'mrp', sb.mrp,
          'quantity_on_hand', sb.quantity_on_hand
        )) filter (where sb.id is not null and sb.quantity_on_hand > 0) as batches
      FROM items i
      LEFT JOIN item_categories c ON c.id = i.category_id
      LEFT JOIN stock_batches sb ON sb.item_id = i.id 
      LEFT JOIN stores st ON st.id = sb.store_id AND st.facility_id = $1
      WHERE i.organization_id = $2 AND i.item_type IN ('drug', 'consumable')
      GROUP BY i.id, i.name, i.generic_name, c.name, i.base_uom
      HAVING COALESCE(SUM(sb.quantity_on_hand), 0) > 0
    `;
    const result = await db.query(query, [facilityId, organizationId]);
    return result.rows;
  }

  async dispenseMedicine(
    facilityId: string,
    organizationId: string,
    itemId: string,
    quantity: number,
    patientId?: string,
    encounterId?: string
  ) {
    const client = await db.connect();
    try {
      await client.query('BEGIN');

      const storeRes = await client.query(
        `SELECT id FROM stores WHERE facility_id = $1 AND store_type = 'pharmacy' LIMIT 1`,
        [facilityId]
      );
      if (storeRes.rows.length === 0) throw new Error('No pharmacy store found for this facility');
      const storeId = storeRes.rows[0].id;

      const dispensationNo = `DISP-\${Date.now()}`;
      const dispRes = await client.query(
        `INSERT INTO dispensations (organization_id, facility_id, store_id, dispensation_no, kind, patient_id, encounter_id, status, dispensed_at)
         VALUES ($1, $2, $3, $4, 'sale', $5, $6, 'completed', now()) RETURNING id`,
         [organizationId, facilityId, storeId, dispensationNo, patientId || null, encounterId || null]
      );
      const dispensationId = dispRes.rows[0].id;

      const batchesRes = await client.query(
        `SELECT id, batch_no, quantity_on_hand, mrp, sale_rate 
         FROM stock_batches 
         WHERE item_id = $1 AND store_id = $2 AND quantity_on_hand > 0 
         ORDER BY expiry_date ASC`,
        [itemId, storeId]
      );

      let remainingQuantity = quantity;
      let totalAmount = 0;

      for (const batch of batchesRes.rows) {
        if (remainingQuantity <= 0) break;

        const take = Math.min(Number(batch.quantity_on_hand), remainingQuantity);
        remainingQuantity -= take;

        const unitPrice = Number(batch.sale_rate || batch.mrp || 0);
        const lineTotal = take * unitPrice;
        totalAmount += lineTotal;

        await client.query(
          `UPDATE stock_batches SET quantity_on_hand = quantity_on_hand - $1, updated_at = now() WHERE id = $2`,
          [take, batch.id]
        );

        await client.query(
          `INSERT INTO dispensation_items (dispensation_id, item_id, batch_id, quantity, unit_price, mrp, line_total)
           VALUES ($1, $2, $3, $4, $5, $6, $7)`,
          [dispensationId, itemId, batch.id, take, unitPrice, batch.mrp, lineTotal]
        );
      }

      if (remainingQuantity > 0) {
        throw new Error('Insufficient stock');
      }

      await client.query(
        `UPDATE dispensations SET total_amount = $1, subtotal = $1 WHERE id = $2`,
        [totalAmount, dispensationId]
      );

      await client.query('COMMIT');
      return { dispensationId, dispensationNo, totalAmount };
    } catch (e) {
      await client.query('ROLLBACK');
      throw e;
    } finally {
      client.release();
    }
  }

  async getExpiringMedicines(facilityId: string, organizationId: string, daysAhead: number = 90) {
    const query = `
      SELECT 
        sb.batch_no, sb.expiry_date, sb.quantity_on_hand,
        i.name as item_name, i.code as item_code,
        st.name as store_name
      FROM stock_batches sb
      JOIN items i ON i.id = sb.item_id
      JOIN stores st ON st.id = sb.store_id
      WHERE st.facility_id = $1 AND i.organization_id = $2
        AND sb.quantity_on_hand > 0
        AND sb.expiry_date < (NOW() + interval '1 day' * $3)
      ORDER BY sb.expiry_date ASC
    `;
    const result = await db.query(query, [facilityId, organizationId, daysAhead]);
    return result.rows;
  }
}
