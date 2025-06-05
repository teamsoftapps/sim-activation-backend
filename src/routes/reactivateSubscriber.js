/** @format */

import express from "express";
import axios from "axios";
const router = express.Router();

/**
 * @swagger
 * tags:
 *   name: AT&T Reactivate Subscriber
 *   description: Endpoints related to reactivating AT&T subscribers
 */

/**
 * @swagger
 * /at&t/reactivate-subscriber:
 *   post:
 *     summary: Reactivate an AT&T subscriber via external API
 *     tags: [AT&T Reactivate Subscriber]
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
 *               msisdn: "2133616694"
 *               reason_code: "RD"
 *     responses:
 *       200:
 *         description: Reactivation successful
 *       400:
 *         description: Bad request
 *       500:
 *         description: Internal server error
 */

router.post("/", async (req, res) => {
  try {
    const response = await axios.post(
      "https://api.opncomm.com/opencom/api/v1/at&t/reactivate-subscriber",
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

export default router;
