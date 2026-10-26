import { db } from '../../config/database';
import { ConflictError, NotFoundError } from '../../shared/errors/AppError';

export class BedRepository {
  async getBeds(facilityId: string) {
    const query = `
      SELECT 
        b.*, 
        r.room_no as room_name, 
        w.name as ward_name, 
        w.ward_type as ward_type,
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
      WHERE b.facility_id = $1 AND b.is_active = true
      ORDER BY w.name, r.room_no, b.bed_no
    `;
    const result = await db.query(query, [facilityId]);
    return result.rows;
  }

  async getWards(facilityId: string) {
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
      JOIN bed_categories bc ON w.bed_category_id = bc.id
      WHERE w.facility_id = $1
      ORDER BY w.floor NULLS LAST, w.name
    `;
    const result = await db.query(query, [facilityId]);
    return result.rows;
  }

  async getRooms(facilityId: string) {
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
      WHERE w.facility_id = $1
      ORDER BY w.floor NULLS LAST, w.name, r.room_no
    `;
    const result = await db.query(query, [facilityId]);
    return result.rows;
  }

  async getBedById(bedId: string, facilityId: string) {
    const query = `
      SELECT b.*, r.room_no as room_name, w.name as ward_name, w.ward_type as ward_type, bc.name as category_name, bc.is_icu,
             srv.id as bed_charge_service_id, srv.code as bed_charge_service_code, srv.name as bed_charge_service_name,
             COALESCE(srv.default_rate, 0) as bed_charge_rate,
             b.features->>'inventory_item_id' as inventory_item_id
      FROM beds b
      LEFT JOIN rooms r ON b.room_id = r.id
      JOIN wards w ON b.ward_id = w.id
      LEFT JOIN bed_categories bc ON b.bed_category_id = bc.id
      LEFT JOIN services srv ON b.bed_charge_service_id = srv.id
      WHERE b.id = $1 AND b.facility_id = $2 AND b.is_active = true
      ORDER BY w.name, r.room_no, b.bed_no
    `;
    const result = await db.query(query, [bedId, facilityId]);
    return result.rows[0];
  }

  async getBedCategories(facilityId?: string) {
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
    const result = await db.query(query);
    const seen = new Set<string>();
    return result.rows.filter(r => {
      if (seen.has(r.id)) return false;
      seen.add(r.id);
      return true;
    });
  }

  async resolveBedChargeServiceId(bedCategoryId: string | null, organizationId?: string): Promise<string | null> {
    if (bedCategoryId) {
      // 1. Check tariff rates for this specific bed category
      const tariffRes = await db.query(
        `SELECT service_id FROM tariff_rates WHERE bed_category_id = $1 LIMIT 1;`,
        [bedCategoryId]
      );
      if (tariffRes.rows.length > 0 && tariffRes.rows[0].service_id) {
        return tariffRes.rows[0].service_id;
      }

      // 2. Try matching service code/name based on bed category code
      const catRes = await db.query(`SELECT code, name FROM bed_categories WHERE id = $1 LIMIT 1;`, [bedCategoryId]);
      if (catRes.rows.length > 0) {
        const catCode = catRes.rows[0].code;
        const catName = catRes.rows[0].name;
        const matchRes = await db.query(
          `SELECT id FROM services 
           WHERE service_type = 'bed' AND (code ILIKE $1 OR name ILIKE $2) 
           ORDER BY created_at ASC LIMIT 1;`,
          [`%${catCode}%`, `%${catName}%`]
        );
        if (matchRes.rows.length > 0) {
          return matchRes.rows[0].id;
        }
      }
    }

    // 3. Fallback to general bed charge service
    const defaultRes = await db.query(
      `SELECT id FROM services WHERE service_type = 'bed' AND code = 'BED-GEN-DAY' LIMIT 1;`
    );
    if (defaultRes.rows.length > 0) {
      return defaultRes.rows[0].id;
    }

    const anyBedRes = await db.query(
      `SELECT id FROM services WHERE service_type = 'bed' ORDER BY created_at ASC LIMIT 1;`
    );
    return anyBedRes.rows[0]?.id || null;
  }

  async syncBedToInventoryItem(bed: any, client: any = db): Promise<string | null> {
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

      const existRes = await client.query(
        `SELECT id FROM items WHERE organization_id = $1 AND code = $2 LIMIT 1;`,
        [orgId, itemCode]
      );

      let itemId: string;
      if (existRes.rows.length > 0) {
        itemId = existRes.rows[0].id;
        await client.query(
          `UPDATE items
           SET name = $2,
               service_id = COALESCE($3, service_id),
               is_active = $4,
               custom_fields = $5,
               updated_at = NOW()
           WHERE id = $1;`,
          [itemId, itemName, bed.bed_charge_service_id || null, bed.is_active ?? true, JSON.stringify(customFields)]
        );
      } else {
        const insertRes = await client.query(
          `INSERT INTO items (
             organization_id, code, name, generic_name, item_type,
             service_id, base_uom, pack_size, track_batches, track_expiry,
             is_active, custom_fields, created_at, updated_at
           ) VALUES (
             $1, $2, $3, 'IPD Hospital Bed Asset', 'equipment',
             $4, 'unit', 1, false, false,
             $5, $6, NOW(), NOW()
           ) RETURNING id;`,
          [orgId, itemCode, itemName, bed.bed_charge_service_id || null, bed.is_active ?? true, JSON.stringify(customFields)]
        );
        itemId = insertRes.rows[0].id;
      }

      // Update features with linked inventory item id
      const currentFeatures = typeof bed.features === 'object' && bed.features !== null ? bed.features : {};
      if (currentFeatures.inventory_item_id !== itemId) {
        const features = { ...currentFeatures, inventory_item_id: itemId };
        await client.query(
          `UPDATE beds SET features = $2 WHERE id = $1;`,
          [bed.id, JSON.stringify(features)]
        );
      }

      return itemId;
    } catch (err) {
      console.error('Error syncing bed to inventory item:', err);
      return null;
    }
  }

  async syncAllBedsToInventory(facilityId: string): Promise<{ synced: number; total: number }> {
    const beds = await db.query(
      `SELECT * FROM beds WHERE facility_id = $1 AND is_active = true;`,
      [facilityId]
    );
    let count = 0;
    for (const bed of beds.rows) {
      let chargeServiceId = bed.bed_charge_service_id;
      if (!chargeServiceId) {
        chargeServiceId = await this.resolveBedChargeServiceId(bed.bed_category_id, bed.organization_id);
        if (chargeServiceId) {
          await db.query(`UPDATE beds SET bed_charge_service_id = $1 WHERE id = $2;`, [chargeServiceId, bed.id]);
          bed.bed_charge_service_id = chargeServiceId;
        }
      }
      await this.syncBedToInventoryItem(bed);
      count++;
    }
    return { synced: count, total: beds.rows.length };
  }

  async createBed(data: any) {
    // Resolve (or auto-create) the ward when only ward reference details are provided
    let wardId = data.ward_id || null;

    const orgId = data.organization_id || '00000000-0000-0000-0000-000000000000';

    if (!wardId) {
      const wardQuery = `
        SELECT id FROM wards
        WHERE facility_id = $1 AND code = $2 AND is_active = true
        LIMIT 1;
      `;
      const wardRes = await db.query(wardQuery, [data.facility_id, data.ward_code]);
      if (wardRes.rows.length > 0) {
        wardId = wardRes.rows[0].id;
      } else {
        const wardInsert = await db.query(
          `INSERT INTO wards (
            organization_id, facility_id, code, name, ward_type, gender_policy, floor, is_active, created_at, updated_at, created_by, updated_by
          ) VALUES ($1, $2, $3, $4, $5, $6, $7, true, NOW(), NOW(), $8, $9) RETURNING *;`,
          [
            orgId,
            data.facility_id,
            data.ward_code,
            data.ward_name || data.ward_code,
            data.ward_type || 'general',
            data.gender_policy || 'any',
            data.floor || null,
            data.created_by || null,
            data.updated_by || null,
          ]
        );
        wardId = wardInsert.rows[0].id;
      }
    }

    // Resolve (or auto-create) the room when room details are provided without an existing room
    let roomId = data.room_id || null;
    if (!roomId && data.room_no) {
      const roomQuery = `SELECT id FROM rooms WHERE ward_id = $1 AND room_no = $2 LIMIT 1;`;
      const roomRes = await db.query(roomQuery, [wardId, data.room_no]);
      if (roomRes.rows.length > 0) {
        roomId = roomRes.rows[0].id;
      } else {
        const roomInsert = await db.query(
          `INSERT INTO rooms (ward_id, room_no, room_type, is_active) VALUES ($1, $2, $3, true) RETURNING *;`,
          [wardId, data.room_no, data.room_type || 'general']
        );
        roomId = roomInsert.rows[0].id;
      }
    }

    const exists = await db.query(
      `SELECT id FROM beds WHERE facility_id = $1 AND ward_id = $2 AND bed_no = $3 AND is_active = true`,
      [data.facility_id, wardId, data.bed_no]
    );
    if (exists.rows.length > 0) {
      throw new ConflictError(`Bed number '${data.bed_no}' already exists in the specified ward`);
    }

    let bedChargeServiceId = data.bed_charge_service_id || null;
    if (!bedChargeServiceId) {
      bedChargeServiceId = await this.resolveBedChargeServiceId(data.bed_category_id, data.organization_id);
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
    const result = await db.query(query, [
      orgId,
      data.facility_id,
      wardId,
      roomId,
      data.bed_category_id || null,
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

  async updateBed(bedId: string, data: any, facilityId: string) {
    let bedChargeServiceId = data.bed_charge_service_id;
    if (bedChargeServiceId === undefined && data.bed_category_id) {
      bedChargeServiceId = await this.resolveBedChargeServiceId(data.bed_category_id, data.organization_id);
    }

    const query = `
      UPDATE beds
      SET ward_id = $2, room_id = $3, bed_category_id = $4,
          bed_charge_service_id = COALESCE($5, bed_charge_service_id),
          bed_no = $6, status = $7, features = $8, is_active = $9, updated_at = NOW(), updated_by = $10
      WHERE id = $1 AND facility_id = $11
      RETURNING *;
    `;
    const result = await db.query(query, [
      bedId,
      data.ward_id ?? null,
      data.room_id ?? null,
      data.bed_category_id ?? null,
      bedChargeServiceId ?? null,
      data.bed_no,
      data.status || 'available',
      data.features || {},
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

  async softDeleteBed(bedId: string, facilityId: string) {
    const query = `
      UPDATE beds
      SET is_active = false, updated_at = NOW()
      WHERE id = $1 AND facility_id = $2
      RETURNING *;
    `;
    const result = await db.query(query, [bedId, facilityId]);
    const deletedBed = result.rows[0];
    if (deletedBed) {
      await this.syncBedToInventoryItem(deletedBed);
    }
    return deletedBed;
  }

  async updateBedStatus(bedId: string, status: string, facilityId: string) {
    const query = `
      UPDATE beds
      SET status = $1, updated_at = NOW()
      WHERE id = $2 AND facility_id = $3
      RETURNING *;
    `;
    const result = await db.query(query, [status, bedId, facilityId]);
    return result.rows[0];
  }

  async transferBed(data: any) {
    const client = await db.getClient();
    try {
      await client.query('BEGIN');

      const fromBed = await client.query(
        `SELECT * FROM beds WHERE id = $1 AND facility_id = $2 AND is_active = true`,
        [data.fromBedId, data.facilityId]
      );
      if (fromBed.rows.length === 0) {
        throw new NotFoundError('Source bed not found');
      }

      const toBed = await client.query(
        `SELECT * FROM beds WHERE id = $1 AND facility_id = $2 AND is_active = true`,
        [data.toBedId, data.facilityId]
      );
      if (toBed.rows.length === 0) {
        throw new NotFoundError('Target bed not found');
      }

      if (fromBed.rows[0].status !== 'occupied') {
        throw new ConflictError('Source bed is not occupied');
      }
      if (toBed.rows[0].status !== 'available') {
        throw new ConflictError('Target bed is not available');
      }

      const admissionRes = await client.query(
        `SELECT admission_id FROM bed_assignments WHERE bed_id = $1 AND assigned_to IS NULL LIMIT 1`,
        [data.fromBedId]
      );
      const admissionId = data.admission_id || admissionRes.rows[0]?.admission_id;
      if (!admissionId) {
        throw new NotFoundError('No active admission found for source bed');
      }

      // Close current assignment on source bed, open new one on target bed
      await client.query(
        `UPDATE bed_assignments SET assigned_to = NOW() WHERE bed_id = $1 AND assigned_to IS NULL`,
        [data.fromBedId]
      );

      const assignRes = await client.query(
        `INSERT INTO bed_assignments (admission_id, bed_id, assigned_from) VALUES ($1, $2, NOW()) RETURNING *;`,
        [admissionId, data.toBedId]
      );

      await client.query(
        `UPDATE beds SET status = 'available', updated_at = NOW() WHERE id = $1`,
        [data.fromBedId]
      );

      const updatedBed = await client.query(
        `UPDATE beds SET status = 'occupied', updated_at = NOW() WHERE id = $1 RETURNING *;`,
        [data.toBedId]
      );

      await client.query('COMMIT');
      return updatedBed.rows[0];
    } catch (error) {
      try {
        await client.query('ROLLBACK');
      } catch (_) {
        // ignore rollback errors
      }
      throw error;
    } finally {
      client.release();
    }
  }
}
