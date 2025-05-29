import express from "express";
import bcrypt from "bcrypt";
import User from "../models/User.js";
import Admin from "../models/Admin.js";
import { generateApiKey } from "../utils/generateApiKey.js";

const router = express.Router();

// ✅ Create User with email uniqueness across roles
router.post("/createUser", async (req, res) => {
  const { fullName, email, password, phone, activationData } = req.body;

  try {
    // Check existing admin and user omitted for brevity (keep your current checks)

    const hashedPassword = await bcrypt.hash(password, 10);
    const apiKey = await generateApiKey();

    const newUser = new User({
      fullName,
      email,
      password: hashedPassword,
      phone,
      apiKey,
      activationData: activationData || [],
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
        activationData: newUser.activationData, // now included
      },
    });
  } catch (error) {
    console.error("❌ Error creating user:", error);
    res.status(500).json({ success: false, message: "Server error" });
  }
});

// ✅ Create Admin with email uniqueness across roles
router.post("/createAdmin", async (req, res) => {
  const { fullName, email, password, phone } = req.body;

  try {
    // Check if email exists in User collection
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({
        success: false,
        message: "Email already in use as a user account",
      });
    }

    // Check if email exists in Admin collection
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
