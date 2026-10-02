import { z } from 'zod';

export const generateInvoiceSchema = z.object({
  body: z.object({
    facility_id: z.string().uuid(),
    patient_id: z.string().uuid(),
    encounter_id: z.string().uuid().optional(),
    items: z.array(z.object({
      service_id: z.string().uuid().optional(),
      description: z.string(),
      quantity: z.number().min(1),
      rate: z.number().min(0)
    })).min(1)
  })
});

export type GenerateInvoiceRequest = z.infer<typeof generateInvoiceSchema>['body'];
