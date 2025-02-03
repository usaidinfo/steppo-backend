// routes/auth.js
const router = require('express').Router();
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const User = require('../models/User');
const auth = require('../middleware/auth');
const crypto = require('crypto');

// Register User
router.post('/register', async (req, res) => {
    try {
      const { name, email, password } = req.body;
      console.log('Request body:', req.body); // Debug log
  
      let user = await User.findOne({ email });
      if (user) return res.status(400).json({ message: 'User already exists' });
  
      user = new User({ name, email, password });
      const salt = await bcrypt.genSalt(10);
      user.password = await bcrypt.hash(password, salt);
      await user.save();
  
      const payload = { user: { id: user.id } };
      const token = jwt.sign(payload, process.env.JWT_SECRET, { expiresIn: '7d' });
      res.json({ token });
    } catch (err) {
      console.error('Registration error:', err); // Error log
      res.status(500).send('Server error');
    }
  });

// Login User
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    const user = await User.findOne({ email });
    if (!user) return res.status(400).json({ message: 'Invalid credentials' });

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) return res.status(400).json({ message: 'Invalid credentials' });

    const payload = { user: { id: user.id } };
    const token = jwt.sign(payload, process.env.JWT_SECRET, { expiresIn: '7d' });
    res.json({ token });
  } catch (err) {
    res.status(500).send('Server error');
  }
});

// Get User Profile
router.get('/me', auth, async (req, res) => {
  try {
    const user = await User.findById(req.user.id).select('-password');
    res.json(user);
  } catch (err) {
    res.status(500).send('Server error');
  }
});

router.post('/forgot-password', async (req, res) => {
    try {
      const user = await User.findOne({ email: req.body.email });
      if (!user) {
        return res.status(404).json({ message: 'User not found' });
      }
  
      const resetToken = crypto.randomBytes(20).toString('hex');
      
      user.resetPasswordToken = resetToken;
      user.resetPasswordExpires = Date.now() + 3600000;
      await user.save();
  
      res.json({ 
        message: 'Password reset token generated',
        resetToken // In production, don't send this in response
      });
    } catch (err) {
      res.status(500).json({ message: 'Server error' });
    }
  });

// routes/auth.js - Update reset-password route
router.post('/reset-password/:token', async (req, res) => {
    try {
      const user = await User.findOneAndUpdate(
        {
          resetPasswordToken: req.params.token,
          resetPasswordExpires: { $gt: Date.now() }
        },
        {
          $set: { password: await bcrypt.hash(req.body.password, await bcrypt.genSalt(10)) },
          $unset: { resetPasswordToken: 1, resetPasswordExpires: 1 }
        },
        { new: true }
      ).select('-password');
  
      if (!user) return res.status(400).json({ message: 'Invalid or expired token' });
  
      res.json({ message: 'Password reset successful', user });
    } catch (err) {
      res.status(500).json({ message: 'Server error' });
    }
  });

module.exports = router;