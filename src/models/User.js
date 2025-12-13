/** @format */

import mongoose from 'mongoose';

const Users = new mongoose.Schema({
  fullName: {
    type: String,
    required: true,
    unique: true,
  },
  email: {
    type: String,
    required: true,
    unique: true,
  },
  password: {
    type: String,
    required: true,
  },
  phone: {
    type: String,
    required: true,
  },

  credits: {
    type: Number,
    default: 0,
  },
  token: String,
  activationCost: {
    type: Number,
    default: 0,
  },

  activationData: [
    {
      sim: String,
      zip: String,
      plan_soc: String,
      imei: String,
      label: String,
      transactionId: String,
      accountId: String,
      msisdn: String,
      iccid: String,
      activationDate: { type: Date, default: Date.now },
      endDateOfActivation: {
        type: Date,
        default: function () {
          return new Date(Date.now() + 30 * 24 * 60 * 60 * 1000);
        },
      },
      E911ADDRESS: {
        e911AddressStreet1: String,
        e911AddressStreet2: String,
        e911AddressCity: String,
        e911AddressState: String,
        e911AddressZip: String,
      },
    },
  ],
  deactivationData: [
    {
      transactionId: String,
      msisdn: String,
      iccid: String,
      deactivationDate: { type: Date, default: Date.now },
    },
  ],
  reactivation: [
    {
      esn: String,
      mdn: String,
      plan: String,
      zip: String,
      BillingCode: String,
      reactivationDate: { type: Date, default: Date.now },
    },
  ],

  e911Updates: [
    {
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
      updatedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
      updatedByRole: { type: String, enum: ['user', 'admin'] },
      updatedAt: { type: Date, default: Date.now },
    },
  ],

  balanceAdjustments: [
    {
      adjustedBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Admin', // Only Admin can be referenced here
        required: false,
      },
      adjustedByUser: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User', // If a regular user adjusts their own
        required: false,
      },
      adjustedByName: String,
      adjustedByType: {
        type: String,
        enum: ['admin', 'user'],
        required: true,
      },
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
      transactionId: String,
      adjustedAt: { type: Date, default: Date.now },
    },
  ],

  deviceLocationCancellations: [
    {
      msisdn: String,
      iccid: String,
      imsi: String,
      status: String,
      transactionId: String,
      cancelledBy: { type: mongoose.Schema.Types.ObjectId, ref: 'Admin' },
      cancelledByType: { type: String, enum: ['user', 'admin'] },
      cancelledAt: { type: Date, default: Date.now },
    },
  ],
  portInCancellations: [
    {
      iccid: String,
      portInMsisdn: String,
      msisdn: String,
      status: String,
      portInRequestId: String,
      portInDueDate: Date,
      transactionId: String,
      cancelledBy: { type: mongoose.Schema.Types.ObjectId, ref: 'Admin' },
      cancelledByType: { type: String, enum: ['user', 'admin'] },
      cancelledAt: { type: Date, default: Date.now },
    },
  ],

  createdAt: {
    type: Date,
    default: Date.now,
  },
});

const User = mongoose.model('User', Users);
export default User;
