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
    const { user: authenticatedEntity } = authUser(req);

    if (!authenticatedEntity) {
      return res.status(401).json({
        success: false,
        message: "Unauthorized",
      });
    }

    const {
      iccid,
      marketZip,
      portIn,
      portInRequestId,
    } = req.body;

    // ✅ Validation
    if (
      !iccid ||
      !marketZip ||
      !portInRequestId ||
      !portIn ||
      !portIn.name ||
      !portIn.ospAccountNumber ||
      !portIn.ospAccountPassword ||
      !portIn.portInMsisdn ||
      !portIn.ospSubscriberAddress?.street1 ||
      !portIn.ospSubscriberAddress?.city ||
      !portIn.ospSubscriberAddress?.state ||
      !portIn.ospSubscriberAddress?.zip
    ) {
      return res.status(400).json({
        success: false,
        message: "Missing required fields",
      });
    }

    const transactionId = generateTransactionId();

    const payload = {
      iccid,
      marketZip,
      portIn,
      portInRequestId,
    };

    // === Call TMO API ===
    let carrierResponse;
    try {
      carrierResponse = await axios.post(
        `${process.env.BASE_URL}/UpdatePortIn`,
        payload,
        {
          headers: {
            "client-id": process.env.CLIENT_ID,
            "client-api-key": process.env.CLIENT_API_KEY,
            "transaction-id": transactionId,
            "Content-Type": "application/json",
          },
          timeout: 20000,
        }
      );
    } catch (axiosErr) {
      return res.status(axiosErr.response?.status || 500).json({
        success: false,
        message: "UpdatePortIn failed at carrier",
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
        message: "UpdatePortIn failed",
        transactionId,
        carrierError: result.error || { message: "Unknown carrier error" },
        apiResponse: carrierResponse.data,
      });
    }

    // ✅ Success response (same pattern)
    res.json({
      success: true,
      message: "UpdatePortIn successful",
      transactionId,
      updatedBy: {
        id: authenticatedEntity._id,
        name: authenticatedEntity.fullName || authenticatedEntity.email,
      },
      data: result,
      apiResponse: carrierResponse.data,
    });
  } catch (err) {
    console.error("UpdatePortIn Internal Error:", err);
    res.status(500).json({
      success: false,
      message: "Internal server error",
      error: err.message,
    });
  }
});

export default router;
