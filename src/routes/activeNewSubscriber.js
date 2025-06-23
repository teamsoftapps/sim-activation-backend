/** @format */

import express from "express";
import axios from "axios";
import User from "../models/User.js";
const router = express.Router();

/**
 * @swagger
 * tags:
 *   name: AT&T Activate New Subscriber
 *   description: Endpoints related to activating new AT&T subscribers
 */

/**
 * @swagger
 * /at&t/active-new-subscriber:
 *   post:
 *     summary: Activate a new AT&T subscriber via external API
 *     tags: [AT&T Activate New Subscriber]
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
 *               partner_transaction_id: "TransID123"
 *               imei: "357836103948576"
 *               sim: "89012802331277820666"
 *               zip_code: "10036"
 *               plan_code: "Plan1"
 *               billing_code: ""
 *     responses:
 *       200:
 *         description: Activation successful
 *       400:
 *         description: Bad request
 *       500:
 *         description: Internal server error
 */

// router.post("/", async (req, res) => {
//   try {
//     const response = await axios.post(
//       "https://api.opncomm.com/opencom/api/v1/at&t/active-new-subscriber",
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

    // Find user based on apiKey
    const user = await User.findOne({ apiKey });

    let bearerToken = user.opncommToken;

    if (!bearerToken) {
      return res.status(400).json({ error: "Missing opncommToken for user" });
    }

    console.log("Making AT&T activation request with token:", bearerToken);

    const response = await axios.post(
      "https://api.opncomm.com/opencom/api/v1/at&t/active-new-subscriber",
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
    console.error("AT&T Activation Error:", err);
    res
      .status(err.response?.status || 500)
      .json(err.response?.data || { error: "Unknown error" });
  }
});
export default router;
