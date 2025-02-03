// routes/profile.js
const router = require('express').Router();
const User = require('../models/User');
const Step = require('../models/Steps');
const auth = require('../middleware/auth');
const mongoose = require('mongoose'); // Add at top
const cloudinary = require('cloudinary').v2;
const { check, validationResult } = require('express-validator');

cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET
  });

  
  // Update profile details
  router.put('/update', auth, [
    check('name', 'Name is required').optional().not().isEmpty(),
    check('height', 'Height must be a number').optional().isNumeric(),
    check('weight', 'Weight must be a number').optional().isNumeric(),
    check('dailyGoal', 'Daily goal must be a number').optional().isNumeric(),
  ], async (req, res) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
      }
  
      const updateFields = {};
      const allowedFields = ['name', 'bio', 'height', 'weight', 'dailyGoal', 'settings'];
      
      allowedFields.forEach(field => {
        if (req.body[field] !== undefined) {
          updateFields[field] = req.body[field];
        }
      });
  
      const user = await User.findByIdAndUpdate(
        req.user.id,
        { $set: updateFields },
        { new: true }
      ).select('-password');
  
      res.json(user);
    } catch (err) {
      console.error(err);
      res.status(500).send('Server error');
    }
  });
  
  // Upload avatar
  router.post('/avatar', auth, async (req, res) => {
    try {
      const { base64Image } = req.body;
      if (!base64Image) {
        return res.status(400).json({ msg: 'Please provide an image' });
      }
  
      const result = await cloudinary.uploader.upload(base64Image);
      const user = await User.findByIdAndUpdate(
        req.user.id,
        { avatar: result.secure_url },
        { new: true }
      ).select('-password');
  
      res.json(user);
    } catch (err) {
      console.error(err);
      res.status(500).send('Server error');
    }
  });
  
  // Get full profile
  router.get('/me', auth, async (req, res) => {
    try {
      const user = await User.findById(req.user.id)
        .select('-password')
        .lean();
  
      if (!user) {
        return res.status(404).json({ msg: 'User not found' });
      }
  
      res.json(user);
    } catch (err) {
      console.error(err);
      res.status(500).send('Server error');
    }
  });

// Get user stats
router.get('/stats', auth, async (req, res) => {
    try {
      const steps = await Step.find({ user: req.user.id });
      const totalSteps = steps.reduce((sum, step) => sum + step.count, 0);
      const averageSteps = steps.length ? Math.round(totalSteps / steps.length) : 0;
  
      res.json({
        totalSteps,
        averageSteps,
        totalDays: steps.length
      });
    } catch (err) {
      res.status(500).send('Server error');
    }
  });



module.exports = router;
