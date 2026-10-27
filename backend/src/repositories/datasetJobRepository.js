import mongoose from 'mongoose';
import { DatasetTestingJob } from '../models/DatasetTestingJob.model.js';

export class DatasetJobRepository {
  async findById(id) {
    if (!mongoose.Types.ObjectId.isValid(id)) return null;
    const doc = await DatasetTestingJob.findById(id).lean();
    if (!doc) return null;
    doc.id = doc._id.toString();
    return doc;
  }

  async create(data) {
    const created = await DatasetTestingJob.create({
      datasetName: data.datasetName,
      datasetFormat: data.datasetFormat || 'CSV',
      datasetPath: data.datasetPath || null,
      status: data.status || 'QUEUED',
      totalRecords: data.totalRecords || 0,
      processedRecords: data.processedRecords || 0,
      failedRecords: data.failedRecords || 0,
      fraudCount: data.fraudCount || 0,
      results: data.results || {},
      errorDetails: data.errorDetails || null,
      createdById: data.createdById && mongoose.Types.ObjectId.isValid(data.createdById) ? new mongoose.Types.ObjectId(data.createdById) : null,
    });
    const doc = created.toJSON();
    doc.id = created._id.toString();
    return doc;
  }
}

export const datasetJobRepository = new DatasetJobRepository();
