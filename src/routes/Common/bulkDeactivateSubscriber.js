/** @format */

import express from 'express';
import multer from 'multer';
import XLSX from 'xlsx';
import axios from 'axios';
import User from '../../models/User.js';
import Deactivation from '../../models/Deactivation.js'; // Optional: you can create a model to log deactivations
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
        return res.status(401).json({ success: false, message: 'Unauthorized' });
      }

      let targetUser;
      if (isAdmin && req.body.userId) {
        targetUser = await User.findById(req.body.userId);
        if (!targetUser)
          return res.status(404).json({ success: false, message: 'Target user not found' });
      } else if (isUser) {
        targetUser = authenticatedUser;
      } else {
        return res.status(400).json({ success: false, message: 'Admin must provide "userId"' });
      }

      if (!req.file)
        return res.status(400).json({ success: false, message: 'Excel file is required' });

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
      const reportRows = [
        headers.concat(['Status', 'Error Message', 'Transaction ID']),
      ];

      for (const row of dataRows) {
        const rowData = {};
        row.forEach((value, i) => {
          rowData[headers[i]] = (value || '').toString().trim();
        });

        const { msisdn = '', iccid = '' } = rowData;

        if (!msisdn && !iccid) {
          reportRows.push(row.concat(['Failed', 'Empty row - skipped', '']));
          results.push({ success: false, row, error: 'Empty row - skipped' });
          continue;
        }

        let rowStatus = 'Failed';
        let rowError = '';
        let rowTxnId = '';

        try {
          const transactionId = generateTransactionId();

          const payload = { msisdn, iccid };
          rowTxnId = transactionId;

          let carrierResponse;
          try {
            carrierResponse = await axios.post(
              `${process.env.BASE_URL}/DeActivateSubscriber`,
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
            console.log(carrierResponse)
          } catch (axiosErr) {
            throw new Error(axiosErr.response?.data?.error || axiosErr.message);
          }

          const data = carrierResponse.data;
          const hasError =
            data?.data?.status === 'ERROR' ||
            data?.data?.status === 'FAILED' ||
            data?.data?.error;

          if (hasError) {
            const errorMessage =
              data?.data?.error?.message ||
              data?.data?.error?.error ||
              'Unknown carrier error';
            throw new Error(errorMessage);
          }

          // Optionally log deactivation
          await Deactivation.create({
            user: targetUser._id,
            deactivatedBy: authenticatedUser._id,
            deactivatedByRole: type,
            msisdn,
            iccid,
            transactionId: transactionId,
            deactivationDate: new Date(),
            response: data,
          });

          rowStatus = 'Success';
          results.push({ success: true, row, transactionId });
        } catch (errRow) {
          rowError = errRow.message;
          results.push({ success: false, row, error: rowError });
        }

        reportRows.push(row.concat([rowStatus, rowError, rowTxnId]));
      }

      const successes = results.filter((r) => r.success).length;

      if (successes === 0) {
        return res.status(400).json({ success: false, message: 'All rows failed', results });
      }

      // Generate Excel Report
      const reportSheet = XLSX.utils.aoa_to_sheet(reportRows);
      const reportWorkbook = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(reportWorkbook, reportSheet, 'Bulk Deactivation Report');
      const excelBuffer = XLSX.write(reportWorkbook, { type: 'buffer', bookType: 'xlsx' });

      res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
      res.setHeader('Content-Disposition', `attachment; filename=bulk_deactivation_report_${Date.now()}.xlsx`);
      return res.end(excelBuffer);
    } catch (err) {
      console.error('Bulk Deactivation Critical Error:', err);
      res.status(500).json({ success: false, message: 'Bulk deactivation failed', error: err.message });
    }
  }
);

export default router;
