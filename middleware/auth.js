// middleware/auth.js
const jwt = require('jsonwebtoken');
const User = require('../models/user.model');
const AdminUser = require('../models/admin.user.model');

// Basic authentication middleware to verify the token
const authenticate = async (req, res, next) => {
  const token = req.header('Authorization')?.replace('Bearer ', '');
  if (!token) return res.status(401).json({ message: 'No token, authorization denied' });

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    
    // Check if user exists and token version matches
    const user = await User.findById(decoded.id);
    if (!user) {
      return res.status(401).json({ message: 'User not found' });
    }

    // Check if token version matches (prevents old tokens from working)
    if (decoded.tokenVersion !== user.tokenVersion) {
      return res.status(401).json({ message: 'Token has been invalidated. Please login again.' });
    }

    req.user = decoded;
    next();
  } catch (err) {
    res.status(401).json({ message: 'Invalid token' });
  }
};

// Check if user has an active subscription
const requireSubscription = async (req, res, next) => {
  try {
    // First authenticate the user
    authenticate(req, res, async () => {
      // Find the user by ID
      const user = await User.findById(req.user.id);
      
      if (!user) {
        return res.status(404).json({ message: 'User not found' });
      }
      
      // Check if the user has an active subscription
      if (!user.subscription.isSubscribed || !user.hasActiveSubscription()) {
        return res.status(403).json({ 
          message: 'Subscription required', 
          subscriptionStatus: 'inactive',
          redirectTo: '/subscription/plans'
        });
      }
      
      // User has active subscription, proceed
      next();
    });
  } catch (err) {
    console.error('Subscription verification error:', err);
    res.status(500).json({ message: 'Server error', error: err.message });
  }
};

// Check if user is admin
const requireAdmin = async (req, res, next) => {
  try {
    // First authenticate the user
    authenticate(req, res, async () => {
      // Check if user is an admin
      const adminUser = await AdminUser.findById(req.user.id);
      
      if (!adminUser) {
        return res.status(403).json({ message: 'Admin access required' });
      }
      
      // User is admin, proceed
      next();
    });
  } catch (err) {
    console.error('Admin verification error:', err);
    res.status(500).json({ message: 'Server error', error: err.message });
  }
};

module.exports = {
  authenticate,
  requireSubscription,
  requireAdmin
};
