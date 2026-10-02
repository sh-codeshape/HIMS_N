import { z } from 'zod';

export const createIpdAdmissionSchema = z.object({
  body: z.object({
    facility_id: z.string().uuid(),
    patient_id: z.string().uuid(),
    bed_id: z.string().uuid(),
    admitting_practitioner_id: z.string().uuid(),
    department_id: z.string().uuid().optional(),
    reason_for_admission: z.string().optional()
  })
});

export const dischargePatientSchema = z.object({
  params: z.object({
    admission_id: z.string().uuid()
  }),
  body: z.object({
    discharge_type: z.enum(['routine', 'lama', 'transfer', 'expired']),
    discharge_summary: z.string().optional()
  })
});

export type CreateIpdAdmissionRequest = z.infer<typeof createIpdAdmissionSchema>['body'];
export type DischargePatientRequest = z.infer<typeof dischargePatientSchema>['body'];
