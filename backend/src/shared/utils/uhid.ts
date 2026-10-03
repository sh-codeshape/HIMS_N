export const UHID_SERIAL_LENGTH = 4;

export interface ParsedUHID {
  month: number;
  yearSuffix: number; // e.g. 26 for 2026
  serial: number;
}

export function buildUHID(date: Date, serial: number): string {
  const month = date.getMonth() + 1;
  const yearSuffix = date.getFullYear() % 100;

  if (!Number.isInteger(serial) || serial < 1) {
    throw new RangeError('UHID serial must be a positive integer.');
  }

  const mmyy = `${String(month).padStart(2, '0')}${String(yearSuffix).padStart(2, '0')}`;
  return `UHID-${mmyy}-${String(serial).padStart(6, '0')}`;
}

export function nextUHIDSerial(currentSerial: number): number {
  if (!Number.isInteger(currentSerial) || currentSerial < 1) {
    throw new RangeError('Current UHID serial must be a positive integer.');
  }
  return currentSerial + 1;
}

export function parseUHID(value: string): ParsedUHID | null {
  const trimmed = value?.trim();
  if (!trimmed) return null;

  const match = /^(\d{2})(\d{2})-(\d{4})$/.exec(trimmed);
  if (!match) return null;

  const [, monthText, yearSuffixText, serialText] = match;
  const month = Number(monthText);
  const yearSuffix = Number(yearSuffixText);
  const serial = Number(serialText);

  if (!Number.isFinite(month) || !Number.isFinite(yearSuffix) || !Number.isFinite(serial)) return null;
  if (month < 1 || month > 12) return null;

  return {
    month,
    yearSuffix,
    serial,
  };
}

export function isValidUHID(value: string): boolean {
  return parseUHID(value) !== null;
}
