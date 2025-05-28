import express from "express";
import mongoose from "mongoose";
import dotenv from "dotenv";
import cors from "cors";
import apiKeyMiddleware from "./src/middleware/apiKeyCheck.js";

dotenv.config();

const app = express();
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
    process.exit(1); // Optional but recommended
  });

// Use API key middleware globally
app.use(apiKeyMiddleware);

// Import your route files
import activateRoutes from "./src/routes/activate.js";
import adminUserControlRoutes from "./src/routes/adminUserControlRoutes.js";
import bulkActivationRoutes from "./src/routes/bulkActivate.js";
import changeSimRoutes from "./src/routes/changeSim.js";
import deactivateRoutes from "./src/routes/deactivate.js";
import reactivateRoutes from "./src/routes/reactivate.js";
import signinRoutes from "./src/routes/signin.js";
import signupRoutes from "./src/routes/signup.js";

// Mount routes
app.use("/activate", activateRoutes);
app.use("/bulk-activate", bulkActivationRoutes);
app.use("/change-sim-no", changeSimRoutes);
app.use("/deactivate", deactivateRoutes);
app.use("/reactivate", reactivateRoutes);

app.use("/admin-user", adminUserControlRoutes); // admin user CRUD and management routes

app.use("/auth", signinRoutes);
app.use("/auth/signup", signupRoutes);

// Start server
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`🚀 Server running on port ${PORT}`));
