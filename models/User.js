// models/User.js
const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
  name: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  avatar: { type: String },  // Will store avatar URL
  bio: { type: String },     // Optional user bio
  height: { type: Number },  // Height in cm
  weight: { type: Number },  // Weight in kg
  dailyGoal: { type: Number, default: 10000 }, // Default daily step goal
  joinDate: { type: Date, default: Date.now },
  settings: {
    notifications: { type: Boolean, default: true },
    theme: { type: String, default: 'light' }
  },
  resetPasswordToken: String,
  resetPasswordExpires: Date,
}, { timestamps: true });

module.exports = mongoose.model('User', userSchema);