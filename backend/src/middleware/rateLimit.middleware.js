import rateLimit from 'express-rate-limit';
import AuditLog from '../models/AuditLog.js';

const logRateLimitExceeded = async (req, type) => {
  try {
    await AuditLog.create({
      userId: req.user ? req.user._id : null,
      username: req.user ? req.user.username : 'guest',
      action: 'rate_limit_exceeded',
      endpoint: req.originalUrl,
      method: req.method,
      ip: req.ip || req.headers['x-forwarded-for'] || req.socket.remoteAddress || 'unknown',
      status: 'blocked',
      details: `Rate limit exceeded for type: ${type}`
    });
  } catch (err) {
    console.error('Failed to log rate limit violation:', err);
  }
};

// General API requests limit
export const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // Limit each IP to 100 requests per window
  standardHeaders: true,
  legacyHeaders: false,
  keyGenerator: (req) => {
    return req.ip || req.headers['x-forwarded-for'] || req.socket.remoteAddress || 'unknown';
  },
  message: {
    success: false,
    message: 'Too many requests from this IP, please try again after 15 minutes.'
  },
  handler: (req, res, next, options) => {
    logRateLimitExceeded(req, 'general');
    res.status(options.statusCode).send(options.message);
  }
});

// Authentication routes limit (prevents brute forcing)
export const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 15, // Limit each IP to 15 login/register attempts per 15 minutes
  standardHeaders: true,
  legacyHeaders: false,
  keyGenerator: (req) => {
    return req.ip || req.headers['x-forwarded-for'] || req.socket.remoteAddress || 'unknown';
  },
  message: {
    success: false,
    message: 'Too many authentication attempts. Please try again after 15 minutes.'
  },
  handler: (req, res, next, options) => {
    logRateLimitExceeded(req, 'auth');
    res.status(options.statusCode).send(options.message);
  }
});

// AI/LLM request limit (prevents excessive costs)
export const aiLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 30, // Limit each user/IP to 30 LLM requests per hour
  standardHeaders: true,
  legacyHeaders: false,
  keyGenerator: (req) => {
    // Limit by user ID if logged in, otherwise by IP
    return req.user ? req.user._id.toString() : (req.ip || req.headers['x-forwarded-for'] || 'unknown');
  },
  message: {
    success: false,
    message: 'AI generation limit reached for this hour. Please try again later to prevent billing abuse.'
  },
  handler: (req, res, next, options) => {
    logRateLimitExceeded(req, 'ai_limit');
    res.status(options.statusCode).send(options.message);
  }
});
