/** @format */

// models/Activation.js
import mongoose from 'mongoose';

const ActivationSchema = new mongoose.Schema(
  {
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    activatedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    activatedByRole: { type: String, enum: ['user', 'admin'], required: true },

    sim: String,
    plan_soc: String,
    imei: String,
    label: String,
    zip: String,
    transactionId: String,
    accountId: String,
    msisdn: String,
    iccid: String,

    activationDate: { type: Date, default: Date.now },
    endDateOfActivation: { type: Date },

    E911ADDRESS: {
      e911AddressStreet1: String,
      e911AddressStreet2: String,
      e911AddressCity: String,
      e911AddressState: String,
      e911AddressZip: String,
    },

    e911UpdatedAt: Date,
    e911UpdatedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    e911UpdatedByRole: { type: String, enum: ['user', 'admin'] },
  },
  { timestamps: true }
);

export default mongoose.model('Activation', ActivationSchema);
