// /** @format */

// import express from 'express';
// import axios from 'axios';
// import User from '../models/User.js';
// import Admin from "../models/Admin.js";
// import dotenv from 'dotenv';
// dotenv.config();


// const router = express.Router();
// router.use((req, res, next) => {
//   res.setHeader("Access-Control-Allow-Origin", "*");
//   res.setHeader("Access-Control-Allow-Methods", "GET,POST,PUT,DELETE,OPTIONS");
//   res.setHeader("Access-Control-Allow-Headers", "Content-Type, Authorization, x-api-key");
  
//   if (req.method === "OPTIONS") {
//     return res.status(200).end();
//   }

//   next();
// });
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
// const _id=apiKey
//     // Fetch user from DB

// let user = await User.findById(_id);

// if (!user) {
//   user = await Admin.findById(_id);
// }

// if (!user) {
//   return res.status(404).json({ error: "No user or admin found with this Id" });
// }

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
//       message: 'SIM deactivated and data saved successfully',
//       result: deactivationResponse.data,
//     });
//   } catch (err) {
//     console.error('Deactivate SIM Card Error:', err);
//     res
//       .status(err.response?.status || 500)
//       .json(err.response?.data || { error: 'Unknown error' });
//   }
// });

// export default router;
/** @format */

import express from 'express';
import axios from 'axios';
import dotenv from 'dotenv';
import User from '../models/User.js';
import Admin from '../models/Admin.js';
import { URL } from '../utils/Url.js';

dotenv.config();

const router = express.Router();

// CORS middleware
router.use((req, res, next) => {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "GET,POST,PUT,DELETE,OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type, Authorization, x-api-key, client-api-key, client-id, transaction-id");

  if (req.method === "OPTIONS") {
    return res.status(200).end();
  }

  next();
});

// POST: Deactivate SIM
router.post('/', async (req, res) => {
  try {
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

    // Prepare external API request
    const deactivationRequestBody = { ...req.body };

    const deactivationResponse = await axios.post(
    `${URL}/DeActivateSubscriber`, // <-- Make sure this URL is correct
      deactivationRequestBody,
      {
        headers: {
          'client-api-key': clientApiKey,
          'client-id': clientId,
          'transaction-id': transactionId,
          'Content-Type': 'application/json',
        },
      }
    );

    console.log('DeactivationResponse', deactivationResponse.data);

    // Save deactivation data to DB
    const { msisdn, iccid } = req.body;
    user.deactivationData = user.deactivationData || [];
    user.deactivationData.push({
      msisdn: msisdn || '',
      iccid: iccid || '',
      transactionId: transactionId || '',
      accountId: deactivationResponse.data?.accountId || '',
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
      .json(err.response?.data || { error: err.message || 'Unknown error' });
  }
});

export default router;
