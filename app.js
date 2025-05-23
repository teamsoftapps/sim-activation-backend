import express from "express";
import mongoose from "mongoose";
import dotenv from "dotenv";
import cors from "cors";
import apiKeyMiddleware from "./src/middleware/apiKeyCheck.js";
dotenv.config();

const app = express();
app.use(express.json());

// ✅ Allow CORS from all origins
app.use(
  cors({
    origin: "*", // 🔓 Allow all origins
    methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "x-api-key"],
  })
);

// ✅ Handle preflight requests globally
app.options("*", cors());

// ✅ Connect to MongoDB
await mongoose.connect(process.env.MONGO_URI);

// ✅ Use API key middleware
app.use(apiKeyMiddleware);

// ✅ Routes
import activate from "./src/routes/activate.js";
import bulkActivate from "./src/routes/bulkActivate.js";
import changeSim from "./src/routes/changeSim.js";
import deactivate from "./src/routes/deactivate.js";
import reactivate from "./src/routes/reactivate.js";

app.use("/activate", activate);
app.use("/bulk-activate", bulkActivate);
app.use("/change-sim-no", changeSim);
app.use("/deactivate", deactivate);
app.use("/reactivate", reactivate);

app.listen(3000, () => console.log("🚀 Server running on port 3000"));
