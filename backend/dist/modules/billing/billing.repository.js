"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.BillingRepository = void 0;
const database_1 = require("../../config/database");
const AppError_1 = require("../../shared/errors/AppError");
class BillingRepository {
    async resolvePaymentMethodId(data, client = database_1.db) {
        const explicitMethodId = data.payment_method_id || data.paymentMethodId;
        if (explicitMethodId) {
            const existingMethod = await client.query('SELECT id FROM payment_methods WHERE id = $1 AND is_active = TRUE LIMIT 1', [explicitMethodId]);
            if (existingMethod.rows[0]?.id) {
                return existingMethod.rows[0].id;
            }
            throw new AppError_1.ValidationError('Selected payment method is not active or does not exist.');
        }
        const paymentMode = String(data.payment_mode || data.paymentMethod || data.payment_method || '').trim();
        if (!paymentMode) {
            throw new AppError_1.ValidationError('Payment method is required when recording a payment.');
        }
        const organizationId = data.organization_id || data.organizationId;
        const zeroUuid = '00000000-0000-0000-0000-000000000000';
        const hasOrg = organizationId && organizationId !== zeroUuid;
        const methodQuery = hasOrg
            ? 'SELECT id FROM payment_methods WHERE is_active = TRUE AND organization_id = $2 AND (name ILIKE $1 OR method_type ILIKE $1 OR code ILIKE $1) LIMIT 1'
            : 'SELECT id FROM payment_methods WHERE is_active = TRUE AND (name ILIKE $1 OR method_type ILIKE $1 OR code ILIKE $1) LIMIT 1';
        const methodRes = await client.query(methodQuery, hasOrg ? [`%${paymentMode}%`, organizationId] : [`%${paymentMode}%`]);
        if (!methodRes.rows[0]?.id) {
            throw new AppError_1.ValidationError('No active payment method found for this payment mode. Please create or activate one first.');
        }
        return methodRes.rows[0].id;
    }
    async createInvoice(data) {
        const client = await database_1.db.getClient();
        try {
            await client.query('BEGIN');
            let invoiceNo;
            await client.query('SAVEPOINT sp_invoice');
            try {
                const invoiceNoResult = await client.query('SELECT next_number($1, $2, $3) AS invoice_no', [data.organization_id, data.facility_id, 'INVOICE']);
                invoiceNo = invoiceNoResult.rows[0]?.invoice_no || `INV-${Date.now()}`;
                await client.query('RELEASE SAVEPOINT sp_invoice');
            }
            catch (seqErr) {
                await client.query('ROLLBACK TO SAVEPOINT sp_invoice');
                // Ensure an organization-level sequence row exists, then retry.
                await client.query(`INSERT INTO number_sequences (
             organization_id, facility_id, seq_key, prefix, suffix, include_year, padding, current_value, reset_policy, last_reset_on
           ) VALUES ($1, NULL, 'INVOICE', 'INV-', '', true, 4, 0, 'yearly', CURRENT_DATE)
           ON CONFLICT (organization_id, COALESCE(facility_id, '00000000-0000-0000-0000-000000000000'::uuid), seq_key)
           DO NOTHING`, [data.organization_id]);
                const invoiceNoResult = await client.query('SELECT next_number($1, $2, $3) AS invoice_no', [data.organization_id, null, 'INVOICE']);
                invoiceNo = invoiceNoResult.rows[0]?.invoice_no || `INV-${Date.now()}`;
                await client.query('RELEASE SAVEPOINT sp_invoice');
            }
            const invoiceQuery = `
        INSERT INTO invoices (
          organization_id, facility_id, patient_id, encounter_id, invoice_no, invoice_type, status,
          subtotal, discount_total, total_amount, due_amount, paid_amount, issued_at
        ) VALUES (
          $1, $2, $3, $4, $5, $6, 'draft',
          $7, $8, $9, $9, 0, NOW()
        ) RETURNING *;
      `;
            const invoiceRes = await client.query(invoiceQuery, [
                data.organization_id,
                data.facility_id,
                data.patient_id,
                data.encounter_id || null,
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
                // Issue the invoice before allocating a payment (trigger forbids payment allocations on draft invoices).
                await client.query(`UPDATE invoices SET status = 'issued', issued_at = NOW() WHERE id = $1`, [invoice.id]);
                const methodId = await this.resolvePaymentMethodId(data, client);
                let receiptNo;
                await client.query('SAVEPOINT sp_receipt');
                try {
                    const receiptNoResult = await client.query('SELECT next_number($1, $2, $3) AS receipt_no', [data.organization_id, data.facility_id, 'RECEIPT']);
                    receiptNo = receiptNoResult.rows[0]?.receipt_no || `REC-${Date.now()}`;
                    await client.query('RELEASE SAVEPOINT sp_receipt');
                }
                catch (seqErr) {
                    await client.query('ROLLBACK TO SAVEPOINT sp_receipt');
                    await client.query(`INSERT INTO number_sequences (
               organization_id, facility_id, seq_key, prefix, suffix, include_year, padding, current_value, reset_policy, last_reset_on
             ) VALUES ($1, NULL, 'RECEIPT', 'REC-', '', true, 4, 0, 'yearly', CURRENT_DATE)
             ON CONFLICT (organization_id, COALESCE(facility_id, '00000000-0000-0000-0000-000000000000'::uuid), seq_key)
             DO NOTHING`, [data.organization_id]);
                    const receiptNoResult = await client.query('SELECT next_number($1, $2, $3) AS receipt_no', [data.organization_id, null, 'RECEIPT']);
                    receiptNo = receiptNoResult.rows[0]?.receipt_no || `REC-${Date.now()}`;
                    await client.query('RELEASE SAVEPOINT sp_receipt');
                }
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
        }
        catch (e) {
            await client.query('ROLLBACK');
            throw e;
        }
        finally {
            client.release();
        }
    }
    async listInvoices(facilityId) {
        const query = `
      SELECT i.*, p.first_name, p.last_name, p.uhid 
      FROM invoices i
      JOIN patients p ON i.patient_id = p.id
      WHERE i.facility_id = $1
      ORDER BY i.created_at DESC
    `;
        const res = await database_1.db.query(query, [facilityId]);
        return res.rows;
    }
    async getInvoice(id, facilityId) {
        const query = `
      SELECT i.*, p.first_name, p.last_name, p.uhid
      FROM invoices i
      JOIN patients p ON i.patient_id = p.id
      WHERE i.id = $1 AND i.facility_id = $2
    `;
        const res = await database_1.db.query(query, [id, facilityId]);
        if (res.rows.length === 0)
            return null;
        const invoice = res.rows[0];
        const linesQuery = `
      SELECT * FROM invoice_lines WHERE invoice_id = $1 ORDER BY line_no ASC
    `;
        const linesRes = await database_1.db.query(linesQuery, [id]);
        invoice.items = linesRes.rows;
        return invoice;
    }
    async addCharge(data) {
        // Derive patient_id from the encounter when the caller (e.g. IPD billing UI)
        // does not send it explicitly.
        let patientId = data.patient_id;
        if (!patientId && data.encounter_id) {
            try {
                const encounterRes = await database_1.db.query(`SELECT patient_id FROM encounters WHERE id = $1 LIMIT 1`, [data.encounter_id]);
                patientId = encounterRes.rows[0]?.patient_id;
            }
            catch {
                patientId = null;
            }
        }
        const description = data.item_name || data.description || data.itemName || 'Charge';
        const qty = Number(data.quantity) || 1;
        const price = Number(data.rate || data.unit_price || data.price || 0);
        const totalAmount = Number(data.total_amount || data.amount || 0) || qty * price;
        const gross = price * qty;
        const discPct = Number(data.discount_percent || 0);
        const discAmt = Number(data.discount_amount || 0);
        const taxable = totalAmount - discAmt;
        const taxAmt = Number(data.tax_amount || 0);
        const net = taxable + taxAmt;
        const customFields = data.custom_fields || {};
        if (data.item_category || data.itemCategory) {
            customFields.item_category = data.item_category || data.itemCategory;
        }
        const query = `
      INSERT INTO charges (
        organization_id, facility_id, patient_id, encounter_id,
        service_id, item_id, description, department_id,
        quantity, unit_price, discount_percent, discount_amount,
        taxable_amount, tax_amount, net_amount, status, created_by, custom_fields
      ) VALUES (
        $1, $2, $3, $4,
        $5, $6, $7, $8,
        $9, $10, $11, $12,
        $13, $14, $15, 'billable', $16, $17
      ) RETURNING *;
    `;
        const res = await database_1.db.query(query, [
            data.organization_id, data.facility_id, patientId, data.encounter_id,
            data.service_id || null, data.item_id || null, description, data.department_id || null,
            qty, price, discPct, discAmt,
            taxable, taxAmt, net || totalAmount, data.user_id,
            JSON.stringify(customFields)
        ]);
        return res.rows[0];
    }
    async postBedCharges(encounterId, facilityId, userId) {
        // 1. Get encounter & admission details
        const encRes = await database_1.db.query(`SELECT e.id as encounter_id, e.organization_id, e.facility_id, e.patient_id, e.started_at, e.ended_at,
              a.id as admission_id, a.admitted_at, a.discharged_at
       FROM encounters e
       JOIN admissions a ON a.encounter_id = e.id
       WHERE e.id = $1 LIMIT 1;`, [encounterId]);
        if (encRes.rows.length === 0) {
            throw new AppError_1.NotFoundError('Encounter / Admission not found for billing bed charges');
        }
        const encounter = encRes.rows[0];
        const orgId = encounter.organization_id;
        // 2. Get all bed assignments for this admission
        const baRes = await database_1.db.query(`SELECT ba.id, ba.bed_id, ba.assigned_from, ba.assigned_to,
              b.bed_no, b.bed_charge_service_id, b.bed_category_id,
              bc.name as category_name,
              s.name as service_name, s.default_rate,
              w.name as ward_name
       FROM bed_assignments ba
       JOIN beds b ON ba.bed_id = b.id
       LEFT JOIN bed_categories bc ON b.bed_category_id = bc.id
       LEFT JOIN services s ON b.bed_charge_service_id = s.id
       LEFT JOIN wards w ON b.ward_id = w.id
       WHERE ba.admission_id = $1
       ORDER BY ba.assigned_from ASC;`, [encounter.admission_id]);
        const postedCharges = [];
        for (const ba of baRes.rows) {
            const fromDate = new Date(ba.assigned_from);
            const toDate = ba.assigned_to ? new Date(ba.assigned_to) : new Date();
            // Calculate days stayed (minimum 1 day)
            const diffMs = Math.max(0, toDate.getTime() - fromDate.getTime());
            const days = Math.max(1, Math.ceil(diffMs / (1000 * 60 * 60 * 24)));
            // Determine rate: check tariff rates or service default rate
            let rate = Number(ba.default_rate) || 1500;
            if (ba.bed_charge_service_id) {
                const tariffRes = await database_1.db.query(`SELECT rate FROM tariff_rates WHERE service_id = $1 AND (bed_category_id = $2 OR bed_category_id IS NULL) LIMIT 1;`, [ba.bed_charge_service_id, ba.bed_category_id]);
                if (tariffRes.rows.length > 0 && Number(tariffRes.rows[0].rate) > 0) {
                    rate = Number(tariffRes.rows[0].rate);
                }
            }
            const description = `Bed Charge: ${ba.ward_name || ''} - ${ba.bed_no} (${ba.category_name || 'Standard'}) - ${days} day(s)`;
            // Avoid creating identical duplicate charge for this bed assignment if already posted
            const existingCharge = await database_1.db.query(`SELECT id, quantity, net_amount FROM charges 
         WHERE encounter_id = $1 AND (custom_fields->>'bed_assignment_id') = $2 AND status != 'cancelled'
         LIMIT 1;`, [encounterId, ba.id]);
            if (existingCharge.rows.length > 0) {
                const existing = existingCharge.rows[0];
                if (Number(existing.quantity) !== days) {
                    const total = days * rate;
                    const updated = await database_1.db.query(`UPDATE charges 
             SET quantity = $2, unit_price = $3, taxable_amount = $4, net_amount = $4, description = $5, updated_at = NOW()
             WHERE id = $1 RETURNING *;`, [existing.id, days, rate, total, description]);
                    postedCharges.push(updated.rows[0]);
                }
                else {
                    postedCharges.push(existing);
                }
            }
            else {
                const total = days * rate;
                const customFields = {
                    bed_assignment_id: ba.id,
                    bed_id: ba.bed_id,
                    bed_no: ba.bed_no,
                    days,
                    item_category: 'Room Charges',
                };
                const charge = await this.addCharge({
                    organization_id: orgId,
                    facility_id: encounter.facility_id || facilityId,
                    patient_id: encounter.patient_id,
                    encounter_id: encounterId,
                    service_id: ba.bed_charge_service_id || null,
                    item_name: description,
                    item_category: 'Room Charges',
                    quantity: days,
                    unit_price: rate,
                    rate: rate,
                    total_amount: total,
                    user_id: userId,
                    custom_fields: customFields,
                });
                postedCharges.push(charge);
            }
        }
        return postedCharges;
    }
    async removeCharge(id, facilityId) {
        const query = `
      UPDATE charges 
      SET status = 'cancelled', updated_at = NOW()
      WHERE id = $1 AND facility_id = $2 AND status = 'billable'
      RETURNING *;
    `;
        const res = await database_1.db.query(query, [id, facilityId]);
        return res.rows[0];
    }
    async getRunningBill(encounterId, facilityId) {
        const query = `
      SELECT c.*, s.name as service_name,
             COALESCE(i.name, c.description) as item_name,
             c.unit_price as rate,
             c.net_amount as total_amount,
             COALESCE(c.custom_fields->>'item_category', CASE WHEN c.source_type = 'order_item' THEN 'Lab Test' ELSE 'General' END) as item_category,
             COALESCE(c.custom_fields->>'payment_status', CASE WHEN c.status = 'billed' THEN 'paid' ELSE c.status END) as payment_status
      FROM charges c
      LEFT JOIN services s ON c.service_id = s.id
      LEFT JOIN items i ON c.item_id = i.id
      WHERE c.encounter_id = $1 AND c.facility_id = $2 AND c.status IN ('billable', 'billed')
      ORDER BY c.charged_at DESC
    `;
        const res = await database_1.db.query(query, [encounterId, facilityId]);
        return res.rows;
    }
    async recordAdvancePayment(data) {
        const receiptNoResult = await database_1.db.query('SELECT next_number($1, $2, $3) AS receipt_no', [data.organization_id, data.facility_id, 'RECEIPT']);
        const receiptNo = receiptNoResult.rows[0]?.receipt_no || `ADV-${Date.now()}`;
        const methodId = await this.resolvePaymentMethodId(data);
        const paymentType = String(data.payment_type || 'advance').toLowerCase();
        // Derive patient_id from encounter (the reliable source). Frontend may send
        // admission id instead of patient uuid, so always resolve from encounter.
        let patientId = null;
        if (data.encounter_id) {
            try {
                const enc = await database_1.db.query('SELECT patient_id FROM encounters WHERE id = $1 LIMIT 1', [data.encounter_id]);
                patientId = enc.rows[0]?.patient_id || null;
            }
            catch {
                patientId = null;
            }
        }
        const query = `
      INSERT INTO payments (
        organization_id, facility_id, receipt_no, patient_id, encounter_id,
        direction, payment_type, payment_method_id, amount, status, received_by
      ) VALUES (
        $1, $2, $3, $4, $5,
        'in', $6, $7, $8, 'completed', $9
      ) RETURNING *;
    `;
        const res = await database_1.db.query(query, [
            data.organization_id, data.facility_id, receiptNo, patientId, data.encounter_id,
            paymentType, methodId, data.amount, data.user_id
        ]);
        return res.rows[0];
    }
    async getEncounterPayments(encounterId, facilityId) {
        const query = `
      SELECT p.*, pm.name as payment_method_name,
             pm.name as payment_method,
             p.paid_at as payment_date,
             p.notes as notes
      FROM payments p
      LEFT JOIN payment_methods pm ON p.payment_method_id = pm.id
      WHERE p.encounter_id = $1 AND p.facility_id = $2
      ORDER BY p.paid_at DESC
    `;
        const res = await database_1.db.query(query, [encounterId, facilityId]);
        return res.rows;
    }
    async getReportsSummary(facilityId, dateFrom, dateTo) {
        const params = [facilityId];
        let dateFilter = '';
        if (dateFrom && dateTo) {
            params.push(dateFrom, dateTo);
            dateFilter = ` AND i.issued_at >= $2 AND i.issued_at <= $3`;
        }
        const invSummaryQuery = `
      SELECT 
        COALESCE(SUM(i.total_amount), 0)::numeric as total_invoiced,
        COALESCE(SUM(i.paid_amount), 0)::numeric as total_revenue,
        COALESCE(SUM(i.due_amount), 0)::numeric as outstanding_dues,
        COUNT(i.id) as total_invoices,
        COUNT(i.id) FILTER (WHERE i.due_amount > 0) as pending_invoices_count
      FROM invoices i
      WHERE (i.facility_id = $1 OR $1 = '00000000-0000-0000-0000-000000000000') ${dateFilter}
    `;
        const invRes = await database_1.db.query(invSummaryQuery, params);
        const invRow = invRes.rows[0] || {};
        // Today's collections
        const collectionsQuery = `
      SELECT COALESCE(SUM(amount), 0)::numeric as today_collections
      FROM payments
      WHERE (facility_id = $1 OR $1 = '00000000-0000-0000-0000-000000000000')
        AND paid_at >= CURRENT_DATE AND status = 'completed'
    `;
        const collRes = await database_1.db.query(collectionsQuery, [facilityId]);
        const todayCollections = Number(collRes.rows[0]?.today_collections || 0);
        // Department / Lab breakdown
        const labQuery = `
      SELECT 
        COALESCE(SUM(c.net_amount), 0)::numeric as lab_total_charges,
        COALESCE(SUM(c.net_amount) FILTER (WHERE c.status = 'billable'), 0)::numeric as lab_unbilled_dues,
        COALESCE(SUM(c.net_amount) FILTER (WHERE c.status = 'billed'), 0)::numeric as lab_billed_amount
      FROM charges c
      JOIN departments d ON d.id = c.department_id
      WHERE (c.facility_id = $1 OR $1 = '00000000-0000-0000-0000-000000000000')
        AND (d.code = 'LAB' OR d.department_type = 'diagnostic')
    `;
        const labRes = await database_1.db.query(labQuery, [facilityId]);
        const labRow = labRes.rows[0] || {};
        return {
            totalInvoiced: Number(invRow.total_invoiced || 0),
            totalRevenue: Number(invRow.total_revenue || 0),
            outstandingDues: Number(invRow.outstanding_dues || 0),
            todayCollections,
            totalInvoices: parseInt(invRow.total_invoices || '0', 10),
            pendingInvoicesCount: parseInt(invRow.pending_invoices_count || '0', 10),
            labTotalCharges: Number(labRow.lab_total_charges || 0),
            labUnbilledDues: Number(labRow.lab_unbilled_dues || 0),
            labBilledAmount: Number(labRow.lab_billed_amount || 0)
        };
    }
    async getPendingDuesReport(facilityId, filters, page = 1, limit = 20) {
        const offset = Math.max(0, (page - 1) * limit);
        const params = [facilityId];
        let whereClause = `
      WHERE (i.facility_id = $1 OR $1 = '00000000-0000-0000-0000-000000000000')
        AND i.due_amount > 0
        AND i.status != 'cancelled'
    `;
        if (filters?.search) {
            params.push(`%${filters.search.toLowerCase()}%`);
            whereClause += ` AND (
        LOWER(p.first_name || ' ' || COALESCE(p.last_name, '')) LIKE $${params.length} OR
        LOWER(p.uhid) LIKE $${params.length} OR
        LOWER(i.invoice_no) LIKE $${params.length} OR
        LOWER(COALESCE(p.phone, '')) LIKE $${params.length}
      )`;
        }
        if (filters?.invoiceType && filters.invoiceType !== 'All') {
            params.push(filters.invoiceType.toLowerCase());
            whereClause += ` AND LOWER(i.invoice_type) = $${params.length}`;
        }
        if (filters?.status && filters.status !== 'All') {
            params.push(filters.status.toLowerCase());
            whereClause += ` AND LOWER(i.status) = $${params.length}`;
        }
        if (filters?.dateFrom) {
            params.push(filters.dateFrom);
            whereClause += ` AND i.issued_at >= $${params.length}::timestamptz`;
        }
        if (filters?.dateTo) {
            params.push(filters.dateTo);
            whereClause += ` AND i.issued_at <= $${params.length}::timestamptz`;
        }
        const countQuery = `
      SELECT COUNT(i.id) as total
      FROM invoices i
      JOIN patients p ON p.id = i.patient_id
      LEFT JOIN encounters e ON e.id = i.encounter_id
      LEFT JOIN admissions a ON a.encounter_id = e.id
      ${whereClause}
    `;
        const countRes = await database_1.db.query(countQuery, params);
        const total = parseInt(countRes.rows[0]?.total || '0', 10);
        const query = `
      SELECT 
        i.id,
        i.invoice_no,
        i.invoice_type,
        i.status as invoice_status,
        i.subtotal,
        i.tax_total,
        i.discount_total,
        i.total_amount,
        i.paid_amount,
        i.due_amount,
        i.issued_at,
        p.id as patient_id,
        p.first_name,
        p.last_name,
        p.uhid,
        p.phone,
        e.id as encounter_id,
        e.encounter_type,
        e.encounter_type as encounter_class,
        e.status as encounter_status,
        a.id as admission_id,
        a.status as admission_status,
        a.discharged_at,
        CASE 
          WHEN a.discharged_at IS NOT NULL OR a.status = 'discharged' THEN 'Discharged'
          WHEN e.status = 'completed' THEN 'Completed'
          WHEN a.id IS NOT NULL THEN 'Admitted'
          ELSE 'Active'
        END as patient_encounter_state
      FROM invoices i
      JOIN patients p ON p.id = i.patient_id
      LEFT JOIN encounters e ON e.id = i.encounter_id
      LEFT JOIN admissions a ON a.encounter_id = e.id
      ${whereClause}
      ORDER BY i.issued_at DESC
      LIMIT ${limit} OFFSET ${offset}
    `;
        const res = await database_1.db.query(query, params);
        return {
            invoices: res.rows,
            pagination: {
                total,
                page,
                limit,
                totalPages: Math.ceil(total / limit)
            }
        };
    }
    async getCollectionsReport(facilityId, filters) {
        const params = [facilityId];
        let whereClause = `WHERE (p.facility_id = $1 OR $1 = '00000000-0000-0000-0000-000000000000') AND p.status = 'completed'`;
        if (filters?.dateFrom) {
            params.push(filters.dateFrom);
            whereClause += ` AND p.paid_at >= $${params.length}::timestamptz`;
        }
        if (filters?.dateTo) {
            params.push(filters.dateTo);
            whereClause += ` AND p.paid_at <= $${params.length}::timestamptz`;
        }
        if (filters?.paymentMethod && filters.paymentMethod !== 'All') {
            params.push(`%${filters.paymentMethod.toLowerCase()}%`);
            whereClause += ` AND LOWER(pm.name) LIKE $${params.length}`;
        }
        const summaryQuery = `
      SELECT 
        COALESCE(pm.name, 'Other') as payment_mode,
        COUNT(p.id) as transaction_count,
        COALESCE(SUM(p.amount), 0)::numeric as total_collected
      FROM payments p
      LEFT JOIN payment_methods pm ON pm.id = p.payment_method_id
      ${whereClause}
      GROUP BY pm.name
      ORDER BY total_collected DESC
    `;
        const summaryRes = await database_1.db.query(summaryQuery, params);
        const ledgerQuery = `
      SELECT 
        p.id,
        p.receipt_no,
        p.amount,
        p.payment_type,
        p.direction,
        p.paid_at,
        pm.name as payment_method_name,
        pat.first_name,
        pat.last_name,
        pat.uhid,
        i.invoice_no
      FROM payments p
      LEFT JOIN payment_methods pm ON pm.id = p.payment_method_id
      LEFT JOIN patients pat ON pat.id = p.patient_id
      LEFT JOIN payment_allocations pa ON pa.payment_id = p.id
      LEFT JOIN invoices i ON i.id = pa.invoice_id
      ${whereClause}
      ORDER BY p.paid_at DESC
      LIMIT 100
    `;
        const ledgerRes = await database_1.db.query(ledgerQuery, params);
        return {
            byPaymentMode: summaryRes.rows,
            ledger: ledgerRes.rows
        };
    }
    async getPatientDues(patientId, facilityId) {
        const invQuery = `
      SELECT i.*, e.encounter_type, e.encounter_type as encounter_class, e.status as encounter_status
      FROM invoices i
      LEFT JOIN encounters e ON e.id = i.encounter_id
      WHERE i.patient_id = $1 AND i.due_amount > 0 AND i.status != 'cancelled'
        AND ($2::uuid IS NULL OR i.facility_id = $2::uuid OR $2 = '00000000-0000-0000-0000-000000000000')
      ORDER BY i.issued_at DESC
    `;
        const invRes = await database_1.db.query(invQuery, [patientId, facilityId || null]);
        const chgQuery = `
      SELECT c.*, d.name as department_name, s.name as service_name
      FROM charges c
      LEFT JOIN departments d ON d.id = c.department_id
      LEFT JOIN services s ON s.id = c.service_id
      WHERE c.patient_id = $1 AND c.status = 'billable'
        AND ($2::uuid IS NULL OR c.facility_id = $2::uuid OR $2 = '00000000-0000-0000-0000-000000000000')
      ORDER BY c.charged_at DESC
    `;
        const chgRes = await database_1.db.query(chgQuery, [patientId, facilityId || null]);
        const totalInvoiceDue = invRes.rows.reduce((sum, r) => sum + Number(r.due_amount || 0), 0);
        const totalUnbilledCharges = chgRes.rows.reduce((sum, r) => sum + Number(r.net_amount || 0), 0);
        return {
            patientId,
            totalDue: totalInvoiceDue + totalUnbilledCharges,
            totalInvoiceDue,
            totalUnbilledCharges,
            invoices: invRes.rows,
            unbilledCharges: chgRes.rows
        };
    }
}
exports.BillingRepository = BillingRepository;
