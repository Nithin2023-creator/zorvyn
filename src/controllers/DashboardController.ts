import { Response, NextFunction } from 'express';
import { DashboardService } from '../services/DashboardService';
import { AuthRequest } from '../types';

export class DashboardController {
    static async summary(req: AuthRequest, res: Response, next: NextFunction) {
        try {
            const data = await DashboardService.getSummary();
            res.status(200).json({ success: true, data });
        } catch (error) {
            next(error);
        }
    }

    static async categoryTotals(req: AuthRequest, res: Response, next: NextFunction) {
        try {
            const data = await DashboardService.getCategoryTotals();
            res.status(200).json({ success: true, data });
        } catch (error) {
            next(error);
        }
    }

    static async recent(req: AuthRequest, res: Response, next: NextFunction) {
        try {
            const data = await DashboardService.getRecentRecords();
            res.status(200).json({ success: true, data });
        } catch (error) {
            next(error);
        }
    }

    static async trends(req: AuthRequest, res: Response, next: NextFunction) {
        try {
            const data = await DashboardService.getMonthlyTrends();
            res.status(200).json({ success: true, data });
        } catch (error) {
            next(error);
        }
    }
}
