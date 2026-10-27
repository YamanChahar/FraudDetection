import mongoose from 'mongoose';

export const INVESTIGATION_STATUSES = ['IN_PROGRESS', 'COMPLETED', 'CLOSED'];
export const INVESTIGATION_DECISIONS = ['CONFIRMED_FRAUD', 'FALSE_POSITIVE', 'SUSPICIOUS_MONITOR', 'INCONCLUSIVE'];

const investigationRecordSchema = new mongoose.Schema(
  {
    alertId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'FraudAlert',
      required: [true, 'Fraud alert reference is required'],
    },
    investigatorId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'Investigator reference is required'],
    },
    investigationStatus: {
      type: String,
      enum: {
        values: INVESTIGATION_STATUSES,
        message: '{VALUE} is not a valid investigation status',
      },
      default: 'IN_PROGRESS',
    },
    findings: {
      type: String,
      required: [true, 'Investigation findings notes are required'],
      trim: true,
    },
    decision: {
      type: String,
      enum: {
        values: INVESTIGATION_DECISIONS,
        message: '{VALUE} is not a valid investigation decision',
      },
      default: null,
    },
    resolution: {
      type: String,
      trim: true,
    },
    evidence: {
      type: mongoose.Schema.Types.Mixed,
      default: {},
    },
    isFraud: {
      type: Boolean,
      default: null,
    },
    lossAmount: {
      type: mongoose.Schema.Types.Decimal128,
      default: null,
    },
    reviewedAt: {
      type: Date,
      default: null,
    },
  },
  {
    timestamps: true,
    collection: 'investigation_records',
    toJSON: {
      getters: true,
      transform: function (doc, ret) {
        if (ret.lossAmount && ret.lossAmount.toString) {
          ret.lossAmount = parseFloat(ret.lossAmount.toString());
        }
        return ret;
      },
    },
  }
);

// Indexes
investigationRecordSchema.index({ alertId: 1 });
investigationRecordSchema.index({ investigatorId: 1 });
investigationRecordSchema.index({ decision: 1 });
investigationRecordSchema.index({ createdAt: -1 });

export const InvestigationRecord = mongoose.model('InvestigationRecord', investigationRecordSchema);
export default InvestigationRecord;
