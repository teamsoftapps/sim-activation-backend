/** @format */

import express from 'express';
import multer from 'multer';
import XLSX from 'xlsx';
import axios from 'axios';
import User from '../../models/User.js';
import Deactivation from '../../models/Deactivation.js'; // or Reactivation log
import authMiddleware from '../../middleware/authMiddleware.js';
import authUser from '../../utils/authUser.js';
import generateTransactionId from '../../utils/generateTransactionId.js';
import dotenv from 'dotenv';

dotenv.config();

const upload = multer({ storage: multer.memoryStorage() });
const router = express.Router();

router.post(
  '/',
  authMiddleware(),
  upload.single('excelFile'),
  async (req, res) => {
    try {
      const { user: authenticatedUser, type, isAdmin, isUser } = authUser(req);

      if (!authenticatedUser) {
        return res
          .status(401)
          .json({ success: false, message: 'Unauthorized' });
      }

      let targetUser;
      if (isAdmin && req.body.userId) {
        targetUser = await User.findById(req.body.userId);
        if (!targetUser)
          return res
            .status(404)
            .json({ success: false, message: 'Target user not found' });
      } else if (isUser) {
        targetUser = authenticatedUser;
      } else {
        return res
          .status(400)
          .json({ success: false, message: 'Admin must provide "userId"' });
      }

      if (!req.file)
        return res
          .status(400)
          .json({ success: false, message: 'Excel file is required' });

      const workbook = XLSX.read(req.file.buffer, { type: 'buffer' });
      const sheetName = workbook.SheetNames[0];
      const sheet = workbook.Sheets[sheetName];
      const rows = XLSX.utils.sheet_to_json(sheet, { header: 1, raw: false });

      if (rows.length < 2)
        return res.status(400).json({
          success: false,
          message: 'Excel must have at least one data row',
        });

      const headers = rows[0].map((h) => h.toString().trim().toLowerCase());
      const dataRows = rows.slice(1);

      const results = [];

      for (const row of dataRows) {
        const rowData = {};
        row.forEach((value, i) => {
          rowData[headers[i]] = (value || '').toString().trim();
        });

        const {
          msisdn = '',
          iccid = '',
          street1 = '',
          street2 = '',
          city = '',
          state = '',
          zip = '',
        } = rowData;

        if (!msisdn && !iccid) {
          results.push({
            success: false,
            row,
            error: 'Empty row - skipped',
          });
          continue;
        }

        const transactionId = generateTransactionId();
        let rowStatus = 'Failed';
        let rowError = '';
        let carrierData = null;

        try {
          const payload = {
            msisdn,
            iccid,
            e911Address: {
              street1,
              street2,
              city,
              state,
              zip,
            },
          };
console.log('Payload for E911 Update:', payload);
          const carrierResponse = await axios.post(
            `${process.env.BASE_URL}/UpdateE911Address`,
            payload,
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

          carrierData = carrierResponse.data;

          const hasError =
            carrierData?.data?.status === 'ERROR' ||
            carrierData?.data?.status === 'FAILED' ||
            carrierData?.data?.error;
console.log('Carrier Response for E911 Update:', carrierData);
          if (hasError) {
            const errorMessage =
              carrierData?.data?.error?.message ||
              carrierData?.data?.error?.error ||
              'Unknown carrier error';
            throw new Error(errorMessage);
          }

          rowStatus = 'Success';

          // Optionally log reactivation
          await Deactivation.create({
            user: targetUser._id,
            reactivatedBy: authenticatedUser._id,
            reactivatedByRole: type,
            msisdn,
            iccid,
            transactionId,
            reactivationDate: new Date(),
            response: carrierData,
          });
        } catch (errRow) {
          rowError = errRow.message;
        }

        results.push({
          success: rowStatus === 'Success',
          row,
          transactionId,
          msisdn,
          iccid,
          data: carrierData,
          error: rowError || null,
        });
      }

      const successes = results.filter((r) => r.success).length;

      if (successes === 0) {
        return res.status(400).json({
          success: false,
          message: 'All rows failed',
          results,
        });
      }

      return res.status(200).json({
        success: true,
        message: `${successes} rows reactivated successfully`,
        results,
      });
    } catch (err) {
      console.error('Bulk Reactivation Critical Error:', err);
      return res.status(500).json({
        success: false,
        message: 'Bulk reactivation failed',
        error: err.message,
      });
    }
  }
);

export default router;
