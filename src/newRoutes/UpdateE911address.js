/** @format */

/** @format */

import express from 'express';
import axios from 'axios';
import User from '../models/User.js';
import Admin from '../models/Admin.js';
import dotenv from 'dotenv';
dotenv.config();

const router = express.Router();
router.post('/', async (req, res) => {
  try {
    // Handle CORS preflight quickly (if needed)
    // If using Express globally with CORS middleware, you can skip this
    if (req.method === 'OPTIONS') {
      res.header('Access-Control-Allow-Origin', '*');
      res.header(
        'Access-Control-Allow-Headers',
        'Content-Type, Authorization, x-api-key, client-api-key, client-id, transaction-id'
      );
      return res.sendStatus(200);
    }

    console.log('Incoming request body:', req.body);

    const _id = req.headers['_id'];
    const clientApiKey = req.headers['client-api-key'];
    const clientId = req.headers['client-id'];
    const transactionId = req.headers['transaction-id'];

    if (!_id) {
      return res.status(400).json({ error: 'Missing User ID' });
    }

    // Use API key as user/admin ID
  

    // Fetch user or admin from DB
    let user = await User.findById(_id);
    if (!user) {
      user = await Admin.findById(_id);
    }

    if (!user) {
      return res.status(404).json({ error: "No user or admin found with this ID" });
    }

    const requestpayload = {
      msisdn: req.body.msisdn,
      iccid: req.body.iccid,
      e911Address: {
        street1: req.body.e911Address.street1,
        street2: req.body.e911Address.street2,
        city: req.body.e911Address.city,
        state: req.body.e911Address.state,
        zip: req.body.e911Address.zip,
      },
    };

    const Updatee911Response = await axios.post(
      'https://prodapitmo1.321communications.com/api/tmo/v1/UpdateE911Address',
      requestpayload,
      {
        headers: {
          'client-api-key': clientApiKey,
          'client-id': clientId,
          'transaction-id': transactionId,
          'Content-Type': 'application/json',
        },
      }
    );

    res.json(Updatee911Response.data);
  } catch (err) {
    console.error('Update E911 Address Error:', err);
    res
      .status(err.response?.status || 500)
      .json(err.response?.data || { error: 'Unknown error' });
  }
});

export default router;