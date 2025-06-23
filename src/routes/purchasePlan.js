/** @format */

import express from "express";
import axios from "axios";
import User from "../models/User.js";
const router = express.Router();

/**
 * @swagger
 * tags:
 *   name: Purchase Plan
 *   description: Endpoints related to purchasing plans
 */

/**
 * @swagger
 * /purchasePlan:
 *   post:
 *     summary: Purchase a plan via external API
 *     tags: [Purchase Plan]
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
 *               mdn: "9297743080"
 *               plan_id: "05"
 *               E911ADDRESS:
 *                 E911ADDRESS: "15 WILLIAM ST"
 *                 STREET2: "APT 34I"
 *                 CITY: "NEW YORK"
 *                 STATE: "NY"
 *                 ZIP: "10005"
 *     responses:
 *       200:
 *         description: Plan purchase successful
 *       400:
 *         description: Bad request
 *       500:
 *         description: Internal server error
 */

// router.post("/", async (req, res) => {
//   try {
//     const response = await axios.post(
//       "https://api.opncomm.com/opencom/api/v1/purchase-plan",
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
    // let bearerToken = process.env.BEARER_TOKEN;
    let bearerToken = user.opncommToken;

    if (!bearerToken) {
      return res.status(400).json({ error: "Missing opncommToken for user" });
    }

    console.log("Making purchase plan request with token:", bearerToken);

    const response = await axios.post(
      "https://api.opncomm.com/opencom/api/v1/purchase-plan",
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
    console.error("Purchase Plan Error:", err);
    res
      .status(err.response?.status || 500)
      .json(err.response?.data || { error: "Unknown error" });
  }
});
export default router;
