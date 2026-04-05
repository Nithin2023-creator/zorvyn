import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import { z } from 'zod';
import { Role } from '@prisma/client';
import { prisma } from '../prisma/client';
import { config } from '../config/env';
import { AppError } from '../middlewares/errorHandler';
import { registerSchema, loginSchema, createUserSchema } from '../validations/userValidations';

export class UserService {
    static async register(data: z.infer<typeof registerSchema>) {
        const existing = await prisma.user.findUnique({
            where: { email: data.email }
        });

        if (existing) {
            throw new AppError(400, 'User with this email already exists');
        }

        const passwordHash = await bcrypt.hash(data.password, config.BCRYPT_SALT_ROUNDS);

        const user = await prisma.user.create({
            data: {
                name: data.name,
                email: data.email,
                passwordHash,
            }
        });

        const token = jwt.sign(
            { userId: user.id, email: user.email, role: user.role },
            config.JWT_SECRET,
            { expiresIn: config.JWT_EXPIRES_IN as any }
        );

        const { passwordHash: _, ...userWithoutPassword } = user;
        return { user: userWithoutPassword, token };
    }

    static async login(data: z.infer<typeof loginSchema>) {
        const user = await prisma.user.findUnique({
            where: { email: data.email }
        });

        if (!user) {
            throw new AppError(401, 'Invalid credentials');
        }

        if (!user.isActive) {
            throw new AppError(403, 'Your account has been deactivated');
        }

        const validPassword = await bcrypt.compare(data.password, user.passwordHash);
        if (!validPassword) {
            throw new AppError(401, 'Invalid credentials');
        }

        const token = jwt.sign(
            { userId: user.id, email: user.email, role: user.role },
            config.JWT_SECRET,
            { expiresIn: config.JWT_EXPIRES_IN as any }
        );

        const { passwordHash: _, ...userWithoutPassword } = user;
        return { user: userWithoutPassword, token };
    }

    static async listUsers() {
        return prisma.user.findMany({
            select: {
                id: true,
                name: true,
                email: true,
                role: true,
                isActive: true,
                createdAt: true,
                updatedAt: true,
            },
            orderBy: { createdAt: 'desc' }
        });
    }

    static async createUser(data: z.infer<typeof createUserSchema>) {
        const existing = await prisma.user.findUnique({
            where: { email: data.email }
        });

        if (existing) {
            throw new AppError(400, 'User with this email already exists');
        }

        const passwordHash = await bcrypt.hash(data.password, config.BCRYPT_SALT_ROUNDS);

        const user = await prisma.user.create({
            data: {
                name: data.name,
                email: data.email,
                passwordHash,
                role: data.role || Role.VIEWER,
            },
            select: {
                id: true,
                name: true,
                email: true,
                role: true,
                isActive: true,
                createdAt: true,
            }
        });

        return user;
    }

    static async updateRole(userId: string, role: Role) {
        try {
            const user = await prisma.user.update({
                where: { id: userId },
                data: { role },
                select: { id: true, name: true, email: true, role: true, isActive: true }
            });
            return user;
        } catch (error) {
            throw new AppError(404, 'User not found');
        }
    }

    static async updateStatus(userId: string, isActive: boolean) {
        try {
            const user = await prisma.user.update({
                where: { id: userId },
                data: { isActive },
                select: { id: true, name: true, email: true, role: true, isActive: true }
            });
            return user;
        } catch (error) {
            throw new AppError(404, 'User not found');
        }
    }

    static async getById(userId: string) {
        const user = await prisma.user.findUnique({
            where: { id: userId },
            select: {
                id: true,
                name: true,
                email: true,
                role: true,
                isActive: true,
                createdAt: true,
                updatedAt: true,
            }
        });

        if (!user) {
            throw new AppError(404, 'User not found');
        }

        return user;
    }
}
