import mongoose from 'mongoose';

export const ALERT_SEVERITIES = ['LOW', 'MEDIUM', 'HIGH', 'CRITICAL'];
export const ALERT_STATUSES = ['OPEN', 'IN_REVIEW', 'ESCALATED', 'RESOLVED', 'DISMISSED'];

const fraudAlertSchema = new mongoose.Schema(
  {
    transactionId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Transaction',
      required: [true, 'Transaction reference is required'],
    },
    predictionId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Prediction',
      default: null,
    },
    severity: {
      type: String,
      enum: {
        values: ALERT_SEVERITIES,
        message: '{VALUE} is not a valid alert severity',
      },
      required: [true, 'Alert severity is required'],
    },
    status: {
      type: String,
      enum: {
        values: ALERT_STATUSES,
        message: '{VALUE} is not a valid alert status',
      },
      default: 'OPEN',
    },
    assignedToId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      default: null,
    },
    triggeredRules: {
      type: [mongoose.Schema.Types.Mixed],
      default: [],
    },
    description: {
      type: String,
      trim: true,
    },
    resolvedAt: {
      type: Date,
      default: null,
    },
  },
  {
    timestamps: true,
    collection: 'fraud_alerts',
  }
);

// Indexes
fraudAlertSchema.index({ status: 1 });
fraudAlertSchema.index({ severity: 1 });
fraudAlertSchema.index({ assignedToId: 1 });
fraudAlertSchema.index({ transactionId: 1 });
fraudAlertSchema.index({ createdAt: -1 });

export const FraudAlert = mongoose.model('FraudAlert', fraudAlertSchema);
export default FraudAlert;
