// middleware/rateLimiter.js - Enhance with additional limiters
const rateLimit = require("express-rate-limit");

const getClientIP = (req) => {
  return (
    req.ip ||
    (req.headers["x-forwarded-for"] || "").split(",")[0].trim() ||
    req.connection.remoteAddress ||
    req.socket.remoteAddress
  );
};

// General API rate limiter
exports.apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // 100 requests per IP
  standardHeaders: true,
  legacyHeaders: false,
  message: "Too many requests from this IP, please try again later",
  keyGenerator: getClientIP,
});

// Auth endpoints rate limiter (login, register, etc.)
exports.authLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 10, // 10 attempts per IP
  standardHeaders: true,
  legacyHeaders: false,
  message: "Too many authentication attempts, please try again later",
  keyGenerator: getClientIP,
});

// Existing like limiter - update to use the helper function
exports.likeLimiter = rateLimit({
  windowMs: 24 * 60 * 60 * 1000,
  max: 3,
  message: "Too many likes from this IP, please try again later",
  keyGenerator: (req) => {
    const ip = getClientIP(req);
    return `${ip}-${req.params.id}`;
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
