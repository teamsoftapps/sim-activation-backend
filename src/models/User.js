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
      accountId: String,
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

  createdAt: {
    type: Date,
    default: Date.now,
  },
});

const User = mongoose.model('User', Users);
export default User;
