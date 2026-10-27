import dotenv from 'dotenv';
import { z } from 'zod';

// Load .env file
dotenv.config();

// Schema defining and validating backend environment variables
const envSchema = z.object({
  PORT: z.coerce.number().default(4000),
  NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
  MONGODB_URI: z.string().default('mongodb://127.0.0.1:27017/trace_dev'),
  DATABASE_URL: z.string().optional(),
  FRONTEND_URL: z.string().url('FRONTEND_URL must be a valid URL').default('http://localhost:5173'),
  ML_SERVICE_URL: z.string().url('ML_SERVICE_URL must be a valid URL').default('http://localhost:8000'),
  INTERNAL_SERVICE_KEY: z.string().min(8, 'INTERNAL_SERVICE_KEY must be at least 8 characters long'),
  ML_TIMEOUT_MS: z.coerce.number().default(1500),
  JWT_ACCESS_SECRET: z.string().default('trace_jwt_access_super_secret_key_change_in_production'),
  JWT_ACCESS_EXPIRES_IN: z.string().default('15m'),
  JWT_REFRESH_EXPIRES_DAYS: z.coerce.number().default(7),
});

let env;
try {
  env = envSchema.parse(process.env);
} catch (error) {
  if (error instanceof z.ZodError) {
    const formattedErrors = error.errors.map((e) => `  - ${e.path.join('.')}: ${e.message}`).join('\n');
    console.error('CRITICAL: Environment variable validation failed:\n' + formattedErrors);
  }
  throw error;
}

export default env;
