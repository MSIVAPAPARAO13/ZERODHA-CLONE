const { UserModel } = require('../models/UserModel');
const { HoldingsModel } = require('../models/HoldingsModel');
const { WatchlistModel } = require('../models/WatchlistModel');
const demoService = require('../services/demoService');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

const generateToken = (userId) => {
  return jwt.sign({ userId }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRES_IN || '1d',
  });
};

const registerUser = async (req, res, next) => {
  try {
    let { name, email, password } = req.body;

    if (!name || !email || !password) {
      return res.status(400).json({ success: false, data: null, error: { message: 'Please provide all required fields' }});
    }

    email = email.toLowerCase();

    const existingUser = await UserModel.findOne({ email });
    if (existingUser) {
      return res.status(409).json({ success: false, data: null, error: { message: 'User already exists' }});
    }

    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    const user = await UserModel.create({
      name,
      email,
      password: hashedPassword,
      virtualBalance: 150000
    });

    // Auto-seed starter portfolio and market data for realistic experience
    try {
      await demoService.seedUserData(user._id);
    } catch (seedErr) {
      console.error("Auto-seed error on registration:", seedErr);
    }

    const token = generateToken(user._id);

    res.status(201).json({
      success: true,
      data: {
        user: { id: user._id, name: user.name, email: user.email },
        token
      },
      error: null
    });
  } catch (err) {
    next(err);
  }
};

const loginUser = async (req, res, next) => {
  try {
    let { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ success: false, data: null, error: { message: 'Please provide email and password' }});
    }

    email = email.toLowerCase();

    const user = await UserModel.findOne({ email });
    if (!user) {
      return res.status(401).json({ success: false, data: null, error: { message: 'Invalid credentials' }});
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(401).json({ success: false, data: null, error: { message: 'Invalid credentials' }});
    }

    // If existing user has 0 holdings and 0 watchlist items, auto-seed starter data
    try {
      const [hCount, wCount] = await Promise.all([
        HoldingsModel.countDocuments({ user: user._id }),
        WatchlistModel.countDocuments({ user: user._id })
      ]);
      if (hCount === 0 && wCount === 0) {
        await demoService.seedUserData(user._id);
      }
    } catch (seedCheckErr) {
      console.error("Seed check on login error:", seedCheckErr);
    }

    const token = generateToken(user._id);

    res.json({
      success: true,
      data: {
        user: { id: user._id, name: user.name, email: user.email },
        token
      },
      error: null
    });
  } catch (err) {
    next(err);
  }
};

module.exports = { registerUser, loginUser };
