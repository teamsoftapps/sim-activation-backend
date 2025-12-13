/** @format */

// models/Deactivation.js
import mongoose from 'mongoose';

const DeactivationSchema = new mongoose.Schema(
  {
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    deactivatedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    deactivatedByRole: {
      type: String,
      enum: ['user', 'admin'],
      required: true,
    },

    msisdn: String,
    iccid: String,
    transactionId: String,
    deactivationDate: { type: Date, default: Date.now },
  },
  { timestamps: true }
);

export default mongoose.model('Deactivation', DeactivationSchema);
