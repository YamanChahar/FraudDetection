import { z } from 'zod';
import { USER_ROLES } from '../models/User.model.js';

export const registerSchema = z.object({
  name: z
    .string()
    .min(2, 'Name must be at least 2 characters')
    .max(100, 'Name cannot exceed 100 characters')
    .trim()
    .optional(),
  fullName: z
    .string()
    .min(2, 'Full name must be at least 2 characters')
    .max(100, 'Full name cannot exceed 100 characters')
    .trim()
    .optional(),
  email: z
    .string()
    .email('Invalid email address format')
    .toLowerCase()
    .trim(),
  password: z
    .string()
    .min(8, 'Password must be at least 8 characters long')
    .max(128, 'Password cannot exceed 128 characters')
    .regex(/[A-Z]/, 'Password must contain at least one uppercase letter')
    .regex(/[a-z]/, 'Password must contain at least one lowercase letter')
    .regex(/[0-9]/, 'Password must contain at least one number'),
  role: z
    .string()
    .transform((val) => val.toUpperCase())
    .pipe(z.enum(USER_ROLES))
    .optional()
    .default('ANALYST'),
}).transform((data) => {
  const resolvedName = data.name || data.fullName;
  if (!resolvedName) {
    throw new z.ZodError([
      {
        code: z.ZodIssueCode.custom,
        path: ['name'],
        message: 'Name is required',
      },
    ]);
  }
  return {
    ...data,
    name: resolvedName,
  };
});

export const loginSchema = z.object({
  email: z.string().email('Invalid email address format').toLowerCase().trim(),
  password: z.string().min(1, 'Password is required'),
});

export const refreshSchema = z.object({
  refreshToken: z.string().min(1, 'Refresh token is required'),
});

export const logoutSchema = z.object({
  refreshToken: z.string().optional(),
});
