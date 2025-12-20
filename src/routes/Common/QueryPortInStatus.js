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
    const { user: authenticatedEntity, isAdmin } = authUser(req);

    if (!authenticatedEntity) {
      return res.status(401).json({
        success: false,
        message: 'Unauthorized',
      });
    }

    const { msisdn, userId } = req.body;

    // === Validation ===
    if (!msisdn) {
      return res.status(400).json({
        success: false,
        message: 'msisdn is required',
      });
    }

    // === Determine target user ===
    let targetUser = authenticatedEntity;
    if (isAdmin && userId) {
      targetUser = { _id: userId }; // minimal info, for tracking if needed
    }

    const transactionId = generateTransactionId();

    const payload = { msisdn };

    // === Call Carrier API ===
    let carrierResponse;
    try {
      carrierResponse = await axios.post(
        `${process.env.BASE_URL}/QueryPortInStatus`,
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
        message: 'Failed to query port-in status from carrier',
        transactionId,
        error: axiosErr.response?.data || { message: axiosErr.message },
      });
    }

    const result = carrierResponse.data?.data || carrierResponse.data;

    const hasError =
      result?.error &&
      (typeof result.error === 'string' ||
        result.error.message ||
        result.error.code ||
        result.error.statusCode);

    if (hasError) {
      return res.status(400).json({
        success: false,
        message: 'Carrier returned an error while querying port-in status',
        transactionId,
        carrierError: result.error,
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
      data: result,
      apiResponse:
        process.env.NODE_ENV === 'development'
          ? carrierResponse.data
          : undefined,
    });
  } catch (err) {
    console.error('QueryPortInStatus Internal Error:', err);
    return res.status(500).json({
      success: false,
      message: 'Internal server error',
      error: err.message,
    });
  }
});

export default router;
