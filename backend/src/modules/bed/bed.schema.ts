import { z } from 'zod';

export const getBedSchema = z.object({
  query: z.object({
    facilityId: z.string().uuid().optional()
  })
});

export const updateBedStatusSchema = z.object({
  params: z.object({
    id: z.string().uuid()
  }),
  body: z.object({
    status: z.enum(['available', 'occupied', 'reserved', 'cleaning', 'maintenance', 'blocked'])
  })
});
