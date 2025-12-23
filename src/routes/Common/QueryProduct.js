/** @format */

import express from "express";
import axios from "axios";
import authMiddleware from "../../middleware/authMiddleware.js";
import authUser from "../../utils/authUser.js";
import generateTransactionId from "../../utils/generateTransactionId.js";
import dotenv from "dotenv";

dotenv.config();

const router = express.Router();

router.post("/", authMiddleware(), async (req, res) => {
  try {
    const { user: authenticatedEntity, isAdmin } = authUser(req);

    if (!authenticatedEntity) {
      return res.status(401).json({
        success: false,
        message: "Unauthorized",
      });
    }

    const { productId } = req.body;

    if (!productId) {
      return res.status(400).json({
        success: false,
        message: "Product ID is required",
      });
    }

    const transactionId = generateTransactionId();
    const payload = { productId };

    let carrierResponse;
    try {
      carrierResponse = await axios.post(
        `${process.env.BASE_URL}/QueryProducts`,
        payload,
        {
          headers: {
            "client-api-key": process.env.CLIENT_API_KEY,
            "client-id": process.env.CLIENT_ID,
            "transaction-id": transactionId,
            "Content-Type": "application/json",
          },
          timeout: 20000,
        }
      );
    } catch (axiosErr) {
      return res.status(axiosErr.response?.status || 500).json({
        success: false,
        message: "Failed to query product at carrier",
        transactionId,
        error: axiosErr.response?.data || { message: axiosErr.message },
      });
    }

    const result = carrierResponse.data?.data || carrierResponse.data;

    const hasError =
      result?.error &&
      (result.error.message || result.error.code || result.error.statusCode);

    if (hasError || result.status === "ERROR" || result.status === "FAILED") {
      return res.status(400).json({
        success: false,
        message: "Product query failed at carrier",
        transactionId,
        carrierError: result.error || { message: "Unknown carrier error" },
        apiResponse: carrierResponse.data,
      });
    }

    res.json({
      success: true,
      message: "Product info fetched successfully",
      transactionId,
      queriedBy: {
        type: isAdmin ? "admin" : "user",
        id: authenticatedEntity._id,
        name: authenticatedEntity.fullName || authenticatedEntity.email,
      },
      data: {
        status: result.status,
        baseProductInfo: result.baseProductInfo || [],
        result: result.result || [],
      },
      apiResponse: carrierResponse.data,
    });
  } catch (err) {
    console.error("QueryProduct Internal Error:", err);
    res.status(500).json({
      success: false,
      message: "Internal server error",
      error: err.message,
    });
  }
});

export default router;
