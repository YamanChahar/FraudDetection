import { DatasetTestingJob } from '../models/DatasetTestingJob.model.js';
import { batchPredict } from './mlClientService.js';
import { auditService } from './auditService.js';

export class BatchService {
  /**
   * Creates and executes a persistent batch dataset testing job
   */
  async createAndRunJob({ datasetName = 'Batch_Dataset.csv', records = [] }, actorId = null) {
    if (!Array.isArray(records) || records.length === 0) {
      const err = new Error('Dataset must contain at least one valid record row');
      err.status = 422;
      throw err;
    }

    if (records.length > 25000) {
      const err = new Error('Dataset exceeds maximum batch limit of 25,000 records per job');
      err.status = 422;
      throw err;
    }

    // 1. Create persistent job record in MongoDB
    const job = await DatasetTestingJob.create({
      datasetName,
      datasetFormat: 'CSV',
      status: 'QUEUED',
      totalRecords: records.length,
      processedRecords: 0,
      failedRecords: 0,
      fraudCount: 0,
      createdById: actorId,
    });

    // 2. Trigger asynchronous bounded execution
    this.processBatchJob(job._id, records, actorId).catch((err) => {
      console.error(`[TRACE Batch] Background job ${job._id} failed:`, err);
    });

    return job.toJSON();
  }

  /**
   * Bounded background execution of dataset inference
   */
  async processBatchJob(jobId, records, actorId) {
    const job = await DatasetTestingJob.findById(jobId);
    if (!job) return;

    job.status = 'PROCESSING';
    job.startedAt = new Date();
    await job.save();

    const CHUNK_SIZE = 100;
    const allPredictions = [];
    let failedCount = 0;
    const startTime = Date.now();

    try {
      for (let i = 0; i < records.length; i += CHUNK_SIZE) {
        const chunk = records.slice(i, i + CHUNK_SIZE);
        try {
          const res = await batchPredict(chunk);
          if (res && res.predictions) {
            allPredictions.push(...res.predictions);
            job.processedRecords = allPredictions.length;
            await job.save();
          }
        } catch (chunkErr) {
          console.warn(`[TRACE Batch] Chunk ${i}-${i + CHUNK_SIZE} inference error: ${chunkErr.message}`);
          failedCount += chunk.length;
        }
      }

      // Aggregate Risk Distribution
      const riskCounts = { LOW: 0, MEDIUM: 0, HIGH: 0, CRITICAL: 0 };
      allPredictions.forEach((p) => {
        const level = p.risk_level || 'LOW';
        riskCounts[level] = (riskCounts[level] || 0) + 1;
      });

      const highAndCritical = (riskCounts.HIGH || 0) + (riskCounts.CRITICAL || 0);

      // Evaluate metrics if ground-truth labels exist
      let groundTruthEvaluation = null;
      const hasLabels = records.some((r) => r.Class !== undefined || r.class !== undefined);
      if (hasLabels) {
        let tp = 0, fp = 0, tn = 0, fn = 0;
        records.forEach((r, idx) => {
          const actual = Number(r.Class ?? r.class ?? 0);
          const pred = allPredictions[idx]?.prediction_label ?? 0;
          if (actual === 1 && pred === 1) tp++;
          else if (actual === 0 && pred === 1) fp++;
          else if (actual === 0 && pred === 0) tn++;
          else if (actual === 1 && pred === 0) fn++;
        });

        const precision = (tp + fp) > 0 ? tp / (tp + fp) : 0;
        const recall = (tp + fn) > 0 ? tp / (tp + fn) : 0;
        const f1 = (precision + recall) > 0 ? (2 * precision * recall) / (precision + recall) : 0;

        groundTruthEvaluation = {
          hasGroundTruth: true,
          precision: Math.round(precision * 10000) / 10000,
          recall: Math.round(recall * 10000) / 10000,
          f1_score: Math.round(f1 * 10000) / 10000,
          confusion_matrix: { tp, fp, tn, fn },
        };
      }

      job.status = 'COMPLETED';
      job.completedAt = new Date();
      job.processedRecords = allPredictions.length;
      job.failedRecords = failedCount;
      job.fraudCount = highAndCritical;
      job.results = {
        durationMs: Date.now() - startTime,
        riskDistribution: riskCounts,
        predictionsSummary: allPredictions.slice(0, 50), // Sample for preview
        evaluation: groundTruthEvaluation,
      };

      await job.save();

      await auditService.logAction({
        actorId,
        action: 'DATASET_TESTING_JOB_COMPLETED',
        entityType: 'DatasetTestingJob',
        entityId: job._id,
        metadata: {
          total: records.length,
          processed: allPredictions.length,
          fraudCount: highAndCritical,
        },
      });
    } catch (jobErr) {
      job.status = 'FAILED';
      job.errorDetails = jobErr.message;
      job.completedAt = new Date();
      await job.save();
    }
  }

  async getJobById(id) {
    const job = await DatasetTestingJob.findById(id).lean();
    if (!job) {
      const err = new Error('Batch job not found');
      err.status = 404;
      throw err;
    }
    return { ...job, id: job._id.toString() };
  }

  async listJobs() {
    const jobs = await DatasetTestingJob.find()
      .sort({ createdAt: -1 })
      .limit(20)
      .lean();
    return jobs.map((j) => ({ ...j, id: j._id.toString() }));
  }
}

export const batchService = new BatchService();
