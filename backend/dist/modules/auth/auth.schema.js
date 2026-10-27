"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.registerSchema = exports.loginSchema = void 0;
const zod_1 = require("zod");
exports.loginSchema = zod_1.z.object({
    body: zod_1.z.object({
        username: zod_1.z.string().min(1, 'Username or email is required'),
        password: zod_1.z.string().min(1, 'Password is required'),
    }),
});
exports.registerSchema = zod_1.z.object({
    body: zod_1.z.object({
        organization_id: zod_1.z.string().uuid(),
        username: zod_1.z.string().min(3),
        password: zod_1.z.string().min(6),
        first_name: zod_1.z.string().min(1),
        last_name: zod_1.z.string().min(1).optional(),
        email: zod_1.z.string().email().optional(),
        phone: zod_1.z.string().optional(),
        roleIds: zod_1.z.array(zod_1.z.string().uuid()).optional(),
    }),
});
