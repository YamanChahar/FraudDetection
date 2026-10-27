import mongoose from 'mongoose';

const transactionSchema = new mongoose.Schema(
  {
    externalTransactionId: {
      type: String,
      trim: true,
      maxlength: 128,
      unique: true,
      sparse: true,
    },
    amount: {
      type: mongoose.Schema.Types.Decimal128,
      required: [true, 'Transaction amount is required'],
      validate: {
        validator: function (val) {
          if (!val) return false;
          const num = parseFloat(val.toString());
          return !isNaN(num) && num > 0;
        },
        message: 'Transaction amount must be a positive number greater than 0',
      },
    },
    currency: {
      type: String,
      default: 'USD',
      trim: true,
      uppercase: true,
      minlength: 3,
      maxlength: 3,
    },
    transactionTimestamp: {
      type: Date,
      default: Date.now,
    },
    merchant: {
      id: { type: String, trim: true, maxlength: 128 },
      name: { type: String, trim: true, maxlength: 128 },
      category: { type: String, trim: true, maxlength: 64 },
    },
    customer: {
      id: { type: String, trim: true, maxlength: 128 },
      email: { type: String, trim: true, lowercase: true, maxlength: 255 },
      phone: { type: String, trim: true, maxlength: 32 },
    },
    channel: {
      type: String,
      trim: true,
      maxlength: 32,
      default: 'ONLINE',
    },
    cardPresent: {
      type: Boolean,
      default: null,
    },
    deviceId: {
      type: String,
      trim: true,
      maxlength: 128,
    },
    ipAddress: {
      type: String,
      trim: true,
      maxlength: 45,
    },
    location: {
      country: { type: String, trim: true, uppercase: true, maxlength: 2 },
      city: { type: String, trim: true, maxlength: 100 },
    },
    metadata: {
      type: mongoose.Schema.Types.Mixed,
      default: {},
    },
  },
  {
    timestamps: true,
    collection: 'transactions',
    toJSON: {
      getters: true,
      transform: function (doc, ret) {
        if (ret.amount && ret.amount.toString) {
          ret.amount = parseFloat(ret.amount.toString());
        }
        return ret;
      },
    },
  }
);

// Indexes
transactionSchema.index({ transactionTimestamp: -1 });
transactionSchema.index({ 'customer.id': 1 });
transactionSchema.index({ 'merchant.id': 1 });
transactionSchema.index({ transactionTimestamp: -1, amount: 1 });

export const Transaction = mongoose.model('Transaction', transactionSchema);
export default Transaction;
