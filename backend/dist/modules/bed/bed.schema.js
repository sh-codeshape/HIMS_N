"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.transferBedSchema = exports.updateBedStatusSchema = exports.deleteBedSchema = exports.updateBedSchema = exports.createRoomSchema = exports.createWardSchema = exports.createBedSchema = exports.listBedsSchema = exports.getBedByIdSchema = exports.getBedSchema = exports.bedStatusSchema = exports.optionalUuid = exports.BED_STATUSES = void 0;
const zod_1 = require("zod");
exports.BED_STATUSES = [
    'available',
    'occupied',
    'reserved',
    'cleaning',
    'maintenance',
    'blocked',
];
const emptyStringToNull = zod_1.z.literal('').transform(() => null);
const emptyStringToUndefined = zod_1.z.literal('').transform(() => undefined);
exports.optionalUuid = zod_1.z
    .union([zod_1.z.string().uuid(), emptyStringToNull, emptyStringToUndefined])
    .optional()
    .nullable();
exports.bedStatusSchema = zod_1.z.preprocess((val) => {
    if (typeof val === 'string') {
        const trimmed = val.trim().toLowerCase();
        return trimmed === '' ? 'available' : trimmed;
    }
    return val;
}, zod_1.z.enum(exports.BED_STATUSES));
exports.getBedSchema = zod_1.z.object({
    query: zod_1.z.object({
        facilityId: exports.optionalUuid,
    })
});
exports.getBedByIdSchema = zod_1.z.object({
    params: zod_1.z.object({
        id: zod_1.z.string().uuid()
    })
});
exports.listBedsSchema = zod_1.z.object({
    query: zod_1.z.object({
        facilityId: exports.optionalUuid,
        wardId: exports.optionalUuid,
        roomId: exports.optionalUuid,
        floor: zod_1.z.string().optional(),
        status: exports.bedStatusSchema.optional(),
        bedNo: zod_1.z.string().optional(),
    })
});
exports.createBedSchema = zod_1.z.object({
    body: zod_1.z.object({
        facility_id: exports.optionalUuid,
        organization_id: exports.optionalUuid,
        ward_id: exports.optionalUuid,
        ward_code: zod_1.z.union([zod_1.z.string().min(1).max(40), emptyStringToUndefined]).optional(),
        ward_name: zod_1.z.union([zod_1.z.string().min(1).max(120), emptyStringToUndefined]).optional(),
        ward_type: zod_1.z.preprocess((v) => (typeof v === 'string' && v.trim() === '' ? 'general' : v), zod_1.z.string().optional()),
        floor: zod_1.z.union([zod_1.z.string().max(60), emptyStringToUndefined]).optional(),
        gender_policy: zod_1.z.preprocess((v) => (typeof v === 'string' && v.trim() === '' ? 'any' : v), zod_1.z.string().optional()),
        bed_category_id: exports.optionalUuid,
        bed_charge_service_id: exports.optionalUuid,
        room_id: exports.optionalUuid,
        room_no: zod_1.z.union([zod_1.z.string().min(1).max(40), emptyStringToUndefined]).optional(),
        room_type: zod_1.z.preprocess((v) => (typeof v === 'string' && v.trim() === '' ? 'general' : v), zod_1.z.string().optional()),
        bed_no: zod_1.z.string().min(1).max(40),
        status: exports.bedStatusSchema.optional().default('available'),
        features: zod_1.z.preprocess((v) => (v && typeof v === 'object' && !Array.isArray(v) ? v : {}), zod_1.z.record(zod_1.z.string(), zod_1.z.unknown()).optional()),
        is_active: zod_1.z.boolean().optional(),
    })
});
exports.createWardSchema = zod_1.z.object({
    body: zod_1.z.object({
        organization_id: exports.optionalUuid,
        facility_id: exports.optionalUuid,
        code: zod_1.z.string().min(1).max(40),
        name: zod_1.z.string().min(1).max(120),
        ward_type: zod_1.z.preprocess((v) => (typeof v === 'string' && v.trim() === '' ? 'general' : v), zod_1.z.string().optional()),
        gender_policy: zod_1.z.preprocess((v) => (typeof v === 'string' && v.trim() === '' ? 'any' : v), zod_1.z.string().optional()),
        floor: zod_1.z.union([zod_1.z.string().max(60), emptyStringToUndefined]).optional(),
        bed_category_id: exports.optionalUuid,
        is_active: zod_1.z.boolean().optional(),
    }),
});
exports.createRoomSchema = zod_1.z.object({
    body: zod_1.z.object({
        ward_id: zod_1.z.string().uuid(),
        room_no: zod_1.z.string().min(1).max(40),
        room_type: zod_1.z.preprocess((v) => (typeof v === 'string' && v.trim() === '' ? 'general' : v), zod_1.z.string().optional()),
        is_active: zod_1.z.boolean().optional(),
    }),
});
exports.updateBedSchema = zod_1.z.object({
    params: zod_1.z.object({
        id: zod_1.z.string().uuid()
    }),
    body: zod_1.z.object({
        facility_id: exports.optionalUuid,
        ward_id: exports.optionalUuid,
        room_id: exports.optionalUuid,
        room_no: zod_1.z.union([zod_1.z.string().min(1).max(40), emptyStringToUndefined]).optional(),
        room_type: zod_1.z.preprocess((v) => (typeof v === 'string' && v.trim() === '' ? 'general' : v), zod_1.z.string().optional()),
        bed_category_id: exports.optionalUuid,
        bed_charge_service_id: exports.optionalUuid,
        bed_no: zod_1.z.string().min(1).max(40).optional(),
        status: exports.bedStatusSchema.optional(),
        features: zod_1.z.preprocess((v) => (v && typeof v === 'object' && !Array.isArray(v) ? v : {}), zod_1.z.record(zod_1.z.string(), zod_1.z.unknown()).optional()),
        is_active: zod_1.z.boolean().optional(),
    }).passthrough(),
});
exports.deleteBedSchema = zod_1.z.object({
    params: zod_1.z.object({
        id: zod_1.z.string().uuid()
    })
});
exports.updateBedStatusSchema = zod_1.z.object({
    params: zod_1.z.object({
        id: zod_1.z.string().uuid()
    }),
    body: zod_1.z.object({
        status: exports.bedStatusSchema,
    })
});
exports.transferBedSchema = zod_1.z.object({
    body: zod_1.z.object({
        fromBedId: zod_1.z.string().uuid(),
        toBedId: zod_1.z.string().uuid(),
        admission_id: exports.optionalUuid,
    })
});
