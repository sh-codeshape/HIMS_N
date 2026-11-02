"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.postBedChargesSchema = exports.createInvoiceSchema = void 0;
const zod_1 = require("zod");
exports.createInvoiceSchema = zod_1.z.object({
    body: zod_1.z.object({
        facility_id: zod_1.z.string().uuid().optional(),
        patient_id: zod_1.z.string().uuid(),
        encounter_id: zod_1.z.string().uuid().optional().nullable(),
        invoice_type: zod_1.z.enum(['opd', 'ipd_interim', 'ipd_final', 'pharmacy', 'diagnostics', 'package', 'misc']).default('opd'),
        discount_total: zod_1.z.number().min(0).default(0),
        discount_reason_id: zod_1.z.string().uuid().optional().nullable(),
        discount_approved_by: zod_1.z.string().uuid().optional().nullable(),
        discount_percent: zod_1.z.number().min(0).max(100).optional().nullable(),
        discount_reference: zod_1.z.string().optional().nullable(),
        referral_source: zod_1.z.string().optional().nullable(),
        referred_by: zod_1.z.string().optional().nullable(),
        notes: zod_1.z.string().optional().nullable(),
        payment_mode: zod_1.z.string().optional(),
        items: zod_1.z.array(zod_1.z.object({
            name: zod_1.z.string(),
            qty: zod_1.z.number().positive(),
            price: zod_1.z.number().min(0),
            discount_amount: zod_1.z.number().min(0).optional().default(0),
            discount_percent: zod_1.z.number().min(0).max(100).optional().default(0)
        })).min(1)
    })
});
exports.postBedChargesSchema = zod_1.z.object({
    body: zod_1.z.object({
        encounter_id: zod_1.z.string().uuid(),
        facility_id: zod_1.z.string().uuid().optional(),
        as_of_date: zod_1.z.string().optional(),
    })
});
