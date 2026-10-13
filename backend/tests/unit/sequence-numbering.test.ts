import { describe, it, expect } from 'vitest';
import { buildSequenceNumber } from '../../src/shared/utils/sequence';

describe('sequence numbering', () => {
  it('formats OPD encounter numbers with year and padding', () => {
    expect(buildSequenceNumber('OPD-', 1, { includeYear: true, padding: 4 })).toBe('OPD-26-0001');
  });

  it('formats invoice numbers without year when configured', () => {
    expect(buildSequenceNumber('INV-', 12, { includeYear: false, padding: 5 })).toBe('INV-00012');
  });

  it('keeps suffixes and works for admission numbers', () => {
    expect(buildSequenceNumber('ADM-', 7, { includeYear: true, padding: 4, suffix: '' })).toBe('ADM-26-0007');
  });
});
