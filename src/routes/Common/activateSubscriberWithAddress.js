/** @format */

import express from 'express';
import axios from 'axios';
import User from '../../models/User.js';
import authMiddleware from '../../middleware/authMiddleware.js';
import authUser from '../../utils/authUser.js';
import dotenv from 'dotenv';
import generateTransactionId from '../../utils/generateTransactionId.js';

dotenv.config();

const router = express.Router();

// POST /api/activate-v2  (or replace your old route)
router.post('/', authMiddleware(), async (req, res) => {
  try {
    // Detect who is making the request: User or Admin
    const { user: authenticatedUser, type, isAdmin, isUser } = authUser(req);

    if (!authenticatedUser) {
      return res.status(401).json({
        success: false,
        message: 'Unauthorized: Invalid or missing token',
      });
    }

    console.log(
      `Activation request by ${type.toUpperCase()}:`,
      authenticatedUser.email || authenticatedUser.fullName
    );

    // Determine which user gets the line activated
    let targetUser;

    if (isAdmin && req.body.userId) {
      // Admin activating on behalf of a specific user
      targetUser = await User.findById(req.body.userId);
      if (!targetUser) {
        return res.status(404).json({
          success: false,
          message: 'Target user not found',
        });
      }
    } else if (isUser) {
      // Regular user activating for themselves
      targetUser = authenticatedUser;
    } else {
      return res.status(400).json({
        success: false,
        message:
          'Admin must include "userId" in request body to activate for a user',
      });
    }

    // Credit check & deduction (only for regular users)
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

      targetUser.credits -= activationCost;
    }

    // Extract fields from body
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

    const transactionId = generateTransactionId();

    // Call external activation API
    const activationResponse = await axios.post(
      `${process.env.BASE_URL}/ActivateSubscriberWithAddress`,
      req.body,
      {
        headers: {
          'client-api-key': process.env.CLIENT_API_KEY,
          'client-id': process.env.CLIENT_ID,
          'transaction-id': transactionId,
          'Content-Type': 'application/json',
        },
      }
    );

    const data = activationResponse.data;

    // Save activation record to target user
    targetUser.activationData.push({
      sim: sim || '',
      plan_soc: plan_soc || '',
      imei: imei || '',
      zip: zip || '',
      label: label || '',
      transactionId: data.transactionId || data.TransactionId,
      accountId: data.accountId || data.AccountId,
      msisdn: data.msisdn || data.MSISDN || data.Mdn,
      iccid: data.iccid || data.ICCID || data.Iccid,
      activationDate: new Date(),
      endDateOfActivation: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days
      E911ADDRESS: {
        e911AddressStreet1: e911AddressStreet1 || '',
        e911AddressStreet2: e911AddressStreet2 || '',
        e911AddressCity: e911AddressCity || '',
        e911AddressState: e911AddressState || '',
        e911AddressZip: e911AddressZip || '',
      },
    });

    await targetUser.save();

    // Success response
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
      line: {
        msisdn: data.msisdn || data.MSISDN,
        iccid: data.iccid || data.ICCID,
      },
      remainingCredits: isUser ? targetUser.credits : 'Unlimited (Admin)',
      activationResponse: data,
    });
  } catch (err) {
    console.error('Activation Error:', err.response?.data || err.message);

    return res.status(err.response?.status || 500).json({
      success: false,
      error: 'Activation failed',
      details: err.response?.data || { message: err.message },
    });
  }
});

export default router;
