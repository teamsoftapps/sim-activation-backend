import express from "express";
import bcrypt from "bcrypt";
import User from "../models/User.js";
import Admin from "../models/Admin.js";
import { generateApiKey } from "../utils/generateApiKey.js";

const router = express.Router();

/**
 * @swagger
 * tags:
 *   name: Users
 *   description: User and Admin account management
 */

/**
 * @swagger
 * /auth/signup/createUser:
 *   post:
 *     summary: Create a new user account
 *     tags: [Users]
 *     requestBody:
 *       description: User details for registration
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - fullName
 *               - email
 *               - password
 *               - phone
 *             properties:
 *               fullName:
 *                 type: string
 *                 example: John Doe
 *               email:
 *                 type: string
 *                 format: email
 *                 example: johndoe@example.com
 *               password:
 *                 type: string
 *                 example: mySecurePass123
 *               phone:
 *                 type: string
 *                 example: "+1234567890"
 *               activationData:
 *                 type: array
 *                 description: Optional activation-related data
 *                 items:
 *                   type: object
 *                   properties: {}
 *     responses:
 *       201:
 *         description: User created successfully
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
 *                   example: User created successfully
 *                 user:
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
 *                       example: johndoe@example.com
 *                     phone:
 *                       type: string
 *                       example: "+1234567890"
 *                     apiKey:
 *                       type: string
 *                       example: abcd1234apikey5678
 *                     activationData:
 *                       type: array
 *                       description: Activation-related data
 *                       items:
 *                         type: object
 *                         properties: {}
 *       400:
 *         description: Missing required fields
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
 *                   example: All required fields are missing.
 *       409:
 *         description: User already exists
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
 *                   example: User already exists with this email.
 *       500:
 *         description: Server error
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
 *                   example: Server error
 */
router.post("/createUser", async (req, res) => {
  const { fullName, email, password, phone, activationData } = req.body;

  if (!fullName || !email || !password || !phone) {
    return res
      .status(400)
      .json({ success: false, message: "All required fields are missing." });
  }

  try {
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(409).json({
        success: false,
        message: "User already exists with this email.",
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
      message: "User created successfully",
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
    console.error("❌ Error creating user:", error);
    res.status(500).json({ success: false, message: "Server error" });
  }
});

/**
 * @swagger
 * /auth/signup/createAdmin:
 *   post:
 *     summary: Create a new admin account
 *     tags: [Users]
 *     requestBody:
 *       description: Admin details for registration
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - fullName
 *               - email
 *               - password
 *               - phone
 *             properties:
 *               fullName:
 *                 type: string
 *                 example: Admin User
 *               email:
 *                 type: string
 *                 format: email
 *                 example: admin@example.com
 *               password:
 *                 type: string
 *                 example: adminPass456
 *               phone:
 *                 type: string
 *                 example: "+1234567890"
 *     responses:
 *       201:
 *         description: Admin created successfully
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
 *                   example: Admin created successfully
 *                 admin:
 *                   type: object
 *                   properties:
 *                     id:
 *                       type: string
 *                       example: 60d0fe4f5311236168a109ca
 *                     fullName:
 *                       type: string
 *                       example: Admin User
 *                     email:
 *                       type: string
 *                       example: admin@example.com
 *                     phone:
 *                       type: string
 *                       example: "+1234567890"
 *       400:
 *         description: Email already in use
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
 *                   example: Email already in use as a user account
 *       500:
 *         description: Server error
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
 *                   example: Server error
 */
router.post("/createAdmin", async (req, res) => {
  const { fullName, email, password, phone } = req.body;

  if (!fullName || !email || !password || !phone) {
    return res
      .status(400)
      .json({ success: false, message: "All required fields are missing." });
  }

  try {
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({
        success: false,
        message: "Email already in use as a user account",
      });
    }

    const existingAdmin = await Admin.findOne({ email });
    if (existingAdmin) {
      return res.status(400).json({
        success: false,
        message: "Admin already exists with this email",
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
      message: "Admin created successfully",
      admin: {
        id: newAdmin._id,
        fullName: newAdmin.fullName,
        email: newAdmin.email,
        phone: newAdmin.phone,
      },
    });
  } catch (err) {
    console.error("❌ Error creating admin:", err);
    res.status(500).json({ success: false, message: "Server error" });
  }
});

export default router;
