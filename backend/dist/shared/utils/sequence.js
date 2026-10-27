"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.buildSequenceNumber = void 0;
const buildSequenceNumber = (prefix, value, options = {}) => {
    const includeYear = options.includeYear ?? false;
    const padding = Math.max(1, Number.isFinite(options.padding) ? Number(options.padding) : 4);
    const suffix = options.suffix ?? '';
    const normalizedValue = Number.isFinite(value) ? Math.max(0, Number(value)) : 0;
    const serial = String(normalizedValue).padStart(padding, '0');
    const yearToken = includeYear ? `${new Date().getFullYear() % 100}-` : '';
    return `${prefix}${yearToken}${serial}${suffix}`;
};
exports.buildSequenceNumber = buildSequenceNumber;
