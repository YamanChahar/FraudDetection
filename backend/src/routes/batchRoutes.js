import { Router } from 'express';
import { batchController } from '../controllers/batchController.js';
import { authenticate } from '../middleware/auth.js';
import { requireRole } from '../middleware/rbac.js';

const router = Router();

router.use(authenticate);
router.use(requireRole(['INVESTIGATOR', 'LEAD', 'ADMIN']));

router.post('/jobs', batchController.createJob);
router.get('/jobs', batchController.listJobs);
router.get('/jobs/:id', batchController.getJobById);

export default router;
