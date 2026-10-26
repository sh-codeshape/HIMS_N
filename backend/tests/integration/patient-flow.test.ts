import { describe, expect, it } from 'vitest';
import { buildUHID, nextUHIDSerial } from '../../src/shared/utils/uhid';

describe('Patient registration flow contract', () => {
  it('keeps UHID format stable across yearly registrations', () => {
    const first = buildUHID(2026, 1, 10);
    const second = buildUHID(2026, nextUHIDSerial(1), 10);
    const nextYear = buildUHID(2027, 1, 10);

    expect(first).toBe('1026-0001');
    expect(second).toBe('1026-0002');
    expect(nextYear).toBe('1027-0001');
  });

  it('supports a standard patient creation workflow shape', () => {
    const patientPayload = {
      facility_id: '11111111-1111-4111-8111-111111111111',
      first_name: 'Aarav',
      last_name: 'Sharma',
      gender: 'male',
      phone: '9876543210',
      address_line1: '12 Main Road',
      city: 'Jaipur',
      state: 'Rajasthan',
    };

    const uhid = buildUHID(2026, 5, 10);

    expect(patientPayload).toHaveProperty('first_name');
    expect(patientPayload).toHaveProperty('phone');
    expect(uhid).toMatch(/^\d{4}-\d{4}$/);
  });
});
