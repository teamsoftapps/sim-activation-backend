/** @format */

import express from "express";
import axios from "axios";
const router = express.Router();

/**
 * @swagger
 * tags:
 *   name: AT&T Change Plan
 *   description: Endpoints related to changing an AT&T subscriber's plan
 */

/**
 * @swagger
 * /at&t/change-plan:
 *   post:
 *     summary: Change the plan for an AT&T subscriber via external API
 *     tags: [AT&T Change Plan]
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
 *               MSISDN: "2523647945"
 *               planCode: "TG250"
 *               keepExpirySame: "Y"
 *     responses:
 *       200:
 *         description: Plan change successful
 *       400:
 *         description: Bad request
 *       500:
 *         description: Internal server error
 */

router.post("/", async (req, res) => {
  try {
    const response = await axios.post(
      "https://api.opncomm.com/opencom/api/v1/at&t/change-plan",
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
