// middleware/apiKeyAuth.js
// Validates a static API key from the X-API-Key header.
// Used for machine-to-machine calls (iOS Shortcut, scripts, etc.)

function apiKeyAuth(req, res, next) {
  const key = process.env.QUICK_THOUGHT_API_KEY;
  if (!key) {
    console.error('[apiKeyAuth] QUICK_THOUGHT_API_KEY not set');
    return res
      .status(500)
      .json({ success: false, message: 'Server misconfigured' });
  }

  const provided = req.headers['x-api-key'];
  if (!provided || provided !== key) {
    return res.status(401).json({ success: false, message: 'Unauthorized' });
  }

  next();
}

module.exports = { apiKeyAuth };
