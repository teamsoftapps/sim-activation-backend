/** @format */

import express from 'express';
import axios from 'axios';
import User from '../../models/User.js';
import authMiddleware from '../../middleware/authMiddleware.js';
import authUser from '../../utils/authUser.js';
import generateTransactionId from '../../utils/generateTransactionId.js';
import dotenv from 'dotenv';
import Reactivation from '../../models/Reactivation.js';

dotenv.config();

const router = express.Router();

router.post('/', authMiddleware(), async (req, res) => {
  try {
    const { user: authenticatedUser, type, isAdmin, isUser } = authUser(req);

    if (!authenticatedUser) {
      return res.status(401).json({
        success: false,
        message: 'Unauthorized: Invalid or missing token',
      });
    }

    const { userId, msisdn, iccid, marketZip, plan_soc } = req.body;

    // === Validation ===
    if (!msisdn && !iccid) {
      return res.status(400).json({
        success: false,
        message: 'At least one of msisdn or iccid is required',
      });
    }
    if (!plan_soc) {
      return res
        .status(400)
        .json({ success: false, message: 'plan_soc is required' });
    }
    if (!marketZip) {
      return res
        .status(400)
        .json({ success: false, message: 'marketZip is required' });
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
        return res
          .status(404)
          .json({ success: false, message: 'User not found' });
      }
    } else {
      targetUser = authenticatedUser;
    }

    const transactionId = generateTransactionId();

    const payload = {
      msisdn: msisdn || '',
      iccid: iccid || '',
      marketZip,
      plan_soc,
    };

    // === Call Carrier API with full error isolation ===
    let carrierResponse;
    try {
      carrierResponse = await axios.post(
        `${process.env.BASE_URL}/ReactivateSubscriber`,
        payload,
        {
          headers: {
            'client-api-key': process.env.CLIENT_API_KEY,
            'client-id': process.env.CLIENT_ID,
            'transaction-id': transactionId,
            'Content-Type': 'application/json',
          },
          timeout: 25000,
        }
      );
    } catch (axiosErr) {
      return res.status(axiosErr.response?.status || 500).json({
        success: false,
        message: 'Reactivation failed at carrier (network/carrier error)',
        transactionId,
        error: axiosErr.response?.data || { message: axiosErr.message },
      });
    }

    const apiResponse = carrierResponse.data;
    const data = apiResponse.data || {};

    // === Check for carrier-level error ===
    const hasError =
      data.status === 'ERROR' ||
      data.status === 'FAILED' ||
      data.error ||
      (data.result &&
        data.result.some((r) => r.status === 'ERROR' || r.status === 'FAILED'));

    if (hasError) {
      // DO NOT save reactivation record
      return res.status(400).json({
        success: false,
        message: 'Reactivation failed at carrier',
        transactionId,
        carrierError: data.error || data.result || 'Unknown carrier error',
        apiResponse,
      });
    }

    // === SUCCESS: Only save when carrier confirms reactivation ===

    await Reactivation.create({
      user: targetUser._id, // ← Link to the user who owns the line
      reactivatedBy: authenticatedUser._id, // ← Who performed the reactivation
      reactivatedByRole: type,
      msisdn: data.msisdn || msisdn || '',
      iccid: data.iccid || iccid || '',
      plan: plan_soc,
      zip: marketZip,
      transactionId,
      accountId: data.accountId || '',
      status: data.status || 'SUCCESS',
      result: data.result || [],
      error: null,
      reactivationDate: new Date(),
      reactivatedBy: authenticatedUser._id,
      reactivatedByRole: type,
    });

    // === Final Success Response ===
    res.json({
      success: true,
      message: 'Line reactivated successfully',
      reactivatedBy: {
        type,
        id: authenticatedUser._id,
        name: authenticatedUser.fullName || authenticatedUser.email,
      },
      reactivatedFor: {
        userId: targetUser._id,
        email: targetUser.email,
      },
      transactionId,
      line: {
        msisdn: data.msisdn || msisdn || 'N/A',
        iccid: data.iccid || iccid || 'N/A',
      },
      status: data.status || 'SUCCESS',
      portInRequestId: data.portInRequestId || null,
      apiResponse,
    });
  } catch (err) {
    console.error('Reactivate Internal Error:', err);
    res.status(500).json({
      success: false,
      message: 'Internal server error',
      error: err.message,
    });
  }
});

export default router;
