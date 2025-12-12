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

// POST /api/update-e911 - Update E911 Address
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
      `E911 Update request by ${type.toUpperCase()}:`,
      authenticatedUser.email || authenticatedUser.fullName
    );

    // Determine target user (whose line we're updating)
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

    const { msisdn, iccid, e911Address } = req.body;

    // Validate required fields
    if (!msisdn && !iccid) {
      return res.status(400).json({
        success: false,
        message: 'At least one of msisdn or iccid is required',
      });
    }

    if (!e911Address || typeof e911Address !== 'object') {
      return res.status(400).json({
        success: false,
        message: 'e911Address object is required',
      });
    }

    const { street1, street2, city, state, zip } = e911Address;

    if (!street1 || !city || !state || !zip) {
      return res.status(400).json({
        success: false,
        message: 'street1, city, state, and zip are required in e911Address',
      });
    }

    // Generate 12-digit numeric transaction ID
    const transactionId = generateTransactionId();

    // Prepare payload for external API
    const payload = {
      msisdn,
      iccid,
      e911Address: {
        street1,
        street2: street2 || '',
        city,
        state,
        zip,
      },
    };

    // Call external E911 update API
    const response = await axios.post(
      `${process.env.BASE_URL}/UpdateE911Address`,
      payload,
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

    // Optional: Save update history in user's activationData (if line exists)
    const activationEntry = targetUser.activationData.find(
      (act) => act.msisdn === msisdn || act.iccid === iccid
    );

    if (activationEntry) {
      activationEntry.E911ADDRESS = {
        e911AddressStreet1: street1,
        e911AddressStreet2: street2 || '',
        e911AddressCity: city,
        e911AddressState: state,
        e911AddressZip: zip,
      };
      activationEntry.updatedAt = new Date();
      await targetUser.save();
    }

    // Success response
    res.json({
      success: true,
      message: 'E911 address updated successfully',
      updatedBy: {
        type,
        id: authenticatedUser._id,
        name: authenticatedUser.fullName || authenticatedUser.email,
      },
      updatedFor: {
        userId: targetUser._id,
        email: targetUser.email,
      },
      transactionId,
      line: { msisdn, iccid },
      e911Address: payload.e911Address,
      apiResponse: data,
    });
  } catch (err) {
    console.error(
      'Update E911 Address Error:',
      err.response?.data || err.message
    );

    return res.status(err.response?.status || 500).json({
      success: false,
      error: 'Failed to update E911 address',
      details: err.response?.data || { message: err.message },
    });
  }
});

export default router;
