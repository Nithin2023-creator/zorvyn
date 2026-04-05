import { describe, it, expect, vi } from 'vitest';
import request from 'supertest';
import express from 'express';
import { dashboardRoutes } from '../routes/dashboardRoutes';
import { errorHandler } from '../middlewares/errorHandler';

// Mock authGuard and roleGuard
vi.mock('../middlewares/authGuard', () => ({
    authGuard: (req: any, res: any, next: any) => {
        req.user = { userId: 'test-user', role: 'ADMIN' };
        next();
    }
}));

vi.mock('../middlewares/roleGuard', () => ({
    roleGuard: (...roles: string[]) => (req: any, res: any, next: any) => next()
}));

const app = express();
app.use(express.json());
app.use('/api/dashboard', dashboardRoutes);
app.use(errorHandler);

describe('Dashboard API', () => {
    it('GET /api/dashboard/summary - should return summary data structure', async () => {
        const res = await request(app).get('/api/dashboard/summary');
        expect(res.status).toBe(200);
        expect(res.body.success).toBe(true);
        expect(res.body.data).toHaveProperty('totalIncome');
        expect(res.body.data).toHaveProperty('totalExpenses');
        expect(res.body.data).toHaveProperty('netBalance');
    });

    it('GET /api/dashboard/trends - should return 6 months of data', async () => {
        const res = await request(app).get('/api/dashboard/trends');
        expect(res.status).toBe(200);
        expect(res.body.data).toHaveLength(6);
        expect(res.body.data[0]).toHaveProperty('month');
        expect(res.body.data[0]).toHaveProperty('income');
        expect(res.body.data[0]).toHaveProperty('expense');
    });
});
