/** @format */

import express from 'express';
import axios from 'axios';
import authMiddleware from '../../middleware/authMiddleware.js';
import authUser from '../../utils/authUser.js';
import generateTransactionId from '../../utils/generateTransactionId.js';
import dotenv from 'dotenv';
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

    const {  iccid, imsi, msisdn } = req.body;
    // const { userId, iccid, imsi, msisdn } = req.body;

    // === Validation ===
    if (!iccid) return res.status(400).json({ success: false, message: 'iccid is required' });
    if (!imsi) return res.status(400).json({ success: false, message: 'imsi is required' });
    if (!msisdn) return res.status(400).json({ success: false, message: 'msisdn is required' });

    // // === Determine target user ===
    // let targetUser;
    // if (isAdmin) {
    //   if (!userId)
    //     return res.status(400).json({ success: false, message: 'userId required for admin' });
    //   targetUser = await User.findById(userId);
    //   if (!targetUser)
    //     return res.status(404).json({ success: false, message: 'User not found' });
    // } else {
    //   targetUser = authenticatedEntity;
    // }

    const transactionId = generateTransactionId();
    const payload = { iccid, imsi, msisdn };

    // === Call Carrier API ===
    let carrierResponse;
    try {
      carrierResponse = await axios.post(
        `${process.env.BASE_URL}/QueryNetwork`,
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
        message: 'Failed to query network at carrier',
        transactionId,
        error: axiosErr.response?.data || { message: axiosErr.message },
      });
    }

    const result = carrierResponse.data.data || carrierResponse.data;

    const hasError =
      result.error &&
      (result.error.message || result.error.code || result.error.statusCode);

    if (hasError || result.status === 'ERROR' || result.status === 'FAILED') {
      return res.status(400).json({
        success: false,
        message: 'Network query failed at carrier',
        transactionId,
        carrierError: result.error || { message: 'Unknown carrier error' },
        apiResponse: carrierResponse.data,
      });
    }

    // === Success Response ===
    res.json({
      success: true,
      message: 'Network query successful',
      transactionId,
      queriedBy: {
        type: isAdmin ? 'admin' : 'user',
        id: authenticatedEntity._id,
        name: authenticatedEntity.fullName || authenticatedEntity.email,
      },
      queriedFor: {
        userId: targetUser._id,
        email: targetUser.email,
      },
      line: {
        iccid,
        imsi,
        msisdn,
      },
      data: result,
      apiResponse: carrierResponse.data,
    });
  } catch (err) {
    console.error('QueryNetwork Internal Error:', err);
    res.status(500).json({
      success: false,
      message: 'Internal server error',
      error: err.message,
    });
  }
});

export default router;
