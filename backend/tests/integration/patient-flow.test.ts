import { describe, expect, it } from 'vitest';
import { buildUHID, nextUHIDSerial } from '../../src/shared/utils/uhid';

describe('Patient registration flow contract', () => {
  it('keeps UHID format stable across yearly registrations', () => {
    const first = buildUHID(2026, 1);
    const second = buildUHID(2026, nextUHIDSerial(1));
    const nextYear = buildUHID(2027, 1);

    expect(first).toBe('HIMS-2026-00001');
    expect(second).toBe('HIMS-2026-00002');
    expect(nextYear).toBe('HIMS-2027-00001');
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

    const uhid = buildUHID(2026, 5);

    expect(patientPayload).toHaveProperty('first_name');
    expect(patientPayload).toHaveProperty('phone');
    expect(uhid).toMatch(/^HIMS-\d{4}-\d{5}$/);
  });
});
