/** @format */

// /** @format */

// import express from 'express';
// import axios from 'axios';
// import User from '../models/User.js';
// import dotenv from 'dotenv';
// dotenv.config();

// const router = express.Router();
// router.post('/', async (req, res) => {
//   try {
//     // Get x-api-key from request header
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
//     const requestpayload = {
//       msisdn: req.body.msisdn,
//       iccid: req.body.iccid,
//       e911Address: {
//         street1: req.body.e911Address.street1,
//         street2: req.body.e911Address.street2,
//         city: req.body.e911Address.city,
//         state: req.body.e911Address.state,
//         zip: req.body.e911Address.zip,
//       },
//     };

//     const Updatee911Response = await axios.post(
//       'https://prodapitmo1.321communications.com/api/tmo/v1/UpdateE911Address',
//       requestpayload,
//       {
//         headers: {
//           'client-api-key': clientapikey,
//           'client-id': clientid,
//           'transaction-id': transactionid,
//           'Content-Type': 'application/json',
//         },
//       }
//     );

//     res.json(Updatee911Response.data);
//   } catch (err) {
//     console.error('Update E911 Address Error:', err);
//     res
//       .status(err.response?.status || 500)
//       .json(err.response?.data || { error: 'Unknown error' });
//   }
// });
// export default router;
import express from 'express';
import axios from 'axios';
import User from '../models/User.js';
import dotenv from 'dotenv';
dotenv.config();

const router = express.Router();

// Bulk Update E911 Address
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

    const apiKey = req.headers['x-api-key'];
    const clientapikey = req.headers['client-api-key'];
    const clientid = req.headers['client-id'];

    if (!apiKey) {
      return res.status(400).json({ error: 'Missing x-api-key in headers' });
    }

    // Fetch user
    const user = await User.findOne({ apiKey });
    if (!user) {
      return res
        .status(404)
        .json({ error: 'User not found with this API key' });
    }

    const bulkData = req.body.bulkData; // Expect an array of records
    if (!bulkData || !Array.isArray(bulkData)) {
      return res.status(400).json({ error: 'bulkData array is required' });
    }

    const results = [];

    // Process in batches to avoid timeouts
    const batchSize = 50;
    for (let i = 0; i < bulkData.length; i += batchSize) {
      const batch = bulkData.slice(i, i + batchSize);

      // Run batch in parallel
      const batchResults = await Promise.all(
        batch.map(async (item) => {
          try {
            const transactionid = Math.floor(
              100000000000 + Math.random() * 900000000000
            );

            const payload = {
              msisdn: item.msisdn,
              iccid: item.iccid,
              e911Address: item.e911Address,
            };

            const response = await axios.post(
              'https://prodapitmo1.321communications.com/api/tmo/v1/UpdateE911Address', // replace with real URL
              payload,
              {
                headers: {
                  'client-api-key': clientapikey,
                  'client-id': clientid,
                  'transaction-id': transactionid,
                  'Content-Type': 'application/json',
                },
              }
            );

            return {
              transactionId: transactionid,
              msisdn: item.msisdn,
              iccid: item.iccid,
              status: 'Success',
              message: response.data?.result || 'Success',
            };
          } catch (err) {
            return {
              transactionId: '',
              msisdn: item.msisdn,
              iccid: item.iccid,
              status: 'Failed',
              message: err.response?.data?.error?.message || err.message,
            };
          }
        })
      );

      results.push(...batchResults);
    }

    res.json({ results });
  } catch (err) {
    console.error('Bulk Update E911 Address Error:', err);
    res
      .status(500)
      .json({ error: 'Internal Server Error', details: err.message });
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
