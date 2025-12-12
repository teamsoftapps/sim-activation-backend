/** @format */

import express from 'express';
import axios from 'axios';
import User from '../models/User.js';
import dotenv from 'dotenv';
dotenv.config();

const router = express.Router();
router.post('/', async (req, res) => {
  try {
    // Get x-api-key from request header
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
          'client-api-key': clientapikey,
          'client-id': clientid,
          'transaction-id': transactionid,
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

// router.post('/', async (req, res) => {
//   try {
//     console.log('Incoming request body:', req.body);
//     const apiKey = req.headers['x-api-key'];
//     const clientapikey = req.headers['client-api-key'];
//     const clientid = req.headers['client-id'];
//     const transactionid = req.headers['transaction-id'];

//     if (!apiKey) {
//       return res.status(400).json({ error: 'Missing x-api-key in headers' });
//     }

//     // Fetch user from DB
//     const user = await User.findOne({ apiKey });
//     if (!user) {
//       return res
//         .status(404)
//         .json({ error: 'User not found with this API key' });
//     }

//     // Call external activation API
//     const deactivationRequestBody = {
//       ...req.body,
//     };

//     const deactivationResponse = await axios.post(
//       'https://prodapitmo1.321communications.com/api/tmo/v1/DeActivateSubscriber',
//       deactivationRequestBody,
//       {
//         headers: {
//           'client-api-key': clientapikey,
//           'client-id': clientid,
//           'transaction-id': transactionid,
//           'Content-Type': 'application/json',
//         },
//       }
//     );

//     console.log('DeactivationResponse', deactivationResponse);

//     // Extract activation fields
//     const { msisdn, iccid } = req.body;

//     // Save activation data
//     user.deactivationData.push({
//       msisdn: msisdn || '',
//       iccid: iccid || '',
//       transactionId: deactivationResponse.transactionId || '',
//       accountId: deactivationResponse.data.accountId || '',
//     });

//     await user.save();

//     res.json({
//       message: 'SIM Update and data saved successfully',
//       result: deactivationResponse.data,
//     });
//   } catch (err) {
//     console.error('Update E911 Error:', err);
//     res
//       .status(err.response?.status || 500)
//       .json(err.response?.data || { error: 'Unknown error' });
//   }
// });

// export default router;
