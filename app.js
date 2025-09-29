/** @format */
import express from "express";
import mongoose from "mongoose";
import dotenv from "dotenv";
import cors from "cors";
import path from "path";
import { fileURLToPath } from "url";

import apiKeyMiddleware from "./src/middleware/apiKeyCheck.js";
import swaggerJsdoc from "swagger-jsdoc";
import swaggerOptions from "./swaggerOptions.js";
import "./cron/deactivateExpiredActivations.js";
import getActivations from "./src/routes/getActivations.js";
import updateActivations from "./src/routes/updateActivation.js";

dotenv.config();

const app = express();

// For __dirname in ES module scope
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Swagger setup
import activateRoutes from "./src/routes/activate.js";
import adminUserControlRoutes from "./src/routes/adminUserControlRoutes.js";
import bulkActivationRoutes from "./src/routes/bulkActivate.js";
import changeSimRoutes from "./src/routes/changeSim.js";
import deactivateRoutes from "./src/routes/deactivate.js";
import reactivateRoutes from "./src/routes/reactivate.js";
import signinRoutes from "./src/routes/signin.js";
import signupRoutes from "./src/routes/signup.js";
import purchasePlan from "./src/routes/purchasePlan.js";
import AT_T_purchasePlan from "./src/routes/AT&T_purchasePlan.js";
import getSubscriberInquiry from "./src/routes/getSubscriberInquiry.js";
import activeNewSubscriber from "./src/routes/activeNewSubscriber.js";
import deactivateSubscriber from "./src/routes/deactivateSubscriber.js";
import reactivateSubscriber from "./src/routes/reactivateSubscriber.js";
import changePlan from "./src/routes/changePlan.js";
import addWfc from "./src/routes/addWfc.js";
import updateE911address from "./src/routes/updateE911address.js";
import userRoutes from "./src/routes/userRoutes.js";
const swaggerSpec = swaggerJsdoc(swaggerOptions);
app.use(express.json());

// app.use(
//   cors({
//     origin: "*",
//     methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
//     allowedHeaders: [
//       "Content-Type",
//       "x-api-key",
//       "Authorization",
//       "Access-Control-Allow-Origin",
//     ],
//   })
// );
// app.options("*", cors());

app.use(
  cors({
    origin: [
      "https://www.jf-mobile.com",
      "http://localhost:3001",
      "http://localhost:3000",
      "*",
    ], // allow only your frontend
    methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization", "x-api-key"],
    credentials: true,
  })
);
app.options("*", cors());

// Serve static Swagger UI files manually
app.use(
  "/swagger-ui",
  express.static(path.join(__dirname, "node_modules", "swagger-ui-dist"))
);

// Serve Swagger JSON
app.get("/swagger.json", (req, res) => {
  res.setHeader("Content-Type", "application/json");
  res.send(swaggerSpec);
});

// Serve custom Swagger HTML
app.get("/api-docs", (req, res) => {
  res.send(`
    <!DOCTYPE html>
    <html lang="en">
      <head>
        <meta charset="UTF-8">
        <title>API Docs</title>
        <link rel="stylesheet" type="text/css" href="/swagger-ui/swagger-ui.css" />
      </head>
      <body>
        <div id="swagger-ui"></div>
        <script src="/swagger-ui/swagger-ui-bundle.js"></script>
        <script src="/swagger-ui/swagger-ui-standalone-preset.js"></script>
        <script>
          window.onload = () => {
            SwaggerUIBundle({
              url: '/swagger.json',
              dom_id: '#swagger-ui',
              presets: [
                SwaggerUIBundle.presets.apis,
                SwaggerUIStandalonePreset
              ],
              layout: "StandaloneLayout"
            });
          };
        </script>
      </body>
    </html>
  `);
});

// MongoDB connection
mongoose
  .connect(process.env.MONGO_URI)
  .then(() => console.log("✅ Connected to MongoDB"))
  .catch((err) => {
    console.error("❌ Failed to connect to MongoDB:", err.message);
    process.exit(1);
  });

app.get("/", (req, res) => {
  res.send("Hello World!");
});

//API Routes
app.use("/activate", apiKeyMiddleware, activateRoutes);
app.use("/bulk-activate", apiKeyMiddleware, bulkActivationRoutes);
app.use("/change-sim-no", apiKeyMiddleware, changeSimRoutes);
app.use("/deactivate", apiKeyMiddleware, deactivateRoutes);
app.use("/reactivate", apiKeyMiddleware, reactivateRoutes);
app.use("/purchasePlan", apiKeyMiddleware, purchasePlan);
app.use("/at&t/purchase-plan", apiKeyMiddleware, AT_T_purchasePlan);
app.use("/at&t/get-subscriber-inquiry", apiKeyMiddleware, getSubscriberInquiry);
app.use("/at&t/active-new-subscriber", apiKeyMiddleware, activeNewSubscriber);
app.use("/at&t/deactivate-subscriber", apiKeyMiddleware, deactivateSubscriber);
app.use("/at&t/reactivate-subscriber", apiKeyMiddleware, reactivateSubscriber);
app.use("/at&t/change-plan", apiKeyMiddleware, changePlan);
app.use("/add-wfc", apiKeyMiddleware, addWfc);
app.use("/update-e911address", apiKeyMiddleware, updateE911address);

//Auth routes
app.use("/admin-user", adminUserControlRoutes);
app.use("/auth", signinRoutes);
app.use("/auth/signup", signupRoutes);
app.use("/user", userRoutes);

//Get Activations
app.use("/get-activations", getActivations);
app.use("/admin-user", updateActivations);

// Server start
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`🚀 Server running on port ${PORT}`));
