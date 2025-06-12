/** @format */

import express from "express";
import User from "../models/User.js";
import Admin from "../models/Admin.js";
import isAdmin from "../middleware/isAdmin.js";
import bcrypt from "bcrypt";

const router = express.Router();

/**
 * @swagger
 * tags:
 *   name: Admin Users
 *   description: Admin operations for managing users
 */

/**
 * @swagger
 * /admin-user/users:
 *   get:
 *     summary: Get all users (admin only)
 *     tags: [Admin Users]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: List of users
 *       500:
 *         description: Server error
 */
router.get("/users", isAdmin, async (req, res) => {
  try {
    const users = await User.find().select("-password");
    res.status(200).json({ success: true, users });
  } catch (err) {
    res.status(500).json({ success: false, message: "Server error" });
  }
});

/**
 * @swagger
 * /admin-user/users/{id}:
 *   get:
 *     summary: Get a single user by ID (admin only)
 *     tags: [Admin Users]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: User ID
 *     responses:
 *       200:
 *         description: User details
 *       404:
 *         description: User not found
 *       500:
 *         description: Server error
 */
router.get("/users/:id", isAdmin, async (req, res) => {
  try {
    const user = await User.findById(req.params.id).select("-password");
    if (!user) {
      return res
        .status(404)
        .json({ success: false, message: "User not found" });
    }
    res.json({ success: true, user });
  } catch (err) {
    res.status(500).json({ success: false, message: "Server error" });
  }
});

/**
 * @swagger
 * /admin-user/users/{id}:
 *   put:
 *     summary: Update a user's details (admin only)
 *     tags: [Admin Users]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: User ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               fullName:
 *                 type: string
 *                 example: John Doe
 *               email:
 *                 type: string
 *                 example: john@example.com
 *               phone:
 *                 type: string
 *                 example: "1234567890"
 *               newPassword:
 *                 type: string
 *                 example: newsecurepassword123
 *               credits:
 *                 type: number
 *                 example: 100
 *                 description: Set new credit balance for the user (must be non-negative)
 *     responses:
 *       200:
 *         description: User updated successfully
 *       404:
 *         description: User not found
 *       500:
 *         description: Server error
 */
// router.put("/users/:id", isAdmin, async (req, res) => {
//   try {
//     const { fullName, email, phone, newPassword } = req.body;

//     const updateFields = {};
//     if (fullName) updateFields.fullName = fullName;
//     if (email) updateFields.email = email;
//     if (phone) updateFields.phone = phone;

//     if (newPassword) {
//       const hashedPassword = await bcrypt.hash(newPassword, 10);
//       updateFields.password = hashedPassword;
//     }

//     const updatedUser = await User.findByIdAndUpdate(
//       req.params.id,
//       updateFields,
//       { new: true }
//     ).select("-password");

//     if (!updatedUser) {
//       return res
//         .status(404)
//         .json({ success: false, message: "User not found" });
//     }

//     res.json({
//       success: true,
//       message: "User updated successfully",
//       user: updatedUser,
//     });
//   } catch (err) {
//     console.error("Error updating user:", err);
//     res.status(500).json({ success: false, message: "Server error" });
//   }
// });
router.put("/users/:id", isAdmin, async (req, res) => {
  try {
    const { fullName, email, phone, newPassword, credits } = req.body;

    const updateFields = {};
    if (fullName) updateFields.fullName = fullName;
    if (email) updateFields.email = email;
    if (phone) updateFields.phone = phone;

    if (typeof credits === "number" && credits >= 0) {
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
    ).select("-password");

    if (!updatedUser) {
      return res
        .status(404)
        .json({ success: false, message: "User not found" });
    }

    res.json({
      success: true,
      message: "User updated successfully",
      user: updatedUser,
    });
  } catch (err) {
    console.error("Error updating user:", err);
    res.status(500).json({ success: false, message: "Server error" });
  }
});

/**
 * @swagger
 * /admin-user/users/{id}:
 *   delete:
 *     summary: Delete a user by ID (admin only)
 *     tags: [Admin Users]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: User ID
 *     responses:
 *       200:
 *         description: User deleted successfully
 *       404:
 *         description: User not found
 *       500:
 *         description: Server error
 */
router.delete("/users/:id", isAdmin, async (req, res) => {
  try {
    const deletedUser = await User.findByIdAndDelete(req.params.id);

    if (!deletedUser) {
      return res
        .status(404)
        .json({ success: false, message: "User not found" });
    }

    res.json({ success: true, message: "User deleted successfully" });
  } catch (err) {
    res.status(500).json({ success: false, message: "Server error" });
  }
});

// POST /admin/set-activation-cost
/**
 * @swagger
 * /admin-user/set-activation-cost:
 *   post:
 *     summary: Set or update the activation cost (admin only)
 *     tags: [Admin Users]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               activationCost:
 *                 type: number
 *                 example: 10
 *                 description: The cost to deduct per activation (must be non-negative)
 *     responses:
 *       200:
 *         description: Activation cost updated successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: Activation cost updated
 *                 email:
 *                   type: string
 *                   example: john@example.com
 *                 activationCost:
 *                   type: number
 *                   example: 10
 *       400:
 *         description: Invalid activation cost value
 *       500:
 *         description: Server error
 */

router.post("/set-activation-cost", async (req, res) => {
  const { email, activationCost } = req.body;

  if (!email) {
    return res.status(400).json({ error: "Email is required" });
  }

  if (typeof activationCost !== "number" || activationCost < 0) {
    return res.status(400).json({ error: "Invalid activation cost" });
  }

  try {
    const user = await User.findOne({ email });

    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }

    user.activationCost = activationCost;

    await user.save();

    res.json({ message: "Activation cost updated for user", activationCost });
  } catch (err) {
    console.error("Error updating user activation cost:", err);
    res.status(500).json({ error: err.message || "Unknown error" });
  }
});

export default router;
