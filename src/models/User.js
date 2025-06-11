import mongoose from "mongoose";

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
  // In Users schema:
  credits: {
    type: Number,
    default: 0,
  },

  apiKey: String,
  token: String,

  // New: Activation data field
  activationData: [
    {
      esn: String,
      planId: String,
      language: String,
      zip: String,
      BillingCode: String,
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
