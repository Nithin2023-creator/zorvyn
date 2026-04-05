import { z } from 'zod';
import { RecordType } from '@prisma/client';
import { prisma } from '../prisma/client';
import { AppError } from '../middlewares/errorHandler';
import { createRecordSchema, updateRecordSchema, queryRecordSchema } from '../validations/recordValidations';

// Always enforce soft-delete globally on all queries
const ACTIVE_FILTER = { deletedAt: null };

export class RecordService {
    static async create(userId: string, data: z.infer<typeof createRecordSchema>) {
        return prisma.financialRecord.create({
            data: {
                userId,
                amount: data.amount,
                type: data.type,
                category: data.category,
                date: data.date,
                notes: data.notes,
            }
        });
    }

    static async list(filters: z.infer<typeof queryRecordSchema>) {
        const page = filters.page;
        const limit = filters.limit;
        const skip = (page - 1) * limit;

        const where: any = {
            ...ACTIVE_FILTER,
        };

        if (filters.type) {
            where.type = filters.type;
        }

        if (filters.category) {
            where.category = { contains: filters.category, mode: 'insensitive' };
        }

        if (filters.search) {
            where.OR = [
                { category: { contains: filters.search, mode: 'insensitive' } },
                { notes: { contains: filters.search, mode: 'insensitive' } },
            ];
        }

        if (filters.startDate || filters.endDate) {
            where.date = {};
            if (filters.startDate) where.date.gte = filters.startDate;
            if (filters.endDate) where.date.lte = filters.endDate;
        }

        const [records, total] = await Promise.all([
            prisma.financialRecord.findMany({
                where,
                skip,
                take: limit,
                orderBy: { [filters.sortBy]: filters.sortOrder },
            }),
            prisma.financialRecord.count({ where }),
        ]);

        return {
            records,
            meta: {
                page,
                limit,
                total,
                totalPages: Math.ceil(total / limit),
            }
        };
    }

    static async update(id: string, data: z.infer<typeof updateRecordSchema>) {
        const existing = await prisma.financialRecord.findFirst({
            where: { id, ...ACTIVE_FILTER }
        });

        if (!existing) {
            throw new AppError(404, 'Record not found');
        }

        return prisma.financialRecord.update({
            where: { id },
            data
        });
    }

    static async softDelete(id: string) {
        const existing = await prisma.financialRecord.findFirst({
            where: { id, ...ACTIVE_FILTER }
        });

        if (!existing) {
            throw new AppError(404, 'Record not found');
        }

        return prisma.financialRecord.update({
            where: { id },
            data: { deletedAt: new Date() }
        });
    }

    static async getById(id: string) {
        const record = await prisma.financialRecord.findFirst({
            where: { id, ...ACTIVE_FILTER }
        });

        if (!record) {
            throw new AppError(404, 'Record not found');
        }

        return record;
    }
}
