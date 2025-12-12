/** @format */

import express from 'express';
import axios from 'axios';
import User from '../../models/User.js';
import authMiddleware from '../../middleware/authMiddleware.js';
import authUser from '../../utils/authUser.js';
import generateTransactionId from '../../utils/generateTransactionId.js'; // your 12-digit function
import dotenv from 'dotenv';

dotenv.config();

const router = express.Router();

// POST /api/deactivate - Deactivate SIM (User or Admin)
router.post('/', authMiddleware(), async (req, res) => {
  try {
    // Detect who is making the request
    const { user: authenticatedUser, type, isAdmin, isUser } = authUser(req);

    if (!authenticatedUser) {
      return res.status(401).json({
        success: false,
        message: 'Unauthorized: Invalid or missing token',
      });
    }

    console.log(
      `Deactivation request by ${type.toUpperCase()}:`,
      authenticatedUser.email || authenticatedUser.fullName
    );

    // Determine target user (who owns the SIM)
    let targetUser;

    if (isAdmin && req.body.userId) {
      // Admin deactivating on behalf of a user
      targetUser = await User.findById(req.body.userId);
      if (!targetUser) {
        return res.status(404).json({
          success: false,
          message: 'Target user not found',
        });
      }
    } else if (isUser) {
      // Regular user deactivating their own SIM
      targetUser = authenticatedUser;
    } else {
      return res.status(400).json({
        success: false,
        message: 'Admin must provide "userId" in body',
      });
    }

    const { msisdn, iccid } = req.body;

    if (!msisdn && !iccid) {
      return res.status(400).json({
        success: false,
        message: 'At least one of msisdn or iccid is required',
      });
    }

    // Generate 12-digit numeric transaction ID
    const transactionId = generateTransactionId(); // e.g., "000000123456" or "170248392174"

    // Call external deactivation API
    const response = await axios.post(
      `${process.env.BASE_URL}/DeActivateSubscriber`,
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

    const data = response.data;

    // Save deactivation record
    targetUser.deactivationData = targetUser.deactivationData || [];
    targetUser.deactivationData.push({
      transactionId,
      accountId: data.accountId || data.AccountId || '',
      msisdn: msisdn || '',
      iccid: iccid || '',
      deactivationDate: new Date(),
    });

    await targetUser.save();

    // Success response
    res.json({
      success: true,
      message: 'SIM deactivated successfully',
      deactivatedBy: {
        type,
        id: authenticatedUser._id,
        name: authenticatedUser.fullName || authenticatedUser.email,
      },
      deactivatedFor: {
        userId: targetUser._id,
        email: targetUser.email,
      },
      transactionId,
      line: { msisdn, iccid },
      deactivationResponse: data,
    });
  } catch (err) {
    console.error('Deactivation Error:', err.response?.data || err.message);

    return res.status(err.response?.status || 500).json({
      success: false,
      error: 'Deactivation failed',
      details: err.response?.data || { message: err.message },
    });
  }
});

export default router;
