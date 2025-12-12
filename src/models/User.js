/** @format */

import mongoose from 'mongoose';
import { type } from 'os';

const E911AddressSchema = new mongoose.Schema({
  STREET1: String,
  STREET2: String,
  CITY: String,
  STATE: String,
  ZIP: String,
});

const ActivationDataSchema = new mongoose.Schema({
  esn: String,
  planId: String,
  language: String,
  zip: String,
  BillingCode: String,
  E911ADDRESS: E911AddressSchema,
});

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

  // apiKey: String,
  token: String,
  opncommToken: {
    type: String,
    default:
      'opencom_skdaf6d495-c91b-40ae-861e-0b24e5e826a2-ee526093-4713-43b9-a887-b96fc9a7c631',
  },

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
          return new Date(Date.now() + 30 * 24 * 60 * 60 * 1000); // 30 days
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
