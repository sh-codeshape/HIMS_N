import { describe, it, expect } from 'vitest';
import { deriveDateOfBirthFromAge, getPatientAge } from '../../src/modules/patient/patient.service';

describe('patient age contract', () => {
  it('derives date_of_birth from age when DOB is missing', () => {
    const dob = deriveDateOfBirthFromAge(32);
    expect(dob).toBeTruthy();
    expect(getPatientAge(dob)).toBe(32);
  });
});
