import { db } from '../config/database';

export async function seedLabAndPharmacy() {
  const orgId = '00000000-0000-0000-0000-000000000000';
  const facilityId = '00000000-0000-0000-0000-000000000000';

  const client = await db.connect();
  try {
    await client.query('BEGIN');

    // Item Categories
    const catMedRes = await client.query(
      `INSERT INTO item_categories (organization_id, name) 
       VALUES ($1, 'Medicines')
       ON CONFLICT (organization_id, name) DO UPDATE SET name = EXCLUDED.name
       RETURNING id`,
       [orgId]
    );
    const catLabRes = await client.query(
      `INSERT INTO item_categories (organization_id, name) 
       VALUES ($1, 'Lab Consumables')
       ON CONFLICT (organization_id, name) DO UPDATE SET name = EXCLUDED.name
       RETURNING id`,
       [orgId]
    );
    const medCatId = catMedRes.rows[0]?.id || (await client.query(`SELECT id FROM item_categories WHERE name = 'Medicines'`)).rows[0].id;
    const labCatId = catLabRes.rows[0]?.id || (await client.query(`SELECT id FROM item_categories WHERE name = 'Lab Consumables'`)).rows[0].id;

    // Store
    const storeRes = await client.query(
      `INSERT INTO stores (organization_id, facility_id, code, name, store_type, is_dispensing_point)
       VALUES ($1, $2, 'PHARM-MAIN', 'Main Pharmacy', 'pharmacy', true)
       ON CONFLICT (facility_id, code) DO UPDATE SET name = EXCLUDED.name
       RETURNING id`,
       [orgId, facilityId]
    );
    const storeId = storeRes.rows[0]?.id || (await client.query(`SELECT id FROM stores WHERE facility_id = $1 AND code = 'PHARM-MAIN'`, [facilityId])).rows[0].id;

    // Items (Medicines)
    const medicines = [
      { code: 'MED-001', name: 'Paracetamol 500mg', generic: 'Paracetamol' },
      { code: 'MED-002', name: 'Amoxicillin 250mg', generic: 'Amoxicillin' },
      { code: 'MED-003', name: 'Omeprazole 20mg', generic: 'Omeprazole' },
      { code: 'MED-004', name: 'Metformin 500mg', generic: 'Metformin' },
      { code: 'MED-005', name: 'Atorvastatin 10mg', generic: 'Atorvastatin' },
      { code: 'MED-006', name: 'Cetirizine 10mg', generic: 'Cetirizine' }
    ];

    const itemIds = [];
    for (const med of medicines) {
      const itemRes = await client.query(
        `INSERT INTO items (organization_id, category_id, code, name, generic_name, item_type, base_uom)
         VALUES ($1, $2, $3, $4, $5, 'drug', 'tablet')
         ON CONFLICT (organization_id, code) DO UPDATE SET name = EXCLUDED.name
         RETURNING id`,
         [orgId, medCatId, med.code, med.name, med.generic]
      );
      itemIds.push(itemRes.rows[0]?.id || (await client.query(`SELECT id FROM items WHERE code = $1`, [med.code])).rows[0].id);
    }

    // Stock Batches
    const today = new Date();
    const soon = new Date(today); soon.setDate(soon.getDate() + 30);
    const later = new Date(today); later.setDate(later.getDate() + 365);
    
    for (let i = 0; i < itemIds.length; i++) {
      const itemId = itemIds[i];
      // Insert 2 batches for each
      await client.query(
        `INSERT INTO stock_batches (store_id, item_id, batch_no, expiry_date, quantity_on_hand, mrp, sale_rate)
         VALUES ($1, $2, $3, $4, $5, $6, $7)
         ON CONFLICT (store_id, item_id, batch_no) DO NOTHING`,
         [storeId, itemId, `B-LATER-\${i}`, later.toISOString(), 100, 50, 50]
      );
      // Expiring soon batch
      await client.query(
        `INSERT INTO stock_batches (store_id, item_id, batch_no, expiry_date, quantity_on_hand, mrp, sale_rate)
         VALUES ($1, $2, $3, $4, $5, $6, $7)
         ON CONFLICT (store_id, item_id, batch_no) DO NOTHING`,
         [storeId, itemId, `B-SOON-\${i}`, soon.toISOString(), 50, 45, 45]
      );
    }

    // Services (Lab Tests)
    const tests = [
      { code: 'LAB-CBC', name: 'CBC', section: 'Haematology' },
      { code: 'LAB-BS', name: 'Blood Sugar', section: 'Biochemistry' },
      { code: 'LAB-LIPID', name: 'Lipid Profile', section: 'Biochemistry' },
      { code: 'LAB-THYROID', name: 'Thyroid Profile', section: 'Biochemistry' },
      { code: 'LAB-URINE', name: 'Urine Routine', section: 'Microbiology' }
    ];

    for (const test of tests) {
      const serviceRes = await client.query(
        `INSERT INTO services (organization_id, department_id, code, name, service_type, base_price, is_active)
         VALUES ($1, NULL, $2, $3, 'lab_test', 500, true)
         ON CONFLICT (organization_id, code) DO UPDATE SET name = EXCLUDED.name
         RETURNING id`,
         [orgId, test.code, test.name]
      );
      const serviceId = serviceRes.rows[0]?.id || (await client.query(`SELECT id FROM services WHERE code = $1`, [test.code])).rows[0].id;

      await client.query(
        `INSERT INTO lab_test_definitions (service_id, lab_section)
         VALUES ($1, $2)
         ON CONFLICT (service_id) DO NOTHING`,
         [serviceId, test.section]
      );
    }

    await client.query('COMMIT');
    console.log('Seed for Lab & Pharmacy completed successfully.');
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('Error seeding lab/pharmacy:', error);
    throw error;
  } finally {
    client.release();
  }
}
seedLabAndPharmacy();
