const rateLimit = require('express-rate-limit');

exports.likeLimiter = rateLimit({
  windowMs: 24 * 60 * 60 * 1000, 
  max: 3, 
  message: 'Too many likes from this IP, please try again later',
  keyGenerator: (req) => {
    return req.ip + '-' + req.params.id; 
  }
});