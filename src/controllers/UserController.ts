import { Request, Response, NextFunction } from 'express';
import { UserService } from '../services/UserService';
import { Role } from '@prisma/client';

export class UserController {
    static async register(req: Request, res: Response, next: NextFunction) {
        try {
            const data = await UserService.register(req.body);
            res.status(201).json({ success: true, data });
        } catch (error) {
            next(error);
        }
    }

    static async login(req: Request, res: Response, next: NextFunction) {
        try {
            const data = await UserService.login(req.body);
            res.status(200).json({ success: true, data });
        } catch (error) {
            next(error);
        }
    }

    static async listUsers(req: Request, res: Response, next: NextFunction) {
        try {
            const data = await UserService.listUsers();
            res.status(200).json({ success: true, data });
        } catch (error) {
            next(error);
        }
    }

    static async createUser(req: Request, res: Response, next: NextFunction) {
        try {
            const data = await UserService.createUser(req.body);
            res.status(201).json({ success: true, data });
        } catch (error) {
            next(error);
        }
    }

    static async updateRole(req: Request, res: Response, next: NextFunction) {
        try {
            const id = req.params.id as string;
            const { role } = req.body as { role: Role };
            const data = await UserService.updateRole(id, role);
            res.status(200).json({ success: true, data });
        } catch (error) {
            next(error);
        }
    }

    static async updateStatus(req: Request, res: Response, next: NextFunction) {
        try {
            const id = req.params.id as string;
            const { isActive } = req.body as { isActive: boolean };
            const data = await UserService.updateStatus(id, isActive);
            res.status(200).json({ success: true, data });
        } catch (error) {
            next(error);
        }
    }

    static async getUser(req: Request, res: Response, next: NextFunction) {
        try {
            const id = req.params.id as string;
            const data = await UserService.getById(id);
            res.status(200).json({ success: true, data });
        } catch (error) {
            next(error);
        }
    }
}
