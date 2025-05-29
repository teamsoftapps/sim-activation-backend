import express from "express";
import axios from "axios";
import User from "../models/User.js";
const router = express.Router();
import dotenv from "dotenv";
dotenv.config();

// router.post("/", async (req, res) => {
//   console.log("request:", req.body);
//   try {
//     const response = await axios.post(
//       "https://api.opncomm.com/opencom/api/v1/active",
//       req.body,
//       {
//         headers: {
//           Authorization: `Bearer ${process.env.BEARER_TOKEN}`,
//           "Content-Type": "application/json",
//         },
//       }
//     );
//     res.json(response.data);
//   } catch (err) {
//     res
//       .status(err.response?.status || 500)
//       .json(err.response?.data || { error: "Unknown error" });
//   }
// });
router.post("/", async (req, res) => {
  console.log("request:", req.body);

  const { email, ...activationData } = req.body;

  console.log("Activation Data:", activationData);

  if (!email) {
    return res
      .status(400)
      .json({ error: "Email is required to update activationData" });
  }

  try {
    // External API call using fetch
    const response = await fetch(
      "https://api.opncomm.com/opencom/api/v1/active",
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${process.env.BEARER_TOKEN}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify(req.body),
      }
    );

    if (!response.ok) {
      const errorData = await response.json();
      return res.status(response.status).json(errorData);
    }

    const apiData = await response.json();

    // Push activation data to user
    const updatedUser = await User.findOneAndUpdate(
      { email },
      {
        $push: {
          activationData: {
            esn: activationData.esn,
            planId: activationData.planId,
            language: activationData.language,
            zip: activationData.zip,
            BillingCode: activationData.BillingCode,
            E911ADDRESS: {
              STREET1: activationData.activationData?.STREET1,
              STREET2: activationData.activationData?.STREET2,
              CITY: activationData.activationData?.CITY,
              STATE: activationData.activationData?.STATE,
              ZIP: activationData.activationData?.ZIP,
            },
          },
        },
      },
      { new: true }
    );

    if (!updatedUser) {
      return res.status(404).json({ error: "User not found with this email" });
    }

    res.json({
      message: "Activation data updated successfully",
      activationData: updatedUser.activationData,
      apiResponse: apiData,
    });
  } catch (err) {
    console.error("Activation error:", err);
    res.status(500).json({ error: err.message || "Unknown error" });
  }
});
export default router;
