import { Router } from 'express';
import { getHealth, getDatabaseHealth } from '../controllers/healthController.js';

const router = Router();

// GET /api/v1/health - Overall system health
router.get('/', getHealth);

// GET /api/v1/health/database - Dedicated database connectivity check
router.get('/database', getDatabaseHealth);

export default router;
