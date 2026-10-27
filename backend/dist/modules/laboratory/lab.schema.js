"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.updateLabResultSchema = exports.createLabOrderSchema = void 0;
const zod_1 = require("zod");
exports.createLabOrderSchema = zod_1.z.object({
    body: zod_1.z.object({
        patientId: zod_1.z.string().uuid(),
        testDefinitionIds: zod_1.z.array(zod_1.z.string().uuid()),
        orderedBy: zod_1.z.string().uuid().optional().nullable(),
    })
});
exports.updateLabResultSchema = zod_1.z.object({
    params: zod_1.z.object({
        id: zod_1.z.string().uuid()
    }),
    body: zod_1.z.object({
        result: zod_1.z.string(),
        status: zod_1.z.enum(['ordered', 'scheduled', 'in_progress', 'completed', 'cancelled'])
    })
});
