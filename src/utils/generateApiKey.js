// // src/utils/generateApiKey.js
// import mongoose from "mongoose";
// import dotenv from "dotenv";
// import { v4 as uuidv4 } from "uuid";
// import ApiKey from "../models/ApiKey.js";

// dotenv.config();

// mongoose.connect(process.env.MONGO_URI, {
//   useNewUrlParser: true,
//   useUnifiedTopology: true,
// });

// async function generateApiKey() {
//   const key = uuidv4();
//   const newKey = new ApiKey({ key });

//   await newKey.save();
//   console.log("✅ API Key generated and saved to DB:", key);
//   process.exit();
// }

// generateApiKey().catch((err) => {
//   console.error("❌ Error generating API key:", err);
//   process.exit(1);
// });

import { v4 as uuidv4 } from "uuid";
import ApiKey from "../models/ApiKey.js";

export async function generateApiKey() {
  const key = uuidv4();
  const newKey = new ApiKey({ key });
  return key;
}
