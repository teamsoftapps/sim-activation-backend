/** @format */

import express from "express";
import axios from "axios";
import User from "../models/User.js";
const router = express.Router();

/**
 * @swagger
 * tags:
 *   name: Deactivation
 *   description: Deactivate SIM cards and store deactivation records
 */

/**
 * @swagger
 * /deactivate:
 *   post:
 *     summary: Deactivate a SIM card
 *     tags: [Deactivation]
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
 *         description: SIM deactivated successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *       400:
 *         description: Bad request
 *       500:
 *         description: Internal server error
 */
router.post("/", async (req, res) => {
  try {
    // Extract x-api-key from request header
    const apiKey = req.headers["x-api-key"];

    if (!apiKey) {
      return res.status(400).json({ error: "Missing x-api-key in headers" });
    }

    // Find user by apiKey
    const user = await User.findOne({ apiKey });

    // Default bearer token
    // let bearerToken = process.env.BEARER_TOKEN;
    let bearerToken = user.opncommToken;

    if (!bearerToken) {
      return res.status(400).json({ error: "Missing opncommToken for user" });
    }

    console.log("Making deactivate request with token:", bearerToken);

    const response = await axios.post(
      "https://api.opncomm.com/opencom/api/v1/deactivate-sim-card",
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
    console.error("Deactivate SIM Card Error:", err);
    res
      .status(err.response?.status || 500)
      .json(err.response?.data || { error: "Unknown error" });
  }
});

/**
 * @swagger
 * /deactivate/save-deactivation:
 *   post:
 *     summary: Save SIM deactivation data to the user profile
 *     tags: [Deactivation]
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
 *     responses:
 *       200:
 *         description: Deactivation data saved successfully
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
router.post("/save-deactivation", async (req, res) => {
  console.log("Save Deactivation Request:", req.body);

  const { email, ...deactivationData } = req.body;

  if (!email) {
    return res
      .status(400)
      .json({ error: "Email is required to save deactivation data" });
  }

  try {
    const updatedUser = await User.findOneAndUpdate(
      { email },
      {
        $push: {
          deactivationData: {
            esn: deactivationData.esn,
            mdn: deactivationData.mdn,
          },
        },
      },
      { new: true }
    );

    if (!updatedUser) {
      return res.status(404).json({ error: "User not found with this email" });
    }

    res.json({
      message: "Deactivation data saved successfully",
      deactivationData: updatedUser.deactivationData,
    });
  } catch (err) {
    console.error("DB Save error:", err);
    res.status(500).json({ error: err.message || "Unknown error" });
  }
});

export default router;
