const rateLimit = require("express-rate-limit");

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
