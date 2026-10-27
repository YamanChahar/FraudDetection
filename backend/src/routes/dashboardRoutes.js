import { Router } from 'express';
import { getOverview } from '../controllers/dashboardController.js';
import { authenticate } from '../middleware/auth.js';
import { requireRole } from '../middleware/rbac.js';

const router = Router();

// Overview Dashboard Endpoint (Accessible to all authenticated analytical roles)
router.get(
  '/overview',
  authenticate,
  requireRole(['ANALYST', 'INVESTIGATOR', 'LEAD', 'ADMIN']),
  getOverview
);

export default router;
