import { describe, expect, it } from 'vitest';
import { hasActiveIpdAdmission } from '../../src/modules/ipd/ipd.repository';

describe('IPD admission guard', () => {
  it('treats active statuses as duplicates', () => {
    expect(hasActiveIpdAdmission('admitted')).toBe(true);
    expect(hasActiveIpdAdmission('pending')).toBe(true);
    expect(hasActiveIpdAdmission('discharge_initiated')).toBe(true);
  });

  it('allows discharged and cancelled admissions to be re-admitted', () => {
    expect(hasActiveIpdAdmission('discharged')).toBe(false);
    expect(hasActiveIpdAdmission('cancelled')).toBe(false);
    expect(hasActiveIpdAdmission(undefined)).toBe(false);
  });
});
