import mongoose from 'mongoose';
import { ModelVersion } from '../models/ModelVersion.model.js';
import { Prediction } from '../models/Prediction.model.js';

export class ModelRepository {
  /**
   * Retrieves all model versions, optionally filtered by status
   */
  async findAll(filter = {}) {
    const query = {};
    if (filter.status) {
      query.status = filter.status;
    }
    if (filter.isActive !== undefined) {
      query.isActive = filter.isActive;
    }

    const docs = await ModelVersion.find(query)
      .sort({ createdAt: -1 })
      .select('name version algorithm status metrics artifactReference isActive createdAt updatedAt')
      .lean();

    return docs.map((doc) => {
      doc.id = doc._id.toString();
      return doc;
    });
  }

  /**
   * Retrieves a specific model version by ID
   */
  async findById(id) {
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return null;
    }

    const doc = await ModelVersion.findById(id).lean();
    if (!doc) return null;

    doc.id = doc._id.toString();

    // Count predictions made with this model version
    const predictionCount = await Prediction.countDocuments({ modelVersionId: doc._id });
    doc._count = { predictions: predictionCount };

    return doc;
  }

  /**
   * Retrieves a specific model version by name and version string
   */
  async findByVersion(version, name) {
    const query = { version };
    if (name) query.name = name;
    const doc = await ModelVersion.findOne(query).lean();
    if (!doc) return null;
    doc.id = doc._id.toString();
    return doc;
  }

  /**
   * Creates a new model version
   */
  async create(data) {
    const created = await ModelVersion.create(data);
    const doc = created.toJSON();
    doc.id = created._id.toString();
    return doc;
  }
}

export const modelRepository = new ModelRepository();
