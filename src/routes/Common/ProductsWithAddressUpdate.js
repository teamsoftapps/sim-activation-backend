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

    const {
      msisdn,
      sim,
      newPlan_soc,
      e911AddressStreet1,
      e911AddressStreet2,
      e911AddressCity,
      e911AddressState,
      e911AddressZip,
    } = req.body;

    // Validate required fields
    if (
      !msisdn ||
      !sim ||
      !newPlan_soc ||
      !e911AddressStreet1 ||
      !e911AddressCity ||
      !e911AddressState ||
      !e911AddressZip
    ) {
      return res.status(400).json({
        success: false,
        message:
          "msisdn, sim, newPlan_soc, and complete e911 address are required",
      });
    }

    const transactionId = generateTransactionId();

    const payload = {
      msisdn,
      sim,
      newPlan_soc,
      e911AddressStreet1,
      e911AddressStreet2,
      e911AddressCity,
      e911AddressState,
      e911AddressZip,
    };

    // === Call Carrier API ===
    let carrierResponse;
    try {
      carrierResponse = await axios.post(
        `${process.env.BASE_URL}/ProductsWithAddressUpdate`,
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
        message: "Failed to update product/address at carrier",
        transactionId,
        error: axiosErr.response?.data || { message: axiosErr.message },
      });
    }

    const result = carrierResponse.data.data || carrierResponse.data;

    const hasError =
      result.error &&
      (result.error.message || result.error.code || result.error.statusCode);

    if (hasError || result.status === "ERROR" || result.status === "FAILED") {
      return res.status(400).json({
        success: false,
        message: "Product/address update failed at carrier",
        transactionId,
        carrierError: result.error || { message: "Unknown carrier error" },
        apiResponse: carrierResponse.data,
      });
    }

    // === Success Response ===
    res.json({
      success: true,
      message: "Product & address update successful",
      transactionId,
      queriedBy: {
        type: isAdmin ? "admin" : "user",
        id: authenticatedEntity._id,
        name: authenticatedEntity.fullName || authenticatedEntity.email,
      },
      msisdn: result.msisdn || msisdn,
      iccid: result.iccid || "",
      data: result.result || [],
      apiResponse: carrierResponse.data,
    });
  } catch (err) {
    console.error("ProductsWithAddressUpdate Internal Error:", err);
    res.status(500).json({
      success: false,
      message: "Internal server error",
      error: err.message,
    });
  }
});

export default router;
