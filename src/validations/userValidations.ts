import { z } from 'zod';
import { Role } from '@prisma/client';

export const registerSchema = z.object({
    name: z.string().min(2, 'Name must be at least 2 characters'),
    email: z.string().email('Invalid email address'),
    password: z
        .string()
        .min(8, 'Password must be at least 8 characters')
        .regex(/[A-Z]/, 'Password must contain at least one uppercase letter')
        .regex(/[0-9]/, 'Password must contain at least one number'),
});

export const loginSchema = z.object({
    email: z.string().email('Invalid email address'),
    password: z.string().min(1, 'Password is required'),
});

export const createUserSchema = registerSchema.extend({
    role: z.nativeEnum(Role).optional(),
});

export const updateRoleSchema = z.object({
    role: z.nativeEnum(Role),
});

export const updateStatusSchema = z.object({
    isActive: z.boolean(),
});
