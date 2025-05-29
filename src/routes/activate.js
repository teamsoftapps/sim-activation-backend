import express from "express";
import axios from "axios";
import User from "../models/User.js";
const router = express.Router();

router.post("/", async (req, res) => {
  try {
    // Step 1: Activate SIM with external API
    const simResponse = await axios.post(
      "https://api.opncomm.com/opencom/api/v1/active",
      req.body,
      {
        headers: {
          Authorization: `Bearer ${process.env.BEARER_TOKEN}`,
          "Content-Type": "application/json",
        },
      }
    );

    const simResult = simResponse.data;

    // Step 2: Save activation data to DB
    const { userId, ...activationData } = req.body;

    const user = await User.findByIdAndUpdate(
      userId,
      { activationData },
      { new: true }
    );

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    // Success response
    res.status(200).json({
      message: "SIM activated and activation data saved successfully.",
      simResponse: simResult,
      user,
    });
  } catch (error) {
    console.error(
      "Activation Failed:",
      error.response?.status,
      error.response?.data || error.message
    );
    res
      .status(error.response?.status || 500)
      .json(error.response?.data || { error: "Server error" });
  }
});

export default router;
