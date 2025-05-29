import express from "express";
import axios from "axios";
import User from "../models/User.js";
const router = express.Router();

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

  const { email, ...activationData } = req.body; // email ko nikal ke baaki push karenge
  if (!email) {
    return res
      .status(400)
      .json({ error: "Email is required to update activationData" });
  }

  try {
    // External API call (response ko sirf client ko denge)
    const response = await axios.post(
      "https://api.opncomm.com/opencom/api/v1/active",
      req.body,
      {
        headers: {
          Authorization: `Bearer ${process.env.BEARER_TOKEN}`,
          "Content-Type": "application/json",
        },
      }
    );

    // User activationData array me naya object push karo
    await User.findOneAndUpdate(
      { email: "user@example.com" },
      {
        $push: {
          activationData: {
            esn: "ABC123",
            planId: "planX",
            language: "en",
            zip: "12345",
            BillingCode: "XYZ",
            E911ADDRESS: {
              STREET1: "123 Main St",
              STREET2: "Apt 4B",
              CITY: "New York",
              STATE: "NY",
              ZIP: "10001",
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
      apiResponse: response.data,
    });
  } catch (err) {
    console.error("Activation error:", err);
    res
      .status(err.response?.status || 500)
      .json(err.response?.data || { error: err.message || "Unknown error" });
  }
});
export default router;
