/** @format */

import express from 'express';
import axios from 'axios';
import User from '../../models/User.js';
import BalanceAdjustment from '../../models/BalanceAdjustment.js';
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

    const { userId, msisdn, iccid, uom, bucketValue, bucketForDataTopUp } =
      req.body;

    // === Validation ===
    if (!msisdn && !iccid) {
      return res
        .status(400)
        .json({ success: false, message: 'msisdn or iccid required' });
    }
    if (!['MBYTES', 'MINUTES', 'MESSAGES'].includes(uom)) {
      return res.status(400).json({ success: false, message: 'Invalid uom' });
    }
    if (typeof bucketValue !== 'number' || bucketValue === 0) {
      return res
        .status(400)
        .json({ success: false, message: 'bucketValue must be non-zero' });
    }

    // === Determine target user ===
    let targetUser;
    if (isAdmin) {
      if (!userId)
        return res
          .status(400)
          .json({ success: false, message: 'userId required for admin' });
      targetUser = await User.findById(userId);
      if (!targetUser)
        return res
          .status(404)
          .json({ success: false, message: 'User not found' });
    } else {
      targetUser = authenticatedEntity;
    }

    const transactionId = generateTransactionId();

    const payload = {
      msisdn: msisdn || '',
      iccid: iccid || '',
      uom,
      bucketValue,
      ...(uom === 'MBYTES' && {
        bucketForDataTopUp: bucketForDataTopUp || 'A',
      }),
    };

    // === Call Carrier API ===
    let carrierResponse;
    try {
      carrierResponse = await axios.post(
        `${process.env.BASE_URL}/AdjustBalance`,
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
        message: 'Failed to reach carrier',
        transactionId,
        error: axiosErr.response?.data || { message: axiosErr.message },
      });
    }

    const result = carrierResponse.data;

    // === Detect carrier error ===
    const hasError =
      result.status === 'ERROR' ||
      result.status === 'FAILED' ||
      result.error ||
      (result.result &&
        result.result.some(
          (r) => r.status === 'ERROR' || r.status === 'FAILED'
        ));

    if (hasError) {
      return res.status(400).json({
        success: false,
        message: 'Balance adjustment failed at carrier',
        transactionId,
        carrierError: result.error || result.result || 'Unknown error',
        apiResponse: result,
      });
    }

    // === SUCCESS: Save to separate BalanceAdjustment collection ===
    await BalanceAdjustment.create({
      user: targetUser._id,
      adjustedBy: authenticatedEntity._id,
      adjustedByRole: isAdmin ? 'admin' : 'user', // ← This was missing/undefined before

      msisdn: result.msisdn || result.data?.msisdn || msisdn || '',
      iccid: result.iccid || result.data?.iccid || iccid || '',
      uom,
      bucketValue,
      bucketForDataTopUp:
        uom === 'MBYTES' ? bucketForDataTopUp || 'A' : undefined,

      previousBalance: result.remaining || result.data?.remaining || null,
      adjustment: result.adjustment || result.data?.adjustment || bucketValue,
      newBalance: result.newAdjustment || result.data?.newAdjustment || null,
      status: result.status || 'SUCCESS',
      result: result.result || [],
      error: null,
      transactionId,
      adjustedAt: new Date(),
    });

    // === Final Success Response ===
    res.json({
      success: true,
      message: `Balance adjusted: ${uom} ${
        bucketValue > 0 ? '+' : ''
      }${bucketValue}`,
      adjustedBy: {
        type: isAdmin ? 'admin' : 'user',
        id: authenticatedEntity._id,
        name: authenticatedEntity.fullName || authenticatedEntity.email,
      },
      adjustedFor: {
        userId: targetUser._id,
        email: targetUser.email,
      },
      transactionId,
      newBalance:
        result.data?.newAdjustment || result.data?.newAdjustment || 'unknown',
      apiResponse: result,
    });
  } catch (err) {
    console.error('AdjustBalance Internal Error:', err);
    res.status(500).json({
      success: false,
      message: 'Internal server error',
      error: err.message,
    });
  }
});

export default router;
