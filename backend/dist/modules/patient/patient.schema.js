"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.searchPatientSchema = exports.getPatientSchema = exports.updatePatientSchema = exports.createPatientSchema = void 0;
const zod_1 = require("zod");
exports.createPatientSchema = zod_1.z.object({
    body: zod_1.z.object({
        facility_id: zod_1.z.string().uuid(),
        first_name: zod_1.z.string().min(1),
        middle_name: zod_1.z.string().optional(),
        last_name: zod_1.z.string().optional(),
        gender: zod_1.z.enum(['male', 'female', 'other', 'unknown']),
        date_of_birth: zod_1.z.string().optional(),
        age: zod_1.z.string().or(zod_1.z.number()).optional(),
        blood_group: zod_1.z.string().optional(),
        marital_status: zod_1.z.string().optional(),
        occupation: zod_1.z.string().optional(),
        nationality: zod_1.z.string().optional(),
        phone: zod_1.z.string().regex(/^\d{10}$/, "Phone number must be exactly 10 digits").optional().or(zod_1.z.literal('')),
        alternate_phone: zod_1.z.string().optional(),
        email: zod_1.z.string().email().optional(),
        landline: zod_1.z.string().optional(),
        address_line1: zod_1.z.string().optional(),
        city: zod_1.z.string().optional(),
        state: zod_1.z.string().optional(),
        postal_code: zod_1.z.string().optional(),
        country: zod_1.z.string().optional(),
        aadhaar_number: zod_1.z.string().regex(/^\d{12}$/, "Aadhaar number must be exactly 12 digits").optional().or(zod_1.z.literal('')),
        pan_number: zod_1.z.string().optional(),
        emergency_name: zod_1.z.string().optional(),
        emergency_phone: zod_1.z.string().optional(),
        emergency_relation: zod_1.z.string().optional(),
        referred_by: zod_1.z.string().optional(),
        department: zod_1.z.string().optional(),
        visit_type: zod_1.z.string().optional(),
        payment_type: zod_1.z.string().optional(),
        health_insurance: zod_1.z.boolean().or(zod_1.z.string()).optional(),
        insurance_provider: zod_1.z.string().optional(),
        insurance_number: zod_1.z.string().optional(),
        family_head_id: zod_1.z.string().uuid().optional(),
        relation_to_head: zod_1.z.string().optional()
    }),
});
exports.updatePatientSchema = zod_1.z.object({
    params: zod_1.z.object({
        id: zod_1.z.string().uuid(),
    }),
    body: zod_1.z.object({
        first_name: zod_1.z.string().min(1).optional(),
        middle_name: zod_1.z.string().optional(),
        last_name: zod_1.z.string().optional(),
        gender: zod_1.z.preprocess((val) => typeof val === 'string' ? val.trim().toLowerCase() : val, zod_1.z.enum(['male', 'female', 'other', 'unknown']).optional()),
        date_of_birth: zod_1.z.string().optional(),
        phone: zod_1.z.string().regex(/^\d{10}$/, "Phone number must be exactly 10 digits").optional(),
        email: zod_1.z.string().email().optional(),
        address_line1: zod_1.z.string().optional(),
        address: zod_1.z.string().optional(),
        city: zod_1.z.string().optional(),
        state: zod_1.z.string().optional(),
        postal_code: zod_1.z.string().optional(),
        country: zod_1.z.string().optional(),
        blood_group: zod_1.z.string().optional(),
        age: zod_1.z.string().or(zod_1.z.number()).optional(),
        custom_fields: zod_1.z.any().optional(),
        status: zod_1.z.enum(['active', 'inactive', 'merged', 'deceased']).optional(),
    }),
});
exports.getPatientSchema = zod_1.z.object({
    params: zod_1.z.object({
        id: zod_1.z.string().uuid(),
    }),
});
exports.searchPatientSchema = zod_1.z.object({
    query: zod_1.z.object({
        query: zod_1.z.string().min(1).optional(),
        phone: zod_1.z.string().optional(),
        uhid: zod_1.z.string().optional(),
        page: zod_1.z.string().regex(/^\d+$/).optional(),
        limit: zod_1.z.string().regex(/^\d+$/).optional(),
    }),
});
