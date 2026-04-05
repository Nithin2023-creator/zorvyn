import { Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { prisma } from '../prisma/client';
import { config } from '../config/env';
import { AuthRequest, JwtPayload } from '../types';

export const authGuard = async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
        const authHeader = req.headers.authorization;
        if (!authHeader || !authHeader.startsWith('Bearer ')) {
            return res.status(401).json({ success: false, error: 'Unauthorized: Missing or invalid token format' });
        }

        const token = authHeader.split(' ')[1];

        // Explicitly type the result of jwt.verify
        const decoded = jwt.verify(token, config.JWT_SECRET) as JwtPayload;

        // Check if user still exists and is active
        const user = await prisma.user.findUnique({
            where: { id: decoded.userId },
            select: { id: true, isActive: true }
        });

        if (!user) {
            return res.status(401).json({ success: false, error: 'Unauthorized: User no longer exists' });
        }

        if (!user.isActive) {
            return res.status(403).json({ success: false, error: 'Forbidden: Account is inactive' });
        }

        // Attach decoded user safely
        req.user = decoded;
        next();
    } catch (error) {
        if (error instanceof jwt.TokenExpiredError) {
            return res.status(401).json({ success: false, error: 'Unauthorized: Token expired' });
        }
        if (error instanceof jwt.JsonWebTokenError) {
            return res.status(401).json({ success: false, error: 'Unauthorized: Invalid token' });
        }
        next(error);
    }
};
