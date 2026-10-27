import { describe, expect, it } from 'vitest';
import { BED_STATUSES, createBedSchema, createWardSchema, createRoomSchema } from '../../src/modules/bed/bed.schema';

describe('Bed Master, Inventory Asset & Billing Contracts', () => {
  it('validates supported bed statuses', () => {
    expect(BED_STATUSES).toContain('available');
    expect(BED_STATUSES).toContain('occupied');
    expect(BED_STATUSES).toContain('cleaning');
    expect(BED_STATUSES).toContain('maintenance');
    expect(BED_STATUSES).toContain('blocked');
    expect(BED_STATUSES).toContain('reserved');
  });

  it('parses and normalizes create bed payloads with empty strings and titlecase statuses', () => {
    const parsed = createBedSchema.parse({
      body: {
        facility_id: '00000000-0000-0000-0000-000000000000',
        ward_code: 'GW-108',
        ward_name: 'General Ward - Second Shift',
        ward_type: 'general',
        floor: 'Ground Floor',
        gender_policy: 'any',
        bed_category_id: '',
        room_id: '',
        room_no: '',
        bed_no: 'GW-101-05',
        status: 'Available',
        features: { oxygen: false, monitor: false, ventilator: false },
      },
    });

    expect(parsed.body.bed_no).toBe('GW-101-05');
    expect(parsed.body.status).toBe('available');
    expect(parsed.body.bed_category_id).toBeNull();
    expect(parsed.body.room_id).toBeNull();
    expect(parsed.body.features).toEqual({ oxygen: false, monitor: false, ventilator: false });
  });

  it('formats inventory equipment asset codes properly from bed numbers', () => {
    const formatAssetCode = (bedNo: string) => `EQ-BED-${String(bedNo || '').replace(/\s+/g, '-').toUpperCase()}`;
    expect(formatAssetCode('ICU-01')).toBe('EQ-BED-ICU-01');
    expect(formatAssetCode('GW 101 B1')).toBe('EQ-BED-GW-101-B1');
    expect(formatAssetCode('PVT-302')).toBe('EQ-BED-PVT-302');
  });

  it('calculates bed stay days and charges accurately with minimum 1 day rule', () => {
    const calculateBedCharge = (from: Date, to: Date | null, dailyRate: number) => {
      const end = to || new Date();
      const diffMs = Math.max(0, end.getTime() - from.getTime());
      const days = Math.max(1, Math.ceil(diffMs / (1000 * 60 * 60 * 24)));
      return {
        days,
        dailyRate,
        totalCharge: days * dailyRate,
      };
    };

    // Same day stay (minimum 1 day applied)
    const now = new Date('2026-10-25T10:00:00Z');
    const sameDay = new Date('2026-10-25T14:00:00Z');
    const res1 = calculateBedCharge(now, sameDay, 1500);
    expect(res1.days).toBe(1);
    expect(res1.totalCharge).toBe(1500);

    // 3 days stay in ICU (5000/day)
    const threeDaysLater = new Date('2026-10-28T10:00:00Z');
    const res2 = calculateBedCharge(now, threeDaysLater, 5000);
    expect(res2.days).toBe(3);
    expect(res2.totalCharge).toBe(15000);

    // 5 days stay in Private Suite (3000/day)
    const fiveDaysLater = new Date('2026-10-30T10:00:00Z');
    const res3 = calculateBedCharge(now, fiveDaysLater, 3000);
    expect(res3.days).toBe(5);
    expect(res3.totalCharge).toBe(15000);
  });

  it('validates standalone ward creation payloads with defaults', () => {
    const parsed = createWardSchema.parse({
      body: {
        facility_id: '00000000-0000-0000-0000-000000000000',
        code: 'GW-201',
        name: 'General Ward - Third Shift',
        ward_type: 'general',
        gender_policy: 'any',
        floor: '4th Floor',
        bed_category_id: '',
      },
    });

    expect(parsed.body.code).toBe('GW-201');
    expect(parsed.body.name).toBe('General Ward - Third Shift');
    expect(parsed.body.ward_type).toBe('general');
    expect(parsed.body.gender_policy).toBe('any');
    expect(parsed.body.floor).toBe('4th Floor');
    expect(parsed.body.bed_category_id).toBeNull();
  });

  it('validates standalone room creation payloads with defaults', () => {
    const parsed = createRoomSchema.parse({
      body: {
        ward_id: '11111111-1111-4111-8111-111111111111',
        room_no: 'GW-201-01',
        room_type: '',
        is_active: true,
      },
    });

    expect(parsed.body.ward_id).toBe('11111111-1111-4111-8111-111111111111');
    expect(parsed.body.room_no).toBe('GW-201-01');
    expect(parsed.body.room_type).toBe('general');
    expect(parsed.body.is_active).toBe(true);
  });
});
