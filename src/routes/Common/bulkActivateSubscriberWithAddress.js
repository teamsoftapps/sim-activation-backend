/** @format */

import express from 'express';
import multer from 'multer';
import XLSX from 'xlsx';
import axios from 'axios';
import User from '../../models/User.js';
import authMiddleware from '../../middleware/authMiddleware.js';
import authUser from '../../utils/authUser.js';
import generateTransactionId from '../../utils/generateTransactionId.js';
import dotenv from 'dotenv';

dotenv.config();

// Configure multer for file upload (Excel files)
const upload = multer({ storage: multer.memoryStorage() });

const router = express.Router();

// POST /api/bulk-activate - Bulk Activate Subscribers from Excel
router.post(
  '/',
  authMiddleware(),
  upload.single('excelFile'),
  async (req, res) => {
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
        `Bulk Activation request by ${type.toUpperCase()}:`,
        authenticatedUser.email || authenticatedUser.fullName
      );

      // Determine target user (for bulk, admin can specify a single userId for all rows)
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
          message: 'Admin must provide "userId" in body for bulk activation',
        });
      }

      // Check for uploaded Excel file
      if (!req.file) {
        return res.status(400).json({
          success: false,
          message: 'Excel file is required',
        });
      }

      // Parse Excel file
      const workbook = XLSX.read(req.file.buffer, { type: 'buffer' });
      const sheetName = workbook.SheetNames[0];
      const sheet = workbook.Sheets[sheetName];
      const rows = XLSX.utils.sheet_to_json(sheet, { header: 1, raw: false });

      if (rows.length < 2) {
        return res.status(400).json({
          success: false,
          message: 'Excel file must have at least one data row (after headers)',
        });
      }

      // Assume first row is headers: sim, plan_soc, imei, label, zip, e911AddressStreet1, e911AddressStreet2, e911AddressCity, e911AddressState, e911AddressZip
      const headers = rows[0].map((h) => h.toLowerCase().trim());
      const dataRows = rows.slice(1);

      const results = []; // Track successes and failures
      let totalDeducted = 0;

      for (const row of dataRows) {
        // Map row to activation data
        const activationData = {};
        row.forEach((value, index) => {
          const key = headers[index];
          activationData[key] = value || '';
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

        // Skip empty rows
        if (!sim && !plan_soc) continue;

        try {
          // Credit check & deduction (only for regular users)
          let activationCost = 0;
          if (isUser) {
            activationCost = targetUser.activationCost ?? 0;

            if (targetUser.credits < activationCost) {
              throw new Error(
                `Insufficient credits for row: ${JSON.stringify(row)}`
              );
            }

            targetUser.credits -= activationCost;
            totalDeducted += activationCost;
          }

          // Generate transaction ID
          const transactionId = generateTransactionId();

          // Call external activation API
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

          const response = await axios.post(
            `${process.env.BASE_URL}/ActivateSubscriberWithAddress`,
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

          // Save activation record
          targetUser.activationData.push({
            sim,
            plan_soc,
            imei,
            zip,
            label,
            transactionId: data.transactionId || data.TransactionId,
            accountId: data.accountId || data.AccountId,
            msisdn: data.msisdn || data.MSISDN || data.Mdn,
            iccid: data.iccid || data.ICCID || data.Iccid,
            activationDate: new Date(),
            endDateOfActivation: new Date(
              Date.now() + 30 * 24 * 60 * 60 * 1000
            ), // 30 days
            E911ADDRESS: {
              e911AddressStreet1: e911addressstreet1,
              e911AddressStreet2: e911addressstreet2,
              e911AddressCity: e911addresscity,
              e911AddressState: e911addressstate,
              e911AddressZip: e911addresszip,
            },
          });

          await targetUser.save();

          results.push({
            success: true,
            row: row,
            msisdn: data.msisdn,
            iccid: data.iccid,
            transactionId,
          });
        } catch (rowError) {
          results.push({
            success: false,
            row: row,
            error: rowError.message,
          });

          // Optional: continue to next row on error
        }
      }

      // Final response
      const successes = results.filter((r) => r.success).length;
      const failures = results.length - successes;

      res.json({
        success: true,
        message: `Bulk activation processed. ${successes} successful, ${failures} failed.`,
        activatedBy: type,
        activatedFor: targetUser._id,
        totalDeducted: isUser ? totalDeducted : 'N/A (Admin)',
        remainingCredits: isUser ? targetUser.credits : 'N/A',
        results,
      });
    } catch (err) {
      console.error('Bulk Activation Error:', err.message);

      res.status(500).json({
        success: false,
        error: 'Bulk activation failed',
        details: err.message,
      });
    }
  }
);

export default router;
