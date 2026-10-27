import { Router } from 'express';
import healthRoutes from './healthRoutes.js';
import transactionRoutes from './transactionRoutes.js';
import modelRoutes from './modelRoutes.js';
import authRoutes from './authRoutes.js';
import dashboardRoutes from './dashboardRoutes.js';
import alertRoutes from './alertRoutes.js';
import batchRoutes from './batchRoutes.js';
import adminRoutes from './adminRoutes.js';

const router = Router();

// Versioned Route Mappings (/api/v1/*)
router.use('/auth', authRoutes);
router.use('/admin', adminRoutes);
router.use('/dashboard', dashboardRoutes);
router.use('/alerts', alertRoutes);
router.use('/batch', batchRoutes);
router.use('/health', healthRoutes);
router.use('/transactions', transactionRoutes);
router.use('/models', modelRoutes);

export default router;
