import { z } from 'zod';

export const loginSchema = z.object({
  body: z.object({
    username: z.string().min(3),
    password: z.string().min(6),
  }),
});

export type LoginRequest = z.infer<typeof loginSchema>['body'];

export const registerSchema = z.object({
  body: z.object({
    organization_id: z.string().uuid(),
    username: z.string().min(3),
    password: z.string().min(6),
    first_name: z.string().min(1),
    last_name: z.string().min(1).optional(),
    email: z.string().email().optional(),
    phone: z.string().optional(),
  }),
});

export type RegisterRequest = z.infer<typeof registerSchema>['body'];
