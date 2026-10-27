import { z } from 'zod';

export const createTransactionSchema = z.object({
  externalTransactionId: z
    .string()
    .min(1, 'externalTransactionId cannot be empty')
    .max(128, 'externalTransactionId cannot exceed 128 characters'),
  amount: z
    .union([z.number(), z.string()])
    .transform((val) => Number(val))
    .refine((val) => !isNaN(val) && val > 0, {
      message: 'amount must be a positive number greater than 0',
    }),
  currency: z
    .string()
    .length(3, 'currency must be a 3-letter ISO code')
    .toUpperCase()
    .default('USD'),
  transactionTimestamp: z
    .string()
    .datetime({ message: 'transactionTimestamp must be a valid ISO 8601 datetime' })
    .default(() => new Date().toISOString()),
  merchantId: z.string().max(128).optional(),
  merchantName: z.string().max(150).optional(),
  merchantCategory: z.string().max(64).optional(),
  customerId: z.string().max(128).optional(),
  customerEmail: z.string().email().optional(),
  customerPhone: z.string().max(32).optional(),
  channel: z.string().max(32).optional(),
  cardPresent: z.boolean().optional(),
  deviceId: z.string().max(128).optional(),
  ipAddress: z.string().max(45).optional(),
  location: z.record(z.any()).optional(),
  metadata: z.record(z.any()).default({}),
  userId: z.string().regex(/^[0-9a-fA-F]{24}$/, 'userId must be a valid 24-character ObjectId').optional(),
});

export const listTransactionsQuerySchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(25),
  customerId: z.string().optional(),
  merchantCategory: z.string().optional(),
  currency: z.string().length(3).toUpperCase().optional(),
  channel: z.string().optional(),
  minAmount: z.coerce.number().positive().optional(),
  maxAmount: z.coerce.number().positive().optional(),
  startDate: z.string().datetime().optional(),
  endDate: z.string().datetime().optional(),
});

export const transactionIdParamSchema = z.object({
  id: z.string().regex(/^[0-9a-fA-F]{24}$/, 'Transaction ID must be a valid 24-character ObjectId'),
});
