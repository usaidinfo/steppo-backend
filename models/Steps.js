// models/Steps.js
const mongoose = require('mongoose');

const stepsSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  count: Number,
  date: { type: Date, default: Date.now }
});

module.exports = mongoose.model('Step', stepsSchema);