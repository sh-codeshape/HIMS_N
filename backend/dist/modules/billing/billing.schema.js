"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.postBedChargesSchema = exports.createInvoiceSchema = void 0;
const zod_1 = require("zod");
exports.createInvoiceSchema = zod_1.z.object({
    body: zod_1.z.object({
        facility_id: zod_1.z.string().uuid(),
        patient_id: zod_1.z.string().uuid(),
        encounter_id: zod_1.z.string().uuid().optional().nullable(),
        invoice_type: zod_1.z.enum(['opd', 'ipd_interim', 'ipd_final', 'pharmacy', 'diagnostics', 'package', 'misc']).default('opd'),
        discount_total: zod_1.z.number().min(0).default(0),
        payment_mode: zod_1.z.string().optional(),
        items: zod_1.z.array(zod_1.z.object({
            name: zod_1.z.string(),
            qty: zod_1.z.number().positive(),
            price: zod_1.z.number().min(0)
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
