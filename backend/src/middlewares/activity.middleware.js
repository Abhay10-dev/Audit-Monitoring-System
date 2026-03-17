const { logActivity } = require('../services/activity.service');

/**
 * Express middleware to automatically log authenticated core API requests
 */
const captureApiActivity = (activityType = 'api_call', description = 'Automated API captured event') => {
  return async (req, res, next) => {
    // We attach this to the res 'finish' event to only log completed requests
    // and grab the final status code
    res.on('finish', () => {
      if (req.user && req.user.id) {
        logActivity({
          userId: req.user.id,
          // We look for sessionId manually if it was passed, though standard requests might not have it attached
          sessionId: req.body?.sessionId || req.query?.sessionId || null,
          activityType,
          description: `${description} [${req.method} ${req.originalUrl}]`,
          ipAddress: req.ip || req.connection.remoteAddress,
          deviceInfo: req.headers['user-agent'],
          metadata: {
            method: req.method,
            endpoint: req.originalUrl,
            params: req.params,
            statusCode: res.statusCode,
          }
        });
      }
    });

    next();
  };
};

module.exports = { captureApiActivity };
