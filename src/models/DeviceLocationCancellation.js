/** @format */

// models/DeviceLocationCancellation.js
import mongoose from 'mongoose';

const DeviceLocationCancellationSchema = new mongoose.Schema(
  {
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    cancelledBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    cancelledByRole: { type: String, enum: ['user', 'admin'], required: true },

    msisdn: String,
    iccid: String,
    imsi: String,
    status: String,
    transactionId: String,
    cancelledAt: { type: Date, default: Date.now },
  },
  { timestamps: true }
);

export default mongoose.model(
  'DeviceLocationCancellation',
  DeviceLocationCancellationSchema
);
