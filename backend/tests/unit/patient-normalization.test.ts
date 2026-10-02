import { describe, it, expect } from 'vitest';
import { normalizePatientRequest, normalizeCountryCode, normalizeGender } from '../../src/modules/patient/patient.service';

describe('patient normalization', () => {
  it('normalizes full country names and gender values to DB-safe values', () => {
    const payload = normalizePatientRequest({
      facility_id: '11111111-1111-1111-1111-111111111111',
      first_name: 'Asha',
      gender: 'Male',
      phone: '9876543210',
      nationality: 'India',
      country: 'United States',
      state: 'Maharashtra',
      city: 'Mumbai',
    });

    expect(payload.gender).toBe('male');
    expect(payload.nationality).toBe('IN');
    expect(payload.country).toBe('US');
    expect(payload.state).toBe('Maharashtra');
  });

  it('maps common values and preserves valid ISO codes', () => {
    expect(normalizeCountryCode('IN')).toBe('IN');
    expect(normalizeCountryCode('india')).toBe('IN');
    expect(normalizeCountryCode('United Kingdom')).toBe('GB');
    expect(normalizeCountryCode('')).toBeUndefined();
    expect(normalizeGender('F')).toBe('female');
    expect(normalizeGender('Unknown')).toBe('unknown');
  });
});
