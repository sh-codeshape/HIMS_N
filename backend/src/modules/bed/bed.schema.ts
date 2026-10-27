import { z } from 'zod';

export const BED_STATUSES = [
  'available',
  'occupied',
  'reserved',
  'cleaning',
  'maintenance',
  'blocked',
] as const;

export const getBedSchema = z.object({
  query: z.object({
    facilityId: z.string().uuid().optional()
  })
});

export const getBedByIdSchema = z.object({
  params: z.object({
    id: z.string().uuid()
  })
});

export const listBedsSchema = z.object({
  query: z.object({
    facilityId: z.string().uuid().optional(),
    wardId: z.string().uuid().optional(),
    roomId: z.string().uuid().optional(),
    floor: z.string().optional(),
    status: z.enum(BED_STATUSES).optional(),
    bedNo: z.string().optional(),
  })
});

export const createBedSchema = z.object({
  body: z.object({
    facility_id: z.string().uuid().optional(),
    organization_id: z.string().uuid().optional(),
    ward_id: z.string().uuid().optional(),
    ward_code: z.string().min(1).max(40).optional(),
    ward_name: z.string().min(1).max(120).optional(),
    ward_type: z.string().optional(),
    floor: z.string().optional(),
    gender_policy: z.string().optional(),
    bed_category_id: z.string().uuid().optional().nullable(),
    bed_charge_service_id: z.string().uuid().optional().nullable(),
    room_id: z.string().uuid().optional().nullable(),
    room_no: z.string().min(1).max(40).optional(),
    room_type: z.string().optional(),
    bed_no: z.string().min(1).max(40),
    status: z.enum(BED_STATUSES).optional(),
    features: z.record(z.string(), z.unknown()).optional(),
    is_active: z.boolean().optional(),
  })
});

export const updateBedSchema = z.object({
  params: z.object({
    id: z.string().uuid()
  }),
  body: z.object({
    facility_id: z.string().uuid().optional(),
    ward_id: z.string().uuid().optional(),
    room_id: z.string().uuid().optional().nullable(),
    room_no: z.string().min(1).max(40).optional(),
    room_type: z.string().optional(),
    bed_category_id: z.string().uuid().optional().nullable(),
    bed_charge_service_id: z.string().uuid().optional().nullable(),
    bed_no: z.string().min(1).max(40).optional(),
    status: z.enum(BED_STATUSES).optional(),
    features: z.record(z.string(), z.unknown()).optional(),
    is_active: z.boolean().optional(),
  }).passthrough(),
});

export const deleteBedSchema = z.object({
  params: z.object({
    id: z.string().uuid()
  })
});

export const updateBedStatusSchema = z.object({
  params: z.object({
    id: z.string().uuid()
  }),
  body: z.object({
    status: z.enum(BED_STATUSES),
  })
});

export const transferBedSchema = z.object({
  body: z.object({
    fromBedId: z.string().uuid(),
    toBedId: z.string().uuid(),
    admission_id: z.string().uuid().optional(),
  })
});
