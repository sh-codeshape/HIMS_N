import { z } from 'zod';

export const createPatientSchema = z.object({
  body: z.object({
    facility_id: z.string().uuid(),
    first_name: z.string().min(1),
    middle_name: z.string().optional(),
    last_name: z.string().optional(),
    gender: z.enum(['male', 'female', 'other', 'unknown']),
    date_of_birth: z.string().optional(),
    phone: z.string().min(10),
    email: z.string().email().optional(),
    address_line1: z.string().optional(),
    city: z.string().optional(),
    state: z.string().optional(),
    postal_code: z.string().optional(),
    blood_group: z.string().optional(),
  }),
});

export const updatePatientSchema = z.object({
  params: z.object({
    id: z.string().uuid(),
  }),
  body: z.object({
    first_name: z.string().min(1).optional(),
    middle_name: z.string().optional(),
    last_name: z.string().optional(),
    gender: z.enum(['male', 'female', 'other', 'unknown']).optional(),
    date_of_birth: z.string().optional(),
    phone: z.string().min(10).optional(),
    email: z.string().email().optional(),
    address_line1: z.string().optional(),
    city: z.string().optional(),
    state: z.string().optional(),
    postal_code: z.string().optional(),
    blood_group: z.string().optional(),
  }),
});

export const getPatientSchema = z.object({
  params: z.object({
    id: z.string().uuid(),
  }),
});

export const searchPatientSchema = z.object({
  query: z.object({
    query: z.string().min(2).optional(),
    phone: z.string().optional(),
    uhid: z.string().optional(),
    page: z.string().regex(/^\d+$/).optional(),
    limit: z.string().regex(/^\d+$/).optional(),
  }),
});

export type CreatePatientRequest = z.infer<typeof createPatientSchema>['body'];
export type UpdatePatientRequest = z.infer<typeof updatePatientSchema>['body'];
export type SearchPatientQuery = z.infer<typeof searchPatientSchema>['query'];
