import express from "express";
import User from "../models/User.js";

const router = express.Router();

// GET /user/current?email=abc@example.com
router.get("/current", async (req, res) => {
  const { email } = req.query;

  if (!email) {
    return res
      .status(400)
      .json({ success: false, message: "Email is required" });
  }

  try {
    const user = await User.findOne({ email }).lean();

    if (!user) {
      return res
        .status(404)
        .json({ success: false, message: "User not found" });
    }

    return res.status(200).json({
      success: true,
      user: {
        email: user.email,
        fullName: user.fullName,
        credits: user.credits,
        activationCost: user.activationCost ?? 0,
      },
    });
  } catch (err) {
    console.error("❌ Error fetching current user:", err);
    res.status(500).json({ success: false, message: "Server error" });
  }
});

// GET /user/activations?email=abc@example.com
router.get("/activations", async (req, res) => {
  const { email } = req.query;

  if (!email) {
    return res
      .status(400)
      .json({ success: false, message: "Email is required" });
  }

  try {
    const user = await User.findOne({ email }).lean();

    if (!user) {
      return res
        .status(404)
        .json({ success: false, message: "User not found" });
    }

    const activations = user.activationData.map((activation) => ({
      esn: activation.esn,
      STREET1: activation.E911ADDRESS?.STREET1 || null,
      STREET2: activation.E911ADDRESS?.STREET2 || null,
      CITY: activation.E911ADDRESS?.CITY || null,
      STATE: activation.E911ADDRESS?.STATE || null,
      ZIP: activation.E911ADDRESS?.ZIP || null,
      activationDate: activation.activationDate || null,
    }));

    return res.status(200).json({
      success: true,
      activations,
    });
  } catch (err) {
    console.error("❌ Error fetching activations:", err);
    res.status(500).json({ success: false, message: "Server error" });
  }
});
export default router;
