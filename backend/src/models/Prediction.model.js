import mongoose from 'mongoose';

export const RISK_LEVELS = ['LOW', 'MEDIUM', 'HIGH', 'CRITICAL'];
export const PREDICTION_STATUSES = ['SUCCESS', 'FAILED', 'TIMEOUT'];

const predictionSchema = new mongoose.Schema(
  {
    transactionId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Transaction',
      required: [true, 'Transaction reference is required'],
    },
    modelVersionId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'ModelVersion',
      required: [true, 'Model version reference is required'],
    },
    fraudProbability: {
      type: mongoose.Schema.Types.Decimal128,
      required: [true, 'Fraud probability is required'],
      validate: {
        validator: function (val) {
          if (!val) return false;
          const prob = parseFloat(val.toString());
          return !isNaN(prob) && prob >= 0.0 && prob <= 1.0;
        },
        message: 'Fraud probability must be a decimal value between 0.0 and 1.0',
      },
    },
    riskScore: {
      type: Number,
      required: [true, 'Risk score is required'],
      min: [0, 'Risk score cannot be less than 0'],
      max: [100, 'Risk score cannot be greater than 100'],
      validate: {
        validator: Number.isInteger,
        message: 'Risk score must be an integer between 0 and 100',
      },
    },
    riskLevel: {
      type: String,
      enum: {
        values: RISK_LEVELS,
        message: '{VALUE} is not a valid risk level',
      },
      required: [true, 'Risk level is required'],
    },
    predictionStatus: {
      type: String,
      enum: {
        values: PREDICTION_STATUSES,
        message: '{VALUE} is not a valid prediction status',
      },
      default: 'SUCCESS',
    },
    predictionLabel: {
      type: Number,
      enum: [0, 1],
      default: 0,
    },
    latencyMs: {
      type: Number,
      min: 0,
    },
    explanationData: {
      type: mongoose.Schema.Types.Mixed,
      default: {},
    },
    createdAt: {
      type: Date,
      default: Date.now,
      index: true,
    },
  },
  {
    timestamps: false,
    collection: 'predictions',
    toJSON: {
      getters: true,
      transform: function (doc, ret) {
        if (ret.fraudProbability && ret.fraudProbability.toString) {
          ret.fraudProbability = parseFloat(ret.fraudProbability.toString());
        }
        return ret;
      },
    },
  }
);

// Indexes
predictionSchema.index({ transactionId: 1 });
predictionSchema.index({ modelVersionId: 1 });
predictionSchema.index({ riskLevel: 1 });
predictionSchema.index({ createdAt: -1 });

export const Prediction = mongoose.model('Prediction', predictionSchema);
export default Prediction;
