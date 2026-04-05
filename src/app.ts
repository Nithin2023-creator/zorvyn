import express from 'express';
import path from 'path';
import cors from 'cors';
import { rateLimit } from 'express-rate-limit';
import swaggerUi from 'swagger-ui-express';
import { config } from './config/env';
import { errorHandler } from './middlewares/errorHandler';
import { authRouter, userRouter } from './routes/userRoutes';
import { recordRoutes } from './routes/recordRoutes';
import { dashboardRoutes } from './routes/dashboardRoutes';
import { swaggerSpec } from './swagger/swagger';

const app = express();

// Global Middlewares
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Swagger Documentation UI
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec));

/**
 * @swagger
 * /health:
 *   get:
 *     summary: Returns API operational status
 *     security: []
 *     responses:
 *       200:
 *         description: Server is healthy and running
 */
app.get('/api/health', (req, res) => {
    res.status(200).json({ status: 'ok', timestamp: new Date() });
});

// Rate Limiter for Auth Routes
const authRateLimiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 100, // limit each IP to 100 requests per windowMs
    message: { success: false, error: 'Too many requests, please try again later' },
    standardHeaders: true,
    legacyHeaders: false,
});

// Primary API Route mounting
app.use('/api/auth', authRateLimiter, authRouter);
app.use('/api/users', userRouter);
app.use('/api/records', recordRoutes);
app.use('/api/dashboard', dashboardRoutes);

// Serve Frontend SPA
app.use(express.static(path.join(__dirname, '../client')));

// Global Error Handler (Must be defined absolutely last in the middleware chain)
app.use(errorHandler);

// Start HTTP Server
app.listen(config.PORT, () => {
    console.log(`🚀 Server is running on http://localhost:${config.PORT}`);
    console.log(`📖 Swagger UI available at http://localhost:${config.PORT}/api-docs`);
});
