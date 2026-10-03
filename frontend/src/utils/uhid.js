export const UHID_SERIAL_LENGTH = 4;

export const buildUHID = (
  date = new Date(),
  serial = 1
) => {
  const month = date.getMonth() + 1;
  const yearSuffix = date.getFullYear() % 100;

  if (!Number.isInteger(serial) || serial < 1 || serial > 9999) {
    throw new RangeError("UHID serial must be an integer between 1 and 9999.");
  }

  const mmyy = `${String(month).padStart(2, '0')}${String(yearSuffix).padStart(2, '0')}`;
  return `${mmyy}-${String(serial).padStart(UHID_SERIAL_LENGTH, "0")}`;
};

export const nextUHIDSerial = (currentSerial = 0) => {
  if (!Number.isInteger(currentSerial) || currentSerial < 0) {
    throw new RangeError("Current UHID serial must be a non-negative integer.");
  }
  return currentSerial + 1;
};
