import { transactionService } from '../services/transactionService.js';
import { successResponse } from '../utils/responseEnvelope.js';

export class TransactionController {
  /**
   * Ingests a new transaction: POST /api/v1/transactions
   */
  async createTransaction(req, res, next) {
    try {
      const transaction = await transactionService.createTransaction(req.body, req.user?.id || null);
      res.status(201).json(
        successResponse(transaction, { requestId: req.id })
      );
    } catch (error) {
      next(error);
    }
  }

  /**
   * Retrieves a single transaction: GET /api/v1/transactions/:id
   */
  async getTransactionById(req, res, next) {
    try {
      const transaction = await transactionService.getTransactionById(req.params.id);
      res.status(200).json(
        successResponse(transaction, { requestId: req.id })
      );
    } catch (error) {
      next(error);
    }
  }

  /**
   * Lists transactions with pagination & filters: GET /api/v1/transactions
   */
  async listTransactions(req, res, next) {
    try {
      const result = await transactionService.listTransactions(req.query);
      res.status(200).json(
        successResponse(result.transactions, {
          requestId: req.id,
          pagination: result.pagination,
        })
      );
    } catch (error) {
      next(error);
    }
  }
}

export const transactionController = new TransactionController();
