// routes/steps.js
const router = require('express').Router();
const Step = require('../models/Steps');
const auth = require('../middleware/auth');
const User = require('../models/User'); // Add this
const mongoose = require('mongoose');

router.get('/test', (req, res) => res.send('Test route'));

// Update or create steps for today
router.post('/', auth, async (req, res) => {
  try {
    const { count } = req.body;
    
    // Get start of today
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    let steps = await Step.findOne({
      user: req.user.id,
      date: {
        $gte: today,
        $lt: new Date(today.getTime() + 24 * 60 * 60 * 1000)
      }
    });

    if (steps) {
      steps.count = count;
      await steps.save();
    } else {
      steps = new Step({
        user: req.user.id,
        count: count,
        date: today
      });
      await steps.save();
    }

    const user = await User.findById(req.user.id);
    
    let notification = null;
    if (count >= user.dailyGoal) {
      notification = {
        type: 'GOAL_COMPLETED',
        message: `Congratulations! You've reached your daily goal of ${user.dailyGoal} steps!`,
        achievement: 'Daily Goal Reached'
      };
    }

    res.json({ steps, notification });
  } catch (err) {
    console.error('Error:', err);
    res.status(500).send('Server error');
  }
});

// Get today's steps
router.get('/today', auth, async (req, res) => {
  try {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    const steps = await Step.findOne({
      user: req.user.id,
      date: { $gte: today }
    });
    res.json(steps || { count: 0 });
  } catch (err) {
    res.status(500).send('Server error');
  }
});

router.get('/weekly', auth, async (req, res) => {
    try {
      const weekStart = new Date();
      weekStart.setDate(weekStart.getDate() - 7);
      weekStart.setHours(0, 0, 0, 0);
  
      const steps = await Step.find({
        user: req.user.id,
        date: { $gte: weekStart }
      }).sort({ date: 1 });
  
      res.json(steps);
    } catch (err) {
      res.status(500).send('Server error');
    }
  });

  router.delete('/history', auth, async (req, res) => {
    try {
      const { startDate, endDate } = req.body;
      
      const query = { user: req.user.id };
      if (startDate && endDate) {
        query.date = { $gte: new Date(startDate), $lte: new Date(endDate) };
      }
  
      const result = await Step.deleteMany(query);
      res.json({ 
        message: 'Steps history deleted',
        deletedCount: result.deletedCount 
      });
    } catch (err) {
      res.status(500).send('Server error');
    }
  });
  

module.exports = router;