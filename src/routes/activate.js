// /** @format */

// import express from "express";
// import axios from "axios";
// import User from "../models/User.js";
// const router = express.Router();
// import dotenv from "dotenv";
// dotenv.config();

// /**
//  * @swagger
//  * tags:
//  *   name: Activation
//  *   description: Endpoints related to device activation
//  */

// /**
//  * @swagger
//  * /activate:
//  *   post:
//  *     summary: Activate a device via external API
//  *     tags: [Activation]
//  *     security:
//  *       - bearerAuth: []  # This route requires an API key, token middleware
//  *       - apiKeyAuth: []
//  *     requestBody:
//  *       required: true
//  *       content:
//  *         application/json:
//  *           schema:
//  *             type: object
//  *             example:
//  *               email: "test@gmail.com"
//  *               esn: "123456789012345"
//  *               planId: "plan-basic"
//  *               language: "EN"
//  *               zip: "12345"
//  *               BillingCode: "ABC123"
//  *               E911ADDRESS:
//  *                 STREET1: "123 Main St"
//  *                 STREET2: "Apt 4B"
//  *                 CITY: "New York"
//  *                 STATE: "NY"
//  *                 ZIP: "10001"
//  *     responses:
//  *       200:
//  *         description: Activation successful
//  *       400:
//  *         description: Bad request
//  *       500:
//  *         description: Internal server error
//  */
// // router.post("/", async (req, res) => {
// //   console.log("request:", req.body);
// //   try {
// //     const response = await axios.post(
// //       "https://api.opncomm.com/opencom/api/v1/active",
// //       req.body,
// //       {
// //         headers: {
// //           Authorization: `Bearer ${process.env.BEARER_TOKEN}`,
// //           "Content-Type": "application/json",
// //         },
// //       }
// //     );
// //     res.json(response.data);
// //   } catch (err) {
// //     res
// //       .status(err.response?.status || 500)
// //       .json(err.response?.data || { error: "Unknown error" });
// //   }
// // });

// // router.post("/", async (req, res) => {
// //   console.log("request:", req.body);
// //   try {
// //     const { email, opncommToken } = req.body;

// //     const user = await User.findOne({ email });

// //     let bearerToken = user.opncommToken;

// //     console.log("bearerToken");

// //     const response = await axios.post(
// //       "https://api.opncomm.com/opencom/api/v1/active",
// //       req.body,
// //       {
// //         headers: {
// //           Authorization: `Bearer ${bearerToken}`,
// //           "Content-Type": "application/json",
// //         },
// //       }
// //     );

// //     res.json(response.data);
// //   } catch (err) {
// //     console.error("Activation Error:", err);
// //     res
// //       .status(err.response?.status || 500)
// //       .json(err.response?.data || { error: "Unknown error" });
// //   }
// // });

// router.post("/", async (req, res) => {
//   try {
//     const { email } = req.body;
//     console.log("Incoming request body:", req.body);

//     // Fetch user from DB
//     const user = await User.findOne({ email });
//     if (!user) {
//       return res.status(404).json({ error: "User not found" });
//     }

//     const bearerToken = user.opncommToken;
//     if (!bearerToken) {
//       return res.status(400).json({ error: "Token not found for user" });
//     }

//     console.log("Using bearerToken:", bearerToken);

//     const response = await axios.post(
//       "https://api.opncomm.com/opencom/api/v1/active",
//       req.body,
//       {
//         headers: {
//           Authorization: `Bearer ${bearerToken}`,
//           "Content-Type": "application/json",
//         },
//       }
//     );

//     res.json(response.data);
//   } catch (err) {
//     console.error("Activation Error:", err?.response?.data || err.message);
//     res
//       .status(err?.response?.status || 500)
//       .json(err?.response?.data || { error: "Unknown server error" });
//   }
// });

// /**
//  * @swagger
//  * /activate/save-activation:
//  *   post:
//  *     summary: Save activation data to a user by email
//  *     tags: [Activation]
//  *     security:
//  *       - bearerAuth: []  # Protected route
//  *     requestBody:
//  *       required: true
//  *       content:
//  *         application/json:
//  *           schema:
//  *             type: object
//  *             required:
//  *               - email
//  *             properties:
//  *               email:
//  *                 type: string
//  *                 example: "user@example.com"
//  *               esn:
//  *                 type: string
//  *               planId:
//  *                 type: string
//  *               language:
//  *                 type: string
//  *               zip:
//  *                 type: string
//  *               BillingCode:
//  *                 type: string
//  *               E911ADDRESS:
//  *                 type: object
//  *                 properties:
//  *                   STREET1:
//  *                     type: string
//  *                   STREET2:
//  *                     type: string
//  *                   CITY:
//  *                     type: string
//  *                   STATE:
//  *                     type: string
//  *                   ZIP:
//  *                     type: string
//  *     responses:
//  *       200:
//  *         description: Activation data saved successfully
//  *       400:
//  *         description: Email is missing or invalid
//  *       404:
//  *         description: User not found
//  *       500:
//  *         description: Internal server error
//  */
// // router.post("/save-activation", async (req, res) => {
// //   console.log("Save Activation Request:", req.body);

// //   const { email, ...activationData } = req.body;

// //   if (!email) {
// //     return res.status(400).json({ error: "Email is required" });
// //   }

// //   try {
// //     const user = await User.findOne({ email });
// //     if (!user) {
// //       return res.status(404).json({ error: "User not found" });
// //     }

// //     const activationCost = user.activationCost ?? 0;

// //     if (user.credits < activationCost) {
// //       return res.status(400).json({ error: "Insufficient credits" });
// //     }

// //     // Deduct credits
// //     user.credits -= activationCost;

// //     // Add activation data
// //     user.activationData.push({
// //       esn: activationData.esn,
// //       planId: activationData.planId,
// //       language: activationData.language,
// //       zip: activationData.zip,
// //       BillingCode: activationData.BillingCode,
// //       E911ADDRESS: {
// //         STREET1: activationData.E911ADDRESS?.STREET1,
// //         STREET2: activationData.E911ADDRESS?.STREET2,
// //         CITY: activationData.E911ADDRESS?.CITY,
// //         STATE: activationData.E911ADDRESS?.STATE,
// //         ZIP: activationData.E911ADDRESS?.ZIP,
// //       },
// //     });

// //     await user.save();

// //     res.json({
// //       message: "Activation saved. Credits deducted.",
// //       activationData: user.activationData,
// //       remainingCredits: user.credits,
// //     });
// //   } catch (err) {
// //     console.error("Error saving activation:", err);
// //     res.status(500).json({ error: err.message || "Unknown error" });
// //   }
// // });
// router.post("/save-activation", async (req, res) => {
//   console.log("Save Activation Request:", req.body);

//   const { email, ...activationData } = req.body;

//   if (!email) {
//     return res.status(400).json({ error: "Email is required" });
//   }

//   try {
//     const user = await User.findOne({ email });
//     if (!user) {
//       return res.status(404).json({ error: "User not found" });
//     }

//     const activationCost = user.activationCost ?? 0;

//     if (user.credits < activationCost) {
//       return res.status(400).json({ error: "Insufficient credits" });
//     }

//     // Deduct credits
//     user.credits -= activationCost;

//     // Add activation data with activationDate
//     user.activationData.push({
//       esn: activationData.esn,
//       planId: activationData.planId,
//       language: activationData.language,
//       zip: activationData.zip,
//       BillingCode: activationData.BillingCode,
//       activationDate: new Date(),
//       E911ADDRESS: {
//         STREET1: activationData.E911ADDRESS?.STREET1,
//         STREET2: activationData.E911ADDRESS?.STREET2,
//         CITY: activationData.E911ADDRESS?.CITY,
//         STATE: activationData.E911ADDRESS?.STATE,
//         ZIP: activationData.E911ADDRESS?.ZIP,
//       },
//     });

//     await user.save();

//     res.json({
//       message: "Activation saved. Credits deducted.",
//       activationData: user.activationData,
//       remainingCredits: user.credits,
//     });
//   } catch (err) {
//     console.error("Error saving activation:", err);
//     res.status(500).json({ error: err.message || "Unknown error" });
//   }
// });

// export default router;

/** @format */

import express from "express";
import axios from "axios";
import User from "../models/User.js";
import dotenv from "dotenv";
dotenv.config();

const router = express.Router();

/**
 * @swagger
 * tags:
 *   name: Activation
 *   description: Endpoints related to device activation
 */

/**
 * @swagger
 * /activate:
 *   post:
 *     summary: Activate a device via external API and save activation data
 *     tags: [Activation]
 *     security:
 *       - bearerAuth: []
 *       - apiKeyAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - email
 *             example:
 *               email: "test@gmail.com"
 *               esn: "123456789012345"
 *               planId: "plan-basic"
 *               language: "EN"
 *               zip: "12345"
 *               BillingCode: "ABC123"
 *               E911ADDRESS:
 *                 STREET1: "123 Main St"
 *                 STREET2: "Apt 4B"
 *                 CITY: "New York"
 *                 STATE: "NY"
 *                 ZIP: "10001"
 *     responses:
 *       200:
 *         description: Activation and saving successful
 *       400:
 *         description: Bad request (e.g., missing email or insufficient credits)
 *       404:
 *         description: User not found
 *       500:
 *         description: Internal server error
 */
// router.post("/", async (req, res) => {
//   try {
//     const { email, ...activationData } = req.body;
//     console.log("Incoming request body:", req.body);

//     if (!email) {
//       return res.status(400).json({ error: "Email is required" });
//     }

//     // Fetch user from DB
//     const user = await User.findOne({ email });
//     if (!user) {
//       return res.status(404).json({ error: "User not found" });
//     }

//     const bearerToken = user.opncommToken;
//     if (!bearerToken) {
//       return res.status(400).json({ error: "Token not found for user" });
//     }

//     const activationCost = user.activationCost ?? 0;
//     if (user.credits < activationCost) {
//       return res.status(400).json({ error: "Insufficient credits" });
//     }

//     console.log("Calling external activation API with token:", bearerToken);

//     // Call external activation API
//     const activationResponse = await axios.post(
//       "https://api.opncomm.com/opencom/api/v1/active",
//       req.body,
//       {
//         headers: {
//           Authorization: `Bearer ${bearerToken}`,
//           "Content-Type": "application/json",
//         },
//       }
//     );

//     // Deduct credits
//     user.credits -= activationCost;

//     // Save activation data
//     user.activationData.push({
//       esn: activationData.esn,
//       planId: activationData.planId,
//       language: activationData.language,
//       zip: activationData.zip,
//       BillingCode: activationData.BillingCode,
//       activationDate: new Date(),
//       E911ADDRESS: {
//         STREET1: activationData.E911ADDRESS?.STREET1,
//         STREET2: activationData.E911ADDRESS?.STREET2,
//         CITY: activationData.E911ADDRESS?.CITY,
//         STATE: activationData.E911ADDRESS?.STATE,
//         ZIP: activationData.E911ADDRESS?.ZIP,
//       },
//     });

//     await user.save();

//     // Final response
//     res.json({
//       message: "Device activated and data saved. Credits deducted.",
//       activationAPIResponse: activationResponse.data,
//       activationData: user.activationData,
//       remainingCredits: user.credits,
//     });
//   } catch (err) {
//     console.error("Activation Error:", err?.response?.data || err.message);
//     res
//       .status(err?.response?.status || 500)
//       .json(err?.response?.data || { error: "Unknown server error" });
//   }
// });

// router.post("/", async (req, res) => {
//   try {
//     const apiKey = req.headers["x-api-key"];

//     if (!apiKey) {
//       return res.status(400).json({ error: "Missing x-api-key in headers" });
//     }

//     // Fetch user from DB
//     const user = await User.findOne({ apiKey });
//     if (!user) {
//       return res
//         .status(404)
//         .json({ error: "User not found with this API key" });
//     }

//     const bearerToken = user.opncommToken;
//     if (!bearerToken) {
//       return res.status(400).json({ error: "Missing opncommToken for user" });
//     }

//     const activationCost = user.activationCost ?? 0;
//     if (user.credits < activationCost) {
//       return res.status(400).json({ error: "Insufficient credits" });
//     }

//     console.log("Calling external activation API with token:", bearerToken);

//     // Call external activation API
//     const activationResponse = await axios.post(
//       "https://api.opncomm.com/opencom/api/v1/active",
//       req.body,
//       {
//         headers: {
//           Authorization: `Bearer ${bearerToken}`,
//           "Content-Type": "application/json",
//         },
//       }
//     );

//     // Deduct credits
//     user.credits -= activationCost;

//     // Extract activation fields
//     const {
//       esn,
//       planId,
//       language,
//       zip,
//       BillingCode,
//       E911ADDRESS = {},
//     } = req.body;
//     const mdn = activationResponse?.data?.data?.mdn || "";
//     // Save activation data
//     user.activationData.push({
//       esn: esn || "",
//       planId: planId || "",
//       language: language || "",
//       zip: zip || "",
//       BillingCode: BillingCode || "",
//       mdn, // ✅ Add mdn here
//       activationDate: new Date(),
//       endDateOfActivation: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),

//       E911ADDRESS: {
//         STREET1: E911ADDRESS.STREET1 || "",
//         STREET2: E911ADDRESS.STREET2 || "",
//         CITY: E911ADDRESS.CITY || "",
//         STATE: E911ADDRESS.STATE || "",
//         ZIP: E911ADDRESS.ZIP || "",
//       },
//     });

//     await user.save();

//     res.json({
//       message: "Device activated and data saved. Credits deducted.",
//       activationAPIResponse: activationResponse.data,
//       activationData: user.activationData,
//       remainingCredits: user.credits,
//     });
//   } catch (err) {
//     console.error("Activation Error:", err?.response?.data || err.message);
//     res
//       .status(err?.response?.status || 500)
//       .json(err?.response?.data || { error: "Unknown server error" });
//   }
// });

router.post("/", async (req, res) => {
  try {
    const apiKey = req.headers["x-api-key"];

    if (!apiKey) {
      return res.status(400).json({ error: "Missing x-api-key in headers" });
    }

    // Fetch user from DB
    const user = await User.findOne({ apiKey });
    if (!user) {
      return res
        .status(404)
        .json({ error: "User not found with this API key" });
    }

    const bearerToken = user.opncommToken;
    if (!bearerToken) {
      return res.status(400).json({ error: "Missing opncommToken for user" });
    }

    const activationCost = user.activationCost ?? 0;
    if (user.credits < activationCost) {
      return res.status(400).json({ error: "Insufficient credits" });
    }

    console.log("Calling external activation API with token:", bearerToken);

    // Call external activation API
    const activationRequestBody = {
      ...req.body,
      planId: "01", // always send "01" to opncomm
    };

    const activationResponse = await axios.post(
      "https://api.opncomm.com/opencom/api/v1/active",
      activationRequestBody,
      {
        headers: {
          Authorization: `Bearer ${bearerToken}`,
          "Content-Type": "application/json",
        },
      }
    );

    // Deduct credits
    user.credits -= activationCost;

    // Extract activation fields
    const {
      esn,
      planId,
      language,
      zip,
      BillingCode,
      E911ADDRESS = {},
    } = req.body;

    const mdn = activationResponse?.data?.address_data?.mdn || "";

    // Calculate endDateOfActivation based on planId
    let endDateOfActivation = new Date();
    if (planId === "01") {
      endDateOfActivation.setDate(endDateOfActivation.getDate() + 30);
    } else if (planId === "012") {
      endDateOfActivation.setFullYear(endDateOfActivation.getFullYear() + 1);
    } else {
      // default to 30 days if unknown planId
      endDateOfActivation.setDate(endDateOfActivation.getDate() + 30);
    }

    // Save activation data
    user.activationData.push({
      esn: esn || "",
      planId: planId || "",
      language: language || "",
      zip: zip || "",
      BillingCode: BillingCode || "",
      mdn,
      activationDate: new Date(),
      endDateOfActivation,
      E911ADDRESS: {
        STREET1: E911ADDRESS.STREET1 || "",
        STREET2: E911ADDRESS.STREET2 || "",
        CITY: E911ADDRESS.CITY || "",
        STATE: E911ADDRESS.STATE || "",
        ZIP: E911ADDRESS.ZIP || "",
      },
    });

    await user.save();

    res.json({
      message: "Device activated and data saved. Credits deducted.",
      activationAPIResponse: activationResponse.data,
      activationData: user.activationData,
      remainingCredits: user.credits,
    });
  } catch (err) {
    console.error("Activation Error:", err?.response?.data || err.message);
    res
      .status(err?.response?.status || 500)
      .json(err?.response?.data || { error: "Unknown server error" });
  }
});
export default router;
