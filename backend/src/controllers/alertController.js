import { alertService } from '../services/alertService.js';
import { successResponse } from '../utils/responseEnvelope.js';

export class AlertController {
  async listAlerts(req, res, next) {
    try {
      const result = await alertService.listAlerts(req.query);
      res.status(200).json(
        successResponse(result.alerts, {
          requestId: req.id,
          pagination: result.pagination,
        })
      );
    } catch (error) {
      next(error);
    }
  }

  async getAlertById(req, res, next) {
    try {
      const alert = await alertService.getAlertById(req.params.id);
      res.status(200).json(successResponse(alert, { requestId: req.id }));
    } catch (error) {
      next(error);
    }
  }

  async updateStatus(req, res, next) {
    try {
      const { status } = req.body;
      if (!status) {
        return res.status(422).json({
          success: false,
          error: { code: 'VALIDATION_ERROR', message: 'Status is required' },
        });
      }
      const updated = await alertService.updateStatus(req.params.id, status, req.user?.id || null);
      res.status(200).json(successResponse(updated, { requestId: req.id }));
    } catch (error) {
      next(error);
    }
  }

  async assignAlert(req, res, next) {
    try {
      const { assignedToId } = req.body;
      const updated = await alertService.assignAlert(req.params.id, assignedToId, req.user?.id || null);
      res.status(200).json(successResponse(updated, { requestId: req.id }));
    } catch (error) {
      next(error);
    }
  }

  async recordInvestigation(req, res, next) {
    try {
      const { findings, decision, isFraud, resolution } = req.body;
      if (!findings) {
        return res.status(422).json({
          success: false,
          error: { code: 'VALIDATION_ERROR', message: 'Investigation findings are required' },
        });
      }
      const record = await alertService.recordInvestigation(
        req.params.id,
        { findings, decision, isFraud, resolution },
        req.user?.id || null
      );
      res.status(201).json(successResponse(record, { requestId: req.id }));
    } catch (error) {
      next(error);
    }
  }
}

export const alertController = new AlertController();
