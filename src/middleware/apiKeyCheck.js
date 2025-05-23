import ApiKey from "../models/ApiKey.js";

const apiKeyMiddleware = async (req, res, next) => {
  const apiKey = req.header("x-api-key") || req.query.api_key;
  if (!apiKey) {
    return res.status(401).json({ error: "API key missing" });
  }

  const key = await ApiKey.findOne({ key: apiKey });
  if (!key) {
    return res.status(403).json({ error: "Invalid API key" });
  }

  next();
};

export default apiKeyMiddleware;
