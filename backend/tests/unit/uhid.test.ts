import { describe, expect, it } from 'vitest';
import { buildUHID, isValidUHID, nextUHIDSerial, parseUHID } from '../../src/shared/utils/uhid';

describe('UHID utilities', () => {
  it('builds a valid annual UHID with padded serial', () => {
    expect(buildUHID(2026, 1)).toBe('HIMS-2026-00001');
    expect(buildUHID(2026, 42)).toBe('HIMS-2026-00042');
    expect(buildUHID(2026, 99999)).toBe('HIMS-2026-99999');
  });

  it('rejects invalid serials outside the supported range', () => {
    expect(() => buildUHID(2026, 0)).toThrow(RangeError);
    expect(() => buildUHID(2026, 100000)).toThrow(RangeError);
  });

  it('increments serials correctly', () => {
    expect(nextUHIDSerial(1)).toBe(2);
    expect(nextUHIDSerial(99999)).toBe(100000);
  });

  it('validates and parses UHID strings', () => {
    const uhid = 'HIMS-2026-00042';
    expect(isValidUHID(uhid)).toBe(true);
    expect(parseUHID(uhid)).toEqual({ prefix: 'HIMS', year: 2026, serial: 42 });
    expect(isValidUHID('MMYY-1234')).toBe(false);
  });
});
