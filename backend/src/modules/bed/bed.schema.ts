import { z } from 'zod';

export const BED_STATUSES = [
  'available',
  'occupied',
  'reserved',
  'cleaning',
  'maintenance',
  'blocked',
] as const;

export type BedStatus = typeof BED_STATUSES[number];

const emptyStringToNull = z.literal('').transform(() => null);
const emptyStringToUndefined = z.literal('').transform(() => undefined);

export const optionalUuid = z
  .union([z.string().uuid(), emptyStringToNull, emptyStringToUndefined])
  .optional()
  .nullable();

export const bedStatusSchema = z.preprocess((val) => {
  if (typeof val === 'string') {
    const trimmed = val.trim().toLowerCase();
    return trimmed === '' ? 'available' : trimmed;
  }
  return val;
}, z.enum(BED_STATUSES));

export const getBedSchema = z.object({
  query: z.object({
    facilityId: optionalUuid,
  })
});

export const getBedByIdSchema = z.object({
  params: z.object({
    id: z.string().uuid()
  })
});

export const listBedsSchema = z.object({
  query: z.object({
    facilityId: optionalUuid,
    wardId: optionalUuid,
    roomId: optionalUuid,
    floor: z.string().optional(),
    status: bedStatusSchema.optional(),
    bedNo: z.string().optional(),
  })
});

export const createBedSchema = z.object({
  body: z.object({
    facility_id: optionalUuid,
    organization_id: optionalUuid,
    ward_id: optionalUuid,
    ward_code: z.union([z.string().min(1).max(40), emptyStringToUndefined]).optional(),
    ward_name: z.union([z.string().min(1).max(120), emptyStringToUndefined]).optional(),
    ward_type: z.preprocess((v) => (typeof v === 'string' && v.trim() === '' ? 'general' : v), z.string().optional()),
    floor: z.union([z.string().max(60), emptyStringToUndefined]).optional(),
    gender_policy: z.preprocess((v) => (typeof v === 'string' && v.trim() === '' ? 'any' : v), z.string().optional()),
    bed_category_id: optionalUuid,
    bed_charge_service_id: optionalUuid,
    room_id: optionalUuid,
    room_no: z.union([z.string().min(1).max(40), emptyStringToUndefined]).optional(),
    room_type: z.preprocess((v) => (typeof v === 'string' && v.trim() === '' ? 'general' : v), z.string().optional()),
    bed_no: z.string().min(1).max(40),
    status: bedStatusSchema.optional().default('available'),
    features: z.preprocess(
      (v) => (v && typeof v === 'object' && !Array.isArray(v) ? v : {}),
      z.record(z.string(), z.unknown()).optional()
    ),
    is_active: z.boolean().optional(),
  })
});

export const createWardSchema = z.object({
  body: z.object({
    organization_id: optionalUuid,
    facility_id: optionalUuid,
    code: z.string().min(1).max(40),
    name: z.string().min(1).max(120),
    ward_type: z.preprocess((v) => (typeof v === 'string' && v.trim() === '' ? 'general' : v), z.string().optional()),
    gender_policy: z.preprocess((v) => (typeof v === 'string' && v.trim() === '' ? 'any' : v), z.string().optional()),
    floor: z.union([z.string().max(60), emptyStringToUndefined]).optional(),
    bed_category_id: optionalUuid,
    is_active: z.boolean().optional(),
  }),
});

export const createRoomSchema = z.object({
  body: z.object({
    ward_id: z.string().uuid(),
    room_no: z.string().min(1).max(40),
    room_type: z.preprocess((v) => (typeof v === 'string' && v.trim() === '' ? 'general' : v), z.string().optional()),
    is_active: z.boolean().optional(),
  }),
});

export const updateBedSchema = z.object({
  params: z.object({
    id: z.string().uuid()
  }),
  body: z.object({
    facility_id: optionalUuid,
    ward_id: optionalUuid,
    room_id: optionalUuid,
    room_no: z.union([z.string().min(1).max(40), emptyStringToUndefined]).optional(),
    room_type: z.preprocess((v) => (typeof v === 'string' && v.trim() === '' ? 'general' : v), z.string().optional()),
    bed_category_id: optionalUuid,
    bed_charge_service_id: optionalUuid,
    bed_no: z.string().min(1).max(40).optional(),
    status: bedStatusSchema.optional(),
    features: z.preprocess(
      (v) => (v && typeof v === 'object' && !Array.isArray(v) ? v : {}),
      z.record(z.string(), z.unknown()).optional()
    ),
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
    status: bedStatusSchema,
  })
});

export const transferBedSchema = z.object({
  body: z.object({
    fromBedId: z.string().uuid(),
    toBedId: z.string().uuid(),
    admission_id: optionalUuid,
  })
});
