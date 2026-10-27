import { Router } from 'express';
import { adminController } from '../controllers/adminController.js';
import { authenticate } from '../middleware/auth.js';
import { requireRole } from '../middleware/rbac.js';

const router = Router();

router.use(authenticate);

// User Management (Admin only)
router.get('/users', requireRole(['ADMIN']), adminController.listUsers);
router.patch('/users/:id/role', requireRole(['ADMIN']), adminController.updateUserRole);

// Audit Logs (Lead & Admin)
router.get('/audit-logs', requireRole(['LEAD', 'ADMIN']), adminController.listAuditLogs);

export default router;
