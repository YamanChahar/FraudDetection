import mongoose from 'mongoose';

export const JOB_STATUSES = ['QUEUED', 'PROCESSING', 'COMPLETED', 'FAILED'];

const datasetTestingJobSchema = new mongoose.Schema(
  {
    datasetName: {
      type: String,
      required: [true, 'Dataset name is required'],
      trim: true,
      maxlength: 150,
    },
    datasetFormat: {
      type: String,
      default: 'CSV',
      trim: true,
      uppercase: true,
      maxlength: 20,
    },
    datasetPath: {
      type: String,
      trim: true,
      maxlength: 500,
    },
    status: {
      type: String,
      enum: {
        values: JOB_STATUSES,
        message: '{VALUE} is not a valid dataset job status',
      },
      default: 'QUEUED',
    },
    totalRecords: {
      type: Number,
      default: 0,
      min: 0,
    },
    processedRecords: {
      type: Number,
      default: 0,
      min: 0,
    },
    failedRecords: {
      type: Number,
      default: 0,
      min: 0,
    },
    fraudCount: {
      type: Number,
      default: 0,
      min: 0,
    },
    results: {
      type: mongoose.Schema.Types.Mixed,
      default: {},
    },
    errorDetails: {
      type: String,
      default: null,
    },
    createdById: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      default: null,
    },
    startedAt: {
      type: Date,
      default: null,
    },
    completedAt: {
      type: Date,
      default: null,
    },
  },
  {
    timestamps: true,
    collection: 'dataset_testing_jobs',
  }
);

// Indexes
datasetTestingJobSchema.index({ status: 1 });
datasetTestingJobSchema.index({ createdById: 1 });
datasetTestingJobSchema.index({ createdAt: -1 });

export const DatasetTestingJob = mongoose.model('DatasetTestingJob', datasetTestingJobSchema);
export default DatasetTestingJob;
