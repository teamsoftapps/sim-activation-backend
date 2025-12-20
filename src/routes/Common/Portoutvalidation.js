/** @format */

import express from 'express';
import axios from 'axios';
import User from '../../models/User.js';
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
      return res.status(401).json({ success: false, message: 'Unauthorized' });
    }

    const { userId, subscriber, portDetails, portAddress } = req.body;

    // === Validation ===
    if (!subscriber?.msisdn || !subscriber?.iccid) {
      return res
        .status(400)
        .json({ success: false, message: 'Subscriber MSISDN and ICCID are required' });
    }

    if (!portDetails?.name || !portDetails?.ospAccountNumber || !portDetails?.ospAccountPassword) {
      return res
        .status(400)
        .json({ success: false, message: 'Port Details are incomplete' });
    }

    if (!portAddress?.street1 || !portAddress?.city || !portAddress?.state || !portAddress?.zip) {
      return res
        .status(400)
        .json({ success: false, message: 'Port Address is incomplete' });
    }

    // === Determine target user ===
    let targetUser;
    if (isAdmin) {
      if (!userId) {
        return res
          .status(400)
          .json({ success: false, message: 'userId required for admin' });
      }
      targetUser = await User.findById(userId);
      if (!targetUser) {
        return res.status(404).json({ success: false, message: 'User not found' });
      }
    } else {
      targetUser = authenticatedEntity;
    }

    const transactionId = generateTransactionId();

    const payload = {
      subscriber,
      portDetails,
      portAddress,
    };

    // === Call Carrier API ===
    let carrierResponse;
    try {
      carrierResponse = await axios.post(
        `${process.env.BASE_URL}/PortOutValidation`,
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
        message: 'Failed to validate port-out at carrier',
        transactionId,
        error: axiosErr.response?.data || { message: axiosErr.message },
      });
    }

    const result = carrierResponse.data.data || carrierResponse.data;

    // === Check if carrier returned an error ===
    const hasError = result.error && (result.error.message || result.error.code || result.error.statusCode);

    if (hasError) {
      return res.status(400).json({
        success: false,
        message: 'Port-out validation failed at carrier',
        transactionId,
        carrierError: result.error || { message: 'Unknown carrier error' },
        apiResponse: carrierResponse.data,
      });
    }

    // === Success Response ===
    res.json({
      success: true,
      message: 'Port-out validation successful',
      checkedBy: {
        type: isAdmin ? 'admin' : 'user',
        id: authenticatedEntity._id,
        name: authenticatedEntity.fullName || authenticatedEntity.email,
      },
      transactionId,
      request: payload,
      apiResponse: carrierResponse.data,
    });
  } catch (err) {
    console.error('PortOutValidation Internal Error:', err);
    res.status(500).json({
      success: false,
      message: 'Internal server error',
      error: err.message,
    });
  }
});

export default router;
