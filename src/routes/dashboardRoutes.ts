import { Router } from 'express';
import { DashboardController } from '../controllers/DashboardController';
import { authGuard } from '../middlewares/authGuard';
import { roleGuard } from '../middlewares/roleGuard';
import { Role } from '@prisma/client';

const router = Router();

// All dashboard routes require authentication and any valid role
router.use(authGuard);
router.use(roleGuard(Role.ADMIN, Role.ANALYST, Role.VIEWER));

router.get('/summary', DashboardController.summary);
router.get('/category-totals', DashboardController.categoryTotals);
router.get('/recent', DashboardController.recent);
router.get('/trends', DashboardController.trends);

export { router as dashboardRoutes };
