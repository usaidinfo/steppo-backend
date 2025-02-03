// routes/history.js
const router = require('express').Router();
const Step = require('../models/Steps');
const auth = require('../middleware/auth');

function getWeekNumber(d) {
    const date = new Date(d);
    date.setHours(0, 0, 0, 0);
    date.setDate(date.getDate() + 4 - (date.getDay() || 7));
    const yearStart = new Date(date.getFullYear(), 0, 1);
    return Math.ceil((((date - yearStart) / 86400000) + 1) / 7);
  }

// Get weekly history
router.get('/weekly', auth, async (req, res) => {
  try {
    const weekStart = new Date();
    weekStart.setDate(weekStart.getDate() - 7);
    weekStart.setHours(0, 0, 0, 0);

    const steps = await Step.find({
      user: req.user.id,
      date: { $gte: weekStart }
    }).sort({ date: 1 });

    // Group steps by day
    const dailySteps = steps.reduce((acc, step) => {
      const date = new Date(step.date).toISOString().split('T')[0];
      acc[date] = (acc[date] || 0) + step.count;
      return acc;
    }, {});

    res.json(dailySteps);
  } catch (err) {
    res.status(500).send('Server error');
  }
});

// Get monthly history
router.get('/monthly', auth, async (req, res) => {
  try {
    const monthStart = new Date();
    monthStart.setMonth(monthStart.getMonth() - 1);
    monthStart.setHours(0, 0, 0, 0);

    const steps = await Step.find({
      user: req.user.id,
      date: { $gte: monthStart }
    }).sort({ date: 1 });

    // Group steps by day
    const dailySteps = steps.reduce((acc, step) => {
      const date = new Date(step.date).toISOString().split('T')[0];
      acc[date] = (acc[date] || 0) + step.count;
      return acc;
    }, {});

    // Calculate statistics
    const totalSteps = Object.values(dailySteps).reduce((a, b) => a + b, 0);
    const daysTracked = Object.keys(dailySteps).length;
    const averageSteps = daysTracked ? Math.round(totalSteps / daysTracked) : 0;

    res.json({
      dailySteps,
      summary: {
        totalSteps,
        daysTracked,
        averageSteps
      }
    });
  } catch (err) {
    res.status(500).send('Server error');
  }
});

// Update the trends route
router.get('/trends', auth, async (req, res) => {
    try {
      const steps = await Step.find({
        user: req.user.id
      }).sort({ date: 1 });
  
      const weeklyAverages = steps.reduce((acc, step) => {
        const weekNumber = getWeekNumber(step.date);
        if (!acc[weekNumber]) {
          acc[weekNumber] = { total: 0, count: 0 };
        }
        acc[weekNumber].total += step.count;
        acc[weekNumber].count += 1;
        return acc;
      }, {});
  
      const averages = {};
      Object.keys(weeklyAverages).forEach(week => {
        averages[week] = Math.round(weeklyAverages[week].total / weeklyAverages[week].count);
      });
  
      res.json(averages);
    } catch (err) {
      console.error(err);
      res.status(500).send('Server error');
    }
  });

// Helper function to calculate improvement percentage
function calculateImprovement(weeklyAverages) {
  const weeks = Object.keys(weeklyAverages);
  if (weeks.length < 2) return 0;

  const firstWeek = weeklyAverages[weeks[0]];
  const lastWeek = weeklyAverages[weeks[weeks.length - 1]];

  return Math.round(((lastWeek - firstWeek) / firstWeek) * 100);
}

module.exports = router;