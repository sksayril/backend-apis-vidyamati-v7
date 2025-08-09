var express = require('express');
var router = express.Router();
const AdminUser = require('../models/admin.user.model');
const jwt = require('jsonwebtoken');

/* GET users listing. */
router.post('/admin/register', async (req, res) => {
  try {
    const { email, password } = req.body;

    // Check if user already exists
    const existingUser = await AdminUser.findOne({ email });
    if (existingUser) return res.status(400).json({ message: 'User already exists' });

    // Create and save user
    const user = new AdminUser({ email, password });
    await user.save();

    res.status(201).json({ message: 'User registered successfully' });
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
});

router.post('/admin/login', async (req, res) => {
  try {
    const { email, password } = req.body;

    // Check user
    const user = await AdminUser.findOne({ email });
    if (!user) return res.status(400).json({ message: 'Invalid email or password' });

    // Check password
    const isMatch = await user.comparePassword(password);
    if (!isMatch) return res.status(400).json({ message: 'Invalid email or password' });

    // Increment token version to invalidate previous tokens
    user.tokenVersion += 1;
    await user.save();

    // Create token with proper structure
    const token = jwt.sign(
      { 
        id: user._id, 
        role: user.role, 
        tokenVersion: user.tokenVersion 
      }, 
      process.env.JWT_SECRET, 
      { expiresIn: '24h' }
    );

    res.status(200).json({ 
      message: 'Login successful', 
      token,
      user: {
        id: user._id,
        email: user.email,
        role: user.role
      }
    });
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
});

module.exports = router;
