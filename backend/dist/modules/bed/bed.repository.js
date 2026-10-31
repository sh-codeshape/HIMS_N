"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.BedRepository = void 0;
const database_1 = require("../../config/database");
const AppError_1 = require("../../shared/errors/AppError");
class BedRepository {
    async getBeds(facilityId) {
        const query = `
      SELECT 
        b.*, 
        r.room_no as room_name, 
        w.name as ward_name, 
        w.ward_type as ward_type,
        w.floor as floor,
        b.status as current_status,
        bc.name as category_name,
        bc.is_icu,
        p.id as patient_id,
        p.uhid as patient_uhid,
        p.first_name as patient_first_name,
        p.last_name as patient_last_name,
        p.date_of_birth,
        p.gender,
        adm.id as admission_id,
        adm.admitted_at,
        adm.status as admission_status,
        s.first_name as doctor_first_name,
        s.last_name as doctor_last_name,
        srv.id as bed_charge_service_id,
        srv.code as bed_charge_service_code,
        srv.name as bed_charge_service_name,
        COALESCE(srv.default_rate, 0) as bed_charge_rate,
        b.features->>'inventory_item_id' as inventory_item_id
      FROM beds b
      LEFT JOIN rooms r ON b.room_id = r.id
      JOIN wards w ON b.ward_id = w.id
      LEFT JOIN bed_categories bc ON b.bed_category_id = bc.id
      LEFT JOIN services srv ON b.bed_charge_service_id = srv.id
      LEFT JOIN bed_assignments ba ON ba.bed_id = b.id AND ba.assigned_to IS NULL
      LEFT JOIN admissions adm ON ba.admission_id = adm.id AND adm.status IN ('admitted', 'discharge_initiated')
      LEFT JOIN patients p ON adm.patient_id = p.id
      LEFT JOIN practitioners prac ON adm.attending_practitioner_id = prac.id OR adm.admitting_practitioner_id = prac.id
      LEFT JOIN staff s ON prac.staff_id = s.id
      WHERE (b.facility_id = $1 OR b.facility_id = '00000000-0000-0000-0000-000000000000' OR $1 = '00000000-0000-0000-0000-000000000000') AND b.is_active = true
      ORDER BY w.name, r.room_no, b.bed_no
    `;
        const result = await database_1.db.query(query, [facilityId]);
        return result.rows;
    }
    async getWards(facilityId) {
        const query = `
      SELECT
        w.id,
        w.code,
        w.name,
        w.floor,
        w.ward_type,
        w.gender_policy,
        bc.id as bed_category_id,
        bc.code as bed_category_code,
        bc.name as bed_category_name
      FROM wards w
      LEFT JOIN bed_categories bc ON w.bed_category_id = bc.id
      WHERE (w.facility_id = $1 OR w.facility_id = '00000000-0000-0000-0000-000000000000' OR $1 = '00000000-0000-0000-0000-000000000000') AND w.is_active = true
      ORDER BY w.floor NULLS LAST, w.name
    `;
        const result = await database_1.db.query(query, [facilityId]);
        return result.rows;
    }
    async getRooms(facilityId) {
        const query = `
      SELECT
        r.id,
        r.room_no,
        r.room_type,
        r.ward_id,
        w.name as ward_name,
        w.floor,
        w.ward_type
      FROM rooms r
      JOIN wards w ON r.ward_id = w.id
      WHERE (w.facility_id = $1 OR w.facility_id = '00000000-0000-0000-0000-000000000000' OR $1 = '00000000-0000-0000-0000-000000000000') AND r.is_active = true AND w.is_active = true
      ORDER BY w.floor NULLS LAST, w.name, r.room_no
    `;
        const result = await database_1.db.query(query, [facilityId]);
        return result.rows;
    }
    async getBedById(bedId, facilityId) {
        const query = `
      SELECT b.*, b.status as current_status, r.room_no as room_name, w.name as ward_name, w.floor as floor, w.ward_type as ward_type, bc.name as category_name, bc.is_icu,
             srv.id as bed_charge_service_id, srv.code as bed_charge_service_code, srv.name as bed_charge_service_name,
             COALESCE(srv.default_rate, 0) as bed_charge_rate,
             b.features->>'inventory_item_id' as inventory_item_id
      FROM beds b
      LEFT JOIN rooms r ON b.room_id = r.id
      JOIN wards w ON b.ward_id = w.id
      LEFT JOIN bed_categories bc ON b.bed_category_id = bc.id
      LEFT JOIN services srv ON b.bed_charge_service_id = srv.id
      WHERE b.id = $1 AND (b.facility_id = $2 OR b.facility_id = '00000000-0000-0000-0000-000000000000' OR $2 = '00000000-0000-0000-0000-000000000000') AND b.is_active = true
      ORDER BY w.name, r.room_no, b.bed_no
    `;
        const result = await database_1.db.query(query, [bedId, facilityId]);
        return result.rows[0];
    }
    async getBedCategories(facilityId) {
        const query = `
      SELECT 
        bc.id,
        bc.code,
        bc.name,
        bc.rank,
        bc.is_icu,
        bc.is_active,
        srv.id as bed_charge_service_id,
        srv.code as bed_charge_service_code,
        srv.name as bed_charge_service_name,
        COALESCE(tr.rate, srv.default_rate, 0) as daily_rate
      FROM bed_categories bc
      LEFT JOIN services srv ON (
        (bc.code = 'GEN' AND srv.code = 'BED-GEN-DAY') OR
        (bc.code = 'ICU' AND srv.code = 'BED-ICU-DAY') OR
        (bc.code = 'PVT' AND srv.code = 'BED-PVT-DAY') OR
        (bc.code = 'SEMI' AND (srv.code = 'BED-SEMI-DAY' OR srv.code = 'BED-GEN-DAY')) OR
        (bc.code = 'NICU' AND (srv.code = 'BED-NICU-DAY' OR srv.code = 'BED-ICU-DAY')) OR
        (bc.code = 'EMG' AND (srv.code = 'BED-EMG-DAY' OR srv.code = 'BED-GEN-DAY')) OR
        (bc.code = 'DAY' AND (srv.code = 'BED-DAY-DAY' OR srv.code = 'BED-GEN-DAY')) OR
        (srv.service_type = 'bed' AND (srv.code ILIKE '%' || bc.code || '%' OR srv.name ILIKE '%' || bc.name || '%'))
      )
      LEFT JOIN tariff_rates tr ON tr.service_id = srv.id AND (tr.bed_category_id = bc.id OR tr.bed_category_id IS NULL)
      WHERE bc.is_active = true
      ORDER BY bc.rank ASC, bc.name ASC;
    `;
        const result = await database_1.db.query(query);
        const seen = new Set();
        return result.rows.filter(r => {
            if (seen.has(r.id))
                return false;
            seen.add(r.id);
            return true;
        });
    }
    async resolveBedChargeServiceId(bedCategoryId, organizationId) {
        if (bedCategoryId) {
            // 1. Check tariff rates for this specific bed category
            const tariffRes = await database_1.db.query(`SELECT service_id FROM tariff_rates WHERE bed_category_id = $1 LIMIT 1;`, [bedCategoryId]);
            if (tariffRes.rows.length > 0 && tariffRes.rows[0].service_id) {
                return tariffRes.rows[0].service_id;
            }
            // 2. Try matching service code/name based on bed category code
            const catRes = await database_1.db.query(`SELECT code, name FROM bed_categories WHERE id = $1 LIMIT 1;`, [bedCategoryId]);
            if (catRes.rows.length > 0) {
                const catCode = catRes.rows[0].code;
                const catName = catRes.rows[0].name;
                const matchRes = await database_1.db.query(`SELECT id FROM services 
           WHERE service_type = 'bed' AND (code ILIKE $1 OR name ILIKE $2) 
           ORDER BY created_at ASC LIMIT 1;`, [`%${catCode}%`, `%${catName}%`]);
                if (matchRes.rows.length > 0) {
                    return matchRes.rows[0].id;
                }
            }
        }
        // 3. Fallback to general bed charge service
        const defaultRes = await database_1.db.query(`SELECT id FROM services WHERE service_type = 'bed' AND code = 'BED-GEN-DAY' LIMIT 1;`);
        if (defaultRes.rows.length > 0) {
            return defaultRes.rows[0].id;
        }
        const anyBedRes = await database_1.db.query(`SELECT id FROM services WHERE service_type = 'bed' ORDER BY created_at ASC LIMIT 1;`);
        return anyBedRes.rows[0]?.id || null;
    }
    async syncBedToInventoryItem(bed, client = database_1.db) {
        try {
            const orgId = bed.organization_id || '00000000-0000-0000-0000-000000000000';
            const itemCode = `EQ-BED-${String(bed.bed_no || '').replace(/\s+/g, '-').toUpperCase()}`;
            const wardRes = await client.query(`SELECT name, floor FROM wards WHERE id = $1 LIMIT 1;`, [bed.ward_id]);
            const ward = wardRes.rows[0];
            const catRes = bed.bed_category_id
                ? await client.query(`SELECT name FROM bed_categories WHERE id = $1 LIMIT 1;`, [bed.bed_category_id])
                : { rows: [] };
            const catName = catRes.rows[0]?.name || 'Standard';
            const itemName = `Hospital Bed - ${bed.bed_no} (${catName})`;
            const customFields = {
                bed_id: bed.id,
                bed_no: bed.bed_no,
                ward_id: bed.ward_id,
                ward_name: ward?.name || null,
                room_id: bed.room_id,
                floor: ward?.floor || null,
                bed_category_id: bed.bed_category_id,
                category_name: catName,
                status: bed.status,
                is_bed_asset: true,
                features: bed.features || {},
            };
            const existRes = await client.query(`SELECT id FROM items WHERE organization_id = $1 AND code = $2 LIMIT 1;`, [orgId, itemCode]);
            let itemId;
            if (existRes.rows.length > 0) {
                itemId = existRes.rows[0].id;
                await client.query(`UPDATE items
           SET name = $2,
               service_id = COALESCE($3, service_id),
               is_active = $4,
               custom_fields = $5,
               updated_at = NOW()
           WHERE id = $1;`, [itemId, itemName, bed.bed_charge_service_id || null, bed.is_active ?? true, JSON.stringify(customFields)]);
            }
            else {
                const insertRes = await client.query(`INSERT INTO items (
             organization_id, code, name, generic_name, item_type,
             service_id, base_uom, pack_size, track_batches, track_expiry,
             is_active, custom_fields, created_at, updated_at
           ) VALUES (
             $1, $2, $3, 'IPD Hospital Bed Asset', 'equipment',
             $4, 'unit', 1, false, false,
             $5, $6, NOW(), NOW()
           ) RETURNING id;`, [orgId, itemCode, itemName, bed.bed_charge_service_id || null, bed.is_active ?? true, JSON.stringify(customFields)]);
                itemId = insertRes.rows[0].id;
            }
            // Update features with linked inventory item id
            const currentFeatures = typeof bed.features === 'object' && bed.features !== null ? bed.features : {};
            if (currentFeatures.inventory_item_id !== itemId) {
                const features = { ...currentFeatures, inventory_item_id: itemId };
                await client.query(`UPDATE beds SET features = $2 WHERE id = $1;`, [bed.id, JSON.stringify(features)]);
            }
            return itemId;
        }
        catch (err) {
            console.error('Error syncing bed to inventory item:', err);
            return null;
        }
    }
    async syncAllBedsToInventory(facilityId) {
        const beds = await database_1.db.query(`SELECT * FROM beds WHERE facility_id = $1 AND is_active = true;`, [facilityId]);
        let count = 0;
        for (const bed of beds.rows) {
            let chargeServiceId = bed.bed_charge_service_id;
            if (!chargeServiceId) {
                chargeServiceId = await this.resolveBedChargeServiceId(bed.bed_category_id, bed.organization_id);
                if (chargeServiceId) {
                    await database_1.db.query(`UPDATE beds SET bed_charge_service_id = $1 WHERE id = $2;`, [chargeServiceId, bed.id]);
                    bed.bed_charge_service_id = chargeServiceId;
                }
            }
            await this.syncBedToInventoryItem(bed);
            count++;
        }
        return { synced: count, total: beds.rows.length };
    }
    async createBed(data) {
        // Resolve (or auto-create) the ward when only ward reference details are provided
        let wardId = data.ward_id || null;
        const orgId = data.organization_id || '00000000-0000-0000-0000-000000000000';
        if (!wardId) {
            const wardQuery = `
        SELECT id FROM wards
        WHERE facility_id = $1 AND code = $2 AND is_active = true
        LIMIT 1;
      `;
            const wardRes = await database_1.db.query(wardQuery, [data.facility_id, data.ward_code]);
            if (wardRes.rows.length > 0) {
                wardId = wardRes.rows[0].id;
            }
            else {
                const wardInsert = await database_1.db.query(`INSERT INTO wards (
            organization_id, facility_id, code, name, ward_type, gender_policy, floor, bed_category_id, is_active, created_at, updated_at, created_by, updated_by
          ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, true, NOW(), NOW(), $9, $10) RETURNING *;`, [
                    orgId,
                    data.facility_id,
                    data.ward_code,
                    data.ward_name || data.ward_code,
                    data.ward_type || 'general',
                    data.gender_policy || 'any',
                    data.floor || null,
                    data.bed_category_id || null,
                    data.created_by || null,
                    data.updated_by || null,
                ]);
                wardId = wardInsert.rows[0].id;
            }
        }
        if (wardId && data.floor && data.floor.trim()) {
            await database_1.db.query(`UPDATE wards SET floor = $1, updated_at = NOW() WHERE id = $2;`, [data.floor.trim(), wardId]);
        }
        // Resolve (or auto-create) the room when room details are provided without an existing room
        let roomId = data.room_id || null;
        if (!roomId && data.room_no) {
            const roomQuery = `SELECT id FROM rooms WHERE ward_id = $1 AND room_no = $2 LIMIT 1;`;
            const roomRes = await database_1.db.query(roomQuery, [wardId, data.room_no]);
            if (roomRes.rows.length > 0) {
                roomId = roomRes.rows[0].id;
            }
            else {
                const roomInsert = await database_1.db.query(`INSERT INTO rooms (ward_id, room_no, room_type, is_active) VALUES ($1, $2, $3, true) RETURNING *;`, [wardId, data.room_no, data.room_type || 'general']);
                roomId = roomInsert.rows[0].id;
            }
        }
        // Resolve (or auto-create) bed category if custom name provided
        let bedCategoryId = data.bed_category_id || null;
        if (!bedCategoryId && data.custom_bed_category?.trim()) {
            const catName = data.custom_bed_category.trim();
            const catCode = catName.toUpperCase().replace(/[^A-Z0-9]/g, '').slice(0, 8) || 'CUSTOM';
            const existingCat = await database_1.db.query(`SELECT id FROM bed_categories WHERE organization_id = $1 AND (code = $2 OR name ILIKE $3) LIMIT 1;`, [orgId, catCode, catName]);
            if (existingCat.rows.length > 0) {
                bedCategoryId = existingCat.rows[0].id;
            }
            else {
                const catInsert = await database_1.db.query(`INSERT INTO bed_categories (organization_id, code, name, rank, is_icu, is_active)
           VALUES ($1, $2, $3, 10, false, true) RETURNING id;`, [orgId, catCode, catName]);
                bedCategoryId = catInsert.rows[0].id;
            }
        }
        const exists = await database_1.db.query(`SELECT id FROM beds WHERE facility_id = $1 AND ward_id = $2 AND bed_no = $3 AND is_active = true`, [data.facility_id, wardId, data.bed_no]);
        if (exists.rows.length > 0) {
            throw new AppError_1.ConflictError(`Bed number '${data.bed_no}' already exists in the specified ward`);
        }
        let bedChargeServiceId = data.bed_charge_service_id || null;
        if (!bedChargeServiceId) {
            bedChargeServiceId = await this.resolveBedChargeServiceId(bedCategoryId, data.organization_id);
        }
        const query = `
      INSERT INTO beds (
        organization_id, facility_id, ward_id, room_id, bed_category_id,
        bed_charge_service_id, bed_no, status, features, is_active,
        created_at, updated_at, created_by, updated_by
      ) VALUES (
        $1, $2, $3, $4, $5, $6, $7, $8, $9, $10, NOW(), NOW(), $11, $12
      ) RETURNING *;
    `;
        const result = await database_1.db.query(query, [
            orgId,
            data.facility_id,
            wardId,
            roomId,
            bedCategoryId,
            bedChargeServiceId,
            data.bed_no,
            data.status || 'available',
            data.features || {},
            data.is_active === undefined ? true : data.is_active,
            data.created_by || null,
            data.updated_by || null,
        ]);
        const createdBed = result.rows[0];
        if (createdBed) {
            await this.syncBedToInventoryItem(createdBed);
        }
        return (await this.getBedById(createdBed.id, data.facility_id)) || createdBed;
    }
    async createWard(data) {
        const facilityId = data.facility_id || '00000000-0000-0000-0000-000000000000';
        const orgId = data.organization_id || '00000000-0000-0000-0000-000000000000';
        const existing = await database_1.db.query(`SELECT id FROM wards WHERE facility_id = $1 AND code = $2 AND is_active = true LIMIT 1;`, [facilityId, data.code]);
        if (existing.rows.length > 0) {
            throw new AppError_1.ConflictError(`Ward code '${data.code}' already exists`);
        }
        // Resolve (or auto-create) bed category if custom name provided
        let bedCategoryId = data.bed_category_id || null;
        if (!bedCategoryId && data.custom_bed_category?.trim()) {
            const catName = data.custom_bed_category.trim();
            const catCode = catName.toUpperCase().replace(/[^A-Z0-9]/g, '').slice(0, 8) || 'CUSTOM';
            const existingCat = await database_1.db.query(`SELECT id FROM bed_categories WHERE organization_id = $1 AND (code = $2 OR name ILIKE $3) LIMIT 1;`, [orgId, catCode, catName]);
            if (existingCat.rows.length > 0) {
                bedCategoryId = existingCat.rows[0].id;
            }
            else {
                const catInsert = await database_1.db.query(`INSERT INTO bed_categories (organization_id, code, name, rank, is_icu, is_active)
           VALUES ($1, $2, $3, 10, false, true) RETURNING id;`, [orgId, catCode, catName]);
                bedCategoryId = catInsert.rows[0].id;
            }
        }
        const VALID_WARD_TYPES = ['general', 'semi_private', 'private', 'icu', 'nicu', 'picu', 'hdu', 'isolation', 'emergency', 'maternity', 'daycare', 'other'];
        const safeWardType = VALID_WARD_TYPES.includes(data.ward_type) ? data.ward_type : 'general';
        const insert = await database_1.db.query(`INSERT INTO wards (
        organization_id, facility_id, code, name, ward_type, gender_policy, floor, bed_category_id, is_active, created_at, updated_at, created_by, updated_by
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, NOW(), NOW(), $10, $11) RETURNING *;`, [
            orgId,
            facilityId,
            data.code,
            data.name,
            safeWardType,
            data.gender_policy || 'any',
            data.floor || null,
            bedCategoryId,
            data.is_active === undefined ? true : data.is_active,
            data.created_by || null,
            data.updated_by || null,
        ]);
        return insert.rows[0];
    }
    async createRoom(data) {
        const facilityId = data.facility_id || '00000000-0000-0000-0000-000000000000';
        const orgId = data.organization_id || '00000000-0000-0000-0000-000000000000';
        let wardId = data.ward_id || null;
        if (!wardId && data.ward_code) {
            const wardQuery = `SELECT id FROM wards WHERE facility_id = $1 AND code = $2 AND is_active = true LIMIT 1;`;
            const wardRes = await database_1.db.query(wardQuery, [facilityId, data.ward_code]);
            if (wardRes.rows.length > 0) {
                wardId = wardRes.rows[0].id;
            }
            else {
                const VALID_WARD_TYPES = ['general', 'semi_private', 'private', 'icu', 'nicu', 'picu', 'hdu', 'isolation', 'emergency', 'maternity', 'daycare', 'other'];
                const safeWardType = VALID_WARD_TYPES.includes(data.ward_type) ? data.ward_type : 'general';
                const wardInsert = await database_1.db.query(`INSERT INTO wards (
            organization_id, facility_id, code, name, ward_type, gender_policy, floor, is_active, created_at, updated_at
          ) VALUES ($1, $2, $3, $4, $5, 'any', $6, true, NOW(), NOW()) RETURNING id;`, [orgId, facilityId, data.ward_code.toUpperCase(), data.ward_name || data.ward_code, safeWardType, data.floor || null]);
                wardId = wardInsert.rows[0].id;
            }
        }
        if (!wardId) {
            throw new AppError_1.ConflictError('A target ward must be specified or created for the room');
        }
        if (wardId && data.floor && data.floor.trim()) {
            await database_1.db.query(`UPDATE wards SET floor = $1, updated_at = NOW() WHERE id = $2;`, [data.floor.trim(), wardId]);
        }
        const existing = await database_1.db.query(`SELECT id FROM rooms WHERE ward_id = $1 AND room_no = $2 AND is_active = true LIMIT 1;`, [wardId, data.room_no]);
        if (existing.rows.length > 0) {
            throw new AppError_1.ConflictError(`Room '${data.room_no}' already exists in this ward`);
        }
        const insert = await database_1.db.query(`INSERT INTO rooms (ward_id, room_no, room_type, is_active) VALUES ($1, $2, $3, $4) RETURNING *;`, [wardId, data.room_no, data.room_type || 'general', data.is_active === undefined ? true : data.is_active]);
        return insert.rows[0];
    }
    async deleteWard(wardId, facilityId) {
        const wardRes = await database_1.db.query(`SELECT id, name, code FROM wards
       WHERE id = $1 AND (facility_id = $2 OR facility_id = '00000000-0000-0000-0000-000000000000' OR $2 = '00000000-0000-0000-0000-000000000000') AND is_active = true`, [wardId, facilityId]);
        if (wardRes.rows.length === 0) {
            throw new AppError_1.NotFoundError('Ward not found or already deleted');
        }
        const ward = wardRes.rows[0];
        // Check for any occupied beds in this ward
        const occupiedCheck = await database_1.db.query(`SELECT b.bed_no FROM beds b
       WHERE b.ward_id = $1 AND b.status = 'occupied' AND b.is_active = true`, [wardId]);
        if (occupiedCheck.rows.length > 0) {
            const beds = occupiedCheck.rows.map((r) => r.bed_no).join(', ');
            throw new AppError_1.ConflictError(`Cannot delete ward '${ward.name}' because it contains occupied bed(s): ${beds}. Please discharge or transfer the patients before deleting this ward.`);
        }
        const client = await database_1.db.getClient();
        try {
            await client.query('BEGIN');
            await client.query(`UPDATE beds SET is_active = false, updated_at = NOW() WHERE ward_id = $1`, [wardId]);
            await client.query(`UPDATE rooms SET is_active = false WHERE ward_id = $1`, [wardId]);
            const updateRes = await client.query(`UPDATE wards SET is_active = false, updated_at = NOW() WHERE id = $1 RETURNING *`, [wardId]);
            await client.query('COMMIT');
            return updateRes.rows[0];
        }
        catch (err) {
            try {
                await client.query('ROLLBACK');
            }
            catch (_) { }
            throw err;
        }
        finally {
            client.release();
        }
    }
    async deleteRoom(roomId, facilityId) {
        const roomRes = await database_1.db.query(`SELECT r.id, r.room_no, r.ward_id, w.name as ward_name
       FROM rooms r
       JOIN wards w ON r.ward_id = w.id
       WHERE r.id = $1 AND r.is_active = true`, [roomId]);
        if (roomRes.rows.length === 0) {
            throw new AppError_1.NotFoundError('Room not found or already deleted');
        }
        const room = roomRes.rows[0];
        // Check for any occupied beds in this room
        const occupiedCheck = await database_1.db.query(`SELECT b.bed_no FROM beds b
       WHERE b.room_id = $1 AND b.status = 'occupied' AND b.is_active = true`, [roomId]);
        if (occupiedCheck.rows.length > 0) {
            const beds = occupiedCheck.rows.map((r) => r.bed_no).join(', ');
            throw new AppError_1.ConflictError(`Cannot delete room '${room.room_no}' because bed(s) ${beds} are currently occupied. Please discharge or transfer the patients before deleting this room.`);
        }
        const client = await database_1.db.getClient();
        try {
            await client.query('BEGIN');
            await client.query(`UPDATE beds SET is_active = false, updated_at = NOW() WHERE room_id = $1`, [roomId]);
            const updateRes = await client.query(`UPDATE rooms SET is_active = false WHERE id = $1 RETURNING *`, [roomId]);
            await client.query('COMMIT');
            return updateRes.rows[0];
        }
        catch (err) {
            try {
                await client.query('ROLLBACK');
            }
            catch (_) { }
            throw err;
        }
        finally {
            client.release();
        }
    }
    async updateBed(bedId, data, facilityId) {
        const orgId = data.organization_id || '00000000-0000-0000-0000-000000000000';
        let bedCategoryId = data.bed_category_id !== undefined ? data.bed_category_id : null;
        if (!bedCategoryId && data.custom_bed_category?.trim()) {
            const catName = data.custom_bed_category.trim();
            const catCode = catName.toUpperCase().replace(/[^A-Z0-9]/g, '').slice(0, 8) || 'CUSTOM';
            const existingCat = await database_1.db.query(`SELECT id FROM bed_categories WHERE organization_id = $1 AND (code = $2 OR name ILIKE $3) LIMIT 1;`, [orgId, catCode, catName]);
            if (existingCat.rows.length > 0) {
                bedCategoryId = existingCat.rows[0].id;
            }
            else {
                const catInsert = await database_1.db.query(`INSERT INTO bed_categories (organization_id, code, name, rank, is_icu, is_active)
           VALUES ($1, $2, $3, 10, false, true) RETURNING id;`, [orgId, catCode, catName]);
                bedCategoryId = catInsert.rows[0].id;
            }
        }
        let bedChargeServiceId = data.bed_charge_service_id;
        if (bedChargeServiceId === undefined && bedCategoryId) {
            bedChargeServiceId = await this.resolveBedChargeServiceId(bedCategoryId, orgId);
        }
        let wardId = data.ward_id ?? null;
        let roomId = data.room_id ?? null;
        if (wardId && data.floor && data.floor.trim()) {
            await database_1.db.query(`UPDATE wards SET floor = $1, updated_at = NOW() WHERE id = $2;`, [data.floor.trim(), wardId]);
        }
        if (!roomId && data.room_no && wardId) {
            const roomQuery = `SELECT id FROM rooms WHERE ward_id = $1 AND room_no = $2 LIMIT 1;`;
            const roomRes = await database_1.db.query(roomQuery, [wardId, data.room_no]);
            if (roomRes.rows.length > 0) {
                roomId = roomRes.rows[0].id;
            }
            else {
                const roomInsert = await database_1.db.query(`INSERT INTO rooms (ward_id, room_no, room_type, is_active) VALUES ($1, $2, $3, true) RETURNING *;`, [wardId, data.room_no, data.room_type || 'general']);
                roomId = roomInsert.rows[0].id;
            }
        }
        if (data.bed_no && wardId) {
            const exists = await database_1.db.query(`SELECT id FROM beds WHERE ward_id = $1 AND bed_no = $2 AND id != $3 AND is_active = true`, [wardId, data.bed_no, bedId]);
            if (exists.rows.length > 0) {
                throw new AppError_1.ConflictError(`Bed number '${data.bed_no}' already exists in this ward`);
            }
        }
        const currentBed = await this.getBedById(bedId, facilityId);
        const mergedFeatures = {
            ...(currentBed?.features || {}),
            ...(typeof data.features === 'object' && data.features !== null ? data.features : {}),
        };
        const query = `
      UPDATE beds
      SET ward_id = $2, room_id = $3, bed_category_id = $4,
          bed_charge_service_id = COALESCE($5, bed_charge_service_id),
          bed_no = $6, status = $7, features = $8, is_active = $9, updated_at = NOW(), updated_by = $10
      WHERE id = $1 AND (facility_id = $11 OR facility_id = '00000000-0000-0000-0000-000000000000' OR $11 = '00000000-0000-0000-0000-000000000000')
      RETURNING *;
    `;
        const result = await database_1.db.query(query, [
            bedId,
            wardId,
            roomId,
            bedCategoryId ?? null,
            bedChargeServiceId ?? null,
            data.bed_no,
            data.status || 'available',
            mergedFeatures,
            data.is_active ?? true,
            data.updated_by || null,
            facilityId,
        ]);
        const updatedBed = result.rows[0];
        if (updatedBed) {
            await this.syncBedToInventoryItem(updatedBed);
        }
        return (await this.getBedById(bedId, facilityId)) || updatedBed;
    }
    async softDeleteBed(bedId, facilityId) {
        const query = `
      UPDATE beds
      SET is_active = false, updated_at = NOW()
      WHERE id = $1 AND (facility_id = $2 OR facility_id = '00000000-0000-0000-0000-000000000000' OR $2 = '00000000-0000-0000-0000-000000000000')
      RETURNING *;
    `;
        const result = await database_1.db.query(query, [bedId, facilityId]);
        const deletedBed = result.rows[0];
        if (deletedBed) {
            await this.syncBedToInventoryItem(deletedBed);
        }
        return deletedBed;
    }
    async updateBedStatus(bedId, status, facilityId) {
        const query = `
      UPDATE beds
      SET status = $1, updated_at = NOW()
      WHERE id = $2 AND facility_id = $3
      RETURNING *;
    `;
        const result = await database_1.db.query(query, [status, bedId, facilityId]);
        return result.rows[0];
    }
    async transferBed(data) {
        const client = await database_1.db.getClient();
        try {
            await client.query('BEGIN');
            const fromBed = await client.query(`SELECT * FROM beds WHERE id = $1 AND facility_id = $2 AND is_active = true`, [data.fromBedId, data.facilityId]);
            if (fromBed.rows.length === 0) {
                throw new AppError_1.NotFoundError('Source bed not found');
            }
            const toBed = await client.query(`SELECT * FROM beds WHERE id = $1 AND facility_id = $2 AND is_active = true`, [data.toBedId, data.facilityId]);
            if (toBed.rows.length === 0) {
                throw new AppError_1.NotFoundError('Target bed not found');
            }
            if (fromBed.rows[0].status !== 'occupied') {
                throw new AppError_1.ConflictError('Source bed is not occupied');
            }
            if (toBed.rows[0].status !== 'available') {
                throw new AppError_1.ConflictError('Target bed is not available');
            }
            const admissionRes = await client.query(`SELECT admission_id FROM bed_assignments WHERE bed_id = $1 AND assigned_to IS NULL LIMIT 1`, [data.fromBedId]);
            const admissionId = data.admission_id || admissionRes.rows[0]?.admission_id;
            if (!admissionId) {
                throw new AppError_1.NotFoundError('No active admission found for source bed');
            }
            // Close current assignment on source bed
            await client.query(`UPDATE bed_assignments
         SET assigned_to = GREATEST(assigned_from + interval '1 millisecond', NOW())
         WHERE bed_id = $1 AND assigned_to IS NULL`, [data.fromBedId]);
            // Close any stale unclosed assignment on target bed
            await client.query(`UPDATE bed_assignments
         SET assigned_to = GREATEST(assigned_from + interval '1 millisecond', NOW())
         WHERE bed_id = $1 AND assigned_to IS NULL`, [data.toBedId]);
            // Insert new assignment with safe non-overlapping assigned_from
            const assignRes = await client.query(`WITH prev AS (
           SELECT COALESCE(MAX(assigned_to), NOW() - interval '1 second') AS max_to
           FROM bed_assignments
           WHERE bed_id = $2
         )
         INSERT INTO bed_assignments (admission_id, bed_id, assigned_from)
         SELECT $1, $2, GREATEST(NOW(), prev.max_to + interval '1 millisecond')
         FROM prev
         RETURNING *;`, [admissionId, data.toBedId]);
            await client.query(`UPDATE beds SET status = 'available', updated_at = NOW() WHERE id = $1`, [data.fromBedId]);
            const updatedBed = await client.query(`UPDATE beds SET status = 'occupied', updated_at = NOW() WHERE id = $1 RETURNING *;`, [data.toBedId]);
            await client.query('COMMIT');
            return updatedBed.rows[0];
        }
        catch (error) {
            try {
                await client.query('ROLLBACK');
            }
            catch (_) {
                // ignore rollback errors
            }
            throw error;
        }
        finally {
            client.release();
        }
    }
}
exports.BedRepository = BedRepository;
