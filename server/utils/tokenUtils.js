// utils/tokenUtils.js
const jwt = require("jsonwebtoken");
const crypto = require("crypto");

// Set fallback secrets (only for development)
const JWT_SECRET =
  process.env.JWT_SECRET ||
  "temporary_development_secret_do_not_use_in_production";
const JWT_REFRESH_SECRET =
  process.env.JWT_REFRESH_SECRET ||
  "temporary_refresh_secret_do_not_use_in_production";

// Generate access token (short-lived)
exports.generateAccessToken = (userId) => {
  if (!JWT_SECRET) {
    throw new Error("JWT_SECRET environment variable is not set");
  }

  return jwt.sign({ id: userId }, JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRES_IN || "15m",
  });
};

// Generate refresh token (long-lived)
exports.generateRefreshToken = (userId) => {
  if (!JWT_REFRESH_SECRET) {
    throw new Error("JWT_REFRESH_SECRET environment variable is not set");
  }

  return jwt.sign({ id: userId }, JWT_REFRESH_SECRET, {
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
