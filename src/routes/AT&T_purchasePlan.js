/** @format */

import express from "express";
import axios from "axios";
import User from "../models/User.js";
const router = express.Router();

/**
 * @swagger
 * tags:
 *   name: AT&T Purchase Plan
 *   description: Endpoint to purchase a plan for an AT&T subscriber
 */

/**
 * @swagger
 * /at&t/purchase-plan:
 *   post:
 *     summary: Purchase a plan for an AT&T subscriber via external API
 *     tags: [AT&T Purchase Plan]
 *     security:
 *       - bearerAuth: []   # API token auth
 *       - apiKeyAuth: []   # API key middleware
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               MSISDN:
 *                 type: string
 *                 description: Mobile Subscriber Integrated Services Digital Network Number
 *                 example: "2133616694"
 *               planCode:
 *                 type: string
 *                 description: Code of the plan to purchase
 *                 example: "TG250"
 *             required:
 *               - MSISDN
 *               - planCode
 *     responses:
 *       200:
 *         description: Plan purchase successful
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               example:
 *                 success: true
 *                 message: "Plan purchased successfully"
 *       400:
 *         description: Bad request
 *       500:
 *         description: Internal server error
 */

// router.post("/", async (req, res) => {
//   try {
//     const response = await axios.post(
//       "https://api.opncomm.com/opencom/api/v1/at&t/purchase-plan",
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
    // Extract x-api-key from header
    const apiKey = req.headers["x-api-key"];

    if (!apiKey) {
      return res.status(400).json({ error: "Missing x-api-key in headers" });
    }

    // Look up user by apiKey
    const user = await User.findOne({ apiKey });

    // Default bearer token
    let bearerToken = user.opncommToken;

    if (!bearerToken) {
      return res.status(400).json({ error: "Missing opncommToken for user" });
    }

    console.log("Making AT&T purchase plan request with token:", bearerToken);

    // Make external request
    const response = await axios.post(
      "https://api.opncomm.com/opencom/api/v1/at&t/purchase-plan",
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
    console.error("AT&T Purchase Plan Error:", err);
    res
      .status(err.response?.status || 500)
      .json(err.response?.data || { error: "Unknown error" });
  }
});
export default router;
