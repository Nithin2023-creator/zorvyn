import { z } from 'zod';
import { RecordType } from '@prisma/client';

export const createRecordSchema = z.object({
    amount: z.number().positive('Amount must be positive'),
    type: z.nativeEnum(RecordType),
    category: z.string().min(1, 'Category is required'),
    date: z.coerce.date(),
    notes: z.string().optional(),
});

export const updateRecordSchema = createRecordSchema.partial();

export const queryRecordSchema = z.object({
    page: z.coerce.number().min(1).default(1),
    limit: z.coerce.number().min(1).max(100).default(10),
    type: z.nativeEnum(RecordType).optional(),
    category: z.string().optional(),
    startDate: z.coerce.date().optional(),
    endDate: z.coerce.date().optional(),
    sortBy: z.enum(['date', 'amount', 'createdAt']).default('date'),
    sortOrder: z.enum(['asc', 'desc']).default('desc'),
    search: z.string().optional(),
});
