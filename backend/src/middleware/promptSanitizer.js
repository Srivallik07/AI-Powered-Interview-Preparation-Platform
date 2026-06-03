import AuditLog from '../models/AuditLog.js';

// Common prompt injection keywords/phrases
const INJECTION_PATTERNS = [
  /ignore\s+(?:all\s+)?previous\s+instructions/i,
  /system\s+override/i,
  /you\s+are\s+now\s+a/i,
  /new\s+role\s+for\s+you/i,
  /forget\s+what\s+you\s+were\s+told/i,
  /reveal\s+(?:your\s+)?system\s+(?:prompt|instructions)/i,
  /bypass\s+(?:the\s+)?safety/i,
  /override\s+(?:the\s+)?prompt/i,
  /Assistant:\s*STOP/i
];

export const sanitizePrompt = async (req, res, next) => {
  // We inspect req.body, req.query, and req.params for strings
  let hasInjection = false;
  let detectedPattern = '';

  const checkValue = (val) => {
    if (typeof val === 'string') {
      for (const pattern of INJECTION_PATTERNS) {
        if (pattern.test(val)) {
          hasInjection = true;
          detectedPattern = pattern.toString();
          return true;
        }
      }
    } else if (typeof val === 'object' && val !== null) {
      for (const key in val) {
        if (checkValue(val[key])) {
          return true;
        }
      }
    }
    return false;
  };

  checkValue(req.body);
  checkValue(req.query);

  if (hasInjection) {
    // Log the security violation to AuditLog
    try {
      await AuditLog.create({
        userId: req.user ? req.user._id : null,
        username: req.user ? req.user.username : 'guest',
        action: 'prompt_injection_blocked',
        endpoint: req.originalUrl,
        method: req.method,
        ip: req.ip || req.headers['x-forwarded-for'] || req.socket.remoteAddress || 'unknown',
        status: 'blocked',
        details: `Prompt injection attack detected: match on pattern ${detectedPattern}`
      });
    } catch (logErr) {
      console.error('Failed to write security audit log:', logErr);
    }

    return res.status(400).json({
      success: false,
      message: 'Security policy violation: Request contains disallowed text patterns (Prompt Injection Defense).'
    });
  }

  next();
};
