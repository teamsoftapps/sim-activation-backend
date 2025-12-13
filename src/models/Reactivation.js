/** @format */

// models/Reactivation.js
import mongoose from 'mongoose';

const ReactivationSchema = new mongoose.Schema(
  {
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    reactivatedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    reactivatedByRole: {
      type: String,
      enum: ['user', 'admin'],
      required: true,
    },

    msisdn: String,
    iccid: String,
    plan: String,
    zip: String,
    transactionId: String,
    accountId: String,
    status: String,
    result: [mongoose.Schema.Types.Mixed],
    error: mongoose.Schema.Types.Mixed,
    reactivationDate: { type: Date, default: Date.now },
  },
  { timestamps: true }
);

export default mongoose.model('Reactivation', ReactivationSchema);
