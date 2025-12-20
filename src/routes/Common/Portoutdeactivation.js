/** @format */

import express from 'express';
import axios from 'axios';
import dotenv from 'dotenv';
import authMiddleware from '../../middleware/authMiddleware.js';
import authUser from '../../utils/authUser.js';
import generateTransactionId from '../../utils/generateTransactionId.js';
import User from '../../models/User.js';

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

    const { userId, msisdn, iccid, imsi, newServiceProviderId } = req.body;

    // Admin must provide userId
    let targetUser = authenticatedEntity;
    if (isAdmin) {
      if (!userId) {
        return res.status(400).json({
          success: false,
          message: 'userId is required for admin',
        });
      }
      targetUser = await User.findById(userId);
      if (!targetUser) {
        return res.status(404).json({
          success: false,
          message: 'User not found',
        });
      }
    }

    // Validation
    if (!msisdn || !iccid || !imsi || !newServiceProviderId) {
      return res.status(400).json({
        success: false,
        message: 'All fields are required',
      });
    }

    const transactionId = generateTransactionId();

    const payload = {
      msisdn,
      iccid,
      imsi,
      newServiceProviderId,
    };

    // Call Carrier API
    let carrierResponse;
    try {
      carrierResponse = await axios.post(
        `${process.env.BASE_URL}/PortOutDeactivation`,
        payload,
        {
          headers: {
            'client-id': process.env.CLIENT_ID,
            'client-api-key': process.env.CLIENT_API_KEY,
            'transaction-id': transactionId,
            'Content-Type': 'application/json',
          },
          timeout: 20000,
        }
      );
    } catch (axiosErr) {
      return res.status(axiosErr.response?.status || 500).json({
        transactionId,
        data: {
          error: axiosErr.response?.data || { message: axiosErr.message },
        },
      });
    }

    // Respond with carrier data
    const result = carrierResponse.data.data || carrierResponse.data;

    // Return response in the expected format
    res.json({
      transactionId,
      data: {
        error: result.error || null,
      },
    });
  } catch (err) {
    console.error('PortOutDeactivation Internal Error:', err);
    res.status(500).json({
      transactionId: generateTransactionId(),
      data: {
        error: {
          message: err.message,
          error: 'Internal server error',
          code: 'INTERNAL_ERR',
          statusCode: 500,
        },
      },
    });
  }
});

export default router;
