const express = require('express');
const router = express.Router();
const User = require('../models/user.model');
const Category = require('../models/category.model');
const jwt = require('jsonwebtoken');
const { authenticate, requireSubscription } = require('../middleware/auth');
const razorpay = require('../utilities/razorpay');
const crypto = require('crypto');

// User Registration
router.post('/register', async (req, res) => {
  try {
    const { name, email, password, phone, parentCategoryId, subCategoryId } = req.body;

    // Check if user already exists
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({ message: 'User already exists with this email' });
    }

    // Validate parent category exists
    if (!parentCategoryId) {
      return res.status(400).json({ message: 'Parent category ID is required' });
    }

    const parentCategory = await Category.findById(parentCategoryId);
    if (!parentCategory) {
      return res.status(400).json({ message: 'Invalid parent category ID' });
    }

    // Validate sub category exists
    if (!subCategoryId) {
      return res.status(400).json({ message: 'Sub category ID is required' });
    }

    const subCategory = await Category.findById(subCategoryId);
    if (!subCategory) {
      return res.status(400).json({ message: 'Invalid sub category ID' });
    }

    // Validate that sub category belongs to the parent category
    if (subCategory.parentId.toString() !== parentCategoryId) {
      return res.status(400).json({ message: 'Sub category does not belong to the selected parent category' });
    }

    // Create new user
    const user = new User({ 
      name, 
      email, 
      password, 
      phone, 
      parentCategoryId, 
      subCategoryId 
    });
    await user.save();

    res.status(201).json({ message: 'User registered successfully' });
  } catch (err) {
    console.error('Registration error:', err);
    res.status(500).json({ message: 'Server error', error: err.message });
  }
});

// User Login
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;

    // Check if user exists and populate both parent and sub categories
    const user = await User.findOne({ email })
      .populate('parentCategoryId', 'name type')
      .populate('subCategoryId', 'name type');
    
    if (!user) {
      return res.status(400).json({ message: 'Invalid email or password' });
    }

    // Verify password
    const isMatch = await user.comparePassword(password);
    if (!isMatch) {
      return res.status(400).json({ message: 'Invalid email or password' });
    }

    // Increment token version to invalidate previous tokens
    user.tokenVersion += 1;
    await user.save();

    // Create JWT token with token version
    const token = jwt.sign(
      { 
        id: user._id, 
        role: user.role, 
        tokenVersion: user.tokenVersion 
      },
      process.env.JWT_SECRET,
      { expiresIn: '365d' }
    );

    // Return user info, categories, and subscription status
    res.status(200).json({
      message: 'Login successful',
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        parentCategory: {
          id: user.parentCategoryId._id,
          name: user.parentCategoryId.name,
          type: user.parentCategoryId.type
        },
        subCategory: {
          id: user.subCategoryId._id,
          name: user.subCategoryId.name,
          type: user.subCategoryId.type
        },
        subscription: {
          isActive: user.hasActiveSubscription(),
          plan: user.subscription.plan,
          endDate: user.subscription.endDate
        }
      }
    });
  } catch (err) {
    console.error('Login error:', err);
    res.status(500).json({ message: 'Server error', error: err.message });
  }
});

// User Logout - Invalidate current token
router.post('/logout', authenticate, async (req, res) => {
  try {
    const user = await User.findById(req.user.id);
    
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    // Increment token version to invalidate current token
    user.tokenVersion += 1;
    await user.save();

    res.status(200).json({ 
      message: 'Logout successful. All tokens have been invalidated.' 
    });
  } catch (err) {
    console.error('Logout error:', err);
    res.status(500).json({ message: 'Server error', error: err.message });
  }
});

// Get user profile
router.get('/profile', authenticate, async (req, res) => {
  try {
    const user = await User.findById(req.user.id)
      .populate('parentCategoryId', 'name type')
      .populate('subCategoryId', 'name type')
      .select('-password');
    
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    res.status(200).json({
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        phone: user.phone,
        parentCategory: {
          id: user.parentCategoryId._id,
          name: user.parentCategoryId.name,
          type: user.parentCategoryId.type
        },
        subCategory: {
          id: user.subCategoryId._id,
          name: user.subCategoryId.name,
          type: user.subCategoryId.type
        },
        subscription: {
          isActive: user.hasActiveSubscription(),
          plan: user.subscription.plan,
          endDate: user.subscription.endDate
        }
      }
    });
  } catch (err) {
    console.error('Profile retrieval error:', err);
    res.status(500).json({ message: 'Server error', error: err.message });
  }
});

// Create Razorpay order for subscription
router.post('/subscription/create-order', authenticate, async (req, res) => {
  try {
    const user = await User.findById(req.user.id);
    
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    // Create receipt ID
    const receiptId = 'receipt_' + Date.now();
    
    // Create Razorpay order for yearly subscription (₹499)
    const order = await razorpay.createOrder(
      razorpay.YEARLY_PLAN_AMOUNT,
      receiptId,
      { userId: user._id.toString() }
    );

    res.status(200).json({
      orderId: order.id,
      amount: order.amount,
      currency: order.currency,
      receipt: order.receipt,
      key_id: process.env.RAZORPAY_KEY_ID,
      user: {
        name: user.name,
        email: user.email,
        phone: user.phone
      }
    });
  } catch (err) {
    console.error('Order creation error:', err);
    res.status(500).json({ message: 'Server error', error: err.message });
  }
});

// Verify and capture payment after successful payment on frontend
router.post('/subscription/verify-payment', authenticate, async (req, res) => {
  try {
    const { razorpay_payment_id, razorpay_order_id, razorpay_signature } = req.body;
    
    // Verify payment signature
    const isValid = razorpay.verifyPaymentSignature(
      razorpay_payment_id, 
      razorpay_order_id, 
      razorpay_signature
    );
    
    if (!isValid) {
      return res.status(400).json({ message: 'Invalid payment signature' });
    }

    // Find the user
    const user = await User.findById(req.user.id);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    // Calculate subscription end date (1 year from now)
    const startDate = new Date();
    const endDate = new Date();
    endDate.setFullYear(endDate.getFullYear() + 1);

    // Update user subscription details
    user.subscription = {
      ...user.subscription,
      isSubscribed: true,
      plan: 'yearly',
      startDate,
      endDate,
      paymentHistory: [
        ...user.subscription.paymentHistory || [],
        {
          razorpayPaymentId: razorpay_payment_id,
          amount: razorpay.YEARLY_PLAN_AMOUNT / 100, // Convert from paisa to rupees
          status: 'success',
          date: new Date()
        }
      ]
    };

    await user.save();

    res.status(200).json({
      success: true,
      message: 'Yearly subscription activated successfully',
      subscription: {
        isActive: true,
        plan: user.subscription.plan,
        startDate: user.subscription.startDate,
        endDate: user.subscription.endDate
      }
    });
  } catch (err) {
    console.error('Payment verification error:', err);
    res.status(500).json({ message: 'Server error', error: err.message });
  }
});

// Cancel subscription
router.post('/subscription/cancel', requireSubscription, async (req, res) => {
  try {
    const user = await User.findById(req.user.id);
    
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    // If there's a razorpay subscription ID, cancel it
    if (user.subscription.razorpaySubscriptionId) {
      await razorpay.cancelSubscription(user.subscription.razorpaySubscriptionId);
    }

    // Update subscription status but keep history
    user.subscription.isSubscribed = false;
    user.subscription.endDate = new Date(); // Set end date to now

    await user.save();

    res.status(200).json({
      success: true,
      message: 'Subscription cancelled successfully'
    });
  } catch (err) {
    console.error('Subscription cancellation error:', err);
    res.status(500).json({ message: 'Server error', error: err.message });
  }
});

// Check subscription status
router.get('/subscription/status', authenticate, async (req, res) => {
  try {
    const user = await User.findById(req.user.id);
    
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    res.status(200).json({
      isSubscribed: user.subscription.isSubscribed,
      isActive: user.hasActiveSubscription(),
      plan: user.subscription.plan,
      startDate: user.subscription.startDate,
      endDate: user.subscription.endDate,
      paymentHistory: user.subscription.paymentHistory || []
    });
  } catch (err) {
    console.error('Subscription status error:', err);
    res.status(500).json({ message: 'Server error', error: err.message });
  }
});

// Get available categories for registration
router.get('/categories', async (req, res) => {
  try {
    const categories = await Category.find({ type: 'category' }).select('name type');
    
    res.status(200).json({
      categories: categories.map(cat => ({
        id: cat._id,
        name: cat.name,
        type: cat.type
      }))
    });
  } catch (err) {
    console.error('Categories retrieval error:', err);
    res.status(500).json({ message: 'Server error', error: err.message });
  }
});

module.exports = router;
