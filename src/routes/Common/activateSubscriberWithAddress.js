/** @format */

import express from 'express';
import axios from 'axios';
import User from '../../models/User.js';
import Activation from '../../models/Activation.js';
import authMiddleware from '../../middleware/authMiddleware.js';
import authUser from '../../utils/authUser.js';
import generateTransactionId from '../../utils/generateTransactionId.js';
import dotenv from 'dotenv';

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

    // === Determine target user ===
    let targetUser;
    if (isAdmin && req.body.userId) {
      targetUser = await User.findById(req.body.userId);
      if (!targetUser) {
        return res
          .status(404)
          .json({ success: false, message: 'Target user not found' });
      }
    } else if (isUser) {
      targetUser = authenticatedUser;
    } else {
      return res
        .status(400)
        .json({ success: false, message: 'Admin must include "userId"' });
    }

    // === Credit Check (only check — don't deduct yet) ===
    if (isUser) {
      const activationCost = targetUser.activationCost ?? 0;
      if (targetUser.credits < activationCost) {
        return res.status(400).json({
          success: false,
          message: 'Insufficient credits',
          required: activationCost,
          available: targetUser.credits,
        });
      }
    }

    const transactionId = generateTransactionId();

    // === Call Carrier API ===
    let carrierResponse;
    try {
      carrierResponse = await axios.post(
        `${process.env.BASE_URL}/ActivateSubscriberWithAddress`,
        req.body,
        {
          headers: {
            'client-api-key': process.env.CLIENT_API_KEY,
            'client-id': process.env.CLIENT_ID,
            'transaction-id': transactionId,
            'Content-Type': 'application/json',
          },
          timeout: 35000,
        }
      );
    } catch (axiosErr) {
      return res.status(axiosErr.response?.status || 500).json({
        success: false,
        message: 'Activation failed at carrier',
        transactionId,
        error: axiosErr.response?.data || { message: axiosErr.message },
      });
    }

    const data = carrierResponse.data;
    const innerData = data.data || data; // Some carriers wrap in "data"

    // === CRITICAL: Check for ANY error from carrier ===
    const hasError =
      innerData.error ||
      innerData.status === 'ERROR' ||
      innerData.status === 'FAILED' ||
      (Array.isArray(innerData.result) &&
        innerData.result.some(
          (r) => r.status === 'ERROR' || r.status === 'FAILED'
        ));

    if (hasError) {
      // DO NOT deduct credits, DO NOT save activation
      return res.status(400).json({
        success: false,
        message: 'Activation failed at carrier',
        transactionId,
        carrierError: innerData.error || innerData.result || 'Unknown error',
        apiResponse: data,
      });
    }

    // === SUCCESS: Now safe to deduct credits and save ===
    if (isUser) {
      const activationCost = targetUser.activationCost ?? 0;
      targetUser.credits -= activationCost;
      await targetUser.save(); // Save credit deduction
    }

    const {
      sim,
      plan_soc,
      imei,
      label,
      zip,
      e911AddressStreet1,
      e911AddressStreet2,
      e911AddressCity,
      e911AddressState,
      e911AddressZip,
    } = req.body;

    await Activation.create({
      user: targetUser._id,
      activatedBy: authenticatedUser._id,
      activatedByRole: type,

      sim: sim || '',
      plan_soc: plan_soc || '',
      imei: imei || '',
      label: label || '',
      zip: zip || '',
      transactionId:
        innerData.transactionId || innerData.TransactionId || transactionId,
      accountId: innerData.accountId || innerData.AccountId || '',
      msisdn: innerData.msisdn || innerData.MSISDN || innerData.Mdn || '',
      iccid: innerData.iccid || innerData.ICCID || innerData.Iccid || '',
      activationDate: new Date(),
      endDateOfActivation: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
      E911ADDRESS: {
        e911AddressStreet1: e911AddressStreet1 || '',
        e911AddressStreet2: e911AddressStreet2 || '',
        e911AddressCity: e911AddressCity || '',
        e911AddressState: e911AddressState || '',
        e911AddressZip: e911AddressZip || '',
      },
    });

    // === Final Success Response ===
    res.json({
      success: true,
      message: isAdmin
        ? 'Device activated by Admin (no cost)'
        : 'Device activated successfully. Credits deducted.',
      activatedBy: {
        type,
        id: authenticatedUser._id,
        name: authenticatedUser.fullName || authenticatedUser.email,
      },
      activatedFor: {
        userId: targetUser._id,
        email: targetUser.email,
      },
      transactionId,
      line: {
        msisdn: innerData.msisdn || innerData.MSISDN || 'N/A',
        iccid: innerData.iccid || innerData.ICCID || 'N/A',
      },
      remainingCredits: isUser ? targetUser.credits : 'Unlimited (Admin)',
      activationResponse: data,
    });
  } catch (err) {
    console.error('Activation Internal Error:', err);
    res.status(500).json({
      success: false,
      message: 'Internal server error',
      error: err.message,
    });
  }
});

export default router;
