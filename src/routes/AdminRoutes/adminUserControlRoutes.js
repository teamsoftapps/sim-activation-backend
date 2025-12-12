/** @format */

import express from 'express';
import User from '../../models/User.js';
import Admin from '../../models/Admin.js';
import isAdmin from '../../middleware/authMiddleware.js';
import bcrypt from 'bcrypt';

const router = express.Router();

router.get('/users', isAdmin, async (req, res) => {
  try {
    const users = await User.find().select('-password');
    res.status(200).json({ success: true, users });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

router.get('/users/:id', isAdmin, async (req, res) => {
  try {
    const user = await User.findById(req.params.id).select('-password');
    if (!user) {
      return res
        .status(404)
        .json({ success: false, message: 'User not found' });
    }
    res.json({ success: true, user });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

router.put('/users/:id', isAdmin, async (req, res) => {
  try {
    const { fullName, email, phone, newPassword, credits, opncommToken } =
      req.body;

    const updateFields = {};
    if (fullName) updateFields.fullName = fullName;
    if (email) updateFields.email = email;
    if (phone) updateFields.phone = phone;
    if (opncommToken) updateFields.opncommToken = opncommToken;

    if (typeof credits === 'number' && credits >= 0) {
      updateFields.credits = credits;
    }

    if (newPassword) {
      const hashedPassword = await bcrypt.hash(newPassword, 10);
      updateFields.password = hashedPassword;
    }

    const updatedUser = await User.findByIdAndUpdate(
      req.params.id,
      updateFields,
      { new: true }
    ).select('-password');

    if (!updatedUser) {
      return res
        .status(404)
        .json({ success: false, message: 'User not found' });
    }

    res.json({
      success: true,
      message: 'User updated successfully',
      user: updatedUser,
    });
  } catch (err) {
    console.error('Error updating user:', err);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

router.post('/set-activation-cost', async (req, res) => {
  const { email, activationCost } = req.body;

  if (!email) {
    return res.status(400).json({ error: 'Email is required' });
  }

  if (typeof activationCost !== 'number' || activationCost < 0) {
    return res.status(400).json({ error: 'Invalid activation cost' });
  }

  try {
    const user = await User.findOne({ email });

    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    user.activationCost = activationCost;

    await user.save();

    res.json({ message: 'Activation cost updated for user', activationCost });
  } catch (err) {
    console.error('Error updating user activation cost:', err);
    res.status(500).json({ error: err.message || 'Unknown error' });
  }
});

export default router;
