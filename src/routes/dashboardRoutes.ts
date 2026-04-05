import { Router } from 'express';
import { DashboardController } from '../controllers/DashboardController';
import { authGuard } from '../middlewares/authGuard';
import { roleGuard } from '../middlewares/roleGuard';
import { Role } from '@prisma/client';

const router = Router();

/**
 * @swagger
 * tags:
 *   name: Dashboard
 *   description: Financial Insights and Summaries
 */

// All dashboard routes require authentication and any valid role
router.use(authGuard);
router.use(roleGuard(Role.ADMIN, Role.ANALYST, Role.VIEWER));

/**
 * @swagger
 * /dashboard/summary:
 *   get:
 *     summary: Get overall financial summary
 *     tags: [Dashboard]
 *     security: [{ bearerAuth: [] }]
 *     responses:
 *       200:
 *         description: Summary of total income, expenses, and balance
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success: { type: boolean }
 *                 data:
 *                   type: object
 *                   properties:
 *                     totalIncome: { type: number }
 *                     totalExpense: { type: number }
 *                     balance: { type: number }
 *                     recordCount: { type: integer }
 *       401:
 *         description: Unauthorized
 *         content:
 *           application/json:
 *             schema: { $ref: '#/components/schemas/ErrorResponse' }
 */
router.get('/summary', DashboardController.summary);

/**
 * @swagger
 * /dashboard/category-totals:
 *   get:
 *     summary: Get aggregate totals by category
 *     tags: [Dashboard]
 *     security: [{ bearerAuth: [] }]
 *     responses:
 *       200:
 *         description: Total amount per category
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success: { type: boolean }
 *                 data:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       category: { type: string }
 *                       total: { type: number }
 *                       _count: { type: integer }
 */
router.get('/category-totals', DashboardController.categoryTotals);

/**
 * @swagger
 * /dashboard/recent:
 *   get:
 *     summary: Get list of most recent records
 *     tags: [Dashboard]
 *     security: [{ bearerAuth: [] }]
 *     responses:
 *       200:
 *         description: List of 10 most recent financial records
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success: { type: boolean }
 *                 data: { type: array, items: { $ref: '#/components/schemas/FinancialRecord' } }
 */
router.get('/recent', DashboardController.recent);

/**
 * @swagger
 * /dashboard/trends:
 *   get:
 *     summary: Get monthly financial trends
 *     tags: [Dashboard]
 *     security: [{ bearerAuth: [] }]
 *     responses:
 *       200:
 *         description: Month-by-month income vs expense comparison
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success: { type: boolean }
 *                 data:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       month: { type: string }
 *                       income: { type: number }
 *                       expense: { type: number }
 */
router.get('/trends', DashboardController.trends);

export { router as dashboardRoutes };
