import { Request, Response, NextFunction } from 'express';
import { ZodSchema, ZodError } from 'zod';

type RequestLocation = 'body' | 'query' | 'params';

export const validateRequest = (schema: ZodSchema<any>, source: RequestLocation = 'body') => {
    return (req: Request, res: Response, next: NextFunction) => {
        try {
            // Reassigning to req[source] to apply coercions/defaults from Zod schema
            // Express v5 makes req.query (and others) getter-only, so we define it on the instance
            const validatedData = schema.parse(req[source]);
            Object.defineProperty(req, source, {
                value: validatedData,
                writable: true,
                enumerable: true,
                configurable: true
            });
            next();
        } catch (error) {
            if (error instanceof ZodError) {
                return res.status(400).json({
                    success: false,
                    error: 'Validation Error',
                    details: (error as any).issues.map((e: any) => ({
                        path: e.path.join('.'),
                        message: e.message,
                    })),
                });
            }
            next(error);
        }
    };
};
