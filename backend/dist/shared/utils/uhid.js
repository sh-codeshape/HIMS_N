"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.UHID_SERIAL_LENGTH = void 0;
exports.buildUHID = buildUHID;
exports.nextUHIDSerial = nextUHIDSerial;
exports.parseUHID = parseUHID;
exports.isValidUHID = isValidUHID;
exports.UHID_SERIAL_LENGTH = 4;
function buildUHID(dateOrYear, serial, monthInput) {
    let month;
    let yearSuffix;
    if (typeof dateOrYear === 'number') {
        yearSuffix = dateOrYear % 100;
        month = monthInput || 1;
    }
    else {
        month = dateOrYear.getMonth() + 1;
        yearSuffix = dateOrYear.getFullYear() % 100;
    }
    if (!Number.isInteger(serial) || serial < 1) {
        throw new RangeError('UHID serial must be a positive integer.');
    }
    const mmyy = `${String(month).padStart(2, '0')}${String(yearSuffix).padStart(2, '0')}`;
    return `${mmyy}-${String(serial).padStart(4, '0')}`;
}
function nextUHIDSerial(currentSerial) {
    if (!Number.isInteger(currentSerial) || currentSerial < 1) {
        throw new RangeError('Current UHID serial must be a positive integer.');
    }
    return currentSerial + 1;
}
function parseUHID(value) {
    const trimmed = value?.trim();
    if (!trimmed)
        return null;
    const match = /^(\d{4})-(\d{4})$/.exec(trimmed);
    if (!match)
        return null;
    const mmyyText = match[1];
    const monthText = mmyyText.substring(0, 2);
    const yearSuffixText = mmyyText.substring(2, 4);
    const serialText = match[2];
    const month = Number(monthText);
    const yearSuffix = Number(yearSuffixText);
    const serial = Number(serialText);
    if (!Number.isFinite(month) || !Number.isFinite(yearSuffix) || !Number.isFinite(serial))
        return null;
    if (month < 1 || month > 12)
        return null;
    return {
        month,
        yearSuffix,
        serial,
    };
}
function isValidUHID(value) {
    return parseUHID(value) !== null;
}
