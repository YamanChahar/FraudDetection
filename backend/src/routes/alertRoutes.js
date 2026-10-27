import { Router } from 'express';
import { alertController } from '../controllers/alertController.js';
import { authenticate } from '../middleware/auth.js';
import { requireRole } from '../middleware/rbac.js';

const router = Router();

// All alert routes require authentication
router.use(authenticate);

// List & Detail
router.get('/', requireRole(['ANALYST', 'INVESTIGATOR', 'LEAD', 'ADMIN']), alertController.listAlerts);
router.get('/:id', requireRole(['ANALYST', 'INVESTIGATOR', 'LEAD', 'ADMIN']), alertController.getAlertById);

// Status Update, Assignment, Investigation Findings (Restricted to Investigator, Lead, Admin)
router.patch('/:id/status', requireRole(['INVESTIGATOR', 'LEAD', 'ADMIN']), alertController.updateStatus);
router.post('/:id/assign', requireRole(['INVESTIGATOR', 'LEAD', 'ADMIN']), alertController.assignAlert);
router.post('/:id/investigate', requireRole(['INVESTIGATOR', 'LEAD', 'ADMIN']), alertController.recordInvestigation);

export default router;
