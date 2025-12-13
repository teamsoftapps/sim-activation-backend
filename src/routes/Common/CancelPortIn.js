/** @format */

import express from 'express';
import axios from 'axios';
import User from '../../models/User.js';
import authMiddleware from '../../middleware/authMiddleware.js';
import authUser from '../../utils/authUser.js';
import generateTransactionId from '../../utils/generateTransactionId.js';
import dotenv from 'dotenv';
import PortInCancellation from '../../models/PortInCancellation.js';

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

    const { userId, iccid, portIn } = req.body;

    // === Validation ===
    if (!iccid) {
      return res
        .status(400)
        .json({ success: false, message: 'iccid is required' });
    }
    if (!portIn || !portIn.portInMsisdn) {
      return res
        .status(400)
        .json({ success: false, message: 'portIn.portInMsisdn is required' });
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
      iccid,
      portIn: { portInMsisdn: portIn.portInMsisdn },
    };

    // === Call Carrier API ===
    let carrierResponse;
    try {
      carrierResponse = await axios.post(
        `${process.env.BASE_URL}/CancelPortIn`,
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
      // Network or 4xx/5xx error from carrier
      return res.status(axiosErr.response?.status || 500).json({
        success: false,
        message: 'Failed to cancel port-in at carrier',
        transactionId,
        error: axiosErr.response?.data || { message: axiosErr.message },
      });
    }

    const result = carrierResponse.data.data || carrierResponse.data;

    // === Check if carrier returned an error ===
    const hasError =
      result.error &&
      (result.error.message || result.error.code || result.error.statusCode);

    if (hasError || result.status === 'ERROR' || result.status === 'FAILED') {
      // Do NOT save anything to DB on error
      return res.status(400).json({
        success: false,
        message: 'Port-in cancellation failed at carrier',
        transactionId,
        carrierError: result.error || { message: 'Unknown carrier error' },
        apiResponse: carrierResponse.data,
      });
    }

    await PortInCancellation.create({
      user: targetUser._id,
      cancelledBy: authenticatedEntity._id,
      cancelledByRole: isAdmin ? 'admin' : 'user',

      iccid,
      portInMsisdn: portIn.portInMsisdn,
      msisdn: result.msisdn || '',
      status: result.status || 'SUCCESS',
      portInRequestId: result.portInRequestId || '',
      portInDueDate: result.portInDueDate
        ? new Date(result.portInDueDate)
        : null,
      result: result.result || [],
      error: null,
      transactionId,
      cancelledAt: new Date(),
    });

    // === Final Success Response ===
    res.json({
      success: true,
      message: 'Port-in cancelled successfully',
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
        iccid,
        msisdn: result.msisdn || 'N/A',
        portInMsisdn: portIn.portInMsisdn,
      },
      portInRequestId: result.portInRequestId,
      status: result.status,
      apiResponse: carrierResponse.data,
    });
  } catch (err) {
    console.error('CancelPortIn Internal Error:', err);
    res.status(500).json({
      success: false,
      message: 'Internal server error',
      error: err.message,
    });
  }
});

export default router;
