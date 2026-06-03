import AuditLog from '../models/AuditLog.js';

export const auditLogger = (actionDescription) => {
  return async (req, res, next) => {
    const originalSend = res.send;
    let responseBody = null;

    res.send = function (body) {
      responseBody = body;
      return originalSend.apply(this, arguments);
    };

    res.on('finish', async () => {
      // We only audit write operations (POST, PUT, DELETE) or actions that explicitly request logging
      const isWriteOp = ['POST', 'PUT', 'DELETE', 'PATCH'].includes(req.method);
      if (!isWriteOp && !actionDescription) return;

      const ip = req.ip || req.headers['x-forwarded-for'] || req.socket.remoteAddress || 'unknown';
      const status = res.statusCode >= 200 && res.statusCode < 300 ? 'success' : 'failure';
      
      let details = '';
      if (res.statusCode >= 400) {
        try {
          const parsed = JSON.parse(responseBody);
          details = parsed.message || 'Error occurred';
        } catch {
          details = 'Error occurred (body not JSON)';
        }
      } else {
        details = actionDescription || `${req.method} request to ${req.originalUrl}`;
      }

      // Do not log password fields or sensitive auth bodies
      const sanitizedBody = { ...req.body };
      if (sanitizedBody.password) sanitizedBody.password = '[MASKED]';
      if (sanitizedBody.token) sanitizedBody.token = '[MASKED]';
      if (sanitizedBody.refreshToken) sanitizedBody.refreshToken = '[MASKED]';

      try {
        await AuditLog.create({
          userId: req.user ? req.user._id : null,
          username: req.user ? req.user.username : (sanitizedBody.username || sanitizedBody.email || 'guest'),
          action: actionDescription || `api_${req.method.toLowerCase()}_${req.originalUrl.split('/')[2] || 'unknown'}`,
          endpoint: req.originalUrl,
          method: req.method,
          ip,
          status,
          details: `${details} | Payload: ${JSON.stringify(sanitizedBody)}`
        });
      } catch (err) {
        console.error('Audit logger failed:', err);
      }
    });

    next();
  };
};
