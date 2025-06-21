/** @format */

import express from "express";
import axios from "axios";
import User from "../models/User.js";
const router = express.Router();

/**
 * @swagger
 * tags:
 *   name: Reactivation
 *   description: Reactivate SIM cards and store reactivation records
 */

/**
 * @swagger
 * /reactivate:
 *   post:
 *     summary: Reactivate a SIM card
 *     tags: [Reactivation]
 *     security:
 *       - bearerAuth: []
 *       - apiKeyAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             example:
 *               esn: "123456789012345"
 *               mdn: "9876543210"
 *     responses:
 *       200:
 *         description: SIM reactivated successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *       400:
 *         description: Bad request
 *       500:
 *         description: Internal server error
 */
// router.post("/", async (req, res) => {
//   try {
//     const response = await axios.post(
//       "https://api.opncomm.com/opencom/api/v1/reactivate-sim-card",
//       req.body,
//       {
//         headers: {
//           Authorization: `Bearer ${process.env.BEARER_TOKEN}`,
//           "Content-Type": "application/json",
//         },
//       }
//     );
//     res.json(response.data);
//   } catch (err) {
//     res
//       .status(err.response?.status || 500)
//       .json(err.response?.data || { error: "Unknown error" });
//   }
// });
router.post("/", async (req, res) => {
  try {
    // Get x-api-key from request header
    const apiKey = req.headers["x-api-key"];

    if (!apiKey) {
      return res.status(400).json({ error: "Missing x-api-key in headers" });
    }

    // Find user by apiKey
    const user = await User.findOne({ apiKey });

    // Default bearer token
    let bearerToken = process.env.BEARER_TOKEN;

    // If user is Carlos, use Carlos bearer token
    if (user && user.email === "c.fonte@prepaidiq.com") {
      bearerToken = process.env.CARLOS_BEARER_TOKEN;
      console.log("Using Carlos Bearer Token");
    } else {
      console.log("Using Default Bearer Token");
    }

    const response = await axios.post(
      "https://api.opncomm.com/opencom/api/v1/reactivate-sim-card",
      req.body,
      {
        headers: {
          Authorization: `Bearer ${bearerToken}`,
          "Content-Type": "application/json",
        },
      }
    );

    res.json(response.data);
  } catch (err) {
    console.error("Reactivate SIM Card Error:", err);
    res
      .status(err.response?.status || 500)
      .json(err.response?.data || { error: "Unknown error" });
  }
});
/**
 * @swagger
 * /reactivate/save-reactivation:
 *   post:
 *     summary: Save SIM reactivation data to the user profile
 *     tags: [Reactivation]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - email
 *             properties:
 *               email:
 *                 type: string
 *                 example: user@example.com
 *               esn:
 *                 type: string
 *                 example: "123456789012345"
 *               mdn:
 *                 type: string
 *                 example: "9876543210"
 *               plan:
 *                 type: string
 *                 example: "Basic Plan"
 *               zip:
 *                 type: string
 *                 example: "90210"
 *               BillingCode:
 *                 type: string
 *                 example: "ABC123"
 *     responses:
 *       200:
 *         description: Reactivation data saved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *       400:
 *         description: Email is required
 *       404:
 *         description: User not found
 *       500:
 *         description: Server/database error
 */
router.post("/save-reactivation", async (req, res) => {
  console.log("Save Reactivation Request:", req.body);

  const { email, ...reactivationData } = req.body;

  if (!email) {
    return res
      .status(400)
      .json({ error: "Email is required to save reactivation data" });
  }

  try {
    const updatedUser = await User.findOneAndUpdate(
      { email },
      {
        $push: {
          reactivation: {
            esn: reactivationData.esn,
            mdn: reactivationData.mdn,
            plan: reactivationData.plan,
            zip: reactivationData.zip,
            BillingCode: reactivationData.BillingCode,
          },
        },
      },
      { new: true }
    );

    if (!updatedUser) {
      return res.status(404).json({ error: "User not found with this email" });
    }

    res.json({
      message: "Reactivation data saved successfully",
      reactivationData: updatedUser.reactivation,
    });
  } catch (err) {
    console.error("DB Save error:", err);
    res.status(500).json({ error: err.message || "Unknown error" });
  }
});

export default router;
