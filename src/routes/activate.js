/** @format */

import express from "express";
import axios from "axios";
import User from "../models/User.js";
const router = express.Router();
import dotenv from "dotenv";
dotenv.config();

/**
 * @swagger
 * tags:
 *   name: Activation
 *   description: Endpoints related to device activation
 */

/**
 * @swagger
 * /activate:
 *   post:
 *     summary: Activate a device via external API
 *     tags: [Activation]
 *     security:
 *       - bearerAuth: []  # This route requires an API key, token middleware
 *       - apiKeyAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             example:
 *               email: "test@gmail.com"
 *               esn: "123456789012345"
 *               planId: "plan-basic"
 *               language: "EN"
 *               zip: "12345"
 *               BillingCode: "ABC123"
 *               E911ADDRESS:
 *                 STREET1: "123 Main St"
 *                 STREET2: "Apt 4B"
 *                 CITY: "New York"
 *                 STATE: "NY"
 *                 ZIP: "10001"
 *     responses:
 *       200:
 *         description: Activation successful
 *       400:
 *         description: Bad request
 *       500:
 *         description: Internal server error
 */
router.post("/", async (req, res) => {
  console.log("request:", req.body);
  try {
    const response = await axios.post(
      "https://api.opncomm.com/opencom/api/v1/active",
      req.body,
      {
        headers: {
          Authorization: `Bearer ${process.env.BEARER_TOKEN}`,
          "Content-Type": "application/json",
        },
      }
    );
    res.json(response.data);
  } catch (err) {
    res
      .status(err.response?.status || 500)
      .json(err.response?.data || { error: "Unknown error" });
  }
});

/**
 * @swagger
 * /activate/save-activation:
 *   post:
 *     summary: Save activation data to a user by email
 *     tags: [Activation]
 *     security:
 *       - bearerAuth: []  # Protected route
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
 *                 example: "user@example.com"
 *               esn:
 *                 type: string
 *               planId:
 *                 type: string
 *               language:
 *                 type: string
 *               zip:
 *                 type: string
 *               BillingCode:
 *                 type: string
 *               E911ADDRESS:
 *                 type: object
 *                 properties:
 *                   STREET1:
 *                     type: string
 *                   STREET2:
 *                     type: string
 *                   CITY:
 *                     type: string
 *                   STATE:
 *                     type: string
 *                   ZIP:
 *                     type: string
 *     responses:
 *       200:
 *         description: Activation data saved successfully
 *       400:
 *         description: Email is missing or invalid
 *       404:
 *         description: User not found
 *       500:
 *         description: Internal server error
 */
router.post("/save-activation", async (req, res) => {
  console.log("Save Activation Request:", req.body);

  const { email, ...activationData } = req.body;

  if (!email) {
    return res
      .status(400)
      .json({ error: "Email is required to save activation data" });
  }

  try {
    const updatedUser = await User.findOneAndUpdate(
      { email },
      {
        $push: {
          activationData: {
            esn: activationData.esn,
            planId: activationData.planId,
            language: activationData.language,
            zip: activationData.zip,
            BillingCode: activationData.BillingCode,
            E911ADDRESS: {
              STREET1: activationData.E911ADDRESS?.STREET1,
              STREET2: activationData.E911ADDRESS?.STREET2,
              CITY: activationData.E911ADDRESS?.CITY,
              STATE: activationData.E911ADDRESS?.STATE,
              ZIP: activationData.E911ADDRESS?.ZIP,
            },
          },
        },
      },
      { new: true }
    );

    if (!updatedUser) {
      return res.status(404).json({ error: "User not found with this email" });
    }

    res.json({
      message: "Activation data saved successfully",
      activationData: updatedUser.activationData,
    });
  } catch (err) {
    console.error("DB Save error:", err);
    res.status(500).json({ error: err.message || "Unknown error" });
  }
});

export default router;
