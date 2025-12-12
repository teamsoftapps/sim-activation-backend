/** @format */

import express from 'express';
import axios from 'axios';
import User from '../../models/User.js';
const router = express.Router();

router.post('/', async (req, res) => {
  try {
    // Extract x-api-key from header
    const apiKey = req.headers['x-api-key'];

    if (!apiKey) {
      return res.status(400).json({ error: 'Missing x-api-key in headers' });
    }

    // Look up user by apiKey
    const user = await User.findOne({ apiKey });

    // Default bearer token
    let bearerToken = user.opncommToken;

    if (!bearerToken) {
      return res.status(400).json({ error: 'Missing opncommToken for user' });
    }

    console.log('Making ADD WFC request with token:', bearerToken);

    // Make external request
    const response = await axios.post(
      'https://api.opncomm.com/opencom/api/v1/add-wfc',
      req.body,
      {
        headers: {
          Authorization: `Bearer ${bearerToken}`,
          'Content-Type': 'application/json',
        },
      }
    );

    res.json(response.data);
  } catch (err) {
    console.error('Add-WFC Error:', err);
    res
      .status(err.response?.status || 500)
      .json(err.response?.data || { error: 'Unknown error' });
  }
});
export default router;
