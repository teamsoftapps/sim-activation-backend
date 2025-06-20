/** @format */

import express from "express";
import jwt from "jsonwebtoken";
import bcrypt from "bcrypt"; // ✅ Import bcrypt
import Admin from "../models/Admin.js";
import User from "../models/User.js";

const router = express.Router();

/**
 * @swagger
 * tags:
 *   name: Auth
 *   description: Authentication related endpoints
 */

/**
 * @swagger
 * /auth/signin:
 *   post:
 *     summary: Sign in as admin or user
 *     tags: [Auth]
 *     requestBody:
 *       description: User credentials for sign-in
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - email
 *               - password
 *             properties:
 *               email:
 *                 type: string
 *                 format: email
 *                 example: user@example.com
 *               password:
 *                 type: string
 *                 example: mypassword123
 *     responses:
 *       200:
 *         description: Successful sign-in returns JWT token and user info
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 message:
 *                   type: string
 *                   example: User signed in successfully
 *                 role:
 *                   type: string
 *                   enum: [admin, user]
 *                   example: user
 *                 token:
 *                   type: string
 *                   example: eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
 *                 account:
 *                   type: object
 *                   properties:
 *                     id:
 *                       type: string
 *                       example: 60d0fe4f5311236168a109ca
 *                     fullName:
 *                       type: string
 *                       example: John Doe
 *                     email:
 *                       type: string
 *                       example: user@example.com
 *       401:
 *         description: Invalid password
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: false
 *                 message:
 *                   type: string
 *                   example: Invalid password
 *       404:
 *         description: User not found
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: false
 *                 message:
 *                   type: string
 *                   example: User not found
 *       500:
 *         description: Server error
 */
router.post("/signin", async (req, res) => {
  const { email, password } = req.body;

  try {
    // 1. Check Admin collection
    let account = await Admin.findOne({ email });

    if (account) {
      const isPasswordValid = await bcrypt.compare(password, account.password);
      if (!isPasswordValid) {
        return res
          .status(401)
          .json({ success: false, message: "Invalid password" });
      }

      const token = jwt.sign(
        { id: account._id, role: "admin" },
        process.env.JWT_SECRET
        // { expiresIn: "1d" }
      );

      account.token = token;
      await account.save();

      return res.json({
        success: true,
        message: "Admin signed in successfully",
        role: "admin",
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

    if (!account) {
      return res
        .status(404)
        .json({ success: false, message: "User not found" });
    }

    const isPasswordValid = await bcrypt.compare(password, account.password);
    if (!isPasswordValid) {
      return res
        .status(401)
        .json({ success: false, message: "Invalid password" });
    }

    const token = jwt.sign(
      { id: account._id, role: "user" },
      process.env.JWT_SECRET
      // { expiresIn: "1d" }
    );

    account.token = token;
    await account.save();

    return res.json({
      success: true,
      message: "User signed in successfully",
      role: "user",
      token,
      account: {
        id: account._id,
        fullName: account.fullName,
        email: account.email,
        credits: account.credits,
      },
    });
  } catch (err) {
    console.error("❌ Sign-in error:", err);
    return res.status(500).json({ success: false, message: "Server error" });
  }
});

export default router;
