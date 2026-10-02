import { describe, expect, it } from 'vitest';
import { createPatientSchema } from '../../src/modules/patient/patient.schema';

describe('Patient validation schema', () => {
  it('accepts a valid patient registration payload', () => {
    const result = createPatientSchema.safeParse({
      body: {
        facility_id: '11111111-1111-4111-8111-111111111111',
        first_name: 'Aarav',
        last_name: 'Sharma',
        gender: 'male',
        phone: '9876543210',
        email: 'aarav@example.com',
        city: 'Jaipur',
        state: 'Rajasthan',
      },
    });

    expect(result.success).toBe(true);
  });

  it('rejects invalid email or missing required fields', () => {
    const invalid = createPatientSchema.safeParse({
      body: {
        facility_id: '11111111-1111-4111-8111-111111111111',
        first_name: '',
        last_name: 'Sharma',
        gender: 'male',
        phone: '123',
        email: 'not-an-email',
      },
    });

    expect(invalid.success).toBe(false);
  });
});
