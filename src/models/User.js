import mongoose from "mongoose";
import { type } from "os";

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

  apiKey: String,
  token: String,
  opncommToken: {
    type: String,
    default:
      "opencom_skdaf6d495-c91b-40ae-861e-0b24e5e826a2-ee526093-4713-43b9-a887-b96fc9a7c631",
  },

  activationCost: {
    type: Number,
    default: 0,
  },

  activationData: [
    {
      esn: String,
      planId: String,
      language: String,
      zip: String,
      BillingCode: String,
      activationDate: { type: Date, default: Date.now },
      E911ADDRESS: {
        STREET1: String,
        STREET2: String,
        CITY: String,
        STATE: String,
        ZIP: String,
      },
    },
  ],
  deactivationData: [
    {
      esn: String,
      mdn: String,
    },
  ],
  reactivation: [
    {
      esn: String,
      mdn: String,
      plan: String,
      zip: String,
      BillingCode: String,
    },
  ],

  createdAt: {
    type: Date,
    default: Date.now,
  },
});

const User = mongoose.model("User", Users);
export default User;
