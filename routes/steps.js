// routes/steps.js
const router = require('express').Router();
const Step = require('../models/Steps');
const auth = require('../middleware/auth');

router.get('/test', (req, res) => res.send('Test route'));

// Post steps
router.post('/', auth, async (req, res) => {
  try {
    const steps = new Step({
      user: req.user.id,
      count: req.body.count
    });
    await steps.save();
    res.json(steps);
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

  router.post('/', auth, async (req, res) => {
    try {
      const { count } = req.body;
      const steps = new Step({
        user: req.user.id,
        count
      });
      await steps.save();
  
      // Check daily goal completion
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      
      const dailySteps = await Step.aggregate([
        {
          $match: {
            user: new mongoose.Types.ObjectId(req.user.id),
            date: { $gte: today }
          }
        },
        {
          $group: {
            _id: null,
            total: { $sum: "$count" }
          }
        }
      ]);
  
      const user = await User.findById(req.user.id);
      const totalSteps = dailySteps[0]?.total || 0;
  
      let notification = null;
      if (totalSteps >= user.dailyGoal) {
        notification = {
          type: 'GOAL_COMPLETED',
          message: `Congratulations! You've reached your daily goal of ${user.dailyGoal} steps!`,
          achievement: 'Daily Goal Reached'
        };
      }
  
      res.json({ steps, notification });
    } catch (err) {
      res.status(500).send('Server error');
    }
  });
  

module.exports = router;