/** @format */

import express from 'express';
import jwt from 'jsonwebtoken';
import bcrypt from 'bcrypt'; // ✅ Import bcrypt
import Admin from '../../models/Admin.js';
import User from '../../models/User.js';

const router = express.Router();

router.post('/signin', async (req, res) => {
  const { email, password } = req.body;

  try {
    // 1. Check Admin collection
    let account = await Admin.findOne({ email });

    console.log('ADmin found', account);

    if (account) {
      const isPasswordValid = await bcrypt.compare(password, account.password);
      if (!isPasswordValid) {
        return res
          .status(401)
          .json({ success: false, message: 'Invalid password' });
      }

      const token = jwt.sign(
        { id: account._id, role: 'admin' },
        process.env.JWT_SECRET
        // { expiresIn: "1d" }
      );

      account.token = token;
      await account.save();

      return res.json({
        success: true,
        message: 'Admin signed in successfully',
        role: 'admin',
        apiKey: account.apiKey,
        token,
        account: {
          id: account._id,
          fullName: account.fullName,
          email: account.email,
        },
      });
    }

    // 2. Check User collection
    account = await User.findOne({ email });

    console.log('🔍 Sign-in attempt for email:', account);

    if (!account) {
      return res
        .status(404)
        .json({ success: false, message: 'User not found' });
    }

    const isPasswordValid = await bcrypt.compare(password, account.password);
    if (!isPasswordValid) {
      return res
        .status(401)
        .json({ success: false, message: 'Invalid password' });
    }

    const token = jwt.sign(
      { id: account._id, role: 'user' },
      process.env.JWT_SECRET
      // { expiresIn: "1d" }
    );

    account.token = token;
    await account.save();

    return res.json({
      success: true,
      message: 'User signed in successfully',
      role: 'user',
      apiKey: account.apiKey,
      token,
      account: {
        id: account._id,
        fullName: account.fullName,
        email: account.email,
        credits: account.credits,
      },
    });
  } catch (err) {
    console.error('❌ Sign-in error:', err);
    return res.status(500).json({ success: false, message: 'Server error' });
  }
});

export default router;
