import express from 'express';
import jwt from 'jsonwebtoken';
import User from '../models/User.js';
import { validateRegister, validateLogin } from '../middleware/inputValidation.js';
import { protect } from '../middleware/auth.middleware.js';
import { auditLogger } from '../middleware/auditLogger.js';
import { authLimiter } from '../middleware/rateLimit.middleware.js';

const router = express.Router();

const generateTokens = (userId) => {
  const secret = process.env.JWT_SECRET || 'supersecretjwtkeyforinterviewprepplatform12345!';
  const accessToken = jwt.sign({ id: userId }, secret, { expiresIn: '7d' });
  const refreshToken = jwt.sign({ id: userId }, secret, { expiresIn: '7d' });
  return { accessToken, refreshToken };
};

// @route   POST /api/auth/register
// @desc    Register a new user
// @access  Public
router.post(
  '/register',
  authLimiter,
  validateRegister,
  auditLogger('User Registration'),
  async (req, res) => {
    const { username, email, password, role } = req.body;
    try {
      let userExists = await User.findOne({ $or: [{ email }, { username }] });
      if (userExists) {
        return res.status(400).json({ success: false, message: 'Username or Email already registered' });
      }

      const user = await User.create({
        username,
        email,
        password,
        role: role || 'user'
      });

      const { accessToken, refreshToken } = generateTokens(user._id);

      res.status(201).json({
        success: true,
        message: 'Registration successful',
        accessToken,
        refreshToken,
        user: {
          id: user._id,
          username: user.username,
          email: user.email,
          role: user.role
        }
      });
    } catch (error) {
      console.error('Registration Error:', error);
      res.status(500).json({ success: false, message: 'Server error during registration' });
    }
  }
);

// @route   POST /api/auth/login
// @desc    Login user & get token
// @access  Public
router.post(
  '/login',
  authLimiter,
  validateLogin,
  auditLogger('User Login'),
  async (req, res) => {
    const { email, password } = req.body;
    try {
      const user = await User.findOne({ email });
      if (!user) {
        return res.status(400).json({ success: false, message: 'Invalid email or password' });
      }

      const isMatch = await user.comparePassword(password);
      if (!isMatch) {
        return res.status(400).json({ success: false, message: 'Invalid email or password' });
      }

      const { accessToken, refreshToken } = generateTokens(user._id);

      res.json({
        success: true,
        message: 'Login successful',
        accessToken,
        refreshToken,
        user: {
          id: user._id,
          username: user.username,
          email: user.email,
          role: user.role
        }
      });
    } catch (error) {
      console.error('Login Error:', error);
      res.status(500).json({ success: false, message: 'Server error during login' });
    }
  }
);

// @route   GET /api/auth/me
// @desc    Get current user profile
// @access  Private
router.get('/me', protect, async (req, res) => {
  res.json({
    success: true,
    user: {
      id: req.user._id,
      username: req.user.username,
      email: req.user.email,
      role: req.user.role
    }
  });
});

export default router;
