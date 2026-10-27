import { modelService } from '../services/modelService.js';
import { successResponse } from '../utils/responseEnvelope.js';

export class ModelController {
  /**
   * Lists model versions: GET /api/v1/models
   */
  async listModels(req, res, next) {
    try {
      const models = await modelService.listModels(req.query);
      res.status(200).json(
        successResponse(models, { requestId: req.id })
      );
    } catch (error) {
      next(error);
    }
  }

  /**
   * Retrieves a specific model version: GET /api/v1/models/:id
   */
  async getModelById(req, res, next) {
    try {
      const model = await modelService.getModelById(req.params.id);
      res.status(200).json(
        successResponse(model, { requestId: req.id })
      );
    } catch (error) {
      next(error);
    }
  }
}

export const modelController = new ModelController();
