import jwt from "jsonwebtoken";
import Admin from "../models/Admin.js";

const isAdmin = async (req, res, next) => {
  try {
    const token = req.headers.authorization?.split(" ")[1];

    if (!token) {
      return res.status(401).json({
        success: false,
        message: "Authorization token missing",
      });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    const admin = await Admin.findById(decoded.id);

    if (!admin) {
      return res.status(403).json({
        success: false,
        message: "Access denied. Not an admin.",
      });
    }

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
