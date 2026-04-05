import { describe, it, expect } from 'vitest';
import request from 'supertest';
import express from 'express';
import { roleGuard } from '../middlewares/roleGuard';
import { Role } from '@prisma/client';

const app = express();
app.use(express.json());

// Test route with roleGuard
app.get('/admin-only', (req: any, res, next) => {
    req.user = { role: Role.ADMIN };
    next();
}, roleGuard(Role.ADMIN), (req, res) => res.status(200).send('OK'));

app.get('/analyst-only', (req: any, res, next) => {
    req.user = { role: Role.VIEWER }; // Simulate a VIEWER trying to access ANALYST route
    next();
}, roleGuard(Role.ANALYST, Role.ADMIN), (req, res) => res.status(200).send('OK'));

describe('roleGuard Middleware', () => {
    it('should allow access if user has the required role', async () => {
        const res = await request(app).get('/admin-only');
        expect(res.status).toBe(200);
        expect(res.text).toBe('OK');
    });

    it('should reject access if user does not have the required role', async () => {
        const res = await request(app).get('/analyst-only');
        expect(res.status).toBe(403);
        expect(res.body.error).toContain('Forbidden');
    });
});
