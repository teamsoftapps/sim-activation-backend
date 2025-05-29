import express from "express";
import axios from "axios";
const router = express.Router();

router.post("/", async (req, res) => {
  console.log("request:", req.body);
  try {
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
    res.json(response.data);
  } catch (err) {
    res
      .status(err.response?.status || 500)
      .json(err.response?.data || { error: "Unknown error" });
  }
});

export default router;
