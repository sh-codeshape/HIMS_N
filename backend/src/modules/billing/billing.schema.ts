import { z } from 'zod';

export const createInvoiceSchema = z.object({
  body: z.object({
    facility_id: z.string().uuid().optional(),
    patient_id: z.string().uuid(),
    encounter_id: z.string().uuid().optional().nullable(),
    invoice_type: z.enum(['opd', 'ipd_interim', 'ipd_final', 'pharmacy', 'diagnostics', 'package', 'misc']).default('opd'),
    discount_total: z.number().min(0).default(0),
    discount_reason_id: z.string().uuid().optional().nullable(),
    discount_approved_by: z.string().uuid().optional().nullable(),
    discount_percent: z.number().min(0).max(100).optional().nullable(),
    discount_reference: z.string().optional().nullable(),
    referral_source: z.string().optional().nullable(),
    referred_by: z.string().optional().nullable(),
    notes: z.string().optional().nullable(),
    payment_mode: z.string().optional(),
    items: z.array(
      z.object({
        name: z.string(),
        qty: z.number().positive(),
        price: z.number().min(0),
        discount_amount: z.number().min(0).optional().default(0),
        discount_percent: z.number().min(0).max(100).optional().default(0)
      })
    ).min(1)
  })
});

export type CreateInvoiceRequest = z.infer<typeof createInvoiceSchema>['body'];

export const postBedChargesSchema = z.object({
  body: z.object({
    encounter_id: z.string().uuid(),
    facility_id: z.string().uuid().optional(),
    as_of_date: z.string().optional(),
  })
});
