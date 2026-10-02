export const UHID_PREFIX = "HIMS";
export const UHID_SERIAL_LENGTH = 5;

export const buildUHID = (
  year = new Date().getFullYear(),
  serial = 1,
  prefix = UHID_PREFIX,
) => {
  if (!Number.isInteger(year) || year < 2000 || year > 9999) {
    throw new RangeError("UHID year must be an integer between 2000 and 9999.");
  }

  if (!Number.isInteger(serial) || serial < 1 || serial > 99999) {
    throw new RangeError("UHID serial must be an integer between 1 and 99999.");
  }

  return `${prefix}-${year}-${String(serial).padStart(UHID_SERIAL_LENGTH, "0")}`;
};

export const nextUHIDSerial = (currentSerial = 0) => {
  if (!Number.isInteger(currentSerial) || currentSerial < 0) {
    throw new RangeError("Current UHID serial must be a non-negative integer.");
  }
  return currentSerial + 1;
};
