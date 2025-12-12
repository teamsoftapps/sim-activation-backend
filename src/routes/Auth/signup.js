/** @format */

import express from 'express';
import bcrypt from 'bcrypt';
import User from '../../models/User.js';
import Admin from '../../models/Admin.js';

const router = express.Router();

router.post('/createUser', async (req, res) => {
  const { fullName, email, password, phone, activationData } = req.body;

  if (!fullName || !email || !password || !phone) {
    return res
      .status(400)
      .json({ success: false, message: 'All required fields are missing.' });
  }

  try {
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(409).json({
        success: false,
        message: 'User already exists with this email.',
      });
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    const apiKey = await generateApiKey();

    const newUser = new User({
      fullName,
      email,
      password: hashedPassword,
      phone,
      apiKey,
      activationData: Array.isArray(activationData) ? activationData : [],
    });

    await newUser.save();

    res.status(201).json({
      success: true,
      message: 'User created successfully',
      user: {
        id: newUser._id,
        fullName: newUser.fullName,
        email: newUser.email,
        phone: newUser.phone,
        apiKey: newUser.apiKey,
        activationData: newUser.activationData,
      },
    });
  } catch (error) {
    console.error('❌ Error creating user:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

router.post('/createAdmin', async (req, res) => {
  const { fullName, email, password, phone } = req.body;

  if (!fullName || !email || !password || !phone) {
    return res
      .status(400)
      .json({ success: false, message: 'All required fields are missing.' });
  }

  try {
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({
        success: false,
        message: 'Email already in use as a user account',
      });
    }

    const existingAdmin = await Admin.findOne({ email });
    if (existingAdmin) {
      return res.status(400).json({
        success: false,
        message: 'Admin already exists with this email',
      });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const newAdmin = new Admin({
      fullName,
      email,
      password: hashedPassword,
      phone,
    });

    await newAdmin.save();

    res.status(201).json({
      success: true,
      message: 'Admin created successfully',
      admin: {
        id: newAdmin._id,
        fullName: newAdmin.fullName,
        email: newAdmin.email,
        phone: newAdmin.phone,
      },
    });
  } catch (err) {
    console.error('❌ Error creating admin:', err);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

export default router;
