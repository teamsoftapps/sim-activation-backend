import express from "express";
import User from "../models/User.js";

const router = express.Router();

router.get("/", async (req, res) => {
  try {
    const users = await User.find(
      {},
      "fullName email phone opncommToken activationCost activationData"
    );

    const result = [];

    users.forEach((user) => {
      user.activationData.forEach((act) => {
        result.push({
          fullName: user.fullName,
          email: user.email,
          phone: user.phone,
          opncommToken: user.opncommToken,
          activationCost: user.activationCost,
          esn: act.esn,
          mdn: act.mdn || null, // ✅ Include MDN
          activationDate: act.activationDate,
          endDateOfActivation: act.endDateOfActivation,
        });
      });
    });

    res.json(result);
  } catch (err) {
    console.error("Get Activations Error:", err);
    res.status(500).json({ error: "Failed to fetch activation data" });
  }
});

export default router;
