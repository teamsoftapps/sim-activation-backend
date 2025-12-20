/** @format */

import express from 'express';
import axios from 'axios';
import authMiddleware from '../../middleware/authMiddleware.js';
import authUser from '../../utils/authUser.js';
import generateTransactionId from '../../utils/generateTransactionId.js';
import dotenv from 'dotenv';

dotenv.config();

const router = express.Router();

router.post('/', authMiddleware(), async (req, res) => {
  try {
    const { user: authenticatedEntity } = authUser(req);

    if (!authenticatedEntity) {
      return res.status(401).json({
        success: false,
        message: 'Unauthorized',
      });
    }

    const { iccid, msisdn } = req.body;

    // === Validation ===
    if (!iccid && !msisdn) {
      return res.status(400).json({
        success: false,
        message: 'Either iccid or msisdn is required',
      });
    }

    const transactionId = generateTransactionId();

    const payload = {
      iccid,
      msisdn,
    };

    // === Call Carrier API ===
    let carrierResponse;
    try {
      carrierResponse = await axios.post(
        `${process.env.BASE_URL}/GetActivePlanSOC`,
        payload,
        {
          headers: {
            'client-api-key': process.env.CLIENT_API_KEY,
            'client-id': process.env.CLIENT_ID,
            'transaction-id': transactionId,
            'Content-Type': 'application/json',
          },
          timeout: 20000,
        }
      );
    } catch (axiosErr) {
      return res.status(axiosErr.response?.status || 500).json({
        success: false,
        message: 'Failed to fetch active plan SOC from carrier',
        transactionId,
        error: axiosErr.response?.data || { message: axiosErr.message },
      });
    }

    const responseData = carrierResponse.data?.data || {};

    const hasError =
      responseData?.error &&
      (typeof responseData.error === 'string' ||
        responseData.error.message ||
        responseData.error.code ||
        responseData.error.statusCode);

    // === Carrier Error Handling ===
    if (hasError) {
      return res.status(400).json({
        success: false,
        message: 'Carrier returned an error while fetching plan SOC',
        transactionId,
        carrierError: responseData.error,
        apiResponse:
          process.env.NODE_ENV === 'development'
            ? carrierResponse.data
            : undefined,
      });
    }

    // === Success Response ===
    return res.json({
      success: true,
      transactionId,
      data: {
        planSOC: responseData.planSOC || null,
      },
      apiResponse:
        process.env.NODE_ENV === 'development'
          ? carrierResponse.data
          : undefined,
    });
  } catch (err) {
    console.error('GetActivePlanSOC Internal Error:', err);
    return res.status(500).json({
      success: false,
      message: 'Internal server error',
      error: err.message,
    });
  }
});

export default router;

