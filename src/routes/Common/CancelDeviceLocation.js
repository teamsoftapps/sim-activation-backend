/** @format */

import express from 'express';
import axios from 'axios';
import User from '../../models/User.js';
import authMiddleware from '../../middleware/authMiddleware.js';
import authUser from '../../utils/authUser.js';
import generateTransactionId from '../../utils/generateTransactionId.js';
import dotenv from 'dotenv';
import DeviceLocationCancellation from '../../models/DeviceLocationCancellation.js';

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

    const { userId, msisdn, iccid } = req.body;

    // === Validation ===
    if (!msisdn && !iccid) {
      return res.status(400).json({
        success: false,
        message: 'msisdn or iccid is required',
      });
    }

    // === Determine target user ===
    let targetUser;
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
          message: 'Target user not found',
        });
      }
    } else {
      targetUser = authenticatedEntity;
    }

    const transactionId = generateTransactionId();

    const payload = {
      msisdn: msisdn || '',
      iccid: iccid || '',
    };

    // === Call Carrier API (with error catching) ===
    let carrierResponse;
    try {
      carrierResponse = await axios.post(
        `${process.env.BASE_URL}/CancelDeviceLocation`,
        payload,
        {
          headers: {
            'client-api-key': process.env.CLIENT_API_KEY,
            'client-id': process.env.CLIENT_ID,
            'transaction-id': transactionId,
            'Content-Type': 'application/json',
          },
          timeout: 15000,
        }
      );
    } catch (axiosErr) {
      // Network error or 4xx/5xx from carrier → don't save
      return res.status(axiosErr.response?.status || 500).json({
        success: false,
        message: 'Failed to cancel device location at carrier',
        transactionId,
        error: axiosErr.response?.data || { message: axiosErr.message },
      });
    }

    const result = carrierResponse.data.data || carrierResponse.data;

    // === Check for carrier-level error ===
    const hasError =
      result.error ||
      result.status === 'ERROR' ||
      result.status === 'FAILED' ||
      (result.result && result.result.some((r) => r.status === 'ERROR'));

    if (hasError) {
      // Do NOT save to DB
      return res.status(400).json({
        success: false,
        message: 'Device location cancellation failed at carrier',
        transactionId,
        carrierError: result.error || 'Unknown error from carrier',
        apiResponse: carrierResponse.data,
      });
    }

    await DeviceLocationCancellation.create({
      user: targetUser._id, //
      cancelledBy: authenticatedEntity._id,
      cancelledByRole: isAdmin ? 'admin' : 'user',

      msisdn: result.msisdn || msisdn || '',
      iccid: result.iccid || iccid || '',
      imsi: result.imsi || '',
      status: result.status || 'SUCCESS',
      result: result.result || [],
      error: null,
      transactionId,
      cancelledAt: new Date(),
    });

    // === Final Success Response ===
    res.json({
      success: true,
      message: 'Device location service cancelled successfully',
      cancelledBy: {
        type: isAdmin ? 'admin' : 'user',
        id: authenticatedEntity._id,
        name: authenticatedEntity.fullName || authenticatedEntity.email,
      },
      cancelledFor: {
        userId: targetUser._id,
        email: targetUser.email,
      },
      transactionId,
      line: {
        msisdn: result.msisdn || msisdn || 'N/A',
        iccid: result.iccid || iccid || 'N/A',
        imsi: result.imsi || 'N/A',
      },
      status: result.status,
      apiResponse: carrierResponse.data,
    });
  } catch (err) {
    console.error('CancelDeviceLocation Internal Error:', err);
    res.status(500).json({
      success: false,
      message: 'Internal server error',
      error: err.message,
    });
  }
});

export default router;
