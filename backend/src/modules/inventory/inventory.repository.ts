import { db } from '../../config/database';
import { NotFoundError, ConflictError } from '../../shared/errors/AppError';
import { logger } from '../../config/logger';

/* ================================================================== */
/*  Item Categories                                                   */
/* ================================================================== */
export class InventoryRepository {
  /* ---- Categories ---- */

  async listCategories({
    organization_id,
    is_active,
    search,
    page = 1,
    limit = 50,
  }: {
    organization_id?: string;
    is_active?: string;
    search?: string;
    page?: number;
    limit?: number;
  }) {
    const conditions: string[] = [];
    const params: any[] = [];
    let paramIdx = 1;

    if (organization_id) {
      conditions.push(`organization_id = $${paramIdx++}`);
      params.push(organization_id);
    }
    if (is_active !== undefined) {
      conditions.push(`is_active = $${paramIdx++}`);
      params.push(is_active === 'true');
    }
    if (search) {
      conditions.push(`(name ILIKE $${paramIdx} OR code ILIKE $${paramIdx})`);
      params.push(`%${search}%`);
      paramIdx++;
    }

    const where = conditions.length ? `WHERE ${conditions.join(' AND ')}` : '';

    const countQuery = `
      SELECT count(*)::int FROM item_categories ${where}
    `;
    const countRes = await db.query(countQuery, params);
    const total = countRes.rows[0].count;

    const offset = (page - 1) * limit;
    const dataQuery = `
      SELECT
        id, organization_id, parent_id, code, name, category_type, is_active
      FROM item_categories
      ${where}
      ORDER BY name ASC
      LIMIT $${paramIdx++} OFFSET $${paramIdx++}
    `;
    params.push(limit, offset);
    const dataRes = await db.query(dataQuery, params);

    return { data: dataRes.rows, meta: { page, limit, total } };
  }

  async getCategory(id: string) {
    const res = await db.query(
      `SELECT * FROM item_categories WHERE id = $1`,
      [id]
    );
    if (res.rows.length === 0) throw new NotFoundError('Item category not found');
    return res.rows[0];
  }

  async createCategory(payload: any) {
    const {
      organization_id, parent_id, code, name, category_type, is_active,
    } = payload;

    // Duplicate code check within organization
    const exists = await db.query(
      `SELECT id FROM item_categories WHERE organization_id = $1 AND code = $2`,
      [organization_id, code]
    );
    if (exists.rows.length > 0) {
      throw new ConflictError(`Category code '${code}' already exists in this organization`);
    }

    const res = await db.query(
      `INSERT INTO item_categories (
        organization_id, parent_id, code, name, category_type, is_active
      ) VALUES ($1, $2, $3, $4, $5, $6)
      RETURNING *`,
      [organization_id, parent_id || null, code, name, category_type, is_active ?? true]
    );
    return res.rows[0];
  }

  async updateCategory(id: string, payload: any) {
    const { parent_id, code, name, category_type, is_active } = payload;

    const existing = await this.getCategory(id);

    if (code && code !== existing.code) {
      const dup = await db.query(
        `SELECT id FROM item_categories WHERE organization_id = $1 AND code = $2 AND id <> $3`,
        [existing.organization_id, code, id]
      );
      if (dup.rows.length > 0) {
        throw new ConflictError(`Category code '${code}' already exists in this organization`);
      }
    }

    const fields: string[] = [];
    const values: any[] = [];
    let idx = 1;

    if (parent_id !== undefined) { fields.push(`parent_id = $${idx++}`); values.push(parent_id); }
    if (code !== undefined) { fields.push(`code = $${idx++}`); values.push(code); }
    if (name !== undefined) { fields.push(`name = $${idx++}`); values.push(name); }
    if (category_type !== undefined) { fields.push(`category_type = $${idx++}`); values.push(category_type); }
    if (is_active !== undefined) { fields.push(`is_active = $${idx++}`); values.push(is_active); }

    values.push(id);

    const res = await db.query(
      `UPDATE item_categories SET ${fields.join(', ')} WHERE id = $${idx} RETURNING *`,
      values
    );
    return res.rows[0];
  }

  async deleteCategory(id: string) {
    const category = await this.getCategory(id);

    // Prevent deletion if items reference this category
    const used = await db.query(
      `SELECT id FROM items WHERE category_id = $1 LIMIT 1`,
      [id]
    );
    if (used.rows.length > 0) {
      throw new ConflictError('Cannot delete category: items are assigned to it');
    }

    await db.query(`DELETE FROM item_categories WHERE id = $1`, [id]);
    return { id };
  }

  /* ---- Items ---- */

  async listItems({
    organization_id,
    facility_id,
    store_id,
    category_id,
    item_type,
    is_active,
    low_stock,
    search,
    page = 1,
    limit = 50,
  }: {
    organization_id?: string;
    facility_id?: string;
    store_id?: string;
    category_id?: string;
    item_type?: string;
    is_active?: string;
    low_stock?: string;
    search?: string;
    page?: number;
    limit?: number;
  }) {
    const conditions: string[] = [];
    const params: any[] = [];
    let paramIdx = 1;

    if (organization_id) {
      conditions.push(`i.organization_id = $${paramIdx++}`);
      params.push(organization_id);
    }
    if (category_id) {
      conditions.push(`i.category_id = $${paramIdx++}`);
      params.push(category_id);
    }
    if (item_type) {
      conditions.push(`i.item_type = $${paramIdx++}`);
      params.push(item_type);
    }
    if (is_active !== undefined) {
      conditions.push(`i.is_active = $${paramIdx++}`);
      params.push(is_active === 'true');
    }
    if (search) {
      conditions.push(`(i.name ILIKE $${paramIdx} OR i.code ILIKE $${paramIdx} OR i.generic_name ILIKE $${paramIdx})`);
      params.push(`%${search}%`);
      paramIdx++;
    }

    // Low stock flag: on-hand <= reorder_level (aggregated across stores or specific store)
    let batchJoin = '';
    if (store_id) {
      conditions.push(`sb.store_id = $${paramIdx++}`);
      params.push(store_id);
      batchJoin = `LEFT JOIN stock_batches sb ON sb.item_id = i.id AND sb.store_id = $${paramIdx - 1}`;
    } else {
      batchJoin = `LEFT JOIN stock_batches sb ON sb.item_id = i.id`;
    }

    const where = conditions.length ? `WHERE ${conditions.join(' AND ')}` : '';

    const lowStockCondition = low_stock === 'true'
      ? `AND COALESCE(SUM(sb.quantity_on_hand), 0) <= COALESCE(i.reorder_level, 0)`
      : low_stock === 'false'
        ? `AND COALESCE(SUM(sb.quantity_on_hand), 0) > COALESCE(i.reorder_level, 0)`
        : '';

    const countQuery = `
      SELECT count(DISTINCT i.id)::int
      FROM items i
      ${batchJoin}
      ${where}
    `;
    const countRes = await db.query(countQuery, params);
    const total = countRes.rows[0].count;

    const offset = (page - 1) * limit;
    const dataQuery = `
      SELECT
        i.id, i.organization_id, i.category_id, i.manufacturer_id, i.tax_group_id,
        i.medical_code_id, i.service_id, i.code, i.name, i.generic_name, i.brand_name,
        i.item_type, i.dosage_form, i.strength, i.route, i.drug_schedule,
        i.requires_prescription, i.is_controlled, i.is_high_alert, i.base_uom,
        i.pack_size, i.hsn_code, i.mrp, i.reorder_level, i.reorder_quantity,
        i.max_stock_level, i.track_batches, i.track_expiry, i.storage_conditions,
        i.barcode, i.is_active, i.custom_fields, i.created_at, i.updated_at,
        c.name AS category_name,
        COALESCE(SUM(sb.quantity_on_hand), 0) AS quantity_on_hand,
        COALESCE(SUM(sb.quantity_reserved), 0) AS quantity_reserved
      FROM items i
      LEFT JOIN item_categories c ON c.id = i.category_id
      ${batchJoin}
      ${where}
      GROUP BY i.id, c.name
      ${lowStockCondition}
      ORDER BY i.name ASC
      LIMIT $${paramIdx++} OFFSET $${paramIdx++}
    `;
    params.push(limit, offset);
    const dataRes = await db.query(dataQuery, params);

    return { data: dataRes.rows, meta: { page, limit, total } };
  }

  async getItem(id: string) {
    const res = await db.query(
      `SELECT i.*, c.name AS category_name
       FROM items i
       LEFT JOIN item_categories c ON c.id = i.category_id
       WHERE i.id = $1`,
      [id]
    );
    if (res.rows.length === 0) throw new NotFoundError('Item not found');
    return res.rows[0];
  }

  async createItem(payload: any) {
    const {
      organization_id, category_id, manufacturer_id, tax_group_id,
      medical_code_id, service_id, code, name, generic_name, brand_name,
      item_type, dosage_form, strength, route, drug_schedule,
      requires_prescription, is_controlled, is_high_alert, base_uom,
      pack_size, hsn_code, mrp, reorder_level, reorder_quantity,
      max_stock_level, track_batches, track_expiry, storage_conditions,
      barcode, is_active,
    } = payload;

    // Duplicate code check within organization
    const exists = await db.query(
      `SELECT id FROM items WHERE organization_id = $1 AND code = $2`,
      [organization_id, code]
    );
    if (exists.rows.length > 0) {
      throw new ConflictError(`Item code '${code}' already exists in this organization`);
    }

    const res = await db.query(
      `INSERT INTO items (
        organization_id, category_id, manufacturer_id, tax_group_id,
        medical_code_id, service_id, code, name, generic_name, brand_name,
        item_type, dosage_form, strength, route, drug_schedule,
        requires_prescription, is_controlled, is_high_alert, base_uom,
        pack_size, hsn_code, mrp, reorder_level, reorder_quantity,
        max_stock_level, track_batches, track_expiry, storage_conditions,
        barcode, is_active, created_by, updated_by
      ) VALUES (
        $1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16,$17,$18,$19,
        $20,$21,$22,$23,$24,$25,$26,$27,$28,$29,$30,$31,$32
      ) RETURNING *`,
      [
        organization_id, category_id || null, manufacturer_id || null, tax_group_id || null,
        medical_code_id || null, service_id || null, code, name, generic_name || null, brand_name || null,
        item_type, dosage_form || null, strength || null, route || null, drug_schedule || 'none',
        requires_prescription ?? false, is_controlled ?? false, is_high_alert ?? false, base_uom || 'unit',
        pack_size ?? 1, hsn_code || null, mrp || null, reorder_level ?? 0, reorder_quantity ?? 0,
        max_stock_level || null, track_batches ?? true, track_expiry ?? true,
        storage_conditions || null, barcode || null, is_active ?? true,
        organization_id, organization_id,
      ]
    );
    return res.rows[0];
  }

  async updateItem(id: string, payload: any) {
    const existing = await this.getItem(id);
    const {
      category_id, manufacturer_id, tax_group_id, code, name, item_type,
      base_uom, reorder_level, reorder_quantity, max_stock_level,
      track_batches, track_expiry, is_active,
    } = payload;

    if (code && code !== existing.code) {
      const dup = await db.query(
        `SELECT id FROM items WHERE organization_id = $1 AND code = $2 AND id <> $3`,
        [existing.organization_id, code, id]
      );
      if (dup.rows.length > 0) {
        throw new ConflictError(`Item code '${code}' already exists in this organization`);
      }
    }

    const fields: string[] = [];
    const values: any[] = [];
    let idx = 1;

    const setIf = (val: any, col: string) => {
      if (val !== undefined) { fields.push(`${col} = $${idx++}`); values.push(val); }
    };

    setIf(category_id, 'category_id');
    setIf(manufacturer_id, 'manufacturer_id');
    setIf(tax_group_id, 'tax_group_id');
    setIf(code, 'code');
    setIf(name, 'name');
    setIf(item_type, 'item_type');
    setIf(base_uom, 'base_uom');
    setIf(reorder_level, 'reorder_level');
    setIf(reorder_quantity, 'reorder_quantity');
    setIf(max_stock_level, 'max_stock_level');
    setIf(track_batches, 'track_batches');
    setIf(track_expiry, 'track_expiry');
    setIf(is_active, 'is_active');

    fields.push('updated_at = now()');
    fields.push(`updated_by = $${idx++}`);
    values.push(existing.organization_id);
    values.push(id);

    const res = await db.query(
      `UPDATE items SET ${fields.join(', ')} WHERE id = $${idx} RETURNING *`,
      values
    );
    return res.rows[0];
  }

  async deleteItem(id: string) {
    await this.getItem(id);

    // Prevent deletion if stock batches reference this item
    const used = await db.query(
      `SELECT id FROM stock_batches WHERE item_id = $1 LIMIT 1`,
      [id]
    );
    if (used.rows.length > 0) {
      throw new ConflictError('Cannot delete item: stock batches exist for it');
    }

    await db.query(`DELETE FROM items WHERE id = $1`, [id]);
    return { id };
  }

  /* ---- Stores ---- */

  async listStores({
    organization_id,
    facility_id,
    store_type,
    is_active,
    page = 1,
    limit = 50,
  }: {
    organization_id?: string;
    facility_id?: string;
    store_type?: string;
    is_active?: string;
    page?: number;
    limit?: number;
  }) {
    const conditions: string[] = [];
    const params: any[] = [];
    let paramIdx = 1;

    if (organization_id) {
      conditions.push(`organization_id = $${paramIdx++}`);
      params.push(organization_id);
    }
    if (facility_id) {
      conditions.push(`facility_id = $${paramIdx++}`);
      params.push(facility_id);
    }
    if (store_type) {
      conditions.push(`store_type = $${paramIdx++}`);
      params.push(store_type);
    }
    if (is_active !== undefined) {
      conditions.push(`is_active = $${paramIdx++}`);
      params.push(is_active === 'true');
    }

    const where = conditions.length ? `WHERE ${conditions.join(' AND ')}` : '';

    const countRes = await db.query(
      `SELECT count(*)::int FROM stores ${where}`,
      params
    );
    const total = countRes.rows[0].count;

    const offset = (page - 1) * limit;
    const dataRes = await db.query(
      `SELECT *
       FROM stores
       ${where}
       ORDER BY name ASC
       LIMIT $${paramIdx++} OFFSET $${paramIdx++}`,
      [...params, limit, offset]
    );

    return { data: dataRes.rows, meta: { page, limit, total } };
  }

  async getStore(id: string) {
    const res = await db.query(`SELECT * FROM stores WHERE id = $1`, [id]);
    if (res.rows.length === 0) throw new NotFoundError('Store not found');
    return res.rows[0];
  }

  async createStore(payload: any) {
    const {
      organization_id, facility_id, department_id, parent_store_id,
      code, name, store_type, is_dispensing_point, is_active,
    } = payload;

    const exists = await db.query(
      `SELECT id FROM stores WHERE facility_id = $1 AND code = $2`,
      [facility_id, code]
    );
    if (exists.rows.length > 0) {
      throw new ConflictError(`Store code '${code}' already exists in this facility`);
    }

    const res = await db.query(
      `INSERT INTO stores (
        organization_id, facility_id, department_id, parent_store_id,
        code, name, store_type, is_dispensing_point, is_active,
        created_by, updated_by
      ) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11)
      RETURNING *`,
      [
        organization_id, facility_id, department_id || null, parent_store_id || null,
        code, name, store_type, is_dispensing_point ?? false, is_active ?? true,
        organization_id, organization_id,
      ]
    );
    return res.rows[0];
  }

  async updateStore(id: string, payload: any) {
    const existing = await this.getStore(id);
    const { code, name, store_type, is_dispensing_point, is_active } = payload;

    if (code && code !== existing.code) {
      const dup = await db.query(
        `SELECT id FROM stores WHERE facility_id = $1 AND code = $2 AND id <> $3`,
        [existing.facility_id, code, id]
      );
      if (dup.rows.length > 0) {
        throw new ConflictError(`Store code '${code}' already exists in this facility`);
      }
    }

    const fields: string[] = [];
    const values: any[] = [];
    let idx = 1;

    const setIf = (val: any, col: string) => {
      if (val !== undefined) { fields.push(`${col} = $${idx++}`); values.push(val); }
    };

    setIf(code, 'code');
    setIf(name, 'name');
    setIf(store_type, 'store_type');
    setIf(is_dispensing_point, 'is_dispensing_point');
    setIf(is_active, 'is_active');

    fields.push('updated_at = now()');
    fields.push(`updated_by = $${idx++}`);
    values.push(existing.organization_id);
    values.push(id);

    const res = await db.query(
      `UPDATE stores SET ${fields.join(', ')} WHERE id = $${idx} RETURNING *`,
      values
    );
    return res.rows[0];
  }

  async deleteStore(id: string) {
    await this.getStore(id);

    const used = await db.query(
      `SELECT id FROM stock_batches WHERE store_id = $1 LIMIT 1`,
      [id]
    );
    if (used.rows.length > 0) {
      throw new ConflictError('Cannot delete store: stock batches exist for it');
    }

    await db.query(`DELETE FROM stores WHERE id = $1`, [id]);
    return { id };
  }

  /* ---- Stock Batches ---- */

  async listStockBatches({
    organization_id,
    facility_id,
    store_id,
    item_id,
    status,
    expiry_before,
    expiry_after,
    low_stock,
    search,
    page = 1,
    limit = 50,
  }: {
    organization_id?: string;
    facility_id?: string;
    store_id?: string;
    item_id?: string;
    status?: string;
    expiry_before?: string;
    expiry_after?: string;
    low_stock?: string;
    search?: string;
    page?: number;
    limit?: number;
  }) {
    const conditions: string[] = [];
    const params: any[] = [];
    let paramIdx = 1;

    if (organization_id) {
      conditions.push(`i.organization_id = $${paramIdx++}`);
      params.push(organization_id);
    }
    if (facility_id) {
      conditions.push(`st.facility_id = $${paramIdx++}`);
      params.push(facility_id);
    }
    if (store_id) {
      conditions.push(`sb.store_id = $${paramIdx++}`);
      params.push(store_id);
    }
    if (item_id) {
      conditions.push(`sb.item_id = $${paramIdx++}`);
      params.push(item_id);
    }
    if (status) {
      conditions.push(`sb.status = $${paramIdx++}`);
      params.push(status);
    }
    if (expiry_before) {
      conditions.push(`sb.expiry_date <= $${paramIdx++}`);
      params.push(expiry_before);
    }
    if (expiry_after) {
      conditions.push(`sb.expiry_date >= $${paramIdx++}`);
      params.push(expiry_after);
    }
    if (search) {
      conditions.push(`(i.name ILIKE $${paramIdx} OR sb.batch_no ILIKE $${paramIdx})`);
      params.push(`%${search}%`);
      paramIdx++;
    }

    const where = conditions.length ? `WHERE ${conditions.join(' AND ')}` : '';

    const countRes = await db.query(
      `SELECT count(*)::int FROM stock_batches sb
       JOIN items i ON i.id = sb.item_id
       JOIN stores st ON st.id = sb.store_id
       ${where}`,
      params
    );
    const total = countRes.rows[0].count;

    const offset = (page - 1) * limit;
    const dataRes = await db.query(
      `SELECT
        sb.id, sb.store_id, sb.item_id, sb.supplier_id, sb.batch_no,
        sb.manufactured_on, sb.expiry_date, sb.mrp, sb.purchase_rate, sb.sale_rate,
        sb.quantity_on_hand, sb.quantity_reserved, sb.status,
        sb.created_at, sb.updated_at, sb.created_by, sb.updated_by,
        i.name AS item_name, i.code AS item_code, i.base_uom,
        st.name AS store_name, st.code AS store_code
       FROM stock_batches sb
       JOIN items i ON i.id = sb.item_id
       JOIN stores st ON st.id = sb.store_id
       ${where}
       ORDER BY
         CASE WHEN sb.expiry_date IS NULL THEN 1 ELSE 0 END,
         sb.expiry_date ASC NULLS LAST,
         sb.batch_no ASC
       LIMIT $${paramIdx++} OFFSET $${paramIdx++}`,
      [...params, limit, offset]
    );

    return { data: dataRes.rows, meta: { page, limit, total } };
  }

  /* ---- Stock Movements ---- */

  async listStockMovements({
    organization_id,
    facility_id,
    store_id,
    item_id,
    batch_id,
    movement_type,
    from_date,
    to_date,
    reference_type,
    page = 1,
    limit = 50,
  }: {
    organization_id?: string;
    facility_id?: string;
    store_id?: string;
    item_id?: string;
    batch_id?: string;
    movement_type?: string;
    from_date?: string;
    to_date?: string;
    reference_type?: string;
    page?: number;
    limit?: number;
  }) {
    const conditions: string[] = [];
    const params: any[] = [];
    let paramIdx = 1;

    if (organization_id) {
      conditions.push(`i.organization_id = $${paramIdx++}`);
      params.push(organization_id);
    }
    if (facility_id) {
      conditions.push(`st.facility_id = $${paramIdx++}`);
      params.push(facility_id);
    }
    if (store_id) {
      conditions.push(`sm.store_id = $${paramIdx++}`);
      params.push(store_id);
    }
    if (item_id) {
      conditions.push(`sm.item_id = $${paramIdx++}`);
      params.push(item_id);
    }
    if (batch_id) {
      conditions.push(`sm.batch_id = $${paramIdx++}`);
      params.push(batch_id);
    }
    if (movement_type) {
      conditions.push(`sm.movement_type = $${paramIdx++}`);
      params.push(movement_type);
    }
    if (from_date) {
      conditions.push(`sm.moved_at >= $${paramIdx++}`);
      params.push(from_date);
    }
    if (to_date) {
      conditions.push(`sm.moved_at <= $${paramIdx++}`);
      params.push(to_date);
    }
    if (reference_type) {
      conditions.push(`sm.reference_type = $${paramIdx++}`);
      params.push(reference_type);
    }

    const where = conditions.length ? `WHERE ${conditions.join(' AND ')}` : '';

    const countRes = await db.query(
      `SELECT count(*)::int FROM stock_movements sm
       JOIN items i ON i.id = sm.item_id
       JOIN stores st ON st.id = sm.store_id
       ${where}`,
      params
    );
    const total = countRes.rows[0].count;

    const offset = (page - 1) * limit;
    const dataRes = await db.query(
      `SELECT
        sm.id, sm.store_id, sm.item_id, sm.batch_id, sm.movement_type,
        sm.quantity, sm.unit_cost, sm.reference_type, sm.reference_id,
        sm.moved_at, sm.moved_by, sm.notes,
        i.name AS item_name, i.code AS item_code,
        sb.batch_no,
        st.name AS store_name
       FROM stock_movements sm
       JOIN items i ON i.id = sm.item_id
       JOIN stock_batches sb ON sb.id = sm.batch_id
       JOIN stores st ON st.id = sm.store_id
       ${where}
       ORDER BY sm.moved_at DESC, sm.id DESC
       LIMIT $${paramIdx++} OFFSET $${paramIdx++}`,
      [...params, limit, offset]
    );

    return { data: dataRes.rows, meta: { page, limit, total } };
  }

  /* ---- Stock Adjustment ---- */

  async createStockAdjustment({
    store_id, item_id, batch_id, movement_type, quantity,
    unit_cost, reference_type, reference_id, notes, moved_by,
  }: {
    store_id: string;
    item_id: string;
    batch_id: string;
    movement_type: 'adjustment_in' | 'adjustment_out';
    quantity: number;
    unit_cost?: number | null;
    reference_type?: string | null;
    reference_id?: string | null;
    notes?: string | null;
    moved_by: string;
  }) {
    // Validate batch belongs to store/item
    const batchRes = await db.query(
      `SELECT id, quantity_on_hand, status FROM stock_batches
       WHERE id = $1 AND store_id = $2 AND item_id = $3`,
      [batch_id, store_id, item_id]
    );
    if (batchRes.rows.length === 0) {
      throw new NotFoundError('Stock batch not found for this store/item');
    }
    const batch = batchRes.rows[0];

    // For adjustment_out, ensure we don't go below zero (trigger enforces, but give a clear error)
    if (movement_type === 'adjustment_out' && Number(batch.quantity_on_hand) < quantity) {
      throw new ConflictError(
        `Insufficient stock: available ${batch.quantity_on_hand}, requested ${quantity}`
      );
    }

    const signedQty = movement_type === 'adjustment_in' ? quantity : -quantity;

    const res = await db.query(
      `INSERT INTO stock_movements (
        store_id, item_id, batch_id, movement_type, quantity,
        unit_cost, reference_type, reference_id, moved_by, notes
      ) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10)
      RETURNING *`,
      [store_id, item_id, batch_id, movement_type, signedQty,
        unit_cost || null, reference_type || null, reference_id || null,
        moved_by, notes || null]
    );
    return res.rows[0];
  }

  /* ---- Stock Write-off ---- */

  async createStockWriteOff({
    store_id, item_id, batch_id, quantity, reason, notes, moved_by,
  }: {
    store_id: string;
    item_id: string;
    batch_id: string;
    quantity: number;
    reason: 'expired' | 'damaged';
    notes?: string | null;
    moved_by: string;
  }) {
    const movement_type = reason === 'expired' ? 'write_off_expired' : 'write_off_damaged';

    const batchRes = await db.query(
      `SELECT quantity_on_hand FROM stock_batches
       WHERE id = $1 AND store_id = $2 AND item_id = $3`,
      [batch_id, store_id, item_id]
    );
    if (batchRes.rows.length === 0) {
      throw new NotFoundError('Stock batch not found for this store/item');
    }
    const batch = batchRes.rows[0];

    if (Number(batch.quantity_on_hand) < quantity) {
      throw new ConflictError(
        `Insufficient stock: available ${batch.quantity_on_hand}, requested ${quantity}`
      );
    }

    const res = await db.query(
      `INSERT INTO stock_movements (
        store_id, item_id, batch_id, movement_type, quantity,
        moved_by, notes
      ) VALUES ($1,$2,$3,$4,$5,$6,$7)
      RETURNING *`,
      [store_id, item_id, batch_id, movement_type, -quantity,
        moved_by, notes || null]
    );
    return res.rows[0];
  }

  /* ================================================================== */
  /*  Suppliers                                                         */
  /* ================================================================== */

  async listSuppliers({
    organization_id,
    is_active,
    search,
    page = 1,
    limit = 50,
  }: {
    organization_id?: string;
    is_active?: string;
    search?: string;
    page?: number;
    limit?: number;
  }) {
    const conditions: string[] = [];
    const params: any[] = [];
    let paramIdx = 1;

    if (organization_id) {
      conditions.push(`organization_id = $${paramIdx++}`);
      params.push(organization_id);
    }
    if (is_active !== undefined) {
      conditions.push(`is_active = $${paramIdx++}`);
      params.push(is_active === 'true');
    }
    if (search) {
      conditions.push(`(name ILIKE $${paramIdx} OR code ILIKE $${paramIdx} OR contact_person ILIKE $${paramIdx})`);
      params.push(`%${search}%`);
      paramIdx++;
    }

    const where = conditions.length ? `WHERE ${conditions.join(' AND ')}` : '';

    const countRes = await db.query(
      `SELECT count(*)::int FROM suppliers ${where}`,
      params
    );
    const total = countRes.rows[0].count;

    const offset = (page - 1) * limit;
    const dataRes = await db.query(
      `SELECT *
       FROM suppliers
       ${where}
       ORDER BY name ASC
       LIMIT $${paramIdx++} OFFSET $${paramIdx++}`,
      [...params, limit, offset]
    );

    return { data: dataRes.rows, meta: { page, limit, total } };
  }

  async getSupplier(id: string) {
    const res = await db.query(`SELECT * FROM suppliers WHERE id = $1`, [id]);
    if (res.rows.length === 0) throw new NotFoundError('Supplier not found');
    return res.rows[0];
  }

  async createSupplier(payload: any, createdBy?: string) {
    const {
      organization_id, code, name, contact_person, phone, email,
      address, gstin, drug_license_no, payment_terms_days, bank_details, is_active,
    } = payload;

    const exists = await db.query(
      `SELECT id FROM suppliers WHERE organization_id = $1 AND code = $2`,
      [organization_id, code]
    );
    if (exists.rows.length > 0) {
      throw new ConflictError(`Supplier code '${code}' already exists in this organization`);
    }

    const res = await db.query(
      `INSERT INTO suppliers (
        organization_id, code, name, contact_person, phone, email,
        address, gstin, drug_license_no, payment_terms_days, bank_details,
        is_active, created_by, updated_by
      ) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14)
      RETURNING *`,
      [organization_id, code, name, contact_person || null, phone || null, email || null,
       address || null, gstin || null, drug_license_no || null, payment_terms_days ?? 30,
       bank_details || {}, is_active ?? true, createdBy, createdBy]
    );
    return res.rows[0];
  }

  async updateSupplier(id: string, payload: any, updatedBy?: string) {
    const existing = await this.getSupplier(id);
    const { code, name, contact_person, phone, email, address, gstin,
            drug_license_no, payment_terms_days, bank_details, is_active } = payload;

    if (code && code !== existing.code) {
      const dup = await db.query(
        `SELECT id FROM suppliers WHERE organization_id = $1 AND code = $2 AND id <> $3`,
        [existing.organization_id, code, id]
      );
      if (dup.rows.length > 0) {
        throw new ConflictError(`Supplier code '${code}' already exists in this organization`);
      }
    }

    const fields: string[] = [];
    const values: any[] = [];
    let idx = 1;

    const setIf = (val: any, col: string) => {
      if (val !== undefined) { fields.push(`${col} = $${idx++}`); values.push(val); }
    };

    setIf(code, 'code');
    setIf(name, 'name');
    setIf(contact_person, 'contact_person');
    setIf(phone, 'phone');
    setIf(email, 'email');
    setIf(address, 'address');
    setIf(gstin, 'gstin');
    setIf(drug_license_no, 'drug_license_no');
    setIf(payment_terms_days, 'payment_terms_days');
    setIf(bank_details, 'bank_details');
    setIf(is_active, 'is_active');

    fields.push('updated_at = now()');
    fields.push(`updated_by = $${idx++}`);
    values.push(existing.organization_id);
    values.push(id);

    const res = await db.query(
      `UPDATE suppliers SET ${fields.join(', ')} WHERE id = $${idx} RETURNING *`,
      values
    );
    return res.rows[0];
  }

  async deleteSupplier(id: string) {
    await this.getSupplier(id);

    const used = await db.query(
      `SELECT id FROM purchase_orders WHERE supplier_id = $1 LIMIT 1`,
      [id]
    );
    if (used.rows.length > 0) {
      throw new ConflictError('Cannot delete supplier: purchase orders reference it');
    }

    const used2 = await db.query(
      `SELECT id FROM goods_receipts WHERE supplier_id = $1 LIMIT 1`,
      [id]
    );
    if (used2.rows.length > 0) {
      throw new ConflictError('Cannot delete supplier: goods receipts reference it');
    }

    await db.query(`DELETE FROM suppliers WHERE id = $1`, [id]);
    return { id };
  }

  /* ================================================================== */
  /*  Purchase Orders                                                   */
  /* ================================================================== */

  async listPurchaseOrders({
    organization_id,
    facility_id,
    supplier_id,
    store_id,
    status,
    search,
    page = 1,
    limit = 50,
  }: {
    organization_id?: string;
    facility_id?: string;
    supplier_id?: string;
    store_id?: string;
    status?: string;
    search?: string;
    page?: number;
    limit?: number;
  }) {
    const conditions: string[] = [];
    const params: any[] = [];
    let paramIdx = 1;

    if (organization_id) {
      conditions.push(`organization_id = $${paramIdx++}`);
      params.push(organization_id);
    }
    if (facility_id) {
      conditions.push(`facility_id = $${paramIdx++}`);
      params.push(facility_id);
    }
    if (supplier_id) {
      conditions.push(`supplier_id = $${paramIdx++}`);
      params.push(supplier_id);
    }
    if (store_id) {
      conditions.push(`store_id = $${paramIdx++}`);
      params.push(store_id);
    }
    if (status) {
      conditions.push(`status = $${paramIdx++}`);
      params.push(status);
    }
    if (search) {
      conditions.push(`(po_number ILIKE $${paramIdx} OR notes ILIKE $${paramIdx})`);
      params.push(`%${search}%`);
      paramIdx++;
    }

    const where = conditions.length ? `WHERE ${conditions.join(' AND ')}` : '';

    const countRes = await db.query(
      `SELECT count(*)::int FROM purchase_orders ${where}`,
      params
    );
    const total = countRes.rows[0].count;

    const offset = (page - 1) * limit;
    const dataRes = await db.query(
      `SELECT
        po.id, po.organization_id, po.facility_id, po.po_number, po.supplier_id,
        po.store_id, po.status, po.order_date, po.expected_date, po.subtotal,
        po.tax_total, po.total_amount, po.terms, po.notes, po.approved_by,
        po.approved_at, po.created_at, po.updated_at, po.created_by, po.updated_by,
        s.name AS supplier_name, st.name AS store_name
       FROM purchase_orders po
       LEFT JOIN suppliers s ON s.id = po.supplier_id
       LEFT JOIN stores st ON st.id = po.store_id
       ${where}
       ORDER BY po.created_at DESC
       LIMIT $${paramIdx++} OFFSET $${paramIdx++}`,
      [...params, limit, offset]
    );

    return { data: dataRes.rows, meta: { page, limit, total } };
  }

  async getPurchaseOrder(id: string) {
    const res = await db.query(
      `SELECT po.*,
        s.name AS supplier_name, st.name AS store_name
       FROM purchase_orders po
       LEFT JOIN suppliers s ON s.id = po.supplier_id
       LEFT JOIN stores st ON st.id = po.store_id
       WHERE po.id = $1`,
      [id]
    );
    if (res.rows.length === 0) throw new NotFoundError('Purchase order not found');

    // Fetch items
    const itemsRes = await db.query(
      `SELECT poi.id, poi.purchase_order_id, poi.item_id, poi.ordered_qty,
              poi.received_qty, poi.unit_cost, poi.discount_percent,
              poi.tax_group_id, poi.tax_amount, poi.line_total,
              i.name AS item_name, i.code AS item_code, i.base_uom
       FROM purchase_order_items poi
       JOIN items i ON i.id = poi.item_id
       WHERE poi.purchase_order_id = $1
       ORDER BY i.name`,
      [id]
    );

    return { ...res.rows[0], items: itemsRes.rows };
  }

  async createPurchaseOrder(payload: any, createdBy?: string) {
    const {
      organization_id, facility_id, supplier_id, store_id,
      order_date, expected_date, terms, notes, items,
    } = payload;

    // Generate PO number using next_number DB function with fallback
    let poNumber = `PO-${Date.now()}`;
    try {
      const poNumRes = await db.query(
        `SELECT next_number($1, $2, 'PO') AS po_number`,
        [organization_id, facility_id]
      );
      if (poNumRes.rows[0]?.po_number) {
        poNumber = poNumRes.rows[0].po_number;
      }
    } catch {
      // Fall back to timestamp-based number
    }

    // Calculate totals
    let subtotal = 0;
    let taxTotal = 0;
    for (const it of items) {
      subtotal += Number(it.line_total || 0);
      taxTotal += Number(it.tax_amount || 0);
    }
    const totalAmount = subtotal + taxTotal;

    const client = await db.getClient();
    try {
      await client.query('BEGIN');

      const poRes = await client.query(
        `INSERT INTO purchase_orders (
          organization_id, facility_id, po_number, supplier_id, store_id,
          order_date, expected_date, terms, notes, subtotal, tax_total,
          total_amount, created_by, updated_by
        ) VALUES ($1,$2,$3,$4,$5, COALESCE($6, CURRENT_DATE), $7,$8,$9,$10,$11,$12,$13,$14)
        RETURNING *`,
        [organization_id, facility_id, poNumber, supplier_id, store_id,
         order_date || null, expected_date || null, terms || null, notes || null,
         subtotal, taxTotal, totalAmount, createdBy, createdBy]
      );
      const po = poRes.rows[0];

      for (const it of items) {
        await client.query(
          `INSERT INTO purchase_order_items (
            purchase_order_id, item_id, ordered_qty, received_qty,
            unit_cost, discount_percent, tax_group_id, tax_amount, line_total
          ) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9)`,
          [po.id, it.item_id, it.ordered_qty, 0,
           it.unit_cost, it.discount_percent || 0, it.tax_group_id || null,
           it.tax_amount || 0, it.line_total || 0]
        );
      }

      await client.query('COMMIT');
      return { ...po, items };
    } catch (e) {
      await client.query('ROLLBACK');
      throw e;
    } finally {
      client.release();
    }
  }

  async updatePurchaseOrder(id: string, payload: any, updatedBy?: string) {
    const existing = await this.getPurchaseOrder(id);

    if (existing.status !== 'draft') {
      throw new ConflictError('Can only update purchase orders in draft status');
    }

    const { supplier_id, store_id, expected_date, terms, notes } = payload;

    const fields: string[] = [];
    const values: any[] = [];
    let idx = 1;

    if (supplier_id !== undefined) { fields.push(`supplier_id = $${idx++}`); values.push(supplier_id); }
    if (store_id !== undefined) { fields.push(`store_id = $${idx++}`); values.push(store_id); }
    if (expected_date !== undefined) { fields.push(`expected_date = $${idx++}`); values.push(expected_date); }
    if (terms !== undefined) { fields.push(`terms = $${idx++}`); values.push(terms); }
    if (notes !== undefined) { fields.push(`notes = $${idx++}`); values.push(notes); }

    fields.push(`updated_at = now()`);
    fields.push(`updated_by = $${idx++}`);
    values.push(existing.organization_id);
    values.push(id);

    const res = await db.query(
      `UPDATE purchase_orders SET ${fields.join(', ')} WHERE id = $${idx} RETURNING *`,
      values
    );
    return res.rows[0];
  }

  async deletePurchaseOrder(id: string) {
    const existing = await this.getPurchaseOrder(id);

    if (existing.status !== 'draft') {
      throw new ConflictError('Can only delete purchase orders in draft status');
    }

    await db.query(`DELETE FROM purchase_orders WHERE id = $1`, [id]);
    return { id };
  }

  async approvePurchaseOrder(id: string, approvedBy?: string) {
    const existing = await this.getPurchaseOrder(id);

    if (existing.status !== 'draft') {
      throw new ConflictError('Only draft purchase orders can be approved');
    }

    const res = await db.query(
      `UPDATE purchase_orders
       SET status = 'approved', approved_by = $1, approved_at = now(),
           updated_at = now(), updated_by = $2
       WHERE id = $3 RETURNING *`,
      [approvedBy, existing.organization_id, id]
    );
    return res.rows[0];
  }

  async sendPurchaseOrder(id: string) {
    const existing = await this.getPurchaseOrder(id);

    if (existing.status !== 'approved') {
      throw new ConflictError('Only approved purchase orders can be sent');
    }

    const res = await db.query(
      `UPDATE purchase_orders
       SET status = 'sent', updated_at = now()
       WHERE id = $1 RETURNING *`,
      [id]
    );
    return res.rows[0];
  }

  async cancelPurchaseOrder(id: string) {
    const existing = await this.getPurchaseOrder(id);

    if (existing.status === 'received' || existing.status === 'closed') {
      throw new ConflictError('Cannot cancel a received or closed purchase order');
    }

    const res = await db.query(
      `UPDATE purchase_orders
       SET status = 'cancelled', updated_at = now()
       WHERE id = $1 RETURNING *`,
      [id]
    );
    return res.rows[0];
  }

  /* ================================================================== */
  /*  Goods Receipts                                                    */
  /* ================================================================== */

  async listGoodsReceipts({
    organization_id,
    facility_id,
    supplier_id,
    store_id,
    purchase_order_id,
    status,
    search,
    page = 1,
    limit = 50,
  }: {
    organization_id?: string;
    facility_id?: string;
    supplier_id?: string;
    store_id?: string;
    purchase_order_id?: string;
    status?: string;
    search?: string;
    page?: number;
    limit?: number;
  }) {
    const conditions: string[] = [];
    const params: any[] = [];
    let paramIdx = 1;

    if (organization_id) {
      conditions.push(`organization_id = $${paramIdx++}`);
      params.push(organization_id);
    }
    if (facility_id) {
      conditions.push(`facility_id = $${paramIdx++}`);
      params.push(facility_id);
    }
    if (supplier_id) {
      conditions.push(`supplier_id = $${paramIdx++}`);
      params.push(supplier_id);
    }
    if (store_id) {
      conditions.push(`store_id = $${paramIdx++}`);
      params.push(store_id);
    }
    if (purchase_order_id) {
      conditions.push(`purchase_order_id = $${paramIdx++}`);
      params.push(purchase_order_id);
    }
    if (status) {
      conditions.push(`status = $${paramIdx++}`);
      params.push(status);
    }
    if (search) {
      conditions.push(`(grn_number ILIKE $${paramIdx} OR supplier_invoice_no ILIKE $${paramIdx})`);
      params.push(`%${search}%`);
      paramIdx++;
    }

    const where = conditions.length ? `WHERE ${conditions.join(' AND ')}` : '';

    const countRes = await db.query(
      `SELECT count(*)::int FROM goods_receipts ${where}`,
      params
    );
    const total = countRes.rows[0].count;

    const offset = (page - 1) * limit;
    const dataRes = await db.query(
      `SELECT
        gr.id, gr.organization_id, gr.facility_id, gr.grn_number,
        gr.purchase_order_id, gr.supplier_id, gr.store_id,
        gr.supplier_invoice_no, gr.supplier_invoice_date, gr.received_at,
        gr.status, gr.subtotal, gr.discount_total, gr.tax_total,
        gr.total_amount, gr.received_by, gr.notes,
        gr.created_at, gr.updated_at, gr.created_by, gr.updated_by,
        s.name AS supplier_name, st.name AS store_name,
        po.po_number
       FROM goods_receipts gr
       LEFT JOIN suppliers s ON s.id = gr.supplier_id
       LEFT JOIN stores st ON st.id = gr.store_id
       LEFT JOIN purchase_orders po ON po.id = gr.purchase_order_id
       ${where}
       ORDER BY gr.created_at DESC
       LIMIT $${paramIdx++} OFFSET $${paramIdx++}`,
      [...params, limit, offset]
    );

    return { data: dataRes.rows, meta: { page, limit, total } };
  }

  async getGoodsReceipt(id: string) {
    const res = await db.query(
      `SELECT gr.*,
        s.name AS supplier_name, st.name AS store_name,
        po.po_number
       FROM goods_receipts gr
       LEFT JOIN suppliers s ON s.id = gr.supplier_id
       LEFT JOIN stores st ON st.id = gr.store_id
       LEFT JOIN purchase_orders po ON po.id = gr.purchase_order_id
       WHERE gr.id = $1`,
      [id]
    );
    if (res.rows.length === 0) throw new NotFoundError('Goods receipt not found');

    const itemsRes = await db.query(
      `SELECT gri.id, gri.goods_receipt_id, gri.po_item_id, gri.item_id,
              gri.batch_id, gri.batch_no, gri.manufactured_on, gri.expiry_date,
              gri.received_qty, gri.free_qty, gri.unit_cost, gri.mrp,
              gri.discount_amount, gri.tax_group_id, gri.tax_amount,
              gri.line_total,
              i.name AS item_name, i.code AS item_code
       FROM goods_receipt_items gri
       JOIN items i ON i.id = gri.item_id
       WHERE gri.goods_receipt_id = $1
       ORDER BY i.name`,
      [id]
    );

    return { ...res.rows[0], items: itemsRes.rows };
  }

  async createGoodsReceipt(payload: any, createdBy?: string) {
    const {
      organization_id, facility_id, supplier_id, store_id,
      purchase_order_id, supplier_invoice_no, supplier_invoice_date,
      notes, items,
    } = payload;

    // Generate GRN number
    let grnNumber = `GRN-${Date.now()}`;
    try {
      const grnRes = await db.query(
        `SELECT next_number($1, $2, 'GRN') AS grn_number`,
        [organization_id, facility_id]
      );
      if (grnRes.rows[0]?.grn_number) {
        grnNumber = grnRes.rows[0].grn_number;
      }
    } catch {
      // Fall back to timestamp-based number
    }

    let subtotal = 0;
    let taxTotal = 0;
    for (const it of items) {
      subtotal += Number(it.line_total || 0);
      taxTotal += Number(it.tax_amount || 0);
    }

    const client = await db.getClient();
    try {
      await client.query('BEGIN');

      const grRes = await client.query(
        `INSERT INTO goods_receipts (
          organization_id, facility_id, grn_number, purchase_order_id,
          supplier_id, store_id, supplier_invoice_no, supplier_invoice_date,
          notes, subtotal, tax_total, total_amount, created_by, updated_by
        ) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14)
        RETURNING *`,
        [organization_id, facility_id, grnNumber, purchase_order_id || null,
         supplier_id, store_id, supplier_invoice_no || null,
         supplier_invoice_date || null, notes || null,
         subtotal, taxTotal, subtotal + taxTotal, createdBy, createdBy]
      );
      const gr = grRes.rows[0];

      for (const it of items) {
        await client.query(
          `INSERT INTO goods_receipt_items (
            goods_receipt_id, po_item_id, item_id, batch_no,
            manufactured_on, expiry_date, received_qty, free_qty,
            unit_cost, mrp, discount_amount, tax_group_id, tax_amount,
            line_total
          ) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14)`,
          [gr.id, it.po_item_id || null, it.item_id, it.batch_no,
           it.manufactured_on || null, it.expiry_date || null,
           it.received_qty, it.free_qty || 0, it.unit_cost,
           it.mrp || null, it.discount_amount || 0, it.tax_group_id || null,
           it.tax_amount || 0, it.line_total || 0]
        );
      }

      await client.query('COMMIT');
      return { ...gr, items };
    } catch (e) {
      await client.query('ROLLBACK');
      throw e;
    } finally {
      client.release();
    }
  }

  async postGoodsReceipt(id: string, postedBy?: string) {
    const existing = await this.getGoodsReceipt(id);

    if (existing.status !== 'draft') {
      throw new ConflictError('Only draft goods receipts can be posted');
    }

    const client = await db.getClient();
    try {
      await client.query('BEGIN');

      // Update GRN status to posted
      await client.query(
        `UPDATE goods_receipts
         SET status = 'posted', updated_at = now(), updated_by = $1
         WHERE id = $2`,
        [postedBy, id]
      );

      // For each GRN item, create/update stock batch and stock movement
      for (const it of existing.items) {
        // Check if batch already exists for this store/item/batch_no
        const batchRes = await client.query(
          `SELECT id, quantity_on_hand FROM stock_batches
           WHERE store_id = $1 AND item_id = $2 AND batch_no = $3`,
          [existing.store_id, it.item_id, it.batch_no]
        );

        let batchId: string;
        if (batchRes.rows.length > 0) {
          // Update existing batch quantity
          batchId = batchRes.rows[0].id;
          await client.query(
            `INSERT INTO stock_movements (
              store_id, item_id, batch_id, movement_type, quantity,
              unit_cost, reference_type, reference_id, moved_by, notes
            ) VALUES ($1,$2,$3,'purchase_receipt',$4,$5,'goods_receipt',$6,$7,$8)`,
            [existing.store_id, it.item_id, batchId, it.received_qty,
             it.unit_cost, id, postedBy, `GRN posted: ${existing.grn_number}`]
          );
        } else {
          // Create new batch
          const newBatch = await client.query(
            `INSERT INTO stock_batches (
              store_id, item_id, supplier_id, batch_no, manufactured_on,
              expiry_date, mrp, purchase_rate, sale_rate, quantity_on_hand,
              status, created_by, updated_by
            ) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,'active',$11,$12)
            RETURNING id`,
            [existing.store_id, it.item_id, existing.supplier_id, it.batch_no,
             it.manufactured_on || null, it.expiry_date || null,
             it.mrp || null, it.unit_cost, it.unit_cost || null,
             it.received_qty, postedBy, postedBy]
          );
          batchId = newBatch.rows[0].id;

          await client.query(
            `INSERT INTO stock_movements (
              store_id, item_id, batch_id, movement_type, quantity,
              unit_cost, reference_type, reference_id, moved_by, notes
            ) VALUES ($1,$2,$3,'purchase_receipt',$4,$5,'goods_receipt',$6,$7,$8)`,
            [existing.store_id, it.item_id, batchId, it.received_qty,
             it.unit_cost, id, postedBy, `GRN posted: ${existing.grn_number}`]
          );
        }

        // Update GRN item with batch_id
        await client.query(
          `UPDATE goods_receipt_items SET batch_id = $1 WHERE id = $2`,
          [batchId, it.id]
        );

        // Update PO item received_qty if linked
        if (it.po_item_id) {
          await client.query(
            `UPDATE purchase_order_items
             SET received_qty = received_qty + $1
             WHERE id = $2`,
            [it.received_qty, it.po_item_id]
          );

          // Check if PO is fully received
          const poCheck = await client.query(
            `SELECT po.id, po.status,
                    SUM(poi.ordered_qty) AS total_ordered,
                    SUM(poi.received_qty) AS total_received
             FROM purchase_orders po
             JOIN purchase_order_items poi ON poi.purchase_order_id = po.id
             WHERE po.id = $1
             GROUP BY po.id, po.status`,
            [existing.purchase_order_id]
          );
          if (poCheck.rows.length > 0) {
            const po = poCheck.rows[0];
            const ordered = Number(po.total_ordered);
            const received = Number(po.total_received);
            let newStatus = po.status;
            if (received >= ordered) newStatus = 'received';
            else if (received > 0) newStatus = 'partially_received';

            if (newStatus !== po.status) {
              await client.query(
                `UPDATE purchase_orders SET status = $1, updated_at = now() WHERE id = $2`,
                [newStatus, po.id]
              );
            }
          }
        }
      }

      await client.query('COMMIT');
      return { id, status: 'posted' };
    } catch (e) {
      await client.query('ROLLBACK');
      throw e;
    } finally {
      client.release();
    }
  }

  async cancelGoodsReceipt(id: string) {
    const existing = await this.getGoodsReceipt(id);

    if (existing.status === 'posted') {
      throw new ConflictError('Cannot cancel a posted goods receipt');
    }

    const res = await db.query(
      `UPDATE goods_receipts
       SET status = 'cancelled', updated_at = now()
       WHERE id = $1 RETURNING *`,
      [id]
    );
    return res.rows[0];
  }

  /* ================================================================== */
  /*  Stock Transfers                                                   */
  /* ================================================================== */

  async listStockTransfers({
    organization_id,
    from_store_id,
    to_store_id,
    status,
    search,
    page = 1,
    limit = 50,
  }: {
    organization_id?: string;
    from_store_id?: string;
    to_store_id?: string;
    status?: string;
    search?: string;
    page?: number;
    limit?: number;
  }) {
    const conditions: string[] = [];
    const params: any[] = [];
    let paramIdx = 1;

    if (organization_id) {
      conditions.push(`organization_id = $${paramIdx++}`);
      params.push(organization_id);
    }
    if (from_store_id) {
      conditions.push(`from_store_id = $${paramIdx++}`);
      params.push(from_store_id);
    }
    if (to_store_id) {
      conditions.push(`to_store_id = $${paramIdx++}`);
      params.push(to_store_id);
    }
    if (status) {
      conditions.push(`status = $${paramIdx++}`);
      params.push(status);
    }
    if (search) {
      conditions.push(`transfer_no ILIKE $${paramIdx}`);
      params.push(`%${search}%`);
      paramIdx++;
    }

    const where = conditions.length ? `WHERE ${conditions.join(' AND ')}` : '';

    const countRes = await db.query(
      `SELECT count(*)::int FROM stock_transfers ${where}`,
      params
    );
    const total = countRes.rows[0].count;

    const offset = (page - 1) * limit;
    const dataRes = await db.query(
      `SELECT
        st.id, st.organization_id, st.transfer_no, st.from_store_id,
        st.to_store_id, st.status, st.requested_by, st.approved_by,
        st.requested_at, st.received_at, st.notes,
        st.created_at, st.updated_at, st.created_by, st.updated_by,
        fs.name AS from_store_name, ts.name AS to_store_name
       FROM stock_transfers st
       LEFT JOIN stores fs ON fs.id = st.from_store_id
       LEFT JOIN stores ts ON ts.id = st.to_store_id
       ${where}
       ORDER BY st.created_at DESC
       LIMIT $${paramIdx++} OFFSET $${paramIdx++}`,
      [...params, limit, offset]
    );

    return { data: dataRes.rows, meta: { page, limit, total } };
  }

  async getStockTransfer(id: string) {
    const res = await db.query(
      `SELECT st.*,
        fs.name AS from_store_name, ts.name AS to_store_name
       FROM stock_transfers st
       LEFT JOIN stores fs ON fs.id = st.from_store_id
       LEFT JOIN stores ts ON ts.id = st.to_store_id
       WHERE st.id = $1`,
      [id]
    );
    if (res.rows.length === 0) throw new NotFoundError('Stock transfer not found');

    const itemsRes = await db.query(
      `SELECT sti.id, sti.stock_transfer_id, sti.item_id,
              sti.batch_id, sti.requested_qty, sti.issued_qty,
              sti.received_qty,
              i.name AS item_name, i.code AS item_code, i.base_uom
       FROM stock_transfer_items sti
       JOIN items i ON i.id = sti.item_id
       WHERE sti.stock_transfer_id = $1
       ORDER BY i.name`,
      [id]
    );

    return { ...res.rows[0], items: itemsRes.rows };
  }

  async createStockTransfer(payload: any, createdBy?: string) {
    const {
      organization_id, from_store_id, to_store_id, notes, items,
    } = payload;

    if (from_store_id === to_store_id) {
      throw new ConflictError('Source and destination stores must be different');
    }

    // Generate transfer number
    let transferNo = `TR-${Date.now()}`;
    try {
      const tnRes = await db.query(
        `SELECT next_number($1, NULL, 'TRANSFER') AS transfer_no`,
        [organization_id]
      );
      if (tnRes.rows[0]?.transfer_no) {
        transferNo = tnRes.rows[0].transfer_no;
      }
    } catch {
      // Fall back to timestamp-based number
    }

    const client = await db.getClient();
    try {
      await client.query('BEGIN');

      const trRes = await client.query(
        `INSERT INTO stock_transfers (
          organization_id, transfer_no, from_store_id, to_store_id,
          requested_by, notes, created_by, updated_by
        ) VALUES ($1,$2,$3,$4,$5,$6,$7,$8)
        RETURNING *`,
        [organization_id, transferNo, from_store_id, to_store_id,
         createdBy, notes || null, createdBy, createdBy]
      );
      const tr = trRes.rows[0];

      for (const it of items) {
        await client.query(
          `INSERT INTO stock_transfer_items (
            stock_transfer_id, item_id, requested_qty, issued_qty, received_qty
          ) VALUES ($1,$2,$3,0,0)`,
          [tr.id, it.item_id, it.requested_qty]
        );
      }

      await client.query('COMMIT');
      return { ...tr, items };
    } catch (e) {
      await client.query('ROLLBACK');
      throw e;
    } finally {
      client.release();
    }
  }

  async approveStockTransfer(id: string, approvedBy?: string) {
    const existing = await this.getStockTransfer(id);

    if (existing.status !== 'requested') {
      throw new ConflictError('Only requested transfers can be approved');
    }

    const res = await db.query(
      `UPDATE stock_transfers
       SET status = 'approved', approved_by = $1, updated_at = now()
       WHERE id = $2 RETURNING *`,
      [approvedBy, id]
    );
    return res.rows[0];
  }

  async receiveStockTransfer(id: string, receivedBy?: string) {
    const existing = await this.getStockTransfer(id);

    if (existing.status !== 'approved' && existing.status !== 'in_transit') {
      throw new ConflictError('Only approved or in-transit transfers can be received');
    }

    const client = await db.getClient();
    try {
      await client.query('BEGIN');

      // Mark transfer as received
      await client.query(
        `UPDATE stock_transfers
         SET status = 'received', received_at = now(), updated_at = now()
         WHERE id = $1`,
        [id]
      );

      // For each transfer item, create stock movements
      for (const it of existing.items) {
        if (Number(it.received_qty) <= 0) continue;

        // transfer_out from source store
        await client.query(
          `INSERT INTO stock_movements (
            store_id, item_id, batch_id, movement_type, quantity,
            reference_type, reference_id, moved_by, notes
          ) VALUES ($1,$2,$3,'transfer_out',$4,'stock_transfer',$5,$6,$7)`,
          [existing.from_store_id, it.item_id, it.batch_id || null,
           -it.received_qty, id, receivedBy,
           `Transfer out: ${existing.transfer_no}`]
        );

        // transfer_in to destination store
        // Find or create batch at destination store
        const destBatchRes = await client.query(
          `SELECT id FROM stock_batches
           WHERE store_id = $1 AND item_id = $2 AND batch_no = (
             SELECT batch_no FROM stock_batches WHERE id = $3
           )`,
          [existing.to_store_id, it.item_id, it.batch_id]
        );

        let destBatchId: string;
        if (destBatchRes.rows.length > 0) {
          destBatchId = destBatchRes.rows[0].id;
        } else {
          // Create new batch at destination with same batch_no
          const sourceBatch = await client.query(
            `SELECT batch_no, manufactured_on, expiry_date, mrp, purchase_rate
             FROM stock_batches WHERE id = $1`,
            [it.batch_id]
          );
          if (sourceBatch.rows.length > 0) {
            const sb = sourceBatch.rows[0];
            const newBatch = await client.query(
              `INSERT INTO stock_batches (
                store_id, item_id, batch_no, manufactured_on, expiry_date,
                mrp, purchase_rate, sale_rate, quantity_on_hand,
                status, created_by, updated_by
              ) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,'active',$10,$11)
              RETURNING id`,
              [existing.to_store_id, it.item_id, sb.batch_no,
               sb.manufactured_on, sb.expiry_date, sb.mrp,
               sb.purchase_rate, sb.purchase_rate, it.received_qty,
               receivedBy, receivedBy]
            );
            destBatchId = newBatch.rows[0].id;
          } else {
            destBatchId = it.batch_id || null;
          }
        }

        await client.query(
          `INSERT INTO stock_movements (
            store_id, item_id, batch_id, movement_type, quantity,
            reference_type, reference_id, moved_by, notes
          ) VALUES ($1,$2,$3,'transfer_in',$4,'stock_transfer',$5,$6,$7)`,
          [existing.to_store_id, it.item_id, destBatchId,
           it.received_qty, id, receivedBy,
           `Transfer in: ${existing.transfer_no}`]
        );

        // Update transfer item received_qty
        await client.query(
          `UPDATE stock_transfer_items
           SET received_qty = received_qty + $1
           WHERE id = $2`,
          [it.received_qty, it.id]
        );
      }

      await client.query('COMMIT');
      return { id, status: 'received' };
    } catch (e) {
      await client.query('ROLLBACK');
      throw e;
    } finally {
      client.release();
    }
  }

  async rejectStockTransfer(id: string) {
    const existing = await this.getStockTransfer(id);

    if (existing.status !== 'requested' && existing.status !== 'approved') {
      throw new ConflictError('Only requested or approved transfers can be rejected');
    }

    const res = await db.query(
      `UPDATE stock_transfers
       SET status = 'rejected', updated_at = now()
       WHERE id = $1 RETURNING *`,
      [id]
    );
    return res.rows[0];
  }

  async cancelStockTransfer(id: string) {
    const existing = await this.getStockTransfer(id);

    if (existing.status === 'received') {
      throw new ConflictError('Cannot cancel a received transfer');
    }

    const res = await db.query(
      `UPDATE stock_transfers
       SET status = 'cancelled', updated_at = now()
       WHERE id = $1 RETURNING *`,
      [id]
    );
    return res.rows[0];
  }

  /* ================================================================== */
  /*  Reports                                                           */
  /* ================================================================== */

  async getDashboard({
    organization_id,
    facility_id,
  }: {
    organization_id?: string;
    facility_id?: string;
  }) {
    const orgFilter = organization_id ? `AND i.organization_id = $1` : '';
    const facFilter = facility_id ? `AND st.facility_id = $2` : '';
    const params: any[] = [];
    if (organization_id) params.push(organization_id);
    if (facility_id) params.push(facility_id);

    // Total stock value
    const stockValueRes = await db.query(
      `SELECT COALESCE(SUM(sb.quantity_on_hand * COALESCE(sb.purchase_rate, 0)), 0) AS total_stock_value
       FROM stock_batches sb
       JOIN items i ON i.id = sb.item_id
       JOIN stores st ON st.id = sb.store_id
       WHERE sb.quantity_on_hand > 0 ${orgFilter} ${facFilter}`,
      params
    );

    // Low stock count
    const lowStockRes = await db.query(
      `SELECT count(DISTINCT i.id)::int AS low_stock_count
       FROM items i
       LEFT JOIN stock_batches sb ON sb.item_id = i.id
       JOIN stores st ON st.id = sb.store_id
       WHERE i.is_active = true ${orgFilter} ${facFilter}
       GROUP BY i.id
       HAVING COALESCE(SUM(sb.quantity_on_hand), 0) <= COALESCE(i.reorder_level, 0)`,
      params
    );

    // Expiring soon (next 30 days)
    const expiringRes = await db.query(
      `SELECT count(*)::int AS expiring_soon_count
       FROM stock_batches sb
       JOIN items i ON i.id = sb.item_id
       JOIN stores st ON st.id = sb.store_id
       WHERE sb.expiry_date IS NOT NULL
         AND sb.expiry_date <= CURRENT_DATE + INTERVAL '30 days'
         AND sb.expiry_date >= CURRENT_DATE
         AND sb.quantity_on_hand > 0 ${orgFilter} ${facFilter}`,
      params
    );

    // Recent movements
    const recentRes = await db.query(
      `SELECT sm.id, sm.movement_type, sm.quantity, sm.moved_at,
              i.name AS item_name, sb.batch_no, st.name AS store_name
       FROM stock_movements sm
       JOIN items i ON i.id = sm.item_id
       JOIN stock_batches sb ON sb.id = sm.batch_id
       JOIN stores st ON st.id = sm.store_id
       WHERE 1=1 ${orgFilter} ${facFilter}
       ORDER BY sm.moved_at DESC
       LIMIT 10`,
      params
    );

    return {
      total_stock_value: Number(stockValueRes.rows[0]?.total_stock_value || 0),
      low_stock_count: lowStockRes.rows.length,
      expiring_soon_count: Number(expiringRes.rows[0]?.expiring_soon_count || 0),
      recent_movements: recentRes.rows,
    };
  }

  async getExpiryTracker({
    organization_id,
    facility_id,
    store_id,
    days_ahead = 30,
  }: {
    organization_id?: string;
    facility_id?: string;
    store_id?: string;
    days_ahead?: number;
  }) {
    const conditions: string[] = [];
    const params: any[] = [];
    let paramIdx = 1;

    conditions.push(`sb.expiry_date IS NOT NULL`);
    conditions.push(`sb.expiry_date <= CURRENT_DATE + INTERVAL '$${paramIdx++} days'`);
    params.push(days_ahead);
    conditions.push(`sb.expiry_date >= CURRENT_DATE`);

    if (organization_id) {
      conditions.push(`i.organization_id = $${paramIdx++}`);
      params.push(organization_id);
    }
    if (facility_id) {
      conditions.push(`st.facility_id = $${paramIdx++}`);
      params.push(facility_id);
    }
    if (store_id) {
      conditions.push(`sb.store_id = $${paramIdx++}`);
      params.push(store_id);
    }
    conditions.push(`sb.quantity_on_hand > 0`);

    const where = conditions.join(' AND ');

    const res = await db.query(
      `SELECT
        sb.id, sb.batch_no, sb.expiry_date, sb.quantity_on_hand,
        sb.status, sb.mrp, sb.purchase_rate,
        i.name AS item_name, i.code AS item_code,
        st.name AS store_name
       FROM stock_batches sb
       JOIN items i ON i.id = sb.item_id
       JOIN stores st ON st.id = sb.store_id
       WHERE ${where}
       ORDER BY sb.expiry_date ASC`,
      params
    );

    return res.rows;
  }

  async getLowStock({
    organization_id,
    facility_id,
    store_id,
  }: {
    organization_id?: string;
    facility_id?: string;
    store_id?: string;
  }) {
    const conditions: string[] = [];
    const params: any[] = [];
    let paramIdx = 1;

    if (organization_id) {
      conditions.push(`i.organization_id = $${paramIdx++}`);
      params.push(organization_id);
    }
    if (facility_id) {
      conditions.push(`st.facility_id = $${paramIdx++}`);
      params.push(facility_id);
    }
    if (store_id) {
      conditions.push(`sb.store_id = $${paramIdx++}`);
      params.push(store_id);
    }

    const where = conditions.length ? `WHERE ${conditions.join(' AND ')}` : '';

    const res = await db.query(
      `SELECT
        i.id, i.code, i.name, i.base_uom, i.reorder_level,
        i.item_type,
        COALESCE(SUM(sb.quantity_on_hand), 0) AS quantity_on_hand,
        st.name AS store_name
       FROM items i
       LEFT JOIN stock_batches sb ON sb.item_id = i.id
       LEFT JOIN stores st ON st.id = sb.store_id
       ${where}
       GROUP BY i.id, i.code, i.name, i.base_uom, i.reorder_level,
                i.item_type, st.name
       HAVING COALESCE(SUM(sb.quantity_on_hand), 0) <= COALESCE(i.reorder_level, 0)
       ORDER BY i.name`,
      params
    );

    return res.rows;
  }
}

export const inventoryRepository = new InventoryRepository();
export default inventoryRepository;
