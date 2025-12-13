/** @format */

// models/E911Update.js
import mongoose from 'mongoose';

const E911UpdateSchema = new mongoose.Schema(
  {
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    updatedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    updatedByRole: { type: String, enum: ['user', 'admin'], required: true },

    msisdn: String,
    iccid: String,
    e911Address: {
      e911AddressStreet1: String,
      e911AddressStreet2: String,
      e911AddressCity: String,
      e911AddressState: String,
      e911AddressZip: String,
    },
    transactionId: String,
    updatedAt: { type: Date, default: Date.now },
  },
  { timestamps: true }
);

export default mongoose.model('E911Update', E911UpdateSchema);
