"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.dispenseMedicineSchema = void 0;
const zod_1 = require("zod");
exports.dispenseMedicineSchema = zod_1.z.object({
    body: zod_1.z.object({
        itemId: zod_1.z.string().uuid(),
        quantity: zod_1.z.number().positive(),
        patientId: zod_1.z.string().uuid().optional().nullable(),
        encounterId: zod_1.z.string().uuid().optional().nullable()
    })
});
