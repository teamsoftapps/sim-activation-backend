/** @format */

import express from 'express';
import axios from 'axios';
import User from '../models/User.js';
import dotenv from 'dotenv';
dotenv.config();

const router = express.Router();

router.post('/', async (req, res) => {
  try {
    console.log('Incoming request body:', req.body);
    const apiKey = req.headers['x-api-key'];
    const clientapikey = req.headers['client-api-key'];
    const clientid = req.headers['client-id'];
    const transactionid = req.headers['transaction-id'];

    if (!apiKey) {
      return res.status(400).json({ error: 'Missing x-api-key in headers' });
    }

    // Fetch user from DB
    const user = await User.findOne({ apiKey });
    if (!user) {
      return res
        .status(404)
        .json({ error: 'User not found with this API key' });
    }

    const activationCost = user.activationCost ?? 0;
    if (user.credits < activationCost) {
      return res.status(400).json({ error: 'Insufficient credits' });
    }

    // Call external activation API
    const activationRequestBody = {
      ...req.body,
    };

    const activationResponse = await axios.post(
      'https://prodapitmo1.321communications.com/api/tmo/v1/ActivateSubscriberWithAddress',
      activationRequestBody,
      {
        headers: {
          'client-api-key': clientapikey,
          'client-id': clientid,
          'transaction-id': transactionid,
          'Content-Type': 'application/json',
        },
      }
    );

    console.log('activationResponse', activationResponse.data);

    // Deduct credits
    user.credits -= activationCost;

    // Extract activation fields
    const {
      sim,
      plan_soc,
      imei,
      label,
      zip,
      e911AddressStreet1,
      e911AddressStreet2,
      e911AddressCity,
      e911AddressState,
      e911AddressZip,
    } = req.body;

    // Save activation data
    user.activationData.push({
      sim: sim || '',
      plan_soc: plan_soc || '',
      imei: imei || '',
      zip: zip || '',
      label: label || '',
      transactionId: activationResponse.transactionId,
      accountId: activationResponse.data.accountId,
      msisdn: activationResponse.data.msisdn,
      iccid: activationResponse.data.iccid,
      activationDate: new Date(),
      endDateOfActivation,
      E911ADDRESS: {
        e911AddressStreet1: e911AddressStreet1 || '',
        e911AddressStreet2: e911AddressStreet2 || '',
        e911AddressCity: e911AddressCity || '',
        e911AddressState: e911AddressState || '',
        e911AddressZip: e911AddressZip || '',
      },
    });

    await user.save();

    res.json({
      message: 'Device activated and data saved. Credits deducted.',
      activationAPIResponse: activationResponse.data,
    });
  } catch (err) {
    console.error('Activation Error:', err?.response?.data || err.message);
    res
      .status(err?.response?.status || 500)
      .json(err?.response?.data || { error: 'Unknown server error' });
  }
});

export default router;
