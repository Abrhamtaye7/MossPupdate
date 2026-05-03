const config = require('../config');
const mongoose = require('mongoose');

const UserSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    unique: true,
  },
  email: {
    type: String,
    required: true,
    unique: true,
  },
  password: {
    type: String,
    required: true,
  },
  chipsAmount: {
    type: Number,
    default: config.INITIAL_CHIPS_AMOUNT,
  },
  phone: {
    type: String,
    default: null,
  },
  avatarUrl: {
    type: String,
    default: null,
  },
  avatarPublicId: {
    type: String,
    default: null,
  },
  isPremium: {
    type: Boolean,
    default: false,
  },
  isAdmin: {
    type: Boolean,
    default: false,
  },
  isRestricted: {
    type: Boolean,
    default: false,
  },
  lastActive: {
    type: Date,
    default: Date.now,
  },
  ipLog: [
    {
      ip: String,
      at: Date,
    },
  ],
  collusionFlags: [
    {
      type: String,
    },
  ],
  type: {
    type: Number,
    default: 0,
  },
  created: {
    type: Date,
    default: Date.now,
  },
});

module.exports = User = mongoose.model('user', UserSchema);
