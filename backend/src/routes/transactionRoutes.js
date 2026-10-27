import { Router } from 'express';
import { transactionController } from '../controllers/transactionController.js';
import { validateRequest } from '../middleware/validator.js';
import { authenticate } from '../middleware/auth.js';
import { requireRole } from '../middleware/rbac.js';
import {
  createTransactionSchema,
  listTransactionsQuerySchema,
  transactionIdParamSchema,
} from '../schemas/transactionSchemas.js';

const router = Router();

// Protect all transaction endpoints with JWT authentication
router.use(authenticate);

// POST /api/v1/transactions - Ingest a new transaction
router.post(
  '/',
  requireRole(['ANALYST', 'INVESTIGATOR', 'LEAD', 'ADMIN']),
  validateRequest({ body: createTransactionSchema }),
  (req, res, next) => transactionController.createTransaction(req, res, next)
);

// GET /api/v1/transactions - List transactions with pagination & filters
router.get(
  '/',
  requireRole(['ANALYST', 'INVESTIGATOR', 'LEAD', 'ADMIN']),
  validateRequest({ query: listTransactionsQuerySchema }),
  (req, res, next) => transactionController.listTransactions(req, res, next)
);

// GET /api/v1/transactions/:id - Retrieve transaction by ID
router.get(
  '/:id',
  requireRole(['ANALYST', 'INVESTIGATOR', 'LEAD', 'ADMIN']),
  validateRequest({ params: transactionIdParamSchema }),
  (req, res, next) => transactionController.getTransactionById(req, res, next)
);

export default router;
