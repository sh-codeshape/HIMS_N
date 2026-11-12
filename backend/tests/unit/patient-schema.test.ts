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

  it('accepts full registration payload with doctor, emergency contact, insurance and aadhaar with spaces', () => {
    const parsed = createPatientSchema.safeParse({
      body: {
        facility_id: '00000000-0000-0000-0000-000000000000',
        first_name: 'rudresh_x',
        gender: 'male',
        aadhaar_number: '8888 9999 0000',
        address_line1: 'jansa',
        age: '23',
        blood_group: 'A+',
        city: 'varanasi',
        country: 'IN',
        doctor: 'Dr. shyam',
        emergency_name: 'A.I. M.l.',
        emergency_phone: '7667676825',
        emergency_relation: 'Sibling',
        health_insurance: 'No',
        nationality: 'IN',
        phone: '8318768181',
        postal_code: '221405',
        state: 'Uttar Pradesh',
        visit_type: 'OPD',
      },
    });

    expect(parsed.success).toBe(true);
    if (parsed.success) {
      expect(parsed.data.body.doctor).toBe('Dr. shyam');
      expect(parsed.data.body.aadhaar_number).toBe('888899990000');
      expect(parsed.data.body.emergency_name).toBe('A.I. M.l.');
      expect(parsed.data.body.health_insurance).toBe('No');
    }
  });
});
