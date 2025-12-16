/** @format */

// routes/report.js or wherever your report route is
import express from 'express';
import authMiddleware from '../../middleware/authMiddleware.js';
import Activation from '../../models/Activation.js';

const router = express.Router();

// GET /api/reports/activations (or whatever your base path is)
router.get('/', authMiddleware(), async (req, res) => {
  try {
    // Use req.auth.role which is correctly set by your middleware
    const role = req.auth?.role;
    const userId = req.auth?.entity?._id || req.user?._id || req.admin?._id;

    if (!role || !userId) {
      return res.status(401).json({ message: 'Authentication error' });
    }

    let activations;
    let projection = {};

    if (role === 'admin') {
      // Admin sees everything
      activations = await Activation.find({})
        .populate('user', 'fullName email phone') // optional: show who activated
        .populate('activatedBy', 'fullName')
        .sort({ activationDate: -1 });
    } else if (role === 'user' || role === 'dealer') {
      // Dealer (user) sees only their own activations, limited fields
      projection = {
        sim: 1,
        zip: 1,
        transactionId: 1,
        E911ADDRESS: 1,
        activationDate: 1,
        // You can include label or plan_soc if useful
        label: 1,
        plan_soc: 1,
      };

      activations = await Activation.find({ user: userId }, projection).sort({
        activationDate: -1,
      });
    } else {
      return res.status(403).json({ message: 'Unauthorized access' });
    }

    return res.status(200).json({
      success: true,
      count: activations.length,
      data: activations,
    });
  } catch (error) {
    console.error('Error fetching activation report:', error);
    return res.status(500).json({
      success: false,
      message: 'Internal server error',
    });
  }
});

export default router;
