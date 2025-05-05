// utils/tokenUtils.js
const jwt = require("jsonwebtoken");
const crypto = require("crypto");

// Generate access token (short-lived)
exports.generateAccessToken = (userId) => {
  return jwt.sign({ id: userId }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRES_IN || "15m",
  });
};

// Generate refresh token (long-lived)
exports.generateRefreshToken = (userId) => {
  return jwt.sign({ id: userId }, process.env.JWT_REFRESH_SECRET, {
    expiresIn: process.env.JWT_REFRESH_EXPIRES_IN || "7d",
  });
};

// Calculate token expiry date
exports.getRefreshTokenExpiryDate = () => {
  const expiresIn = process.env.JWT_REFRESH_EXPIRES_IN || "7d";
  const milliseconds = expiresIn.endsWith("d")
    ? parseInt(expiresIn) * 24 * 60 * 60 * 1000
    : expiresIn.endsWith("h")
    ? parseInt(expiresIn) * 60 * 60 * 1000
    : expiresIn.endsWith("m")
    ? parseInt(expiresIn) * 60 * 1000
    : parseInt(expiresIn) * 1000;

  return new Date(Date.now() + milliseconds);
};

// Parse JWT without verification (to get payload)
exports.parseJwt = (token) => {
  try {
    return JSON.parse(Buffer.from(token.split(".")[1], "base64").toString());
  } catch (err) {
    return null;
  }
};

// Generate secure random token
exports.generateRandomToken = () => {
  return crypto.randomBytes(32).toString("hex");
};
