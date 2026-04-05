import { Router } from 'express';
import { RecordController } from '../controllers/RecordController';
import { authGuard } from '../middlewares/authGuard';
import { roleGuard } from '../middlewares/roleGuard';
import { validateRequest } from '../middlewares/validateRequest';
import {
    createRecordSchema,
    updateRecordSchema,
    queryRecordSchema
} from '../validations/recordValidations';
import { Role } from '@prisma/client';

const router = Router();

/**
 * @swagger
 * tags:
 *   name: Records
 *   description: Financial Record Management
 */

// All record routes require authentication
router.use(authGuard);

/**
 * @swagger
 * /records:
 *   post:
 *     summary: Create a new financial record
 *     tags: [Records]
 *     security: [{ bearerAuth: [] }]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [amount, type, category, date]
 *             properties:
 *               amount: { type: number }
 *               type: { type: string, enum: [INCOME, EXPENSE] }
 *               category: { type: string }
 *               date: { type: string, format: date-time }
 *               notes: { type: string }
 *     responses:
 *       201:
 *         description: Record created
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success: { type: boolean }
 *                 data: { $ref: '#/components/schemas/FinancialRecord' }
 *       400:
 *         description: Invalid input
 *         content:
 *           application/json:
 *             schema: { $ref: '#/components/schemas/ErrorResponse' }
 *   get:
 *     summary: List financial records with filtering
 *     tags: [Records]
 *     security: [{ bearerAuth: [] }]
 *     parameters:
 *       - name: type
 *         in: query
 *         schema: { type: string, enum: [INCOME, EXPENSE] }
 *       - name: category
 *         in: query
 *         schema: { type: string }
 *       - name: search
 *         in: query
 *         schema: { type: string }
 *       - name: startDate
 *         in: query
 *         schema: { type: string, format: date-time }
 *       - name: endDate
 *         in: query
 *         schema: { type: string, format: date-time }
 *       - name: page
 *         in: query
 *         schema: { type: integer, default: 1 }
 *       - name: limit
 *         in: query
 *         schema: { type: integer, default: 10 }
 *       - name: sortBy
 *         in: query
 *         schema: { type: string, default: date }
 *       - name: sortOrder
 *         in: query
 *         schema: { type: string, enum: [asc, desc], default: desc }
 *     responses:
 *       200:
 *         description: List of records
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success: { type: boolean }
 *                 data: { type: array, items: { $ref: '#/components/schemas/FinancialRecord' } }
 *                 meta:
 *                   type: object
 *                   properties:
 *                     page: { type: integer }
 *                     limit: { type: integer }
 *                     total: { type: integer }
 *                     totalPages: { type: integer }
 */
router.post(
    '/',
    roleGuard(Role.ADMIN, Role.ANALYST),
    validateRequest(createRecordSchema),
    RecordController.create
);

router.get(
    '/',
    roleGuard(Role.ADMIN, Role.ANALYST, Role.VIEWER),
    validateRequest(queryRecordSchema, 'query'),
    RecordController.list
);

/**
 * @swagger
 * /records/{id}:
 *   get:
 *     summary: Get record details
 *     tags: [Records]
 *     security: [{ bearerAuth: [] }]
 *     parameters:
 *       - name: id
 *         in: path
 *         required: true
 *         schema: { type: string }
 *     responses:
 *       200:
 *         description: Record details
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success: { type: boolean }
 *                 data: { $ref: '#/components/schemas/FinancialRecord' }
 *       404:
 *         description: Record not found
 *         content:
 *           application/json:
 *             schema: { $ref: '#/components/schemas/ErrorResponse' }
 *   put:
 *     summary: Update a financial record
 *     tags: [Records]
 *     security: [{ bearerAuth: [] }]
 *     parameters:
 *       - name: id
 *         in: path
 *         required: true
 *         schema: { type: string }
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               amount: { type: number }
 *               type: { type: string, enum: [INCOME, EXPENSE] }
 *               category: { type: string }
 *               date: { type: string, format: date-time }
 *               notes: { type: string }
 *     responses:
 *       200:
 *         description: Record updated
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success: { type: boolean }
 *                 data: { $ref: '#/components/schemas/FinancialRecord' }
 *       404:
 *         description: Record not found
 *         content:
 *           application/json:
 *             schema: { $ref: '#/components/schemas/ErrorResponse' }
 *   delete:
 *     summary: Delete a financial record (Soft delete)
 *     tags: [Records]
 *     security: [{ bearerAuth: [] }]
 *     parameters:
 *       - name: id
 *         in: path
 *         required: true
 *         schema: { type: string }
 *     responses:
 *       200:
 *         description: Record deleted
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success: { type: boolean }
 *                 data:
 *                   type: object
 *                   properties:
 *                     message: { type: string }
 *       404:
 *         description: Record not found
 *         content:
 *           application/json:
 *             schema: { $ref: '#/components/schemas/ErrorResponse' }
 */
router.get(
    '/:id',
    roleGuard(Role.ADMIN, Role.ANALYST, Role.VIEWER),
    RecordController.getById
);

router.put(
    '/:id',
    roleGuard(Role.ADMIN, Role.ANALYST),
    validateRequest(updateRecordSchema),
    RecordController.update
);

router.delete(
    '/:id',
    roleGuard(Role.ADMIN),
    RecordController.remove
);

export { router as recordRoutes };
