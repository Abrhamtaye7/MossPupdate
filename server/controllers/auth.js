const bcrypt = require('bcryptjs');
const { validationResult } = require('express-validator');
const jwt = require('jsonwebtoken');
const config = require('../config');

const User = require('../models/User');

// @route   GET api/auth
// @desc    Get user by token
// @access  Private
exports.getCurrentUser = async (req, res) => {
  try {
    const user = await User.findById(req.user.id).select('-password');
    if (user) {
      user.lastActive = new Date();
      await user.save();
    }
    return res.status(200).json(user);
  } catch (err) {
    console.error(err.message);
    return res.status(500).send('Internal server error');
  }
};

// @route   POST api/auth
// @desc    Authenticate user & get token
// @access  Public
exports.login = async (req, res) => {
  const errors = validationResult(req);

  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }

  const { email, password } = req.body;

  try {
    let user = await User.findOne({ email });

    if (!user) {
      return res.status(400).json({ errors: [{ msg: 'Invalid credentials' }] });
    }

    const isMatch = await bcrypt.compare(password, user.password);

    if (!isMatch) {
      return res.status(400).json({ errors: [{ msg: 'Invalid credentials' }] });
    }

    const loginEntry = { ip: req.ip, at: new Date() };
    user.ipLog = Array.isArray(user.ipLog) ? user.ipLog : [];
    user.ipLog.push(loginEntry);
    if (user.ipLog.length > 50) {
      user.ipLog.shift();
    }
    user.lastActive = new Date();
    await user.save();

    const payload = {
      user: {
        id: user.id,
      },
    };

    jwt.sign(
      payload,
      config.JWT_SECRET,
      { expiresIn: config.JWT_TOKEN_EXPIRES_IN },
      (err, token) => {
        if (err) throw err;
        res.json({ token });
      },
    );
  } catch (err) {
    console.error(err.message);
    res.status(500).json({ msg: 'Internal server error' });
  }
};
