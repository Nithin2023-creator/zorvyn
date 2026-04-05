import { describe, it, expect, vi } from 'vitest';
import request from 'supertest';
import express from 'express';
import { authRouter } from '../routes/userRoutes';
import { errorHandler } from '../middlewares/errorHandler';

const app = express();
app.use(express.json());
app.use('/api/auth', authRouter);
app.use(errorHandler);

describe('Auth API', () => {
    describe('POST /api/auth/register', () => {
        it('should return 400 for invalid email', async () => {
            const res = await request(app)
                .post('/api/auth/register')
                .send({
                    name: 'Test User',
                    email: 'invalid-email',
                    password: 'Password123'
                });

            expect(res.status).toBe(400);
            expect(res.body.success).toBe(false);
            expect(res.body.error).toBe('Validation Error');
        });

        it('should return 400 for weak password', async () => {
            const res = await request(app)
                .post('/api/auth/register')
                .send({
                    name: 'Test User',
                    email: 'test@example.com',
                    password: '123'
                });

            expect(res.status).toBe(400);
            expect(res.body.details[0].message).toContain('at least 8 characters');
        });
    });

    describe('POST /api/auth/login', () => {
        it('should return 400 for missing credentials', async () => {
            const res = await request(app)
                .post('/api/auth/login')
                .send({});

            expect(res.status).toBe(400);
        });
    });
});
