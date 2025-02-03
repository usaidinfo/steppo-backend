// models/Goal.js
const mongoose = require('mongoose');
const GoalSchema = mongoose.Schema({
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true
    },
    type: { type: String, enum: ['daily', 'weekly'], required: true },
    targetSteps: { type: Number, required: true },
    startDate: { type: Date, default: Date.now },
    isActive: { type: Boolean, default: true },
    weekStart: { type: Date } // For weekly goals
  });

module.exports = mongoose.model('Goal', GoalSchema);