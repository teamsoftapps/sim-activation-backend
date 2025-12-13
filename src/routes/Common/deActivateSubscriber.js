/** @format */

import express from 'express';
import axios from 'axios';
import User from '../../models/User.js';
import Activation from '../../models/Activation.js';
import E911Update from '../../models/E911Update.js';
import authMiddleware from '../../middleware/authMiddleware.js';
import authUser from '../../utils/authUser.js';
import generateTransactionId from '../../utils/generateTransactionId.js';
import dotenv from 'dotenv';

dotenv.config();

const router = express.Router();

router.post('/', authMiddleware(), async (req, res) => {
  try {
    const { user: authenticatedUser, type, isAdmin } = authUser(req);

    if (!authenticatedUser) {
      return res.status(401).json({
        success: false,
        message: 'Unauthorized: Invalid or missing token',
      });
    }

    const { userId, msisdn, iccid, e911Address } = req.body;

    // === Validation ===
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

    const { street1, street2 = '', city, state, zip } = e911Address;

    if (!street1 || !city || !state || !zip) {
      return res.status(400).json({
        success: false,
        message: 'street1, city, state, and zip are required in e911Address',
      });
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
      e911Address: { street1, street2, city, state, zip },
    };

    // === Call Carrier API ===
    let carrierResponse;
    try {
      carrierResponse = await axios.post(
        `${process.env.BASE_URL}/UpdateE911Address`,
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
        message: 'E911 update failed at carrier',
        transactionId,
        error: axiosErr.response?.data || { message: axiosErr.message },
      });
    }

    const data = carrierResponse.data;

    // === Check for carrier error ===
    const hasError =
      ['ERROR', 'FAILED'].includes(data.status) ||
      data.error ||
      (Array.isArray(data.result) &&
        data.result.some((r) => ['ERROR', 'FAILED'].includes(r.status)));

    if (hasError) {
      return res.status(400).json({
        success: false,
        message: 'E911 address update failed at carrier',
        transactionId,
        carrierError: data.error || data.result || 'Unknown carrier error',
        apiResponse: data,
      });
    }

    // === SUCCESS: Save audit log ===
    await E911Update.create({
      user: targetUser._id,
      updatedBy: authenticatedUser._id,
      updatedByRole: type,
      msisdn: msisdn || '',
      iccid: iccid || '',
      e911Address: payload.e911Address,
      transactionId,
      updatedAt: new Date(),
    });

    // === Update main Activation record (for fast dashboard access) ===
    const activationEntry = await Activation.findOne({
      user: targetUser._id,
      $or: [{ msisdn }, { iccid }],
    });

    if (activationEntry) {
      activationEntry.E911ADDRESS = payload.e911Address;
      activationEntry.e911UpdatedAt = new Date();
      activationEntry.e911UpdatedBy = authenticatedUser._id;
      activationEntry.e911UpdatedByRole = type;
      await activationEntry.save();
    }

    // === Success Response ===
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
      line: { msisdn: msisdn || 'N/A', iccid: iccid || 'N/A' },
      e911Address: payload.e911Address,
      status: data.status || 'SUCCESS',
      apiResponse: data,
    });
  } catch (err) {
    console.error('Update E911 Internal Error:', err);
    res.status(500).json({
      success: false,
      message: 'Internal server error',
      error: err.message,
    });
  }
});

export default router;
