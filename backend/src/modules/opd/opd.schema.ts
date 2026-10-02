import { z } from 'zod';

export const createOpdEncounterSchema = z.object({
  body: z.object({
    facility_id: z.string().uuid(),
    patient_id: z.string().uuid(),
    department_id: z.string().uuid().optional(),
    primary_practitioner_id: z.string().uuid(),
    chief_complaint: z.string().optional(),
    triage_vitals: z.object({
      bp: z.string().optional(),
      pulse: z.number().optional(),
      temperature: z.number().optional(),
      spo2: z.number().optional()
    }).optional()
  })
});

export const updateOpdStatusSchema = z.object({
  params: z.object({
    id: z.string().uuid()
  }),
  body: z.object({
    status: z.enum(['planned', 'arrived', 'in_progress', 'on_hold', 'finished', 'cancelled', 'entered_in_error'])
  })
});

export type CreateOpdEncounterRequest = z.infer<typeof createOpdEncounterSchema>['body'];
export type UpdateOpdStatusRequest = z.infer<typeof updateOpdStatusSchema>['body'];
