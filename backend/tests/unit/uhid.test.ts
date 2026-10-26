import { describe, expect, it } from 'vitest';
import { buildUHID, isValidUHID, nextUHIDSerial, parseUHID } from '../../src/shared/utils/uhid';

describe('UHID utilities', () => {
  it('builds a valid annual UHID with padded serial', () => {
    expect(buildUHID(2026, 1, 10)).toBe('1026-0001');
    expect(buildUHID(2026, 42, 10)).toBe('1026-0042');
    expect(buildUHID(2026, 9999, 10)).toBe('1026-9999');
  });

  it('rejects invalid serials outside the supported range', () => {
    expect(() => buildUHID(2026, 0)).toThrow(RangeError);
    expect(() => buildUHID(2026, -1)).toThrow(RangeError);
  });

  it('increments serials correctly', () => {
    expect(nextUHIDSerial(1)).toBe(2);
    expect(nextUHIDSerial(9999)).toBe(10000);
  });

  it('validates and parses UHID strings', () => {
    const uhid = '1026-0042';
    expect(isValidUHID(uhid)).toBe(true);
    expect(parseUHID(uhid)).toEqual({ month: 10, yearSuffix: 26, serial: 42 });
    expect(isValidUHID('INVALID-UHID')).toBe(false);
  });
});
