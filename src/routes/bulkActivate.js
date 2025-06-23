/** @format */

import express from "express";
import axios from "axios";
import multer from "multer";
import User from "../models/User.js";
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
// router.post("/", upload.any(), async (req, res) => {
//   try {
//     const response = await axios.post(
//       "https://api.opncomm.com/opencom/api/v1/bulk-active",
//       req.body,
//       {
//         headers: {
//           Authorization: `Bearer ${process.env.BEARER_TOKEN}`,
//           "Content-Type": "multipart/form-data",
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
router.post("/", upload.any(), async (req, res) => {
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

    // If user is Carlos, switch bearer token
    // if (user && user.email === "c.fonte@prepaidiq.com") {
    //   bearerToken = process.env.CARLOS_BEARER_TOKEN;
    //   console.log("Using Carlos Bearer Token");
    // } else {
    //   console.log("Using Default Bearer Token");
    // }

    // Prepare form data correctly for multipart request
    const formData = req.body; // This will work only if your axios instance supports multipart form automatically.
    // You may also need to pass original file streams depending on your actual backend requirements.

    const response = await axios.post(
      "https://api.opncomm.com/opencom/api/v1/bulk-active",
      formData,
      {
        headers: {
          Authorization: `Bearer ${bearerToken}`,
          "Content-Type": "multipart/form-data",
        },
      }
    );

    res.json(response.data);
  } catch (err) {
    console.error("Bulk Activation Error:", err);
    res
      .status(err.response?.status || 500)
      .json(err.response?.data || { error: "Unknown error" });
  }
});
export default router;
