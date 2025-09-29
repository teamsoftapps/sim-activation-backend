/** @format */

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

router.get("/activations", async (req, res) => {
  const { email, fromDate, toDate } = req.query;

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

    let activations = user.activationData.map((activation) => ({
      esn: activation.esn || null,
      mdn: activation.mdn || null,
      STREET1: activation.E911ADDRESS?.STREET1 || null,
      STREET2: activation.E911ADDRESS?.STREET2 || null,
      CITY: activation.E911ADDRESS?.CITY || null,
      STATE: activation.E911ADDRESS?.STATE || null,
      ZIP: activation.E911ADDRESS?.ZIP || null,
      activationDate: activation.activationDate || null,
    }));

    if (fromDate && toDate) {
      const from = new Date(fromDate);
      const to = new Date(new Date(toDate).setHours(23, 59, 59, 999));
      activations = activations.filter((item) => {
        if (!item.activationDate) return false;
        const date = new Date(item.activationDate);
        return date >= from && date <= to;
      });
    }

    return res.status(200).json({
      success: true,
      activations,
    });
  } catch (err) {
    console.error("❌ Error fetching activations:", err);
    res.status(500).json({ success: false, message: "Server error" });
  }
});

router.get("/deactivations", async (req, res) => {
  const { email, fromDate, toDate } = req.query;

  if (!email) {
    return res
      .status(400)
      .json({ success: false, message: "Email is required" });
  }

  try {
    const user = await User.findOne({ email }).lean();

    console.log("user in deactivation api:", user);

    if (!user) {
      return res
        .status(404)
        .json({ success: false, message: "User not found" });
    }

    let deactivations = user.deactivationData.map((deactivation) => ({
      esn: deactivation.esn || null,
      mdn: deactivation.mdn || null,
      deactivationDate: deactivation.deactivationDate || null,
    }));

    console.log("deactivations:", deactivations);
    if (deactivations[deactivations.length - 1]?.deactivationDate !== null) {
      if (fromDate && toDate) {
        const from = new Date(fromDate);
        const to = new Date(new Date(toDate).setHours(23, 59, 59, 999));
        deactivations = deactivations.filter((item) => {
          if (!item.deactivationDate) return false;
          const date = new Date(item.deactivationDate);
          return date >= from && date <= to;
        });
      }
    }
    return res.status(200).json({
      success: true,
      deactivations,
    });
  } catch (err) {
    console.error("❌ Error fetching deactivations:", err);
    res.status(500).json({ success: false, message: "Server error" });
  }
});

router.get("/reactivations", async (req, res) => {
  const { email, fromDate, toDate } = req.query;

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

    let reactivations = user.reactivation.map((reactivation) => ({
      esn: reactivation.esn || null,
      mdn: reactivation.mdn || null,
      plan: reactivation.plan || null,
      zip: reactivation.zip || null,
      BillingCode: reactivation.BillingCode || null,
      reactivationDate: reactivation.reactivationDate || null,
    }));
    console.log("reactivations:", reactivations);
    if (reactivations[reactivations.length - 1]?.reactivationDate !== null) {
      if (fromDate && toDate) {
        const from = new Date(fromDate);
        const to = new Date(new Date(toDate).setHours(23, 59, 59, 999));
        reactivations = reactivations.filter((item) => {
          if (!item.reactivationDate) return false;
          const date = new Date(item.reactivationDate);
          return date >= from && date <= to;
        });
      }
    }

    return res.status(200).json({
      success: true,
      reactivations,
    });
  } catch (err) {
    console.error("❌ Error fetching reactivations:", err);
    res.status(500).json({ success: false, message: "Server error" });
  }
});
export default router;
