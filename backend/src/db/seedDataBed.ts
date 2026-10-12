// Bed allotment seed data aligned with the bed_assignments migration schema.
// Required fields: id, admission_id, bed_id, billing_bed_category_id,
// assigned_from, assigned_to, reason, assigned_by.

export interface BedAllotmentSeedRecord {
  id: string;
  admission_id: string;
  bed_id: string;
  billing_bed_category_id: string | null;
  assigned_from: string;
  assigned_to: string | null;
  reason: string;
  assigned_by: string | null;
}

export const BED_ALLOTMENT_SEED_DATA: BedAllotmentSeedRecord[] = [
  {
    id: '11111111-1111-4111-8111-111111111111',
    admission_id: 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa',
    bed_id: 'bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb',
    billing_bed_category_id: 'cccccccc-cccc-4ccc-8ccc-cccccccccccc',
    assigned_from: '2026-10-01T09:15:00+05:30',
    assigned_to: null,
    reason: 'Acute appendicitis observation and surgical monitoring',
    assigned_by: 'dddddddd-dddd-4ddd-8ddd-dddddddddddd',
  },
  {
    id: '22222222-2222-4222-8222-222222222222',
    admission_id: 'eeeeeeee-eeee-4eee-8eee-eeeeeeeeeeee',
    bed_id: 'ffffffff-ffff-4fff-8fff-ffffffffffff',
    billing_bed_category_id: 'cccccccc-cccc-4ccc-8ccc-cccccccccccc',
    assigned_from: '2026-10-02T11:30:00+05:30',
    assigned_to: null,
    reason: 'COPD exacerbation with moderate respiratory distress',
    assigned_by: 'dddddddd-dddd-4ddd-8ddd-dddddddddddd',
  },
  {
    id: '33333333-3333-4333-8333-333333333333',
    admission_id: '12121212-1212-4121-8121-121212121212',
    bed_id: '13131313-1313-4131-8131-131313131313',
    billing_bed_category_id: '14141414-1414-4141-8141-141414141414',
    assigned_from: '2026-10-03T08:45:00+05:30',
    assigned_to: null,
    reason: 'Female general ward assignment for dengue monitoring',
    assigned_by: 'dddddddd-dddd-4ddd-8ddd-dddddddddddd',
  },
  {
    id: '44444444-4444-4444-8444-444444444444',
    admission_id: '15151515-1515-4151-8151-151515151515',
    bed_id: '16161616-1616-4161-8161-161616161616',
    billing_bed_category_id: '17171717-1717-4171-8171-171717171717',
    assigned_from: '2026-10-04T14:00:00+05:30',
    assigned_to: null,
    reason: 'Private deluxe bed assigned for post-op recovery',
    assigned_by: 'dddddddd-dddd-4ddd-8ddd-dddddddddddd',
  },
  {
    id: '55555555-5555-4555-8555-555555555555',
    admission_id: '18181818-1818-4181-8181-181818181818',
    bed_id: '19191919-1919-4191-8191-191919191919',
    billing_bed_category_id: '1a1a1a1a-1a1a-41a1-81a1-1a1a1a1a1a1a',
    assigned_from: '2026-10-05T06:40:00+05:30',
    assigned_to: null,
    reason: 'ICU monitoring for severe respiratory failure',
    assigned_by: 'dddddddd-dddd-4ddd-8ddd-dddddddddddd',
  },
  {
    id: '66666666-6666-4666-8666-666666666666',
    admission_id: '1b1b1b1b-1b1b-41b1-81b1-1b1b1b1b1b1b',
    bed_id: '1c1c1c1c-1c1c-41c1-81c1-1c1c1c1c1c1c',
    billing_bed_category_id: '1d1d1d1d-1d1d-41d1-81d1-1d1d1d1d1d1d',
    assigned_from: '2026-10-06T19:10:00+05:30',
    assigned_to: '2026-10-08T10:30:00+05:30',
    reason: 'Emergency trauma observation and stabilization before discharge',
    assigned_by: 'dddddddd-dddd-4ddd-8ddd-dddddddddddd',
  },
  {
    id: '77777777-7777-4777-8777-777777777777',
    admission_id: '1e1e1e1e-1e1e-41e1-81e1-1e1e1e1e1e1e',
    bed_id: '1f1f1f1f-1f1f-41f1-81f1-1f1f1f1f1f1f',
    billing_bed_category_id: null,
    assigned_from: '2026-10-07T12:00:00+05:30',
    assigned_to: '2026-10-08T08:45:00+05:30',
    reason: 'Short stay bed allotment for post-discharge review after stable recovery',
    assigned_by: 'dddddddd-dddd-4ddd-8ddd-dddddddddddd',
  },
  {
    id: '88888888-8888-4888-8888-888888888888',
    admission_id: '20202020-2020-4202-8202-202020202020',
    bed_id: '21212121-2121-4212-8212-212121212121',
    billing_bed_category_id: '14141414-1414-4141-8141-141414141414',
    assigned_from: '2026-10-09T13:20:00+05:30',
    assigned_to: null,
    reason: 'Post-laparoscopy recovery in semi-private room',
    assigned_by: 'dddddddd-dddd-4ddd-8ddd-dddddddddddd',
  },
];

export default BED_ALLOTMENT_SEED_DATA;
