// middleware/auth.js
const jwt = require("jsonwebtoken");
const User = require("../models/User");
const AppError = require("../utils/AppError");

exports.protect = async (req, res, next) => {
  try {
    let token;

    // Get token from Authorization header
    if (
      req.headers.authorization &&
      req.headers.authorization.startsWith("Bearer")
    ) {
      token = req.headers.authorization.split(" ")[1];
    }

    if (!token) {
      return next(new AppError("Not authorized to access this resource", 401));
    }

    // Verify token
    let decoded;
    try {
      decoded = jwt.verify(token, process.env.JWT_SECRET);
    } catch (err) {
      if (err.name === "TokenExpiredError") {
        return next(new AppError("Token expired. Please log in again.", 401));
      }
      return next(new AppError("Invalid token. Please log in again.", 401));
    }

    // Check if user still exists
    const user = await User.findById(decoded.id);

    if (!user) {
      return next(new AppError("User no longer exists", 401));
    }

    // Check if user changed password after token was issued
    if (user.changedPasswordAfter && user.changedPasswordAfter(decoded.iat)) {
      return next(
        new AppError("Password recently changed. Please log in again.", 401)
      );
    }

    // Add user to request
    req.user = user;
    next();
  } catch (err) {
    next(err);
  }
};

exports.authorize = (roles) => {
  return (req, res, next) => {
    // Convert roles to array if it's a string or rest parameters
    const roleArray = Array.isArray(roles) ? roles : [roles];

    if (!req.user) {
      return next(new AppError("Not authenticated", 401));
    }

    if (!roleArray.includes(req.user.role)) {
      return next(
        new AppError(
          `User role ${req.user.role} is not authorized to access this resource`,
          403
        )
      );
    }

    next();
  };
};
