import mongoose from 'mongoose';

const auditLogSchema = new mongoose.Schema(
  {
    actorId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      default: null,
    },
    action: {
      type: String,
      required: [true, 'Audit action is required'],
      trim: true,
      maxlength: 100,
    },
    entityType: {
      type: String,
      required: [true, 'Entity type is required'],
      trim: true,
      maxlength: 50,
    },
    entityId: {
      type: String,
      trim: true,
      maxlength: 128,
      default: null,
    },
    ipAddress: {
      type: String,
      trim: true,
      maxlength: 45,
      default: null,
    },
    userAgent: {
      type: String,
      trim: true,
      maxlength: 255,
      default: null,
    },
    correlationId: {
      type: String,
      trim: true,
      maxlength: 64,
      default: null,
    },
    metadata: {
      type: mongoose.Schema.Types.Mixed,
      default: {},
    },
    createdAt: {
      type: Date,
      default: Date.now,
    },
  },
  {
    timestamps: false,
    collection: 'audit_logs',
  }
);

// Immutability safeguards: Prevent document modification or removal
auditLogSchema.pre('save', function () {
  if (!this.isNew) {
    throw new Error('AuditLog records are append-only and cannot be modified.');
  }
});

auditLogSchema.pre('updateOne', function () {
  throw new Error('AuditLog records are append-only and cannot be modified.');
});

auditLogSchema.pre('updateMany', function () {
  throw new Error('AuditLog records are append-only and cannot be modified.');
});

auditLogSchema.pre('findOneAndUpdate', function () {
  throw new Error('AuditLog records are append-only and cannot be modified.');
});

auditLogSchema.pre('findOneAndReplace', function () {
  throw new Error('AuditLog records are append-only and cannot be replaced.');
});

auditLogSchema.pre('deleteOne', function () {
  throw new Error('AuditLog records cannot be deleted.');
});

auditLogSchema.pre('deleteMany', function () {
  throw new Error('AuditLog records cannot be deleted.');
});

auditLogSchema.pre('findOneAndDelete', function () {
  throw new Error('AuditLog records cannot be deleted.');
});

// Indexes
auditLogSchema.index({ actorId: 1 });
auditLogSchema.index({ entityType: 1, entityId: 1 });
auditLogSchema.index({ createdAt: -1 });

export const AuditLog = mongoose.model('AuditLog', auditLogSchema);
export default AuditLog;
