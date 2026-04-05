import { Request } from 'express';
import { Role } from '@prisma/client';

export interface JwtPayload {
    userId: string;
    email: string;
    role: Role;
}

export interface AuthRequest extends Request {
    user?: JwtPayload;
}

export interface ApiResponse<T = any> {
    success: boolean;
    data?: T;
    error?: string;
    details?: any;
    meta?: {
        page: number;
        limit: number;
        total: number;
        totalPages: number;
    };
}
