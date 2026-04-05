import { Router } from 'express';
import { UserController } from '../controllers/UserController';
import { authGuard } from '../middlewares/authGuard';
import { roleGuard } from '../middlewares/roleGuard';
import { validateRequest } from '../middlewares/validateRequest';
import {
    registerSchema,
    loginSchema,
    createUserSchema,
    updateRoleSchema,
    updateStatusSchema
} from '../validations/userValidations';
import { Role } from '@prisma/client';

const authRouter = Router();

// Public auth routes
authRouter.post('/register', validateRequest(registerSchema), UserController.register);
authRouter.post('/login', validateRequest(loginSchema), UserController.login);

const userRouter = Router();

// Admin-only user management routes
userRouter.use(authGuard);
userRouter.use(roleGuard(Role.ADMIN));

userRouter.post('/', validateRequest(createUserSchema), UserController.createUser);
userRouter.get('/', UserController.listUsers);
userRouter.get('/:id', UserController.getUser);
userRouter.put('/:id/role', validateRequest(updateRoleSchema), UserController.updateRole);
userRouter.put('/:id/status', validateRequest(updateStatusSchema), UserController.updateStatus);

export { authRouter, userRouter };
