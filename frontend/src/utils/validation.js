/**
 * Reusable UI-level validation utilities for HIMS forms.
 *
 * Each validator returns { isValid: boolean, message: string | null }.
 * Use these for real-time inline validation in Input/Select components
 * and as a final guard before submitting forms.
 */

/* ─── Indian phone number helpers ─── */

// Strip everything except digits and a leading plus.
export const normalizePhone = (value = "") =>
  String(value).replace(/[^\d+]/g, "");

// 10-digit Indian mobile (starts with 6-9).
export const INDIAN_MOBILE_REGEX = /^[6-9]\d{9}$/;

// Allows optional +91 / 91 prefix followed by 10 digits.
export const FLEXIBLE_PHONE_REGEX = /^(\+?91|0)?[6-9]\d{9}$/;

/* ─── Validators ─── */

export const required = (value, fieldName = "This field") => {
  if (value === null || value === undefined)
    return { isValid: false, message: `${fieldName} is required.` };
  const trimmed = String(value).trim();
  if (trimmed === "")
    return { isValid: false, message: `${fieldName} is required.` };
  return { isValid: true, message: null };
};

export const phone = (value, { requiredField = true, country = "IN" } = {}) => {
  if (!value || String(value).trim() === "") {
    return requiredField
      ? { isValid: false, message: "Phone number is required." }
      : { isValid: true, message: null };
  }

  const digits = normalizePhone(value);

  if (country === "IN") {
    if (!INDIAN_MOBILE_REGEX.test(digits)) {
      return {
        isValid: false,
        message:
          "Enter a valid 10-digit Indian mobile number (e.g. 9876543210).",
      };
    }
    return { isValid: true, message: null };
  }

  if (!FLEXIBLE_PHONE_REGEX.test(digits)) {
    return { isValid: false, message: "Enter a valid phone number." };
  }
  return { isValid: true, message: null };
};

export const email = (value, { requiredField = false } = {}) => {
  if (!value || String(value).trim() === "") {
    return requiredField
      ? { isValid: false, message: "Email address is required." }
      : { isValid: true, message: null };
  }
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(String(value).trim())) {
    return { isValid: false, message: "Enter a valid email address." };
  }
  return { isValid: true, message: null };
};

export const pincode = (value, { requiredField = false } = {}) => {
  if (!value || String(value).trim() === "") {
    return requiredField
      ? { isValid: false, message: "Pincode is required." }
      : { isValid: true, message: null };
  }
  const digits = String(value).replace(/\D/g, "");
  if (!/^\d{6}$/.test(digits)) {
    return { isValid: false, message: "Enter a valid 6-digit pincode." };
  }
  return { isValid: true, message: null };
};

export const aadhaar = (value, { requiredField = false } = {}) => {
  if (!value || String(value).trim() === "") {
    return requiredField
      ? { isValid: false, message: "Aadhaar number is required." }
      : { isValid: true, message: null };
  }
  const digits = String(value).replace(/\D/g, "");
  if (!/^\d{12}$/.test(digits)) {
    return { isValid: false, message: "Aadhaar must be exactly 12 digits." };
  }
  return { isValid: true, message: null };
};

export const pan = (value, { requiredField = false } = {}) => {
  if (!value || String(value).trim() === "") {
    return requiredField
      ? { isValid: false, message: "PAN is required." }
      : { isValid: true, message: null };
  }
  const panRegex = /^[A-Z]{5}[0-9]{4}[A-Z]{1}$/;
  if (!panRegex.test(String(value).trim().toUpperCase())) {
    return { isValid: false, message: "Enter a valid PAN (e.g. ABCDE1234F)." };
  }
  return { isValid: true, message: null };
};

export const age = (
  value,
  { min = 0, max = 120, requiredField = true } = {},
) => {
  if (value === "" || value === null || value === undefined) {
    return requiredField
      ? { isValid: false, message: "Age is required." }
      : { isValid: true, message: null };
  }
  const num = Number(value);
  if (!Number.isInteger(num) || num < min || num > max) {
    return {
      isValid: false,
      message: `Age must be between ${min} and ${max}.`,
    };
  }
  return { isValid: true, message: null };
};

export const dateNotFuture = (
  value,
  { requiredField = true, fieldName = "Date" } = {},
) => {
  if (!value) {
    return requiredField
      ? { isValid: false, message: `${fieldName} is required.` }
      : { isValid: true, message: null };
  }
  const selected = new Date(value);
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  if (selected > today) {
    return { isValid: false, message: `${fieldName} cannot be in the future.` };
  }
  return { isValid: true, message: null };
};

export const minLength = (value, length, fieldName = "This field") => {
  if (!value || String(value).trim().length < length) {
    return {
      isValid: false,
      message: `${fieldName} must be at least ${length} characters.`,
    };
  }
  return { isValid: true, message: null };
};

/**
 * Run multiple validators against a single field, returning the first error.
 */
export const validateField = (value, validators) => {
  for (const validator of validators) {
    // Accept either a validator function (value) => {isValid, message}
    // or a pre-computed result object {isValid, message}.
    const result = typeof validator === "function" ? validator(value) : validator;
    if (!result.isValid) return result;
  }
  return { isValid: true, message: null };
};

/**
 * Run validation over an entire form object shaped as:
 * { fieldName: { value, validators: [...] } }
 * Returns { isValid: boolean, errors: { [field]: message } }
 */
export const validateForm = (fields) => {
  const errors = {};
  let isValid = true;
  Object.entries(fields).forEach(([key, field]) => {
    const result = validateField(field.value, field.validators || []);
    if (!result.isValid) {
      isValid = false;
      errors[key] = result.message;
    }
  });
  return { isValid, errors };
};
