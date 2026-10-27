import { batchService } from '../services/batchService.js';
import { successResponse } from '../utils/responseEnvelope.js';

export class BatchController {
  async createJob(req, res, next) {
    try {
      const { datasetName, records } = req.body;
      const job = await batchService.createAndRunJob({ datasetName, records }, req.user?.id || null);
      res.status(202).json(successResponse(job, { requestId: req.id }));
    } catch (error) {
      next(error);
    }
  }

  async getJobById(req, res, next) {
    try {
      const job = await batchService.getJobById(req.params.id);
      res.status(200).json(successResponse(job, { requestId: req.id }));
    } catch (error) {
      next(error);
    }
  }

  async listJobs(req, res, next) {
    try {
      const jobs = await batchService.listJobs();
      res.status(200).json(successResponse(jobs, { requestId: req.id }));
    } catch (error) {
      next(error);
    }
  }
}

export const batchController = new BatchController();
