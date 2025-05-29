import express from "express";
import axios from "axios";
import User from "../models/User.js";
const router = express.Router();

router.post("/", async (req, res) => {
  try {
    const response = await axios.post(
      "https://api.opncomm.com/opencom/api/v1/deactivate-sim-card",
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

router.post("/save-deactivation", async (req, res) => {
  console.log("Save Deactivation Request:", req.body);

  const { email, ...deactivationData } = req.body;

  if (!email) {
    return res
      .status(400)
      .json({ error: "Email is required to save deactivation data" });
  }

  try {
    const updatedUser = await User.findOneAndUpdate(
      { email },
      {
        $push: {
          deactivationData: {
            esn: deactivationData.esn,
            mdn: deactivationData.mdn,
          },
        },
      },
      { new: true }
    );

    if (!updatedUser) {
      return res.status(404).json({ error: "User not found with this email" });
    }

    res.json({
      message: "Deactivation data saved successfully",
      deactivationData: updatedUser.deactivationData,
    });
  } catch (err) {
    console.error("DB Save error:", err);
    res.status(500).json({ error: err.message || "Unknown error" });
  }
});

export default router;
