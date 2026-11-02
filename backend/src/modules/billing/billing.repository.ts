import { db } from '../../config/database';
import { ValidationError, NotFoundError } from '../../shared/errors/AppError';

export class BillingRepository {
  private async resolvePaymentMethodId(data: any, client: any = db): Promise<string> {
    const explicitMethodId = data.payment_method_id || data.paymentMethodId;
    if (explicitMethodId) {
      const existingMethod = await client.query(
        'SELECT id FROM payment_methods WHERE id = $1 AND is_active = TRUE LIMIT 1',
        [explicitMethodId]
      );

      if (existingMethod.rows[0]?.id) {
        return existingMethod.rows[0].id;
      }

      throw new ValidationError('Selected payment method is not active or does not exist.');
    }

    const paymentMode = String(data.payment_mode || data.paymentMethod || data.payment_method || '').trim();
    const organizationId = data.organization_id || data.organizationId;

    // Clean mode to first key term if compound e.g. "UPI / PhonePe" -> "UPI", "Card POS" -> "Card", "Cash Counter" -> "Cash"
    const cleanMode = paymentMode.split(/[\/\(]/)[0].trim();

    if (paymentMode) {
      if (organizationId) {
        const methodRes = await client.query(
          'SELECT id FROM payment_methods WHERE is_active = TRUE AND organization_id = $2 AND (name ILIKE $1 OR method_type ILIKE $1 OR code ILIKE $1) LIMIT 1',
          [`%${cleanMode || paymentMode}%`, organizationId]
        );
        if (methodRes.rows[0]?.id) {
          return methodRes.rows[0].id;
        }
      }

      // Try across active payment methods
      const methodRes = await client.query(
        'SELECT id FROM payment_methods WHERE is_active = TRUE AND (name ILIKE $1 OR method_type ILIKE $1 OR code ILIKE $1) LIMIT 1',
        [`%${cleanMode || paymentMode}%`]
      );

      if (methodRes.rows[0]?.id) {
        return methodRes.rows[0].id;
      }
    }

    // Fallback: Cash or first active method
    const fallbackRes = await client.query(
      'SELECT id FROM payment_methods WHERE is_active = TRUE ORDER BY CASE WHEN code = \'CASH\' OR name ILIKE \'%cash%\' THEN 0 ELSE 1 END, created_at ASC LIMIT 1'
    );

    if (fallbackRes.rows[0]?.id) {
      return fallbackRes.rows[0].id;
    }

    throw new ValidationError('No active payment method found. Please activate Cash or UPI first.');
  }

  async getDiscountReasons(organizationId?: string) {
    if (organizationId) {
      const res = await db.query(
        `SELECT id, organization_id, code, name, default_percent, max_percent, requires_approval, is_active
         FROM discount_reasons
         WHERE is_active = true AND organization_id = $1
         ORDER BY name ASC`,
        [organizationId]
      );
      if (res.rows.length > 0) {
        return res.rows;
      }
    }

    // Dynamic fallback: return unique active discount reasons
    const fallbackRes = await db.query(
      `SELECT DISTINCT ON (code) id, organization_id, code, name, default_percent, max_percent, requires_approval, is_active
       FROM discount_reasons
       WHERE is_active = true
       ORDER BY code, id`
    );
    return fallbackRes.rows.sort((a: any, b: any) => a.name.localeCompare(b.name));
  }

  async getReferrals(organizationId?: string, facilityId?: string) {
    let docsRes = await db.query(
      `SELECT 
         p.id as practitioner_id,
         s.id as staff_id,
         TRIM(CONCAT(s.first_name, ' ', COALESCE(s.last_name, ''))) as name,
         d.name as department,
         p.registration_no
       FROM practitioners p
       JOIN staff s ON p.staff_id = s.id
       LEFT JOIN departments d ON s.department_id = d.id
       WHERE s.is_active = true 
         AND ($1::uuid IS NULL OR s.organization_id = $1::uuid)
       ORDER BY s.first_name ASC`,
      [organizationId || null]
    );

    if (docsRes.rows.length === 0) {
      docsRes = await db.query(
        `SELECT 
           p.id as practitioner_id,
           s.id as staff_id,
           TRIM(CONCAT(s.first_name, ' ', COALESCE(s.last_name, ''))) as name,
           d.name as department,
           p.registration_no
         FROM practitioners p
         JOIN staff s ON p.staff_id = s.id
         LEFT JOIN departments d ON s.department_id = d.id
         WHERE s.is_active = true
         ORDER BY s.first_name ASC`
      );
    }

    const sources = [
      'Doctor Referral',
      'Self / Direct Walk-in',
      'Hospital Consultant / Internal',
      'Hospital Transfer / Casualty',
      'Management / Director Discretion',
      'Senior Citizen / Community Concession',
      'Corporate / Institutional Tie-Up',
      'Insurance / TPA Panel',
      'Charitable Trust / BPL Scheme'
    ];

    return {
      doctors: docsRes.rows,
      referral_sources: sources
    };
  }

  async createInvoice(data: any) {
    const client = await db.getClient();
    try {
      await client.query('BEGIN');

      let invoiceNo: string;
      await client.query('SAVEPOINT sp_invoice');
      try {
        const invoiceNoResult = await client.query(
          'SELECT next_number($1, $2, $3) AS invoice_no',
          [data.organization_id, data.facility_id, 'INVOICE']
        );
        invoiceNo = invoiceNoResult.rows[0]?.invoice_no || `INV-${Date.now()}`;
        await client.query('RELEASE SAVEPOINT sp_invoice');
      } catch (seqErr: any) {
        await client.query('ROLLBACK TO SAVEPOINT sp_invoice');
        // Ensure an organization-level sequence row exists, then retry.
        await client.query(
          `INSERT INTO number_sequences (
             organization_id, facility_id, seq_key, prefix, suffix, include_year, padding, current_value, reset_policy, last_reset_on
           ) VALUES ($1, NULL, 'INVOICE', 'INV-', '', true, 4, 0, 'yearly', CURRENT_DATE)
           ON CONFLICT (organization_id, COALESCE(facility_id, '00000000-0000-0000-0000-000000000000'::uuid), seq_key)
           DO NOTHING`,
          [data.organization_id]
        );
        const invoiceNoResult = await client.query(
          'SELECT next_number($1, $2, $3) AS invoice_no',
          [data.organization_id, null, 'INVOICE']
        );
        invoiceNo = invoiceNoResult.rows[0]?.invoice_no || `INV-${Date.now()}`;
        await client.query('RELEASE SAVEPOINT sp_invoice');
      }

      // Ensure unique invoiceNo in case sequence was behind existing records
      let attempts = 0;
      while (attempts < 10) {
        const dupCheck = await client.query(
          'SELECT 1 FROM invoices WHERE facility_id = $1 AND invoice_no = $2 LIMIT 1',
          [data.facility_id, invoiceNo]
        );
        if (dupCheck.rows.length === 0) break;
        attempts++;
        try {
          const nextRes = await client.query('SELECT next_number($1, $2, $3) AS invoice_no', [data.organization_id, data.facility_id, 'INVOICE']);
          invoiceNo = nextRes.rows[0]?.invoice_no || `INV-${Date.now()}`;
        } catch {
          invoiceNo = `INV-${Date.now()}-${attempts}`;
          break;
        }
      }
      
      // Resolve discount reason code / name if discount_reason_id is present
      let discountReasonCode: string | null = null;
      let discountReasonName: string | null = null;
      if (data.discount_reason_id) {
        try {
          const drRes = await client.query(
            'SELECT code, name FROM discount_reasons WHERE id = $1 LIMIT 1',
            [data.discount_reason_id]
          );
          if (drRes.rows[0]) {
            discountReasonCode = drRes.rows[0].code;
            discountReasonName = drRes.rows[0].name;
          }
        } catch {
          // ignore
        }
      }

      const externalRefs: any = {
        discount_reference: data.discount_reference || null,
        discount_reason_code: discountReasonCode,
        discount_reason_name: discountReasonName,
        referred_by: data.referred_by || null,
        referral_source: data.referral_source || null,
        ...(data.external_refs || {})
      };

      const invoiceQuery = `
        INSERT INTO invoices (
          organization_id, facility_id, patient_id, encounter_id, invoice_no, invoice_type, status,
          subtotal, discount_total, total_amount, due_amount, paid_amount, issued_at,
          discount_reason_id, discount_approved_by, external_refs, notes
        ) VALUES (
          $1, $2, $3, $4, $5, $6, 'draft',
          $7, $8, $9, $9, 0, NOW(),
          $10, $11, $12, $13
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
        data.discount_total || 0,
        data.total_amount,
        data.discount_reason_id || null,
        data.discount_approved_by || null,
        JSON.stringify(externalRefs),
        data.notes || null
      ]);
      const invoice = invoiceRes.rows[0];

      let lineNo = 1;
      for (const item of data.items) {
        const itemQty = Number(item.qty) || 1;
        const itemPrice = Number(item.price) || 0;
        const grossAmount = itemQty * itemPrice;
        let discAmt = Number(item.discount_amount || item.discount || 0);
        let discPct = Number(item.discount_percent || 0);
        if (discPct > 0 && discAmt === 0) {
          discAmt = (grossAmount * discPct) / 100;
        } else if (discAmt > 0 && discPct === 0 && grossAmount > 0) {
          discPct = (discAmt / grossAmount) * 100;
        }
        discAmt = Math.min(discAmt, grossAmount);
        const taxableAmount = Math.max(0, grossAmount - discAmt);
        const lineTotal = taxableAmount;

        const lineQuery = `
          INSERT INTO invoice_lines (
            invoice_id, line_no, description, quantity, unit_price,
            discount_percent, discount_amount, taxable_amount, line_total
          ) VALUES (
            $1, $2, $3, $4, $5,
            $6, $7, $8, $9
          )
        `;
        await client.query(lineQuery, [
          invoice.id,
          lineNo++,
          item.name,
          itemQty,
          itemPrice,
          discPct,
          discAmt,
          taxableAmount,
          lineTotal
        ]);
      }

      if (data.encounter_id && (data.referred_by || data.referral_source)) {
        try {
          await client.query(
            `UPDATE encounters 
             SET referred_by = COALESCE($1, referred_by),
                 referral_source = COALESCE($2, referral_source),
                 updated_at = NOW()
             WHERE id = $3`,
            [data.referred_by || null, data.referral_source || null, data.encounter_id]
          );
        } catch {
          // ignore
        }
      }

      if (data.payment_mode && data.total_amount > 0) {
        // Issue the invoice before allocating a payment (trigger forbids payment allocations on draft invoices).
        await client.query(
          `UPDATE invoices SET status = 'issued', issued_at = NOW() WHERE id = $1`,
          [invoice.id]
        );

        const methodId = await this.resolvePaymentMethodId(data, client);

        let receiptNo: string;
        await client.query('SAVEPOINT sp_receipt');
        try {
          const receiptNoResult = await client.query(
            'SELECT next_number($1, $2, $3) AS receipt_no',
            [data.organization_id, data.facility_id, 'RECEIPT']
          );
          receiptNo = receiptNoResult.rows[0]?.receipt_no || `REC-${Date.now()}`;
          await client.query('RELEASE SAVEPOINT sp_receipt');
        } catch (seqErr: any) {
          await client.query('ROLLBACK TO SAVEPOINT sp_receipt');
          await client.query(
            `INSERT INTO number_sequences (
               organization_id, facility_id, seq_key, prefix, suffix, include_year, padding, current_value, reset_policy, last_reset_on
             ) VALUES ($1, NULL, 'RECEIPT', 'REC-', '', true, 4, 0, 'yearly', CURRENT_DATE)
             ON CONFLICT (organization_id, COALESCE(facility_id, '00000000-0000-0000-0000-000000000000'::uuid), seq_key)
             DO NOTHING`,
            [data.organization_id]
          );
          const receiptNoResult = await client.query(
            'SELECT next_number($1, $2, $3) AS receipt_no',
            [data.organization_id, null, 'RECEIPT']
          );
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
    } catch (e) {
      await client.query('ROLLBACK');
      throw e;
    } finally {
      client.release();
    }
  }

  async listInvoices(facilityId: string) {
    const query = `
      SELECT i.*, p.first_name, p.last_name, p.uhid,
             dr.name as discount_reason_name, dr.code as discount_reason_code,
             COALESCE(i.external_refs->>'referred_by', e.referred_by) as referred_by,
             COALESCE(i.external_refs->>'referral_source', e.referral_source) as referral_source,
             i.external_refs->>'discount_reference' as discount_reference
      FROM invoices i
      JOIN patients p ON i.patient_id = p.id
      LEFT JOIN discount_reasons dr ON i.discount_reason_id = dr.id
      LEFT JOIN encounters e ON i.encounter_id = e.id
      WHERE i.facility_id = $1
      ORDER BY i.created_at DESC
    `;
    const res = await db.query(query, [facilityId]);
    return res.rows;
  }

  async getInvoice(id: string, facilityId: string) {
    const query = `
      SELECT i.*, p.first_name, p.last_name, p.uhid,
             dr.name as discount_reason_name, dr.code as discount_reason_code,
             dr.default_percent as discount_reason_percent,
             e.encounter_no,
             COALESCE(i.external_refs->>'referred_by', e.referred_by) as referred_by,
             COALESCE(i.external_refs->>'referral_source', e.referral_source) as referral_source,
             i.external_refs->>'discount_reference' as discount_reference
      FROM invoices i
      JOIN patients p ON i.patient_id = p.id
      LEFT JOIN discount_reasons dr ON i.discount_reason_id = dr.id
      LEFT JOIN encounters e ON i.encounter_id = e.id
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
    // Derive organization_id, facility_id, and patient_id from the encounter
    let patientId = data.patient_id;
    if (data.encounter_id) {
      try {
        const encounterRes = await db.query(
          `SELECT organization_id, facility_id, patient_id FROM encounters WHERE id = $1 LIMIT 1`,
          [data.encounter_id]
        );
        if (encounterRes.rows.length > 0) {
          const row = encounterRes.rows[0];
          patientId = patientId || row.patient_id;
          data.organization_id = row.organization_id;
          data.facility_id = row.facility_id;
        }
      } catch {
        // fallback
      }
    }

    if (!data.organization_id) {
      const orgRes = await db.query(`SELECT id FROM organizations LIMIT 1`);
      data.organization_id = orgRes.rows[0]?.id;
    }
    if (!data.facility_id) {
      const facRes = await db.query(`SELECT id FROM facilities WHERE organization_id = $1 LIMIT 1`, [data.organization_id]);
      data.facility_id = facRes.rows[0]?.id;
    }
    if (!data.user_id) {
      const userRes = await db.query(`SELECT id FROM users LIMIT 1`);
      data.user_id = userRes.rows[0]?.id;
    }

    const description =
      data.item_name || data.description || data.itemName || 'Charge';

    const qty = Number(data.quantity) || 1;
    const price = Number(data.rate || data.unit_price || data.price || 0);
    const gross = price * qty;
    let discPct = Number(data.discount_percent || 0);
    let discAmt = Number(data.discount_amount || 0);

    if (discPct > 0 && discAmt === 0) {
      discAmt = (gross * discPct) / 100;
    } else if (discAmt > 0 && discPct === 0 && gross > 0) {
      discPct = (discAmt / gross) * 100;
    }
    discAmt = Math.min(discAmt, gross);
    if (gross > 0 && discPct === 0 && discAmt > 0) {
      discPct = (discAmt / gross) * 100;
    }

    const taxable = Math.max(0, gross - discAmt);
    const taxAmt = Number(data.tax_amount || 0);
    const net = taxable + taxAmt;

    const customFields = data.custom_fields || {};
    if (data.item_category || data.itemCategory) {
      customFields.item_category = data.item_category || data.itemCategory;
    }
    if (data.discount_reason || data.discountReason) {
      customFields.discount_reason = data.discount_reason || data.discountReason;
    }
    if (data.discount_reason_id || data.discountReasonId) {
      customFields.discount_reason_id = data.discount_reason_id || data.discountReasonId;
    }
    if (data.discount_reference || data.discountReference) {
      customFields.discount_reference = data.discount_reference || data.discountReference;
    }
    if (data.referred_by || data.referredBy) {
      customFields.referred_by = data.referred_by || data.referredBy;
    }
    if (data.referral_source || data.referralSource) {
      customFields.referral_source = data.referral_source || data.referralSource;
    }

    const chargeDate = data.charged_at || data.charge_date || data.date || null;
    const practitionerId = data.ordered_by_practitioner_id || data.practitioner_id || null;

    const query = `
      INSERT INTO charges (
        organization_id, facility_id, patient_id, encounter_id,
        service_id, item_id, description, department_id,
        quantity, unit_price, discount_percent, discount_amount,
        taxable_amount, tax_amount, net_amount, status, created_by, custom_fields, charged_at,
        ordered_by_practitioner_id
      ) VALUES (
        $1, $2, $3, $4,
        $5, $6, $7, $8,
        $9, $10, $11, $12,
        $13, $14, $15, 'billable', $16, $17, COALESCE($18::timestamptz, NOW()),
        $19
      ) RETURNING *;
    `;
    const res = await db.query(query, [
      data.organization_id, data.facility_id, patientId, data.encounter_id,
      data.service_id || null, data.item_id || null, description, data.department_id || null,
      qty, price, discPct, discAmt,
      taxable, taxAmt, net, data.user_id,
      JSON.stringify(customFields), chargeDate,
      practitionerId
    ]);
    return res.rows[0];
  }

  async postBedCharges(encounterId: string, facilityId: string, userId?: string) {
    // 1. Get encounter & admission details
    const encRes = await db.query(
      `SELECT e.id as encounter_id, e.organization_id, e.facility_id, e.patient_id, e.started_at, e.ended_at,
              a.id as admission_id, a.admitted_at, a.discharged_at
       FROM encounters e
       JOIN admissions a ON a.encounter_id = e.id
       WHERE e.id = $1 LIMIT 1;`,
      [encounterId]
    );

    if (encRes.rows.length === 0) {
      throw new NotFoundError('Encounter / Admission not found for billing bed charges');
    }

    const encounter = encRes.rows[0];
    const orgId = encounter.organization_id;

    // 2. Get all bed assignments for this admission
    const baRes = await db.query(
      `SELECT ba.id, ba.bed_id, ba.assigned_from, ba.assigned_to,
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
       ORDER BY ba.assigned_from ASC;`,
      [encounter.admission_id]
    );

    const postedCharges: any[] = [];

    // Fallback if no specific bed assignments exist for this admission: calculate based on admission stay dates
    if (baRes.rows.length === 0) {
      const fromDate = new Date(encounter.admitted_at || encounter.started_at || new Date());
      const toDate = encounter.discharged_at ? new Date(encounter.discharged_at) : (encounter.ended_at ? new Date(encounter.ended_at) : new Date());
      const diffMs = Math.max(0, toDate.getTime() - fromDate.getTime());
      const days = Math.max(1, Math.ceil(diffMs / (1000 * 60 * 60 * 24)));
      const rate = 1500;
      const description = `Bed Charge: General Inpatient Stay (${days} day(s))`;

      const existingCharge = await db.query(
        `SELECT id, quantity, net_amount FROM charges 
         WHERE encounter_id = $1 AND (custom_fields->>'item_category') = 'Room Charges' AND status != 'cancelled'
         LIMIT 1;`,
        [encounterId]
      );

      if (existingCharge.rows.length > 0) {
        const existing = existingCharge.rows[0];
        if (Number(existing.quantity) !== days) {
          const total = days * rate;
          const updated = await db.query(
            `UPDATE charges 
             SET quantity = $2, unit_price = $3, taxable_amount = $4, net_amount = $4, description = $5, updated_at = NOW()
             WHERE id = $1 RETURNING *;`,
            [existing.id, days, rate, total, description]
          );
          postedCharges.push(updated.rows[0]);
        } else {
          postedCharges.push(existing);
        }
      } else {
        const total = days * rate;
        const charge = await this.addCharge({
          organization_id: orgId,
          facility_id: encounter.facility_id || facilityId,
          patient_id: encounter.patient_id,
          encounter_id: encounterId,
          service_id: null,
          item_name: description,
          item_category: 'Room Charges',
          quantity: days,
          unit_price: rate,
          rate: rate,
          total_amount: total,
          user_id: userId,
          custom_fields: { days, item_category: 'Room Charges', auto_bed_charge: true },
        });
        postedCharges.push(charge);
      }
      return postedCharges;
    }

    for (const ba of baRes.rows) {
      const fromDate = new Date(ba.assigned_from);
      const toDate = ba.assigned_to ? new Date(ba.assigned_to) : new Date();

      // Calculate days stayed (minimum 1 day)
      const diffMs = Math.max(0, toDate.getTime() - fromDate.getTime());
      const days = Math.max(1, Math.ceil(diffMs / (1000 * 60 * 60 * 24)));

      // Determine rate: check tariff rates or service default rate
      let rate = Number(ba.default_rate) || 1500;
      if (ba.bed_charge_service_id) {
        const tariffRes = await db.query(
          `SELECT rate FROM tariff_rates WHERE service_id = $1 AND (bed_category_id = $2 OR bed_category_id IS NULL) LIMIT 1;`,
          [ba.bed_charge_service_id, ba.bed_category_id]
        );
        if (tariffRes.rows.length > 0 && Number(tariffRes.rows[0].rate) > 0) {
          rate = Number(tariffRes.rows[0].rate);
        }
      }

      const description = `Bed Charge: ${ba.ward_name || ''} - ${ba.bed_no} (${ba.category_name || 'Standard'}) - ${days} day(s)`;

      // Avoid creating identical duplicate charge for this bed assignment if already posted
      const existingCharge = await db.query(
        `SELECT id, quantity, net_amount FROM charges 
         WHERE encounter_id = $1 AND (custom_fields->>'bed_assignment_id') = $2 AND status != 'cancelled'
         LIMIT 1;`,
        [encounterId, ba.id]
      );

      if (existingCharge.rows.length > 0) {
        const existing = existingCharge.rows[0];
        if (Number(existing.quantity) !== days) {
          const total = days * rate;
          const updated = await db.query(
            `UPDATE charges 
             SET quantity = $2, unit_price = $3, taxable_amount = $4, net_amount = $4, description = $5, updated_at = NOW()
             WHERE id = $1 RETURNING *;`,
            [existing.id, days, rate, total, description]
          );
          postedCharges.push(updated.rows[0]);
        } else {
          postedCharges.push(existing);
        }
      } else {
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

  async removeCharge(id: string, facilityId?: string) {
    let query = `
      UPDATE charges 
      SET status = 'cancelled', updated_at = NOW()
      WHERE id = $1 AND status IN ('billable', 'billed')
    `;
    const params: any[] = [id];
    if (facilityId && facilityId !== '00000000-0000-0000-0000-000000000000') {
      params.push(facilityId);
      query += ` AND facility_id = $2`;
    }
    query += ` RETURNING *;`;
    const res = await db.query(query, params);
    return res.rows[0];
  }

  async updateChargeDiscount(id: string, data: any) {
    const chargeRes = await db.query(
      `SELECT * FROM charges WHERE id = $1 AND status IN ('billable', 'billed')`,
      [id]
    );
    if (chargeRes.rows.length === 0) {
      throw new NotFoundError('Charge item not found or already cancelled');
    }
    const charge = chargeRes.rows[0];
    const qty = Number(charge.quantity) || 1;
    const price = Number(charge.unit_price) || 0;
    const gross = Number(charge.gross_amount || (price * qty));

    let discPct = Number(data.discount_percent ?? data.discountPercent ?? 0);
    let discAmt = Number(data.discount_amount ?? data.discountAmount ?? 0);

    if (discPct > 0 && discAmt === 0) {
      discAmt = Math.round((gross * discPct) / 100);
    } else if (discAmt > 0 && discPct === 0 && gross > 0) {
      discPct = Number(((discAmt / gross) * 100).toFixed(2));
    }
    discAmt = Math.min(discAmt, gross);
    if (discAmt > 0 && gross > 0 && discPct === 0) {
      discPct = Number(((discAmt / gross) * 100).toFixed(2));
    }

    const taxable = Math.max(0, gross - discAmt);
    const taxAmt = Number(charge.tax_amount || 0);
    const net = taxable + taxAmt;

    const customFields = {
      ...(charge.custom_fields || {}),
      discount_reason: data.discount_reason || data.discountReason || null,
      discount_reason_id: data.discount_reason_id || data.discountReasonId || null,
      discount_reference: data.discount_reference || data.discountReference || null,
      referred_by: data.referred_by || data.referredBy || charge.custom_fields?.referred_by || null,
      referral_source: data.referral_source || data.referralSource || charge.custom_fields?.referral_source || null,
    };

    const res = await db.query(
      `UPDATE charges 
       SET discount_percent = $1, discount_amount = $2, taxable_amount = $3, net_amount = $4, custom_fields = $5, updated_at = NOW()
       WHERE id = $6 RETURNING *`,
      [discPct, discAmt, taxable, net, JSON.stringify(customFields), id]
    );
    return res.rows[0];
  }

  async applyConcessionBatch(data: any) {
    const { encounter_id, charge_ids, discount_percent, discount_amount, discount_reason, discount_reference, referred_by, referral_source } = data;
    if (!encounter_id) {
      throw new ValidationError('encounter_id is required for applying concession');
    }
    let query = `SELECT * FROM charges WHERE encounter_id = $1 AND status IN ('billable', 'billed')`;
    const params: any[] = [encounter_id];
    if (Array.isArray(charge_ids) && charge_ids.length > 0) {
      params.push(charge_ids);
      query += ` AND id = ANY($2)`;
    }
    const chargesRes = await db.query(query, params);
    const updated = [];
    for (const c of chargesRes.rows) {
      const up = await this.updateChargeDiscount(c.id, {
        discount_percent,
        discount_amount,
        discount_reason,
        discount_reference,
        referred_by,
        referral_source,
      });
      updated.push(up);
    }
    return updated;
  }

  async getRunningBill(encounterId: string, facilityId?: string) {
    const query = `
      SELECT c.*, s.name as service_name,
             COALESCE(i.name, c.description) as item_name,
             c.unit_price as rate,
             COALESCE(c.gross_amount, c.unit_price * c.quantity) as gross_amount,
             c.discount_percent as discount_percent,
             c.discount_amount as discount_amount,
             c.taxable_amount as taxable_amount,
             c.net_amount as total_amount,
             c.charged_at as charged_at,
             c.created_at as created_at,
             COALESCE(c.custom_fields->>'item_category', CASE WHEN c.source_type = 'order_item' THEN 'Lab Test' ELSE 'General' END) as item_category,
             COALESCE(c.custom_fields->>'payment_status', CASE WHEN c.status = 'billed' THEN 'paid' ELSE c.status END) as payment_status,
             c.custom_fields->>'discount_reason' as discount_reason,
             c.custom_fields->>'discount_reference' as discount_reference,
             COALESCE(c.custom_fields->>'referred_by', TRIM(CONCAT(st.first_name, ' ', COALESCE(st.last_name, '')))) as referred_by,
             c.custom_fields->>'referral_source' as referral_source,
             TRIM(CONCAT(st.first_name, ' ', COALESCE(st.last_name, ''))) as practitioner_name
      FROM charges c
      LEFT JOIN services s ON c.service_id = s.id
      LEFT JOIN items i ON c.item_id = i.id
      LEFT JOIN practitioners pr ON c.ordered_by_practitioner_id = pr.id
      LEFT JOIN staff st ON pr.staff_id = st.id
      WHERE c.encounter_id = $1 
        AND c.status IN ('billable', 'billed')
        AND COALESCE(c.custom_fields->>'advance_deposit', 'false') != 'true'
      ORDER BY COALESCE(c.charged_at, c.created_at) DESC
    `;
    const res = await db.query(query, [encounterId]);
    return res.rows;
  }

  async recordAdvancePayment(data: any) {
    let patientId = data.patient_id;
    let facilityId = data.facility_id;
    let organizationId = data.organization_id;

    if (data.encounter_id) {
      try {
        const enc = await db.query(
          'SELECT patient_id, facility_id, organization_id FROM encounters WHERE id = $1 LIMIT 1',
          [data.encounter_id]
        );
        if (enc.rows.length > 0) {
          patientId = enc.rows[0].patient_id || patientId;
          if (!facilityId || facilityId === '00000000-0000-0000-0000-000000000000') {
            facilityId = enc.rows[0].facility_id;
          }
          if (!organizationId || organizationId === '00000000-0000-0000-0000-000000000000') {
            organizationId = enc.rows[0].organization_id;
          }
        }
      } catch {
        // keep fallback
      }
    }

    if (!organizationId) {
      const orgRes = await db.query(`SELECT id FROM organizations LIMIT 1`);
      organizationId = orgRes.rows[0]?.id;
    }
    if (!facilityId) {
      const facRes = await db.query(`SELECT id FROM facilities WHERE organization_id = $1 LIMIT 1`, [organizationId]);
      facilityId = facRes.rows[0]?.id;
    }

    let receiptNo: string;
    try {
      const receiptNoResult = await db.query(
        'SELECT next_number($1, $2, $3) AS receipt_no',
        [organizationId, facilityId, 'RECEIPT']
      );
      receiptNo = receiptNoResult.rows[0]?.receipt_no || `REC-${Date.now()}`;
    } catch {
      receiptNo = `REC-${Date.now()}`;
    }

    const methodId = await this.resolvePaymentMethodId({
      ...data,
      organization_id: organizationId
    });

    let paymentType = String(data.payment_type || 'advance').toLowerCase();
    if (paymentType === 'payment' || paymentType === 'interim') {
      paymentType = 'invoice_payment';
    } else if (paymentType === 'settlement') {
      paymentType = 'invoice_payment';
    } else if (!['invoice_payment', 'advance', 'refund', 'payer_settlement', 'settlement', 'payment'].includes(paymentType)) {
      paymentType = 'advance';
    }

    const payDate = data.payment_date || data.paid_at || data.date || null;

    const query = `
      INSERT INTO payments (
        organization_id, facility_id, receipt_no, patient_id, encounter_id,
        direction, payment_type, payment_method_id, amount, status, notes, received_by, paid_at
      ) VALUES (
        $1, $2, $3, $4, $5,
        'in', $6, $7, $8, 'completed', $9, $10, COALESCE($11::timestamptz, NOW())
      ) RETURNING *;
    `;
    const res = await db.query(query, [
      organizationId, facilityId, receiptNo, patientId, data.encounter_id,
      paymentType, methodId, data.amount, data.notes || null, data.user_id, payDate
    ]);
    return res.rows[0];
  }

  async getEncounterPayments(encounterId: string, facilityId?: string) {
    const query = `
      SELECT p.*,
             COALESCE(pm.name, 'Cash') as payment_method_name,
             COALESCE(pm.name, 'Cash') as payment_method,
             p.paid_at as payment_date,
             p.paid_at as paid_at,
             p.notes as notes
      FROM payments p
      LEFT JOIN payment_methods pm ON p.payment_method_id = pm.id
      WHERE p.encounter_id = $1
      ORDER BY p.paid_at DESC
    `;
    const res = await db.query(query, [encounterId]);
    return res.rows;
  }

  async settleBill(data: {
    encounter_id: string;
    amount?: number;
    payment_mode?: string;
    use_wallet?: boolean;
    remarks?: string;
    organization_id: string;
    facility_id?: string;
    user_id?: string;
  }) {
    const client = await db.getClient();
    try {
      await client.query('BEGIN');
      const { encounter_id, amount, payment_mode = 'Cash', use_wallet, remarks } = data;

      // 1. Resolve encounter and patient
      const encRes = await client.query(
        `SELECT e.*, p.id as patient_id, p.custom_fields as patient_custom_fields
         FROM encounters e
         JOIN patients p ON e.patient_id = p.id
         WHERE e.id = $1 LIMIT 1`,
        [encounter_id]
      );
      if (encRes.rows.length === 0) throw new Error('Encounter not found');
      const enc = encRes.rows[0];
      const patientId = enc.patient_id;

      // 2. Fetch all open billable charges (excluding advance deposit charges)
      const chargesRes = await client.query(
        `SELECT * FROM charges
         WHERE encounter_id = $1 AND status = 'billable'
           AND COALESCE(custom_fields->>'advance_deposit', 'false') != 'true'`,
        [encounter_id]
      );
      const totalCharges = chargesRes.rows.reduce((sum, c) => sum + Number(c.net_amount || 0), 0);

      // 3. Mark all billable charges as 'billed' with payment_status = 'paid'
      for (const c of chargesRes.rows) {
        const updatedFields = {
          ...(c.custom_fields || {}),
          payment_status: 'paid',
          settled: true,
          settled_at: new Date().toISOString()
        };
        await client.query(
          `UPDATE charges SET status = 'billed', custom_fields = $1, updated_at = NOW() WHERE id = $2`,
          [JSON.stringify(updatedFields), c.id]
        );
      }

      // 4. Record payment if amount > 0
      const payAmount = Number(amount) || totalCharges;
      if (payAmount > 0) {
        let methodId = null;
        const mode = payment_mode || 'Cash';
        const methodRes = await client.query(
          `SELECT id FROM payment_methods WHERE is_active = true AND (name ILIKE $1 OR method_type ILIKE $1) LIMIT 1`,
          [`%${mode}%`]
        );
        methodId = methodRes.rows[0]?.id || null;

        let receiptNo: string;
        try {
          const receiptNoRes = await client.query(
            `SELECT next_number($1, $2, 'RECEIPT') as receipt_no`,
            [data.organization_id, data.facility_id || enc.facility_id]
          );
          receiptNo = receiptNoRes.rows[0]?.receipt_no || `REC-SETTLE-${Date.now()}`;
        } catch {
          receiptNo = `REC-SETTLE-${Date.now()}`;
        }

        await client.query(
          `INSERT INTO payments (
             organization_id, facility_id, receipt_no, patient_id, encounter_id,
             direction, payment_type, payment_method_id, amount, status, notes, received_by, paid_at
           ) VALUES ($1, $2, $3, $4, $5, 'in', 'invoice_payment', $6, $7, 'completed', $8, $9, COALESCE($10::timestamptz, NOW()))`,
          [
            data.organization_id,
            data.facility_id || enc.facility_id,
            receiptNo,
            patientId,
            encounter_id,
            methodId,
            payAmount,
            remarks || `Full bill settlement for encounter ${encounter_id}`,
            data.user_id || null,
            (data as any).payment_date || null
          ]
        );
      }

      // 5. Update encounter billing status
      await client.query(
        `UPDATE encounters SET billing_status = 'closed', updated_at = NOW() WHERE id = $1`,
        [encounter_id]
      );

      await client.query('COMMIT');
      return { success: true, settledAmount: payAmount, chargesSettled: chargesRes.rows.length };
    } catch (err) {
      await client.query('ROLLBACK');
      throw err;
    } finally {
      client.release();
    }
  }

  async processRefund(data: {
    encounter_id: string;
    patient_id?: string;
    amount: number;
    payment_method?: string;
    notes?: string;
    organization_id: string;
    facility_id?: string;
    user_id?: string;
  }) {
    const client = await db.getClient();
    try {
      await client.query('BEGIN');
      const { encounter_id, amount, payment_method = 'Cash', notes } = data;

      let patientId = data.patient_id;
      if (!patientId) {
        const encRes = await client.query('SELECT patient_id, facility_id FROM encounters WHERE id = $1', [encounter_id]);
        patientId = encRes.rows[0]?.patient_id;
      }

      const methodRes = await client.query(
        `SELECT id FROM payment_methods WHERE is_active = true AND (name ILIKE $1 OR method_type ILIKE $1) LIMIT 1`,
        [`%${payment_method}%`]
      );
      const methodId = methodRes.rows[0]?.id || null;

      const receiptNoRes = await client.query(
        `SELECT next_number($1, $2, 'RECEIPT') as receipt_no`,
        [data.organization_id, data.facility_id]
      );
      const receiptNo = receiptNoRes.rows[0]?.receipt_no || `REF-${Date.now()}`;

      const res = await client.query(
        `INSERT INTO payments (
           organization_id, facility_id, receipt_no, patient_id, encounter_id,
           direction, payment_type, payment_method_id, amount, status, notes, received_by
         ) VALUES ($1, $2, $3, $4, $5, 'out', 'refund', $6, $7, 'completed', $8, $9)
         RETURNING *;`,
        [
          data.organization_id,
          data.facility_id || null,
          receiptNo,
          patientId,
          encounter_id,
          methodId,
          Number(amount),
          notes || `Refund of excess payment for encounter ${encounter_id}`,
          data.user_id || null
        ]
      );

      await client.query('COMMIT');
      return res.rows[0];
    } catch (err) {
      await client.query('ROLLBACK');
      throw err;
    } finally {
      client.release();
    }
  }

  async creditWallet(data: { patient_id: string; amount: number; notes?: string; encounter_id?: string }) {
    const { patient_id, amount } = data;
    const patRes = await db.query('SELECT id, custom_fields FROM patients WHERE id = $1', [patient_id]);
    if (patRes.rows.length === 0) throw new Error('Patient not found');
    const pat = patRes.rows[0];
    const current = Number(pat.custom_fields?.wallet_balance || 0);
    const updated = current + Number(amount);
    const fields = { ...(pat.custom_fields || {}), wallet_balance: updated };
    await db.query('UPDATE patients SET custom_fields = $1, updated_at = NOW() WHERE id = $2', [
      JSON.stringify(fields),
      patient_id
    ]);
    return { patient_id, wallet_balance: updated };
  }

  async settleWithWallet(data: { encounter_id: string; patient_id: string; amount: number; charge_id?: string }) {
    const { encounter_id, patient_id, amount, charge_id } = data;
    const patRes = await db.query('SELECT id, custom_fields FROM patients WHERE id = $1', [patient_id]);
    if (patRes.rows.length === 0) throw new Error('Patient not found');
    const pat = patRes.rows[0];
    const current = Number(pat.custom_fields?.wallet_balance || 0);
    if (current < Number(amount)) {
      throw new Error(`Insufficient wallet balance. Available: ₹${current}, Required: ₹${amount}`);
    }
    const updated = current - Number(amount);
    const fields = { ...(pat.custom_fields || {}), wallet_balance: updated };
    await db.query('UPDATE patients SET custom_fields = $1, updated_at = NOW() WHERE id = $2', [
      JSON.stringify(fields),
      patient_id
    ]);

    if (charge_id) {
      const chargeRes = await db.query('SELECT custom_fields FROM charges WHERE id = $1', [charge_id]);
      const cf = { ...(chargeRes.rows[0]?.custom_fields || {}), payment_status: 'paid', paid_from_wallet: true };
      await db.query(`UPDATE charges SET status = 'billed', custom_fields = $1, updated_at = NOW() WHERE id = $2`, [
        JSON.stringify(cf),
        charge_id
      ]);
    }

    return { patient_id, wallet_balance: updated, settledAmount: amount };
  }

  async getReportsSummary(facilityId: string, dateFrom?: string, dateTo?: string) {
    const params: any[] = [facilityId];
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
    const invRes = await db.query(invSummaryQuery, params);
    const invRow = invRes.rows[0] || {};

    // Today's collections
    const collectionsQuery = `
      SELECT COALESCE(SUM(amount), 0)::numeric as today_collections
      FROM payments
      WHERE (facility_id = $1 OR $1 = '00000000-0000-0000-0000-000000000000')
        AND paid_at >= CURRENT_DATE AND status = 'completed'
    `;
    const collRes = await db.query(collectionsQuery, [facilityId]);
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
    const labRes = await db.query(labQuery, [facilityId]);
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

  async getPendingDuesReport(
    facilityId: string,
    filters?: {
      search?: string;
      invoiceType?: string;
      status?: string;
      dateFrom?: string;
      dateTo?: string;
      encounterStatus?: string;
    },
    page: number = 1,
    limit: number = 20
  ) {
    const offset = Math.max(0, (page - 1) * limit);
    const params: any[] = [facilityId];

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
    const countRes = await db.query(countQuery, params);
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
    const res = await db.query(query, params);

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

  async getCollectionsReport(facilityId: string, filters?: { dateFrom?: string; dateTo?: string; paymentMethod?: string }) {
    const params: any[] = [facilityId];
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
    const summaryRes = await db.query(summaryQuery, params);

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
    const ledgerRes = await db.query(ledgerQuery, params);

    return {
      byPaymentMode: summaryRes.rows,
      ledger: ledgerRes.rows
    };
  }

  async getPatientDues(patientId: string, facilityId?: string) {
    const invQuery = `
      SELECT i.*, e.encounter_type, e.encounter_type as encounter_class, e.status as encounter_status
      FROM invoices i
      LEFT JOIN encounters e ON e.id = i.encounter_id
      WHERE i.patient_id = $1 AND i.due_amount > 0 AND i.status != 'cancelled'
        AND ($2::uuid IS NULL OR i.facility_id = $2::uuid OR $2 = '00000000-0000-0000-0000-000000000000')
      ORDER BY i.issued_at DESC
    `;
    const invRes = await db.query(invQuery, [patientId, facilityId || null]);

    const chgQuery = `
      SELECT c.*, d.name as department_name, s.name as service_name
      FROM charges c
      LEFT JOIN departments d ON d.id = c.department_id
      LEFT JOIN services s ON s.id = c.service_id
      WHERE c.patient_id = $1 AND c.status = 'billable'
        AND ($2::uuid IS NULL OR c.facility_id = $2::uuid OR $2 = '00000000-0000-0000-0000-000000000000')
      ORDER BY c.charged_at DESC
    `;
    const chgRes = await db.query(chgQuery, [patientId, facilityId || null]);

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
