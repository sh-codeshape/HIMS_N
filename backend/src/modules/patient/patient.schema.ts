import { z } from 'zod';

export const createPatientSchema = z.object({
  body: z.object({
    facility_id: z.string().uuid(),
    first_name: z.string().min(1),
    middle_name: z.string().optional(),
    last_name: z.string().optional(),
    gender: z.enum(['male', 'female', 'other', 'unknown']),
    date_of_birth: z.string().optional(),
    age: z.string().or(z.number()).optional(),
    blood_group: z.string().optional(),
    marital_status: z.string().optional(),
    occupation: z.string().optional(),
    nationality: z.string().optional(),
    phone: z.string().regex(/^\d{10}$/, "Phone number must be exactly 10 digits"),
    alternate_phone: z.string().optional(),
    email: z.string().email().optional(),
    landline: z.string().optional(),
    address_line1: z.string().optional(),
    city: z.string().optional(),
    state: z.string().optional(),
    postal_code: z.string().optional(),
    country: z.string().optional(),
    aadhaar_number: z.string().regex(/^\d{12}$/, "Aadhaar number must be exactly 12 digits").optional().or(z.literal('')),
    pan_number: z.string().optional(),
    emergency_name: z.string().optional(),
    emergency_phone: z.string().optional(),
    emergency_relation: z.string().optional(),
    referred_by: z.string().optional(),
    department: z.string().optional(),
    visit_type: z.string().optional(),
    payment_type: z.string().optional(),
    health_insurance: z.boolean().or(z.string()).optional(),
    insurance_provider: z.string().optional(),
    insurance_number: z.string().optional(),
    family_head_id: z.string().uuid().optional(),
    relation_to_head: z.string().optional()
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
    phone: z.string().regex(/^\d{10}$/, "Phone number must be exactly 10 digits").optional(),
    email: z.string().email().optional(),
    address_line1: z.string().optional(),
    address: z.string().optional(),
    city: z.string().optional(),
    state: z.string().optional(),
    postal_code: z.string().optional(),
    country: z.string().optional(),
    blood_group: z.string().optional(),
    age: z.string().or(z.number()).optional(),
    custom_fields: z.any().optional(),
    status: z.enum(['active', 'inactive', 'merged', 'deceased']).optional(),
  }),
});

export const getPatientSchema = z.object({
  params: z.object({
    id: z.string().uuid(),
  }),
});

export const searchPatientSchema = z.object({
  query: z.object({
    query: z.string().min(1).optional(),
    phone: z.string().optional(),
    uhid: z.string().optional(),
    page: z.string().regex(/^\d+$/).optional(),
    limit: z.string().regex(/^\d+$/).optional(),
  }),
});

export type CreatePatientRequest = z.infer<typeof createPatientSchema>['body'];
export type UpdatePatientRequest = z.infer<typeof updatePatientSchema>['body'];
export type SearchPatientQuery = z.infer<typeof searchPatientSchema>['query'];
