import { z } from 'zod';

export const modelIdParamSchema = z.object({
  id: z.string().regex(/^[0-9a-fA-F]{24}$/, 'Model Version ID must be a valid 24-character ObjectId'),
});

export const listModelsQuerySchema = z.object({
  status: z.enum(['DEVELOPMENT', 'VALIDATION', 'CHAMPION', 'CHALLENGER', 'ARCHIVED']).optional(),
  isActive: z.coerce.boolean().optional(),
});
