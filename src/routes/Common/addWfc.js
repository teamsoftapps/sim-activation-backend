/** @format */

import express from 'express';
import axios from 'axios';
import User from '../../models/User.js';
import authMiddleware from '../../middleware/authMiddleware.js';
import authUser from '../../utils/authUser.js';
import dotenv from 'dotenv';

dotenv.config();

const router = express.Router();

// POST /api/add-wfc - Enable Wi-Fi Calling (WFC) for a line
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
      `Add WFC request by ${type.toUpperCase()}:`,
      authenticatedUser.email || authenticatedUser.fullName
    );

    // Determine target user (whose line gets WFC enabled)
    let targetUser;

    if (isAdmin && req.body.userId) {
      targetUser = await User.findById(req.body.userId);
      if (!targetUser) {
        return res.status(404).json({
          success: false,
          message: 'Target user not found',
        });
      }
    } else if (isUser) {
      targetUser = authenticatedUser;
    } else {
      return res.status(400).json({
        success: false,
        message: 'Admin must provide "userId" in body',
      });
    }

    // Get the user's stored OPNComm token
    if (!targetUser.opncommToken) {
      return res.status(400).json({
        success: false,
        message: 'User has no opncommToken configured. Please set it first.',
      });
    }

    const bearerToken = targetUser.opncommToken;

    // Optional: Validate required fields (depends on OPNComm API)
    const { msisdn, iccid } = req.body;
    if (!msisdn && !iccid) {
      return res.status(400).json({
        success: false,
        message: 'msisdn or iccid is required',
      });
    }

    console.log(
      `Enabling WFC for user ${
        targetUser.email
      } using token: ${bearerToken.slice(0, 10)}...`
    );

    // Call OPNComm API
    const response = await axios.post(
      'https://api.opncomm.com/opencom/api/v1/add-wfc',
      req.body,
      {
        headers: {
          Authorization: `Bearer ${bearerToken}`,
          'Content-Type': 'application/json',
        },
        timeout: 15000, // 15 second timeout
      }
    );

    const data = response.data;

    // Optional: Save WFC enablement in activationData history
    const activationEntry = targetUser.activationData.find(
      (act) => act.msisdn === msisdn || act.iccid === iccid
    );

    if (activationEntry) {
      activationEntry.wfcEnabled = true;
      activationEntry.wfcEnabledAt = new Date();
      await targetUser.save();
    }

    // Success response
    res.json({
      success: true,
      message: 'Wi-Fi Calling (WFC) enabled successfully',
      enabledBy: {
        type,
        id: authenticatedUser._id,
        name: authenticatedUser.fullName || authenticatedUser.email,
      },
      enabledFor: {
        userId: targetUser._id,
        email: targetUser.email,
      },
      line: { msisdn, iccid },
      opncommResponse: data,
    });
  } catch (err) {
    console.error('Add WFC Error:', err.response?.data || err.message);

    const status = err.response?.status || 500;
    const errorData = err.response?.data || { message: err.message };

    return res.status(status).json({
      success: false,
      error: 'Failed to enable Wi-Fi Calling',
      details: errorData,
    });
  }
});

export default router;
