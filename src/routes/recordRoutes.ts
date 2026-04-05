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

// All record routes require authentication
router.use(authGuard);

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
