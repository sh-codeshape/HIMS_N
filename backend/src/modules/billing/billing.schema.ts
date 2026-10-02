import { z } from 'zod';

export const createInvoiceSchema = z.object({
  body: z.object({
    facility_id: z.string().uuid(),
    patient_id: z.string().uuid(),
    invoice_type: z.enum(['opd', 'ipd_interim', 'ipd_final', 'pharmacy', 'diagnostics', 'package', 'misc']).default('opd'),
    discount_total: z.number().min(0).default(0),
    payment_mode: z.string().optional(),
    items: z.array(
      z.object({
        name: z.string(),
        qty: z.number().positive(),
        price: z.number().min(0)
      })
    ).min(1)
  })
});

export type CreateInvoiceRequest = z.infer<typeof createInvoiceSchema>['body'];
