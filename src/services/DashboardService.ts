import { prisma } from '../prisma/client';
import { RecordType } from '@prisma/client';
import { subMonths, startOfMonth, endOfMonth, format } from 'date-fns';

const ACTIVE_FILTER = { deletedAt: null };

export class DashboardService {
    static async getSummary() {
        // We run two separate aggregations concurrently to get total sums without loading records into memory
        const [incomeResult, expenseResult] = await Promise.all([
            prisma.financialRecord.aggregate({
                where: { ...ACTIVE_FILTER, type: RecordType.INCOME },
                _sum: { amount: true },
            }),
            prisma.financialRecord.aggregate({
                where: { ...ACTIVE_FILTER, type: RecordType.EXPENSE },
                _sum: { amount: true },
            }),
        ]);

        // Prisma returns Decimal objects; convert to numbers or floats for the response
        const totalIncome = incomeResult._sum.amount?.toNumber() || 0;
        const totalExpenses = expenseResult._sum.amount?.toNumber() || 0;
        const netBalance = totalIncome - totalExpenses;

        return {
            totalIncome,
            totalExpenses,
            netBalance,
        };
    }

    static async getCategoryTotals() {
        const totals = await prisma.financialRecord.groupBy({
            by: ['category', 'type'],
            where: { ...ACTIVE_FILTER },
            _sum: { amount: true },
            orderBy: { category: 'asc' }
        });

        return totals.map(item => ({
            category: item.category,
            type: item.type,
            total: item._sum.amount?.toNumber() || 0
        }));
    }

    static async getRecentRecords() {
        return prisma.financialRecord.findMany({
            where: { ...ACTIVE_FILTER },
            orderBy: { date: 'desc' },
            take: 5
        });
    }

    static async getMonthlyTrends() {
        const oldestMonth = subMonths(new Date(), 5);
        const startDate = startOfMonth(oldestMonth);

        // Professional optimization: Use a single raw SQL query to get all monthly buckets at once.
        // Prisma's groupBy doesn't support date truncation, so raw SQL is the idiomatic solution here.
        const results = await prisma.$queryRaw`
            SELECT 
                DATE_TRUNC('month', date)::DATE as month,
                type,
                SUM(amount)::FLOAT as total
            FROM financial_records
            WHERE "deletedAt" IS NULL
              AND date >= ${startDate}
            GROUP BY 1, 2
            ORDER BY 1 ASC
        ` as { month: Date, type: RecordType, total: number }[];

        const monthsData = Array.from({ length: 6 }, (_, i) => {
            const date = subMonths(new Date(), 5 - i);
            const label = format(date, 'MMM yyyy');
            const targetPeriod = format(date, 'yyyy-MM');

            const income = results
                .filter(r => format(new Date(r.month), 'yyyy-MM') === targetPeriod && r.type === RecordType.INCOME)
                .reduce((acc, r) => acc + r.total, 0);

            const expense = results
                .filter(r => format(new Date(r.month), 'yyyy-MM') === targetPeriod && r.type === RecordType.EXPENSE)
                .reduce((acc, r) => acc + r.total, 0);

            return { month: label, income, expense };
        });

        return monthsData;
    }
}
