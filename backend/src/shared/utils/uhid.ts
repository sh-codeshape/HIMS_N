export const UHID_PREFIX = 'HIMS';
export const UHID_SERIAL_LENGTH = 5;

export interface ParsedUHID {
  prefix: string;
  year: number;
  serial: number;
}

export function buildUHID(year: number, serial: number, prefix = UHID_PREFIX): string {
  if (!Number.isInteger(year) || year < 2000 || year > 9999) {
    throw new RangeError('UHID year must be an integer between 2000 and 9999.');
  }

  if (!Number.isInteger(serial) || serial < 1 || serial > 99999) {
    throw new RangeError('UHID serial must be an integer between 1 and 99999.');
  }

  return `${prefix}-${year}-${String(serial).padStart(UHID_SERIAL_LENGTH, '0')}`;
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

  const match = /^([A-Z]+)-(\d{4})-(\d{5})$/i.exec(trimmed);
  if (!match) return null;

  const [, prefix, yearText, serialText] = match;
  const year = Number(yearText);
  const serial = Number(serialText);

  if (!Number.isFinite(year) || !Number.isFinite(serial)) return null;

  return {
    prefix: prefix.toUpperCase(),
    year,
    serial,
  };
}

export function isValidUHID(value: string): boolean {
  return parseUHID(value) !== null;
}
