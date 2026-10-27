import mongoose from 'mongoose';

export const MODEL_STATUSES = ['DEVELOPMENT', 'VALIDATION', 'CHAMPION', 'CHALLENGER', 'ARCHIVED'];

const modelVersionSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'Model name is required'],
      trim: true,
      maxlength: 100,
    },
    version: {
      type: String,
      required: [true, 'Model version string is required'],
      trim: true,
      maxlength: 50,
    },
    algorithm: {
      type: String,
      required: [true, 'Model algorithm identifier is required'],
      trim: true,
      maxlength: 50,
    },
    status: {
      type: String,
      enum: {
        values: MODEL_STATUSES,
        message: '{VALUE} is not a valid model status',
      },
      default: 'DEVELOPMENT',
    },
    metrics: {
      type: mongoose.Schema.Types.Mixed,
      default: {},
    },
    artifactReference: {
      type: String,
      trim: true,
      maxlength: 500,
    },
    inputSchema: {
      type: mongoose.Schema.Types.Mixed,
      default: {},
    },
    isActive: {
      type: Boolean,
      default: true,
    },
    deployedAt: {
      type: Date,
      default: null,
    },
  },
  {
    timestamps: true,
    collection: 'model_versions',
  }
);

// Unique composite index for model name and version
modelVersionSchema.index({ name: 1, version: 1 }, { unique: true });
modelVersionSchema.index({ status: 1 });
modelVersionSchema.index({ isActive: 1 });

export const ModelVersion = mongoose.model('ModelVersion', modelVersionSchema);
export default ModelVersion;
