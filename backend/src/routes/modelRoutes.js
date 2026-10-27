import { Router } from 'express';
import { modelController } from '../controllers/modelController.js';
import { validateRequest } from '../middleware/validator.js';
import { authenticate } from '../middleware/auth.js';
import { requireRole } from '../middleware/rbac.js';
import { modelIdParamSchema, listModelsQuerySchema } from '../schemas/modelSchemas.js';

const router = Router();

// Protect all model endpoints with JWT authentication
router.use(authenticate);

// GET /api/v1/models - List registered model versions
router.get(
  '/',
  requireRole(['ANALYST', 'INVESTIGATOR', 'LEAD', 'ADMIN']),
  validateRequest({ query: listModelsQuerySchema }),
  (req, res, next) => modelController.listModels(req, res, next)
);

// GET /api/v1/models/:id - Retrieve specific model version
router.get(
  '/:id',
  requireRole(['ANALYST', 'INVESTIGATOR', 'LEAD', 'ADMIN']),
  validateRequest({ params: modelIdParamSchema }),
  (req, res, next) => modelController.getModelById(req, res, next)
);

export default router;
