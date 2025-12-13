/** @format */

// models/BalanceAdjustment.js
import mongoose from 'mongoose';

const BalanceAdjustmentSchema = new mongoose.Schema(
  {
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    adjustedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    adjustedByRole: { type: String, enum: ['user', 'admin'], required: true },

    msisdn: String,
    iccid: String,
    uom: {
      type: String,
      enum: ['MBYTES', 'MINUTES', 'MESSAGES'],
      required: true,
    },
    bucketValue: { type: Number, required: true },
    bucketForDataTopUp: { type: String, enum: ['A', 'B'], default: 'A' },

    previousBalance: Number,
    adjustment: Number,
    newBalance: Number,
    status: String,
    result: [mongoose.Schema.Types.Mixed],
    error: mongoose.Schema.Types.Mixed,
    transactionId: String,
    adjustedAt: { type: Date, default: Date.now },
  },
  { timestamps: true }
);

export default mongoose.model('BalanceAdjustment', BalanceAdjustmentSchema);
