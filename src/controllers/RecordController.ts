import { Response, NextFunction } from 'express';
import { RecordService } from '../services/RecordService';
import { AuthRequest } from '../types';

export class RecordController {
    static async create(req: AuthRequest, res: Response, next: NextFunction) {
        try {
            // User ID is guaranteed by authGuard
            const userId = req.user!.userId;
            const data = await RecordService.create(userId, req.body);
            res.status(201).json({ success: true, data });
        } catch (error) {
            next(error);
        }
    }

    static async list(req: AuthRequest, res: Response, next: NextFunction) {
        try {
            const { records, meta } = await RecordService.list(req.query as any);
            res.status(200).json({ success: true, data: records, meta });
        } catch (error) {
            next(error);
        }
    }

    static async update(req: AuthRequest, res: Response, next: NextFunction) {
        try {
            const id = req.params.id as string;
            const data = await RecordService.update(id, req.body);
            res.status(200).json({ success: true, data });
        } catch (error) {
            next(error);
        }
    }

    static async remove(req: AuthRequest, res: Response, next: NextFunction) {
        try {
            const id = req.params.id as string;
            await RecordService.softDelete(id);
            res.status(200).json({ success: true, data: { message: 'Record deleted successfully' } });
        } catch (error) {
            next(error);
        }
    }

    static async getById(req: AuthRequest, res: Response, next: NextFunction) {
        try {
            const id = req.params.id as string;
            const data = await RecordService.getById(id);
            res.status(200).json({ success: true, data });
        } catch (error) {
            next(error);
        }
    }
}
