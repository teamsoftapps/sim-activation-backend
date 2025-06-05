/** @format */

import express from "express";
import axios from "axios";
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

router.post("/", async (req, res) => {
  try {
    const response = await axios.post(
      "https://api.opncomm.com/opencom/api/v1/update-e911address",
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
