"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.updateOpdStatusSchema = exports.createOpdEncounterSchema = void 0;
const zod_1 = require("zod");
exports.createOpdEncounterSchema = zod_1.z.object({
    body: zod_1.z.object({
        facility_id: zod_1.z.string().uuid(),
        patient_id: zod_1.z.string().uuid(),
        department_id: zod_1.z.string().uuid().optional().nullable(),
        primary_practitioner_id: zod_1.z.string().uuid().optional().nullable(),
        referred_by: zod_1.z.string().optional().nullable(),
        chief_complaint: zod_1.z.string().optional(),
        attendant_name: zod_1.z.string().optional().nullable(),
        attendant_relation: zod_1.z.string().optional().nullable(),
        attendant_phone: zod_1.z.string().optional().nullable(),
        triage_vitals: zod_1.z.object({
            bp: zod_1.z.string().optional(),
            pulse: zod_1.z.number().optional(),
            temperature: zod_1.z.number().optional(),
            spo2: zod_1.z.number().optional()
        }).optional()
    })
});
exports.updateOpdStatusSchema = zod_1.z.object({
    params: zod_1.z.object({
        id: zod_1.z.string().uuid()
    }),
    body: zod_1.z.object({
        status: zod_1.z.enum(['planned', 'arrived', 'in_progress', 'on_hold', 'finished', 'cancelled', 'entered_in_error'])
    })
});
