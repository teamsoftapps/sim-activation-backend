/** @format */

// models/PortInCancellation.js
import mongoose from 'mongoose';

const PortInCancellationSchema = new mongoose.Schema(
  {
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    cancelledBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    cancelledByRole: { type: String, enum: ['user', 'admin'], required: true },

    iccid: String,
    portInMsisdn: String,
    msisdn: String,
    status: String,
    portInRequestId: String,
    portInDueDate: Date,
    transactionId: String,
    cancelledAt: { type: Date, default: Date.now },
  },
  { timestamps: true }
);

export default mongoose.model('PortInCancellation', PortInCancellationSchema);
