// cron/deactivateExpiredActivations.js

import cron from "node-cron";
import User from "../src/models/User.js";
import axios from "axios";

// Every 5 minutes
cron.schedule("*/5 * * * *", async () => {
  console.log("🕒 Running auto-deactivation cron...");

  const now = new Date();

  try {
    const users = await User.find({
      "activationData.endDateOfActivation": { $lte: now },
    });

    for (const user of users) {
      const expiredActivations = user.activationData.filter(
        (a) => a.endDateOfActivation <= now
      );

      for (const activation of expiredActivations) {
        try {
          const response = await axios.post(
            "https://api.opncomm.com/opencom/api/v1/deactivate-sim-card",
            {
              esn: activation.esn,
              mdn: activation.mdn || "", // ✅ Pass mdn if available
            },
            {
              headers: {
                Authorization: `Bearer ${user.opncommToken}`,
                "Content-Type": "application/json",
              },
            }
          );

          console.log(`✅ Deactivated ESN: ${activation.esn}`);

          user.deactivationData.push({
            esn: activation.esn,
            mdn: activation.mdn || "",
          });

          user.activationData = user.activationData.filter(
            (a) => a.esn !== activation.esn
          );

          await user.save();
        } catch (err) {
          console.error(
            `❌ Failed to deactivate ESN ${activation.esn}:`,
            err.message
          );
        }
      }
    }
  } catch (err) {
    console.error("❌ Cron failed:", err.message);
  }
});
