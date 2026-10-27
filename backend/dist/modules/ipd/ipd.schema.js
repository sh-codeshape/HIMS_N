"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.dischargePatientSchema = exports.createIpdAdmissionSchema = void 0;
const zod_1 = require("zod");
exports.createIpdAdmissionSchema = zod_1.z.object({
    body: zod_1.z.object({
        facility_id: zod_1.z.string().uuid(),
        patient_id: zod_1.z.string().uuid(),
        bed_id: zod_1.z.string().uuid().optional().nullable(),
        admitting_practitioner_id: zod_1.z.string().uuid().optional().nullable(),
        department_id: zod_1.z.string().uuid().optional().nullable(),
        referred_by: zod_1.z.string().optional().nullable(),
        admission_type: zod_1.z.enum(['elective', 'emergency', 'maternity', 'daycare']).optional(),
        reason_for_admission: zod_1.z.string().optional(),
        attendant_name: zod_1.z.string().optional().nullable(),
        attendant_relation: zod_1.z.string().optional().nullable(),
        attendant_phone: zod_1.z.string().optional().nullable(),
        // ── Billing fields (optional, additive) ──
        tariff_plan_id: zod_1.z.string().uuid().optional().nullable(),
        entitled_bed_category_id: zod_1.z.string().uuid().optional().nullable(),
        payer_type: zod_1.z.enum(['self', 'insurance', 'corporate', 'government', 'tpa']).optional().nullable(),
        patient_coverage_id: zod_1.z.string().uuid().optional().nullable(),
        advance_deposit: zod_1.z
            .object({
            amount: zod_1.z.number().positive(),
            payment_mode: zod_1.z.string().min(1),
            receipt_no: zod_1.z.string().optional().nullable(),
        })
            .optional()
            .nullable(),
    })
});
exports.dischargePatientSchema = zod_1.z.object({
    params: zod_1.z.object({
        id: zod_1.z.string().uuid()
    }),
    body: zod_1.z.object({
        discharge_type: zod_1.z.enum(['normal', 'lama', 'dama', 'absconded', 'referred', 'transferred', 'death']),
        discharge_condition: zod_1.z.string().optional()
    })
});
