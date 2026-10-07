import { z } from 'zod';

export const createIpdAdmissionSchema = z.object({
  body: z.object({
    facility_id: z.string().uuid(),
    patient_id: z.string().uuid(),
    bed_id: z.string().uuid().optional().nullable(),
    admitting_practitioner_id: z.string().uuid().optional().nullable(),
    department_id: z.string().uuid().optional().nullable(),
    referred_by: z.string().optional().nullable(),
    admission_type: z.enum(['elective', 'emergency', 'maternity', 'daycare']).optional(),
    reason_for_admission: z.string().optional(),
    attendant_name: z.string().optional().nullable(),
    attendant_relation: z.string().optional().nullable(),
    attendant_phone: z.string().optional().nullable(),
  })
});

export const dischargePatientSchema = z.object({
  params: z.object({
    id: z.string().uuid()
  }),
  body: z.object({
    discharge_type: z.enum(['normal', 'lama', 'dama', 'absconded', 'referred', 'transferred', 'death']),
    discharge_condition: z.string().optional()
  })
});

export type CreateIpdAdmissionRequest = z.infer<typeof createIpdAdmissionSchema>['body'];
export type DischargePatientRequest = z.infer<typeof dischargePatientSchema>['body'];
