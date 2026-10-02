import { z } from 'zod';

export const createLabOrderSchema = z.object({
  body: z.object({
    patientId: z.string().uuid(),
    testDefinitionIds: z.array(z.string().uuid()),
    orderedBy: z.string().uuid().optional().nullable(),
  })
});

export const updateLabResultSchema = z.object({
  params: z.object({
    id: z.string().uuid()
  }),
  body: z.object({
    result: z.string(),
    status: z.enum(['ordered', 'scheduled', 'in_progress', 'completed', 'cancelled'])
  })
});
