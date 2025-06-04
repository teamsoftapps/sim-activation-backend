/** @format */

import express from "express";
import axios from "axios";
import multer from "multer";
const upload = multer();
const router = express.Router();

/**
 * @swagger
 * tags:
 *   name: Bulk Activation
 *   description: Perform bulk activation of users or devices
 */

/**
 * @swagger
 * /bulk-activate:
 *   post:
 *     summary: Perform bulk activation via uploaded form data
 *     tags: [Bulk Activation]
 *     security:
 *       - bearerAuth: []
 *       - apiKeyAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             properties:
 *               data:
 *                 type: string
 *                 format: binary
 *                 description: Bulk activation form or file content
 *     responses:
 *       200:
 *         description: Bulk activation successful
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *       400:
 *         description: Bad request
 *       500:
 *         description: Internal server error
 */
router.post("/", upload.any(), async (req, res) => {
  try {
    const response = await axios.post(
      "https://api.opncomm.com/opencom/api/v1/bulk-active",
      req.body,
      {
        headers: {
          Authorization: `Bearer ${process.env.BEARER_TOKEN}`,
          "Content-Type": "multipart/form-data",
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
