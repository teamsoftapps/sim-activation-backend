/** @format */

import express from "express";
import axios from "axios";
const router = express.Router();

/**
 * @swagger
 * tags:
 *   name: AT&T Subscriber Inquiry
 *   description: Endpoints related to AT&T subscriber information
 */

/**
 * @swagger
 * /at&t/get-subscriber-inquiry:
 *   post:
 *     summary: Retrieve AT&T subscriber inquiry information via external API
 *     tags: [AT&T Subscriber Inquiry]
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
 *               msisdn: "2524121785"
 *               balance_info: true
 *     responses:
 *       200:
 *         description: Subscriber inquiry successful
 *       400:
 *         description: Bad request
 *       500:
 *         description: Internal server error
 */

router.post("/", async (req, res) => {
  try {
    const response = await axios.post(
      "https://api.opncomm.com/opencom/api/v1/at&t/get-subscriber-inquiry",
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
