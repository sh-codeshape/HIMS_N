"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.transferBedSchema = exports.updateBedStatusSchema = exports.deleteBedSchema = exports.updateBedSchema = exports.createBedSchema = exports.listBedsSchema = exports.getBedByIdSchema = exports.getBedSchema = exports.BED_STATUSES = void 0;
const zod_1 = require("zod");
exports.BED_STATUSES = [
    'available',
    'occupied',
    'reserved',
    'cleaning',
    'maintenance',
    'blocked',
];
exports.getBedSchema = zod_1.z.object({
    query: zod_1.z.object({
        facilityId: zod_1.z.string().uuid().optional()
    })
});
exports.getBedByIdSchema = zod_1.z.object({
    params: zod_1.z.object({
        id: zod_1.z.string().uuid()
    })
});
exports.listBedsSchema = zod_1.z.object({
    query: zod_1.z.object({
        facilityId: zod_1.z.string().uuid().optional(),
        wardId: zod_1.z.string().uuid().optional(),
        roomId: zod_1.z.string().uuid().optional(),
        floor: zod_1.z.string().optional(),
        status: zod_1.z.enum(exports.BED_STATUSES).optional(),
        bedNo: zod_1.z.string().optional(),
    })
});
exports.createBedSchema = zod_1.z.object({
    body: zod_1.z.object({
        facility_id: zod_1.z.string().uuid().optional(),
        organization_id: zod_1.z.string().uuid().optional(),
        ward_id: zod_1.z.string().uuid().optional(),
        ward_code: zod_1.z.string().min(1).max(40).optional(),
        ward_name: zod_1.z.string().min(1).max(120).optional(),
        ward_type: zod_1.z.string().optional(),
        floor: zod_1.z.string().optional(),
        gender_policy: zod_1.z.string().optional(),
        bed_category_id: zod_1.z.string().uuid().optional().nullable(),
        bed_charge_service_id: zod_1.z.string().uuid().optional().nullable(),
        room_id: zod_1.z.string().uuid().optional().nullable(),
        room_no: zod_1.z.string().min(1).max(40).optional(),
        room_type: zod_1.z.string().optional(),
        bed_no: zod_1.z.string().min(1).max(40),
        status: zod_1.z.enum(exports.BED_STATUSES).optional(),
        features: zod_1.z.record(zod_1.z.string(), zod_1.z.unknown()).optional(),
        is_active: zod_1.z.boolean().optional(),
    })
});
exports.updateBedSchema = zod_1.z.object({
    params: zod_1.z.object({
        id: zod_1.z.string().uuid()
    }),
    body: zod_1.z.object({
        facility_id: zod_1.z.string().uuid().optional(),
        ward_id: zod_1.z.string().uuid().optional(),
        room_id: zod_1.z.string().uuid().optional().nullable(),
        room_no: zod_1.z.string().min(1).max(40).optional(),
        room_type: zod_1.z.string().optional(),
        bed_category_id: zod_1.z.string().uuid().optional().nullable(),
        bed_charge_service_id: zod_1.z.string().uuid().optional().nullable(),
        bed_no: zod_1.z.string().min(1).max(40).optional(),
        status: zod_1.z.enum(exports.BED_STATUSES).optional(),
        features: zod_1.z.record(zod_1.z.string(), zod_1.z.unknown()).optional(),
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
        status: zod_1.z.enum(exports.BED_STATUSES),
    })
});
exports.transferBedSchema = zod_1.z.object({
    body: zod_1.z.object({
        fromBedId: zod_1.z.string().uuid(),
        toBedId: zod_1.z.string().uuid(),
        admission_id: zod_1.z.string().uuid().optional(),
    })
});
