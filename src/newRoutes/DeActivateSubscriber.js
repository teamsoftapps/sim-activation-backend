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

    // Call external activation API
    const deactivationRequestBody = {
      ...req.body,
    };

    const deactivationResponse = await axios.post(
      'https://prodapitmo1.321communications.com/api/tmo/v1/DeActivateSubscriber',
      deactivationRequestBody,
      {
        headers: {
          'client-api-key': clientapikey,
          'client-id': clientid,
          'transaction-id': transactionid,
          'Content-Type': 'application/json',
        },
      }
    );

    console.log('DeactivationResponse', deactivationResponse);

    // Extract activation fields
    const { msisdn, iccid } = req.body;

    // Save activation data
    user.deactivationData.push({
      msisdn: msisdn || '',
      iccid: iccid || '',
      transactionId: deactivationResponse.transactionId || '',
      accountId: deactivationResponse.data.accountId || '',
    });

    await user.save();

    res.json({
      message: 'SIM deactivated and data saved successfully',
      result: deactivationResponse.data,
    });
  } catch (err) {
    console.error('Deactivate SIM Card Error:', err);
    res
      .status(err.response?.status || 500)
      .json(err.response?.data || { error: 'Unknown error' });
  }
});

export default router;
