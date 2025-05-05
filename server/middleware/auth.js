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
      return res.status(401).json({
        success: false,
        message: "Not authorized to access this resource",
      });
    }

    // Verify token
    let decoded;
    try {
      if (!process.env.JWT_SECRET) {
        throw new Error("JWT_SECRET environment variable is not set");
      }

      decoded = jwt.verify(token, process.env.JWT_SECRET);
    } catch (err) {
      console.error("JWT verification error:", err.message);

      if (err.name === "TokenExpiredError") {
        return res.status(401).json({
          success: false,
          message: "Token expired. Please log in again.",
        });
      }

      return res.status(401).json({
        success: false,
        message: "Invalid token. Please log in again.",
      });
    }

    // Check if user still exists
    const user = await User.findById(decoded.id);

    if (!user) {
      return res.status(401).json({
        success: false,
        message: "User no longer exists",
      });
    }

    // Add user to request
    req.user = user;
    next();
  } catch (err) {
    console.error("Auth middleware error:", err);
    res.status(500).json({
      success: false,
      message: "Authentication error",
    });
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
