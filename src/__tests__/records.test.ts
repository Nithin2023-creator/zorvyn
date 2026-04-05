import { describe, it, expect, vi } from 'vitest';
import request from 'supertest';
import express from 'express';
import { recordRoutes } from '../routes/recordRoutes';
import { errorHandler } from '../middlewares/errorHandler';

// Mock authGuard to bypass token verification for validation tests
vi.mock('../middlewares/authGuard', () => ({
    authGuard: (req: any, res: any, next: any) => {
        req.user = { userId: 'test-user', role: 'ADMIN' };
        next();
    }
}));

const app = express();
app.use(express.json());
app.use('/api/records', recordRoutes);
app.use(errorHandler);

describe('Records API Validation', () => {
    describe('GET /api/records', () => {
        it('should accept valid pagination query', async () => {
            const res = await request(app)
                .get('/api/records?page=2&limit=5');

            // Should pass validation and reach controller (which might fail DB, but we check 400)
            expect(res.status).not.toBe(400);
        });

        it('should return 400 for invalid sort order', async () => {
            const res = await request(app)
                .get('/api/records?sortOrder=invalid');

            expect(res.status).toBe(400);
        });
    });

    describe('POST /api/records', () => {
        it('should return 400 for negative amount', async () => {
            const res = await request(app)
                .post('/api/records')
                .send({
                    amount: -100,
                    type: 'EXPENSE',
                    category: 'Food',
                    date: new Date()
                });

            expect(res.status).toBe(400);
            expect(res.body.details[0].message).toContain('positive');
        });
    });
});
