import jwt from "jsonwebtoken";
import Admin from "../models/Admin.js";

const isAdmin = async (req, res, next) => {
  try {
    // Get token from Authorization header: "Bearer <token>"
    const token = req.headers.authorization?.split(" ")[1];

    if (!token) {
      return res.status(401).json({
        success: false,
        message: "Authorization token missing",
      });
    }

    // ✅ Decode token using JWT secret
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    // ✅ Find admin using the ID from the token payload
    const admin = await Admin.findById(decoded.id);

    if (!admin) {
      return res.status(403).json({
        success: false,
        message: "Access denied. Not an admin.",
      });
    }

    // Attach admin info to the request (optional)
    req.admin = admin;
    next();
  } catch (err) {
    console.error("🔐 Admin middleware error:", err.message);
    return res.status(401).json({
      success: false,
      message: "Invalid or expired token",
    });
  }
};

export default isAdmin;
