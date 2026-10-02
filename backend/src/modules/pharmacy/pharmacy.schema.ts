import { z } from 'zod';

export const dispenseMedicineSchema = z.object({
  body: z.object({
    itemId: z.string().uuid(),
    quantity: z.number().positive(),
    patientId: z.string().uuid().optional().nullable(),
    encounterId: z.string().uuid().optional().nullable()
  })
});
