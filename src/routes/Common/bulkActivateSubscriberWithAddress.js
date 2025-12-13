/** @format */

import express from 'express';
import multer from 'multer';
import XLSX from 'xlsx';
import axios from 'axios';
import User from '../../models/User.js';
import Activation from '../../models/Activation.js';
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

      const headers = rows[0].map((h) => h.toString().trim());
      const dataRows = rows.slice(1);

      const results = [];
      let totalDeducted = 0;

      // Prepare for Excel report
      const reportRows = [
        headers.concat([
          'Status',
          'Error Message',
          'MSISDN',
          'ICCID',
          'Transaction ID',
        ]),
      ];

      for (const row of dataRows) {
        const activationData = {};
        row.forEach((value, i) => {
          activationData[headers[i].toLowerCase()] = value || '';
        });

        const {
          sim = '',
          plan_soc = '',
          imei = '',
          label = '',
          zip = '',
          e911addressstreet1 = '',
          e911addressstreet2 = '',
          e911addresscity = '',
          e911addressstate = '',
          e911addresszip = '',
        } = activationData;

        if (!sim && !plan_soc) {
          reportRows.push(
            row.concat(['Failed', 'Empty row - skipped', '', '', ''])
          );
          results.push({ success: false, row, error: 'Empty row - skipped' });
          continue;
        }

        let rowStatus = 'Failed';
        let rowError = '';
        let rowMsisdn = '';
        let rowIccid = '';
        let rowTxnId = '';

        try {
          if (isUser) {
            const cost = targetUser.activationCost ?? 0;
            if (targetUser.credits < cost) {
              throw new Error(
                `Insufficient credits (need: ${cost}, have: ${targetUser.credits})`
              );
            }
          }

          const transactionId = generateTransactionId();

          const payload = {
            sim,
            plan_soc,
            imei,
            label,
            zip,
            E911ADDRESS: {
              STREET1: e911addressstreet1,
              STREET2: e911addressstreet2,
              CITY: e911addresscity,
              STATE: e911addressstate,
              ZIP: e911addresszip,
            },
          };

          let carrierResponse;
          try {
            carrierResponse = await axios.post(
              `${process.env.BASE_URL}/ActivateSubscriberWithAddress`,
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
          } catch (axiosErr) {
            throw new Error(axiosErr.response?.data?.error || axiosErr.message);
          }

          const data = carrierResponse.data;

          const hasError =
            data.status === 'ERROR' ||
            data.status === 'FAILED' ||
            data.error ||
            (data.result && data.result.some((r) => r.status === 'ERROR'));

          if (hasError) {
            throw new Error(
              JSON.stringify(
                data.error || data.result || 'Unknown carrier error'
              )
            );
          }

          // SUCCESS
          if (isUser) {
            const cost = targetUser.activationCost ?? 0;
            targetUser.credits -= cost;
            totalDeducted += cost;
          }

          await Activation.create({
            user: targetUser._id,
            activatedBy: authenticatedUser._id,
            activatedByRole: type,
            sim,
            plan_soc,
            imei,
            label,
            zip,
            transactionId:
              data.transactionId || data.TransactionId || transactionId,
            accountId: data.accountId || data.AccountId || '',
            msisdn: data.msisdn || data.MSISDN || data.Mdn || '',
            iccid: data.iccid || data.ICCID || data.Iccid || '',
            activationDate: new Date(),
            endDateOfActivation: new Date(
              Date.now() + 30 * 24 * 60 * 60 * 1000
            ),
            E911ADDRESS: {
              e911AddressStreet1: e911addressstreet1,
              e911AddressStreet2: e911addressstreet2,
              e911AddressCity: e911addresscity,
              e911AddressState: e911addressstate,
              e911AddressZip: e911addresszip,
            },
          });

          rowStatus = 'Success';
          rowMsisdn = data.msisdn || 'N/A';
          rowIccid = data.iccid || 'N/A';
          rowTxnId = transactionId;

          results.push({
            success: true,
            row,
            msisdn: rowMsisdn,
            iccid: rowIccid,
            transactionId: rowTxnId,
          });
        } catch (rowError) {
          rowError = rowError.message;
          results.push({ success: false, row, error: rowError.message });
        }

        reportRows.push(
          row.concat([rowStatus, rowError, rowMsisdn, rowIccid, rowTxnId])
        );
      }

      // === Generate Excel Report ===
      const reportSheet = XLSX.utils.aoa_to_sheet(reportRows);
      const reportWorkbook = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(
        reportWorkbook,
        reportSheet,
        'Bulk Activation Report'
      );

      const excelBuffer = XLSX.write(reportWorkbook, {
        type: 'buffer',
        bookType: 'xlsx',
      });

      const successes = results.filter((r) => r.success).length;
      const failures = results.length - successes;

      // === Send Excel as download + JSON summary ===
      res.setHeader(
        'Content-Type',
        'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
      );
      res.setHeader(
        'Content-Disposition',
        `attachment; filename=bulk_activation_report_${Date.now()}.xlsx`
      );
      res.send(excelBuffer);

      // Optional: Also send JSON if you want both (comment out if only Excel needed)
      // res.json({ ... summary, results });
    } catch (err) {
      console.error('Bulk Activation Critical Error:', err);
      res.status(500).json({
        success: false,
        message: 'Bulk activation failed',
        error: err.message,
      });
    }
  }
);

export default router;
