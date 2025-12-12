/** @format */

// middleware/authMiddleware.js
import jwt from 'jsonwebtoken';
import User from '../models/User.js';
import Admin from '../models/Admin.js';

const authMiddleware = (options = { requireAdmin: false }) => {
  return async (req, res, next) => {
    try {
      const authHeader = req.headers.authorization;
      if (!authHeader?.startsWith('Bearer ')) {
        return res.status(401).json({
          success: false,
          message: 'Access denied. No token provided.',
        });
      }

      const token = authHeader.split(' ')[1];

      if (!token) {
        return res.status(401).json({
          success: false,
          message: 'Access denied. Token missing.',
        });
      }

      // Verify JWT
      const decoded = jwt.verify(token, process.env.JWT_SECRET);

      let authenticatedEntity = null;

      // First try to find as Admin
      if (decoded.role === 'admin' || decoded.id) {
        authenticatedEntity = await Admin.findById(decoded.id || decoded._id);
        if (authenticatedEntity) {
          req.admin = authenticatedEntity;
          req.user = authenticatedEntity; // optional: unify under req.user too
          req.auth = { role: 'admin', entity: authenticatedEntity };
        }
      }

      // If not admin, try regular User
      if (!authenticatedEntity) {
        authenticatedEntity = await User.findById(decoded.id || decoded._id);
        if (authenticatedEntity) {
          req.user = authenticatedEntity;
          req.auth = { role: 'user', entity: authenticatedEntity };
        }
      }

      // If nothing found
      if (!authenticatedEntity) {
        return res.status(401).json({
          success: false,
          message: 'Invalid token - user/admin not found',
        });
      }

      // If route requires admin but authenticated is not admin
      if (options.requireAdmin && req.auth?.role !== 'admin') {
        return res.status(403).json({
          success: false,
          message: 'Access denied. Admin privileges required.',
        });
      }

      next();
    } catch (err) {
      console.error('Auth middleware error:', err.message);
      if (err.name === 'JsonWebTokenError') {
        return res
          .status(401)
          .json({ success: false, message: 'Invalid token' });
      }
      if (err.name === 'TokenExpiredError') {
        return res
          .status(401)
          .json({ success: false, message: 'Token expired' });
      }

      return res.status(500).json({ success: false, message: 'Server error' });
    }
  };
};

export default authMiddleware;
