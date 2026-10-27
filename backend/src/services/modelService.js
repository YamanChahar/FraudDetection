import { modelRepository } from '../repositories/modelRepository.js';
import { getModelMetadata } from './mlClientService.js';

export class ModelService {
  /**
   * Lists registered model versions, automatically syncing with ML service if empty
   */
  async listModels(filter = {}) {
    let models = await modelRepository.findAll(filter);
    if (models.length === 0) {
      try {
        const meta = await getModelMetadata();
        if (meta && meta.model_version) {
          // Upsert champion model
          const champion = await modelRepository.create({
            name: meta.model_name || 'Champion Model',
            version: meta.model_version,
            algorithm: meta.algorithm || 'LOGISTIC_REGRESSION',
            status: 'CHAMPION',
            metrics: meta.metrics || {},
            isActive: true,
            deployedAt: new Date(meta.created_at || Date.now()),
          });
          models = [champion];

          // Also register challenger candidates for comparison
          if (Array.isArray(meta.all_candidates)) {
            for (const cand of meta.all_candidates) {
              if (cand.name !== meta.model_name) {
                await modelRepository.create({
                  name: cand.name,
                  version: 'v1.1.0-challenger',
                  algorithm: cand.algorithm,
                  status: 'CHALLENGER',
                  metrics: cand.metrics || {},
                  isActive: false,
                }).catch(() => {});
              }
            }
            models = await modelRepository.findAll(filter);
          }
        }
      } catch (err) {
        console.warn(`[TRACE Model] Unable to sync metadata from ML service: ${err.message}`);
      }
    }
    return models;
  }

  /**
   * Retrieves a single model version by ID
   */
  async getModelById(id) {
    const model = await modelRepository.findById(id);
    if (!model) {
      const error = new Error(`ModelVersion with ID '${id}' not found`);
      error.code = 'RESOURCE_NOT_FOUND';
      error.status = 404;
      throw error;
    }
    return model;
  }
}

export const modelService = new ModelService();
