// routes/goals.js
const router = require('express').Router();
const Goal = require('../models/Goal');
const auth = require('../middleware/auth');
const Step = require('../models/Steps');

// Create goal
router.post('/', auth, async (req, res) => {
  try {
    const { type, targetSteps } = req.body;
    const goal = new Goal({
      user: req.user.id,
      type,
      targetSteps
    });
    await goal.save();
    res.json(goal);
  } catch (err) {
    res.status(500).send('Server error');
  }
});

// Get active goals
router.get('/', auth, async (req, res) => {
  try {
    const goals = await Goal.find({ 
      user: req.user.id,
      isActive: true 
    });
    res.json(goals);
  } catch (err) {
    res.status(500).send('Server error');
  }
});

router.get('/progress', auth, async (req, res) => {
    try {
      const activeGoals = await Goal.find({ 
        user: req.user.id,
        isActive: true 
      });
  
      const today = new Date();
      today.setHours(0, 0, 0, 0);
  
      const todaySteps = await Step.findOne({
        user: req.user.id,
        date: { $gte: today }
      });
  
      const progress = activeGoals.map(goal => ({
        goal,
        currentSteps: todaySteps ? todaySteps.count : 0,
        percentage: todaySteps ? Math.min((todaySteps.count / goal.targetSteps) * 100, 100) : 0
      }));
  
      res.json(progress);
    } catch (err) {
      res.status(500).send('Server error');
    }
  });

  router.put('/:id', auth, async (req, res) => {
    try {
      const { targetSteps, isActive } = req.body;
      const goal = await Goal.findOneAndUpdate(
        { _id: req.params.id, user: req.user.id },
        { targetSteps, isActive },
        { new: true }
      );
      res.json(goal);
    } catch (err) {
      res.status(500).send('Server error');
    }
  });
  

  router.get('/weekly-progress', auth, async (req, res) => {
    try {
      const weekStart = new Date();
      weekStart.setDate(weekStart.getDate() - weekStart.getDay());
      weekStart.setHours(0, 0, 0, 0);
  
      const weeklySteps = await Step.find({
        user: req.user.id,
        date: { $gte: weekStart }
      });
  
      const weeklyGoal = await Goal.findOne({
        user: req.user.id,
        type: 'weekly',
        isActive: true
      });
  
      const totalSteps = weeklySteps.reduce((sum, step) => sum + step.count, 0);
      const percentage = weeklyGoal ? (totalSteps / weeklyGoal.targetSteps * 100) : 0;
  
      res.json({
        weeklyGoal,
        currentSteps: totalSteps,
        percentage: Math.round(percentage * 100) / 100
      });
    } catch (err) {
      console.error('Error:', err);
      res.status(500).send('Server error');
    }
  });

module.exports = router;