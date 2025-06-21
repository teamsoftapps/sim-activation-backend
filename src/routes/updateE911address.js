/** @format */

import express from "express";
import axios from "axios";
import User from "../models/User.js";
const router = express.Router();

/**
 * @swagger
 * tags:
 *   name: Update E911 Address
 *   description: Endpoint for updating the E911 emergency address of a subscriber
 */

/**
 * @swagger
 * /update-e911address:
 *   post:
 *     summary: Update the E911 address for a subscriber via external API
 *     tags: [Update E911 Address]
 *     security:
 *       - bearerAuth: []  # Requires API key and token middleware
 *       - apiKeyAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             example:
 *               mdn: "5593307726"
 *               esn: "8901240467166018574"
 *               e911Address:
 *                 street1: "1095 6th Ave"
 *                 street2: "ST 190"
 *                 city: "New York"
 *                 state: "NY"
 *                 zip: "10036"
 *     responses:
 *       200:
 *         description: E911 address updated successfully
 *       400:
 *         description: Bad request
 *       500:
 *         description: Internal server error
 */

// router.post("/", async (req, res) => {
//   try {
//     const response = await axios.post(
//       "https://api.opncomm.com/opencom/api/v1/update-e911address",
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
      "https://api.opncomm.com/opencom/api/v1/update-e911address",
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
    console.error("Update E911 Address Error:", err);
    res
      .status(err.response?.status || 500)
      .json(err.response?.data || { error: "Unknown error" });
  }
});
export default router;
