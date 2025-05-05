// middleware/rateLimiter.js - Enhance with additional limiters
const rateLimit = require("express-rate-limit");

// General API rate limiter
exports.apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // 100 requests per IP
  standardHeaders: true,
  legacyHeaders: false,
  message: "Too many requests from this IP, please try again later",
});

// Auth endpoints rate limiter (login, register, etc.)
exports.authLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 10, // 10 attempts per IP
  standardHeaders: true,
  legacyHeaders: false,
  message: "Too many authentication attempts, please try again later",
});

// Existing like limiter
exports.likeLimiter = rateLimit({
  windowMs: 24 * 60 * 60 * 1000,
  max: 3,
  message: "Too many likes from this IP, please try again later",
  keyGenerator: (req) => {
    const ip =
      req.headers["x-forwarded-for"] ||
      req.connection.remoteAddress ||
      req.socket.remoteAddress ||
      req.ip;
    return ip + "-" + req.params.id;
  },
  standardHeaders: true,
  legacyHeaders: false,
});

// Story creation rate limiter
exports.storyCreationLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 20, // 20 stories per IP per hour
  standardHeaders: true,
  legacyHeaders: false,
  message: "Too many stories created, please try again later",
});

// Post creation rate limiter
exports.postCreationLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 10, // 10 posts per IP per hour
  standardHeaders: true,
  legacyHeaders: false,
  message: "Too many posts created, please try again later",
});
