"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.LabRepository = void 0;
const database_1 = require("../../config/database");
const AppError_1 = require("../../shared/errors/AppError");
class LabRepository {
    async getLabTests(facilityId, filters) {
        const params = [];
        let query = `
      SELECT 
        o.id as order_id, 
        o.order_no, 
        o.order_type, 
        o.priority, 
        o.clinical_info, 
        o.created_at,
        oi.id as order_item_id, 
        oi.status, 
        oi.notes as result,
        oi.processing_source,
        oi.outsource_lab_id,
        ol.name as outsource_lab_name,
        p.id as patient_id, 
        p.first_name, 
        p.last_name, 
        p.uhid, 
        p.phone, 
        p.gender, 
        p.date_of_birth,
        EXTRACT(YEAR FROM age(CURRENT_DATE, p.date_of_birth))::int as age,
        ltd.service_id as test_id, 
        ltd.lab_section, 
        ltd.specimen_type,
        s.name as test_name, 
        s.code as test_code,
        s.default_rate as price,
        ls.id as specimen_id,
        ls.specimen_no,
        ls.status as specimen_status,
        ls.collected_at,
        c.id as charge_id,
        c.status as charge_status,
        c.net_amount as charge_amount,
        (SELECT COUNT(*) FROM lab_results lr WHERE lr.order_item_id = oi.id) as result_count,
        (SELECT lr.status FROM lab_results lr WHERE lr.order_item_id = oi.id ORDER BY lr.created_at DESC LIMIT 1) as result_status,
        (SELECT lr.verified_at FROM lab_results lr WHERE lr.order_item_id = oi.id AND lr.verified_at IS NOT NULL LIMIT 1) as verified_at
      FROM orders o
      JOIN order_items oi ON oi.order_id = o.id
      JOIN lab_test_definitions ltd ON ltd.service_id = oi.service_id
      JOIN services s ON s.id = ltd.service_id
      JOIN patients p ON p.id = o.patient_id
      LEFT JOIN lab_specimens ls ON ls.order_id = o.id
      LEFT JOIN outsource_labs ol ON ol.id = oi.outsource_lab_id
      LEFT JOIN charges c ON c.id = oi.charge_id
      WHERE o.order_type = 'lab'
    `;
        if (facilityId && facilityId !== '00000000-0000-0000-0000-000000000000') {
            params.push(facilityId);
            query += ` AND o.facility_id = $${params.length}`;
        }
        if (filters?.search) {
            params.push(`%${filters.search.toLowerCase()}%`);
            query += ` AND (
        LOWER(p.first_name || ' ' || COALESCE(p.last_name, '')) LIKE $${params.length} OR
        LOWER(p.uhid) LIKE $${params.length} OR
        LOWER(o.order_no) LIKE $${params.length} OR
        LOWER(COALESCE(ls.specimen_no, '')) LIKE $${params.length} OR
        LOWER(s.name) LIKE $${params.length}
      )`;
        }
        if (filters?.status && filters.status !== 'All') {
            params.push(filters.status.toLowerCase());
            query += ` AND LOWER(oi.status) = $${params.length}`;
        }
        if (filters?.source && filters.source !== 'All') {
            params.push(filters.source);
            query += ` AND oi.processing_source = $${params.length}`;
        }
        query += ` ORDER BY o.created_at DESC`;
        const result = await database_1.db.query(query, params);
        return result.rows;
    }
    async getTestDefinitions(organizationId, includeInactive = false) {
        const activeFilter = includeInactive ? '' : 'AND s.is_active = true';
        const query = `
      SELECT 
        ltd.*, 
        s.id as service_id,
        s.id,
        s.name, 
        s.code, 
        s.description, 
        s.is_active,
        COALESCE(s.default_rate, 350) as price,
        (SELECT COUNT(*) FROM lab_parameters lp WHERE lp.test_service_id = s.id AND lp.is_active = true) as parameter_count
      FROM lab_test_definitions ltd
      JOIN services s ON s.id = ltd.service_id
      WHERE ($1::uuid IS NULL OR s.organization_id = $1::uuid OR s.organization_id = '00000000-0000-0000-0000-000000000000')
        ${activeFilter}
      ORDER BY ltd.lab_section ASC, s.name ASC
    `;
        const result = await database_1.db.query(query, [organizationId || null]);
        return result.rows;
    }
    async getOrderDetails(orderId, facilityId) {
        const orderQuery = `
      SELECT 
        o.*,
        p.first_name, p.last_name, p.uhid, p.phone, p.gender, p.date_of_birth,
        EXTRACT(YEAR FROM age(CURRENT_DATE, p.date_of_birth))::int as age,
        e.encounter_type, e.status as encounter_status
      FROM orders o
      JOIN patients p ON p.id = o.patient_id
      LEFT JOIN encounters e ON e.id = o.encounter_id
      WHERE o.id = $1 AND ($2::uuid IS NULL OR o.facility_id = $2::uuid)
    `;
        const orderRes = await database_1.db.query(orderQuery, [orderId, facilityId || null]);
        if (orderRes.rows.length === 0) {
            throw new AppError_1.NotFoundError('Lab order not found');
        }
        const order = orderRes.rows[0];
        const itemsQuery = `
      SELECT 
        oi.*,
        s.name as test_name, s.code as test_code, s.default_rate as price,
        ltd.lab_section, ltd.specimen_type,
        ol.name as outsource_lab_name,
        c.status as charge_status, c.net_amount as charge_amount
      FROM order_items oi
      JOIN services s ON s.id = oi.service_id
      LEFT JOIN lab_test_definitions ltd ON ltd.service_id = s.id
      LEFT JOIN outsource_labs ol ON ol.id = oi.outsource_lab_id
      LEFT JOIN charges c ON c.id = oi.charge_id
      WHERE oi.order_id = $1
    `;
        const itemsRes = await database_1.db.query(itemsQuery, [orderId]);
        order.items = itemsRes.rows;
        const specimensQuery = `
      SELECT ls.*, ol.name as outsource_lab_name
      FROM lab_specimens ls
      LEFT JOIN outsource_labs ol ON ol.id = ls.outsource_lab_id
      WHERE ls.order_id = $1
    `;
        const specRes = await database_1.db.query(specimensQuery, [orderId]);
        order.specimens = specRes.rows;
        return order;
    }
    async getOrderItemParameters(orderItemId) {
        const itemQuery = `
      SELECT oi.id, oi.service_id, s.name as test_name, ltd.lab_section
      FROM order_items oi
      JOIN services s ON s.id = oi.service_id
      LEFT JOIN lab_test_definitions ltd ON ltd.service_id = s.id
      WHERE oi.id = $1
    `;
        const itemRes = await database_1.db.query(itemQuery, [orderItemId]);
        if (itemRes.rows.length === 0) {
            throw new AppError_1.NotFoundError('Order item not found');
        }
        const item = itemRes.rows[0];
        // Fetch defined parameters
        const paramsQuery = `
      SELECT 
        lp.id as parameter_id,
        lp.code,
        lp.name,
        lp.unit,
        lp.data_type,
        lp.sort_order,
        lr.id as result_id,
        lr.value_numeric,
        lr.value_text,
        lr.flag,
        lr.status as result_status,
        lr.comments,
        lr.reference_low,
        lr.reference_high,
        lr.verified_at
      FROM lab_parameters lp
      LEFT JOIN lab_results lr ON lr.parameter_id = lp.id AND lr.order_item_id = $1
      WHERE lp.test_service_id = $2 AND lp.is_active = true
      ORDER BY lp.sort_order ASC, lp.name ASC
    `;
        const paramsRes = await database_1.db.query(paramsQuery, [orderItemId, item.service_id]);
        return {
            orderItemId,
            serviceId: item.service_id,
            testName: item.test_name,
            parameters: paramsRes.rows
        };
    }
    async createLabOrder(data) {
        const client = await database_1.db.getClient();
        try {
            await client.query('BEGIN');
            // 1. Resolve Encounter
            let encounterId = data.encounterId;
            if (!encounterId) {
                const encounterRes = await client.query(`SELECT id FROM encounters WHERE patient_id = $1 AND status = 'in_progress' ORDER BY started_at DESC LIMIT 1`, [data.patientId]);
                encounterId = encounterRes.rows[0]?.id;
                if (!encounterId) {
                    let encNo;
                    try {
                        await client.query('SAVEPOINT enc_seq_sp');
                        const seqRes = await client.query(`SELECT next_number($1, $2, 'ENCOUNTER') AS enc_no`, [data.organizationId, data.facilityId]);
                        encNo = seqRes.rows[0]?.enc_no || `ENC-${Date.now().toString().slice(-6)}`;
                        await client.query('RELEASE SAVEPOINT enc_seq_sp');
                    }
                    catch {
                        await client.query('ROLLBACK TO SAVEPOINT enc_seq_sp');
                        encNo = `ENC-${Date.now().toString().slice(-6)}`;
                    }
                    const encRes = await client.query(`INSERT INTO encounters (
              organization_id, facility_id, patient_id, encounter_no, encounter_type, status, started_at
            ) VALUES ($1, $2, $3, $4, 'diagnostic_only', 'in_progress', now()) RETURNING id`, [data.organizationId, data.facilityId, data.patientId, encNo]);
                    encounterId = encRes.rows[0].id;
                }
            }
            // 2. Resolve Laboratory Department
            const deptRes = await client.query(`SELECT id FROM departments WHERE facility_id = $1 AND (code = 'LAB' OR department_type = 'diagnostic') LIMIT 1`, [data.facilityId]);
            const labDeptId = deptRes.rows[0]?.id || null;
            // 3. Resolve Order Number
            let orderNo;
            try {
                await client.query('SAVEPOINT order_seq_sp');
                const seqRes = await client.query(`SELECT next_number($1, $2, 'LAB_ORDER') AS order_no`, [data.organizationId, data.facilityId]);
                orderNo = seqRes.rows[0]?.order_no || `LAB-${Date.now().toString().slice(-6)}`;
                await client.query('RELEASE SAVEPOINT order_seq_sp');
            }
            catch {
                await client.query('ROLLBACK TO SAVEPOINT order_seq_sp');
                orderNo = `LAB-${Date.now().toString().slice(-6)}`;
            }
            // 4. Resolve Practitioner UUID if orderedBy is string / not UUID
            let practitionerId = null;
            if (data.orderedBy) {
                const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(data.orderedBy);
                if (isUuid) {
                    practitionerId = data.orderedBy;
                }
                else {
                    try {
                        await client.query('SAVEPOINT prac_sp');
                        const cleanName = data.orderedBy.replace(/^Dr\.?\s*/i, '').trim().split(' ')[0];
                        const pRes = await client.query(`SELECT p.id FROM practitioners p 
               JOIN staff s ON p.staff_id = s.id
               LEFT JOIN users u ON u.id = s.user_id 
               WHERE (s.first_name || ' ' || COALESCE(s.last_name, '')) ILIKE $1 
                  OR u.name ILIKE $1 
                  OR s.first_name ILIKE $1 
               LIMIT 1`, [`%${cleanName}%`]);
                        practitionerId = pRes.rows[0]?.id || null;
                        await client.query('RELEASE SAVEPOINT prac_sp');
                    }
                    catch {
                        await client.query('ROLLBACK TO SAVEPOINT prac_sp');
                        practitionerId = null;
                    }
                }
            }
            // 5. Insert Order
            const orderQuery = `
        INSERT INTO orders (
          organization_id, facility_id, patient_id, encounter_id, order_no, 
          order_type, priority, status, ordered_by_practitioner_id, 
          performing_department_id, clinical_info, created_by
        ) VALUES (
          $1, $2, $3, $4, $5, 
          'lab', $6, 'active', $7, 
          $8, $9, $10
        ) RETURNING id, order_no
      `;
            const orderRes = await client.query(orderQuery, [
                data.organizationId,
                data.facilityId,
                data.patientId,
                encounterId,
                orderNo,
                data.priority || 'routine',
                practitionerId,
                labDeptId,
                data.clinicalInfo || null,
                data.userId || null
            ]);
            const orderId = orderRes.rows[0].id;
            // 6. Create Specimen
            const specimenNo = data.barcode || `LAB${Date.now().toString().slice(-8)}`;
            const specimenType = data.specimenType || 'Blood';
            const processingSource = data.processingSource || 'in_house';
            const outsourceLabId = processingSource.startsWith('outsource') ? (data.outsourceLabId || null) : null;
            let collectedByStaffId = null;
            if (data.collectedBy) {
                const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(data.collectedBy);
                if (isUuid) {
                    collectedByStaffId = data.collectedBy;
                }
                else {
                    try {
                        await client.query('SAVEPOINT coll_sp');
                        const cleanName = data.collectedBy.split(' ')[0].replace(/[^a-zA-Z]/g, '');
                        const sRes = await client.query(`SELECT id FROM staff WHERE first_name ILIKE $1 OR last_name ILIKE $1 LIMIT 1`, [`%${cleanName}%`]);
                        collectedByStaffId = sRes.rows[0]?.id || null;
                        await client.query('RELEASE SAVEPOINT coll_sp');
                    }
                    catch {
                        await client.query('ROLLBACK TO SAVEPOINT coll_sp');
                        collectedByStaffId = null;
                    }
                }
            }
            const specimenQuery = `
        INSERT INTO lab_specimens (
          organization_id, facility_id, specimen_no, patient_id, encounter_id, 
          order_id, specimen_type, status, processing_source, outsource_lab_id,
          collected_at, collected_by, created_by
        ) VALUES (
          $1, $2, $3, $4, $5, 
          $6, $7, 'collected', $8, $9,
          now(), $10, $11
        ) RETURNING id, specimen_no
      `;
            const specRes = await client.query(specimenQuery, [
                data.organizationId,
                data.facilityId,
                specimenNo,
                data.patientId,
                encounterId,
                orderId,
                specimenType,
                processingSource,
                outsourceLabId,
                collectedByStaffId,
                data.userId || null
            ]);
            const specimenId = specRes.rows[0].id;
            // 7. Insert Order Items, Auto-generate Charges, and Initialize Parameter Results
            const createdItemIds = [];
            for (const testIdOrCode of data.testDefinitionIds) {
                // Resolve UUID or test code (e.g. 'LAB-CBC')
                const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(testIdOrCode);
                let serviceId;
                let svcRes;
                if (isUuid) {
                    serviceId = testIdOrCode;
                    svcRes = await client.query(`SELECT id, name, code, COALESCE(default_rate, 350) as price FROM services WHERE id = $1`, [serviceId]);
                }
                else {
                    svcRes = await client.query(`SELECT id, name, code, COALESCE(default_rate, 350) as price FROM services WHERE code = $1 OR UPPER(code) = UPPER($1) LIMIT 1`, [testIdOrCode]);
                    if (svcRes.rows.length === 0) {
                        throw new AppError_1.ValidationError(`Test definition '${testIdOrCode}' not found`);
                    }
                    serviceId = svcRes.rows[0].id;
                }
                const svc = svcRes.rows[0] || { name: 'Lab Investigation', code: 'LAB', price: 350 };
                const price = Number(svc.price) || 350;
                // Insert Order Item
                const itemRes = await client.query(`INSERT INTO order_items (
            order_id, service_id, quantity, status, processing_source, outsource_lab_id, created_by
          ) VALUES ($1, $2, 1, 'ordered', $3, $4, $5) RETURNING id`, [orderId, serviceId, processingSource, outsourceLabId, data.userId || null]);
                const orderItemId = itemRes.rows[0].id;
                createdItemIds.push(orderItemId);
                // Auto-create Charge for Cross-Module Billing
                const chargeRes = await client.query(`INSERT INTO charges (
            organization_id, facility_id, patient_id, encounter_id,
            service_id, description, department_id,
            quantity, unit_price, discount_percent, discount_amount,
            taxable_amount, tax_amount, net_amount,
            responsibility, status, source_type, source_id, created_by
          ) VALUES (
            $1, $2, $3, $4,
            $5, $6, $7,
            1, $8, 0, 0,
            $8, 0, $8,
            'patient', 'billable', 'order_item', $9, $10
          ) RETURNING id`, [
                    data.organizationId,
                    data.facilityId,
                    data.patientId,
                    encounterId,
                    serviceId,
                    svc.name,
                    labDeptId,
                    price,
                    orderItemId,
                    data.userId || null
                ]);
                const chargeId = chargeRes.rows[0].id;
                // Link charge_id back to order_items
                await client.query(`UPDATE order_items SET charge_id = $1 WHERE id = $2`, [chargeId, orderItemId]);
                // Fetch configured analytes / parameters for this test
                const paramsRes = await client.query(`SELECT id, name, unit FROM lab_parameters WHERE test_service_id = $1 AND is_active = true ORDER BY sort_order ASC`, [serviceId]);
                // Initialize preliminary results in lab_results
                for (const param of paramsRes.rows) {
                    await client.query(`INSERT INTO lab_results (
              order_item_id, parameter_id, specimen_id, unit, status, created_by
            ) VALUES (
              $1, $2, $3, $4, 'preliminary', $5
            ) ON CONFLICT (order_item_id, parameter_id) DO NOTHING`, [orderItemId, param.id, specimenId, param.unit, data.userId || null]);
                }
            }
            await client.query('COMMIT');
            return {
                orderId,
                orderNo,
                specimenId,
                specimenNo,
                orderItemIds: createdItemIds
            };
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
      SET notes = $2, status = COALESCE($3, status), updated_at = now()
      WHERE id = $1
      RETURNING *
    `;
        const res = await database_1.db.query(query, [orderItemId, result, status || null]);
        return res.rows[0];
    }
    async submitBulkResults(orderItemId, results, status = 'preliminary', userId) {
        const client = await database_1.db.getClient();
        try {
            await client.query('BEGIN');
            // Verify order item exists
            const itemRes = await client.query(`SELECT oi.id, oi.service_id, ls.id as specimen_id
         FROM order_items oi
         JOIN orders o ON o.id = oi.order_id
         LEFT JOIN lab_specimens ls ON ls.order_id = o.id
         WHERE oi.id = $1`, [orderItemId]);
            if (itemRes.rows.length === 0) {
                throw new AppError_1.NotFoundError('Order item not found');
            }
            const item = itemRes.rows[0];
            for (const res of results) {
                let paramId = res.parameterId;
                // If parameterId is missing, find or create parameter
                if (!paramId && res.parameterName) {
                    const pQuery = `
            SELECT id FROM lab_parameters 
            WHERE test_service_id = $1 AND LOWER(name) = LOWER($2) LIMIT 1
          `;
                    const pRes = await client.query(pQuery, [item.service_id, res.parameterName]);
                    if (pRes.rows.length > 0) {
                        paramId = pRes.rows[0].id;
                    }
                    else {
                        const code = res.parameterName.toUpperCase().replace(/[^A-Z0-9]/g, '').slice(0, 10);
                        const newP = await client.query(`INSERT INTO lab_parameters (test_service_id, code, name, unit)
               VALUES ($1, $2, $3, $4) RETURNING id`, [item.service_id, code || `P${Date.now().toString().slice(-4)}`, res.parameterName, res.unit || null]);
                        paramId = newP.rows[0].id;
                    }
                }
                if (!paramId)
                    continue;
                // Upsert into lab_results
                await client.query(`INSERT INTO lab_results (
            order_item_id, parameter_id, specimen_id, value_numeric, value_text, unit,
            reference_low, reference_high, flag, status, comments, performed_at, created_by
          ) VALUES (
            $1, $2, $3, $4, $5, $6,
            $7, $8, $9, $10, $11, now(), $12
          ) ON CONFLICT (order_item_id, parameter_id) DO UPDATE SET
            value_numeric = EXCLUDED.value_numeric,
            value_text = EXCLUDED.value_text,
            unit = EXCLUDED.unit,
            reference_low = EXCLUDED.reference_low,
            reference_high = EXCLUDED.reference_high,
            flag = EXCLUDED.flag,
            status = EXCLUDED.status,
            comments = EXCLUDED.comments,
            performed_at = now(),
            updated_at = now()`, [
                    orderItemId,
                    paramId,
                    item.specimen_id || null,
                    res.valueNumeric !== undefined ? res.valueNumeric : null,
                    res.valueText || null,
                    res.unit || null,
                    res.referenceLow || null,
                    res.referenceHigh || null,
                    res.flag || 'normal',
                    status,
                    res.comments || null,
                    userId || null
                ]);
            }
            // Update order_items status
            const newStatus = status === 'final' ? 'completed' : 'in_progress';
            await client.query(`UPDATE order_items 
         SET status = $2, 
             completed_at = CASE WHEN $2 = 'completed' THEN now() ELSE completed_at END,
             updated_at = now() 
         WHERE id = $1`, [orderItemId, newStatus]);
            await client.query('COMMIT');
            return { success: true, orderItemId, status: newStatus };
        }
        catch (e) {
            await client.query('ROLLBACK');
            throw e;
        }
        finally {
            client.release();
        }
    }
    async verifyResult(orderItemId, verifiedBy, comments) {
        const client = await database_1.db.getClient();
        try {
            await client.query('BEGIN');
            // Update lab_results
            await client.query(`UPDATE lab_results 
         SET status = 'final', verified_at = now(), comments = COALESCE($2, comments), updated_at = now()
         WHERE order_item_id = $1`, [orderItemId, comments || null]);
            // Update order_items
            await client.query(`UPDATE order_items 
         SET status = 'completed', completed_at = now(), updated_at = now()
         WHERE id = $1`, [orderItemId]);
            await client.query('COMMIT');
            return { success: true, orderItemId, verified: true };
        }
        catch (e) {
            await client.query('ROLLBACK');
            throw e;
        }
        finally {
            client.release();
        }
    }
    async updateSpecimenStatus(specimenId, status, rejectionReason) {
        const query = `
      UPDATE lab_specimens
      SET status = $2, 
          rejection_reason = $3,
          received_at = CASE WHEN $2 = 'received' AND received_at IS NULL THEN now() ELSE received_at END,
          updated_at = now()
      WHERE id = $1
      RETURNING *
    `;
        const res = await database_1.db.query(query, [specimenId, status, rejectionReason || null]);
        return res.rows[0];
    }
    async outsourceSpecimen(specimenId, data) {
        const client = await database_1.db.getClient();
        try {
            await client.query('BEGIN');
            const specRes = await client.query(`UPDATE lab_specimens
         SET processing_source = 'outsource_send',
             outsource_lab_id = $2,
             outsource_ref_no = $3,
             sent_at = now(),
             expected_return_at = $4,
             outsource_cost = $5,
             status = 'in_process',
             updated_at = now()
         WHERE id = $1
         RETURNING order_id`, [specimenId, data.outsourceLabId, data.outsourceRefNo || null, data.expectedReturnAt || null, data.outsourceCost || null]);
            if (specRes.rows.length === 0) {
                throw new AppError_1.NotFoundError('Specimen not found');
            }
            const orderId = specRes.rows[0].order_id;
            if (orderId) {
                await client.query(`UPDATE order_items
           SET processing_source = 'outsource_send',
               outsource_lab_id = $2,
               status = 'in_progress',
               updated_at = now()
           WHERE order_id = $1`, [orderId, data.outsourceLabId]);
            }
            await client.query('COMMIT');
            return { success: true, specimenId };
        }
        catch (e) {
            await client.query('ROLLBACK');
            throw e;
        }
        finally {
            client.release();
        }
    }
    async outsourceReturnSpecimen(specimenId, data) {
        const client = await database_1.db.getClient();
        try {
            await client.query('BEGIN');
            const specRes = await client.query(`UPDATE lab_specimens
         SET processing_source = 'outsource_return',
             returned_at = COALESCE($2::timestamptz, now()),
             updated_at = now()
         WHERE id = $1
         RETURNING order_id`, [specimenId, data.returnedAt || null]);
            if (specRes.rows.length === 0) {
                throw new AppError_1.NotFoundError('Specimen not found');
            }
            const orderId = specRes.rows[0].order_id;
            if (orderId) {
                await client.query(`UPDATE order_items
           SET processing_source = 'outsource_return',
               updated_at = now()
           WHERE order_id = $1`, [orderId]);
            }
            await client.query('COMMIT');
            return { success: true, specimenId };
        }
        catch (e) {
            await client.query('ROLLBACK');
            throw e;
        }
        finally {
            client.release();
        }
    }
    async getDashboardStats(facilityId) {
        const params = [];
        let facilityFilter = '';
        if (facilityId && facilityId !== '00000000-0000-0000-0000-000000000000') {
            params.push(facilityId);
            facilityFilter = ` AND o.facility_id = $${params.length}`;
        }
        const query = `
      SELECT
        COUNT(DISTINCT o.id) as total_orders_all_time,
        COUNT(DISTINCT o.id) FILTER (WHERE o.created_at >= CURRENT_DATE) as today_orders,
        COUNT(oi.id) FILTER (WHERE oi.created_at >= CURRENT_DATE) as today_tests,
        COUNT(oi.id) FILTER (WHERE oi.status = 'ordered') as pending_count,
        COUNT(oi.id) FILTER (WHERE oi.status = 'in_progress') as in_progress_count,
        COUNT(oi.id) FILTER (WHERE oi.status = 'completed') as completed_count,
        COUNT(oi.id) FILTER (WHERE oi.processing_source LIKE 'outsource%') as outsourced_count
      FROM orders o
      JOIN order_items oi ON oi.order_id = o.id
      WHERE o.order_type = 'lab' ${facilityFilter}
    `;
        const res = await database_1.db.query(query, params);
        const row = res.rows[0] || {};
        return {
            todayOrders: parseInt(row.today_orders || '0', 10),
            todayTests: parseInt(row.today_tests || '0', 10),
            pendingCount: parseInt(row.pending_count || '0', 10),
            inProgressCount: parseInt(row.in_progress_count || '0', 10),
            completedCount: parseInt(row.completed_count || '0', 10),
            outsourcedCount: parseInt(row.outsourced_count || '0', 10),
            totalOrdersAllTime: parseInt(row.total_orders_all_time || '0', 10)
        };
    }
    // ---- Outsource Labs CRUD ----
    async listOutsourceLabs(organizationId) {
        const query = `
      SELECT * FROM outsource_labs
      WHERE ($1::uuid IS NULL OR organization_id = $1::uuid OR organization_id = '00000000-0000-0000-0000-000000000000')
      ORDER BY is_active DESC, name ASC
    `;
        const res = await database_1.db.query(query, [organizationId || null]);
        return res.rows;
    }
    async getOutsourceLabById(id) {
        const res = await database_1.db.query(`SELECT * FROM outsource_labs WHERE id = $1`, [id]);
        return res.rows[0] || null;
    }
    async createOutsourceLab(organizationId, data, userId) {
        const query = `
      INSERT INTO outsource_labs (
        organization_id, name, code, contact_person, phone, email, 
        address, contract_rate, turnaround_days, is_active, created_by
      ) VALUES (
        $1, $2, $3, $4, $5, $6, 
        $7, $8, $9, $10, $11
      ) RETURNING *
    `;
        const res = await database_1.db.query(query, [
            organizationId,
            data.name,
            data.code || null,
            data.contactPerson || data.contact_person || null,
            data.phone || null,
            data.email || null,
            data.address || null,
            data.contractRate !== undefined ? data.contractRate : 0,
            data.turnaroundDays || 2,
            data.isActive !== undefined ? data.isActive : true,
            userId || null
        ]);
        return res.rows[0];
    }
    async updateOutsourceLab(id, data, userId) {
        const query = `
      UPDATE outsource_labs
      SET name = COALESCE($2, name),
          code = COALESCE($3, code),
          contact_person = COALESCE($4, contact_person),
          phone = COALESCE($5, phone),
          email = COALESCE($6, email),
          address = COALESCE($7, address),
          contract_rate = COALESCE($8, contract_rate),
          turnaround_days = COALESCE($9, turnaround_days),
          is_active = COALESCE($10, is_active),
          updated_at = now(),
          updated_by = $11
      WHERE id = $1
      RETURNING *
    `;
        const res = await database_1.db.query(query, [
            id,
            data.name || null,
            data.code || null,
            data.contactPerson || data.contact_person || null,
            data.phone || null,
            data.email || null,
            data.address || null,
            data.contractRate !== undefined ? data.contractRate : null,
            data.turnaroundDays || null,
            data.isActive !== undefined ? data.isActive : null,
            userId || null
        ]);
        if (res.rows.length === 0) {
            throw new AppError_1.NotFoundError('Outsource lab not found');
        }
        return res.rows[0];
    }
    async deleteOutsourceLab(id) {
        const res = await database_1.db.query(`UPDATE outsource_labs SET is_active = false, updated_at = now() WHERE id = $1 RETURNING *`, [id]);
        if (res.rows.length === 0) {
            throw new AppError_1.NotFoundError('Outsource lab not found');
        }
        return res.rows[0];
    }
    // ---- In-House Test Definitions CRUD ----
    async createTestDefinition(organizationId, data, userId) {
        const client = await database_1.db.getClient();
        try {
            await client.query('BEGIN');
            // 1. Resolve Laboratory Department
            const deptRes = await client.query(`SELECT id FROM departments WHERE (organization_id = $1 OR organization_id = '00000000-0000-0000-0000-000000000000') AND (code = 'LAB' OR department_type = 'diagnostic') LIMIT 1`, [organizationId]);
            const labDeptId = deptRes.rows[0]?.id || null;
            // 2. Insert into services
            const svcRes = await client.query(`INSERT INTO services (
          organization_id, department_id, code, name, description, 
          service_type, default_rate, is_active, created_by
        ) VALUES (
          $1, $2, $3, $4, $5, 
          'lab_test', $6, true, $7
        ) RETURNING id`, [
                organizationId,
                labDeptId,
                data.code.trim().toUpperCase(),
                data.name.trim(),
                data.description || null,
                data.price !== undefined ? data.price : 350,
                userId || null
            ]);
            const serviceId = svcRes.rows[0].id;
            // 3. Insert into lab_test_definitions
            await client.query(`INSERT INTO lab_test_definitions (
          service_id, lab_section, specimen_type, tat_hours, fasting_required
        ) VALUES ($1, $2, $3, $4, $5)`, [
                serviceId,
                data.labSection || 'Biochemistry',
                data.specimenType || 'Serum',
                data.tatHours || 4,
                data.fastingRequired || false
            ]);
            // 4. Insert parameters if provided
            if (Array.isArray(data.parameters) && data.parameters.length > 0) {
                for (let i = 0; i < data.parameters.length; i++) {
                    const p = data.parameters[i];
                    const paramCode = (p.code || p.name).toUpperCase().replace(/[^A-Z0-9]/g, '').slice(0, 10);
                    await client.query(`INSERT INTO lab_parameters (
              test_service_id, code, name, unit, data_type, sort_order, is_active
            ) VALUES ($1, $2, $3, $4, $5, $6, true)
            ON CONFLICT (test_service_id, code) DO NOTHING`, [
                        serviceId,
                        paramCode || `P${i + 1}`,
                        p.name,
                        p.unit || null,
                        p.dataType || 'numeric',
                        i + 1
                    ]);
                }
            }
            await client.query('COMMIT');
            return {
                id: serviceId,
                service_id: serviceId,
                code: data.code,
                name: data.name,
                price: data.price || 350,
                lab_section: data.labSection,
                specimen_type: data.specimenType,
                tat_hours: data.tatHours || 4,
                fasting_required: data.fastingRequired || false,
                is_active: true
            };
        }
        catch (e) {
            await client.query('ROLLBACK');
            throw e;
        }
        finally {
            client.release();
        }
    }
    async updateTestDefinition(serviceId, data, userId) {
        const client = await database_1.db.getClient();
        try {
            await client.query('BEGIN');
            // Update services table
            await client.query(`UPDATE services
         SET name = COALESCE($2, name),
             code = COALESCE($3, code),
             description = COALESCE($4, description),
             default_rate = COALESCE($5, default_rate),
             updated_at = now(),
             updated_by = $6
         WHERE id = $1`, [
                serviceId,
                data.name || null,
                data.code ? data.code.trim().toUpperCase() : null,
                data.description !== undefined ? data.description : null,
                data.price !== undefined ? data.price : null,
                userId || null
            ]);
            // Update lab_test_definitions table
            await client.query(`UPDATE lab_test_definitions
         SET lab_section = COALESCE($2, lab_section),
             specimen_type = COALESCE($3, specimen_type),
             tat_hours = COALESCE($4, tat_hours),
             fasting_required = COALESCE($5, fasting_required)
         WHERE service_id = $1`, [
                serviceId,
                data.labSection || null,
                data.specimenType || null,
                data.tatHours !== undefined ? data.tatHours : null,
                data.fastingRequired !== undefined ? data.fastingRequired : null
            ]);
            await client.query('COMMIT');
            return { success: true, serviceId };
        }
        catch (e) {
            await client.query('ROLLBACK');
            throw e;
        }
        finally {
            client.release();
        }
    }
    async deleteTestDefinition(serviceId) {
        const res = await database_1.db.query(`UPDATE services SET is_active = false, updated_at = now() WHERE id = $1 RETURNING id`, [serviceId]);
        if (res.rows.length === 0) {
            throw new AppError_1.NotFoundError('Lab test definition not found');
        }
        return { success: true, serviceId };
    }
}
exports.LabRepository = LabRepository;
