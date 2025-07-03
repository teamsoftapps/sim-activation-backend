import express from "express";
import User from "../models/User.js";
const router = express.Router();

router.put("/activations-by-email/:email/:esn", async (req, res) => {
  const { email, esn } = req.params;
  const { endDateOfActivation } = req.body;

  try {
    if (!endDateOfActivation) {
      return res.status(400).json({ error: "endDateOfActivation is required" });
    }

    const parsedDate = new Date(endDateOfActivation);
    if (isNaN(parsedDate.getTime())) {
      return res.status(400).json({ error: "Invalid date format" });
    }

    const user = await User.findOneAndUpdate(
      { email: email, "activationData.esn": esn },
      {
        $set: {
          "activationData.$.endDateOfActivation": parsedDate,
        },
      },
      { new: true }
    );

    if (!user) {
      return res.status(404).json({ error: "User or activation not found" });
    }

    res.status(200).json({ message: "End date updated successfully", user });
  } catch (error) {
    console.error("Error updating end date:", error);
    res.status(500).json({ error: "Server error" });
  }
});

export default router;
