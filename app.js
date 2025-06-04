/** @format */

import express from "express";
import mongoose from "mongoose";
import dotenv from "dotenv";
import cors from "cors";
import apiKeyMiddleware from "./src/middleware/apiKeyCheck.js";
import swaggerJsdoc from "swagger-jsdoc";
import swaggerUi from "swagger-ui-express";
import swaggerOptions from "./swaggerOptions.js";

dotenv.config();

const app = express();

const swaggerSpec = swaggerJsdoc(swaggerOptions);

app.use("/api-docs", swaggerUi.serve, swaggerUi.setup(swaggerSpec));
app.use(express.json());

// Enable CORS for all origins and handle preflight requests
app.use(
  cors({
    origin: "*",
    methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "x-api-key", "Authorization"],
  })
);
app.options("*", cors());

// Connect to MongoDB
mongoose
  .connect(process.env.MONGO_URI)
  .then(() => console.log("✅ Connected to MongoDB"))
  .catch((err) => {
    console.error("❌ Failed to connect to MongoDB:", err.message);
    process.exit(1);
  });

import activateRoutes from "./src/routes/activate.js";
import adminUserControlRoutes from "./src/routes/adminUserControlRoutes.js";
import bulkActivationRoutes from "./src/routes/bulkActivate.js";
import changeSimRoutes from "./src/routes/changeSim.js";
import deactivateRoutes from "./src/routes/deactivate.js";
import reactivateRoutes from "./src/routes/reactivate.js";
import signinRoutes from "./src/routes/signin.js";
import signupRoutes from "./src/routes/signup.js";

app.use("/activate", apiKeyMiddleware, activateRoutes);
app.use("/bulk-activate", apiKeyMiddleware, bulkActivationRoutes);
app.use("/change-sim-no", apiKeyMiddleware, changeSimRoutes);
app.use("/deactivate", apiKeyMiddleware, deactivateRoutes);
app.use("/reactivate", apiKeyMiddleware, reactivateRoutes);

app.use("/admin-user", adminUserControlRoutes);

app.use("/auth", signinRoutes);
app.use("/auth/signup", signupRoutes);

// Start server
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`🚀 Server running on port ${PORT}`));
