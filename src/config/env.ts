import { config as dotenvConfig } from 'dotenv';
import { z } from 'zod';

// Load .env file
dotenvConfig();

// Define the schema for environment variables
const envSchema = z.object({
    NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
    PORT: z.coerce.number().default(3000),
    DATABASE_URL: z.string().min(1, 'DATABASE_URL is required'),
    JWT_SECRET: z.string().min(1, 'JWT_SECRET is required'),
    JWT_EXPIRES_IN: z.string().default('24h'),
    BCRYPT_SALT_ROUNDS: z.coerce.number().default(12),
});

// Validate process.env
const _env = envSchema.safeParse(process.env);

if (!_env.success) {
    console.error('❌ Invalid environment variables:');
    console.error(_env.error.format());
    process.exit(1);
}

// Export the typed config object
export const config = _env.data as z.infer<typeof envSchema>;
