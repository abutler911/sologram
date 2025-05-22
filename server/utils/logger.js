// server/utils/logger.js
const winston = require("winston");
const path = require("path");

// Custom log levels
const levels = {
  error: 0,
  warn: 1,
  info: 2,
  http: 3,
  debug: 4,
};

// Level logic based on environment
const level = () => (process.env.NODE_ENV === "production" ? "info" : "debug");

// Console format (pretty + colorized for dev)
const consoleFormat = winston.format.combine(
  winston.format.colorize({ all: true }),
  winston.format.timestamp({ format: "YYYY-MM-DD HH:mm:ss" }),
  winston.format.printf(
    ({ level, message, timestamp }) =>
      `[${timestamp}] ${level}: ${
        typeof message === "object" ? JSON.stringify(message) : message
      }`
  )
);

// File format (structured JSON)
const fileFormat = winston.format.combine(
  winston.format.timestamp(),
  winston.format.errors({ stack: true }),
  winston.format.json()
);

// Transport definitions
const transports = [
  new winston.transports.Console({
    format: consoleFormat,
  }),
  new winston.transports.File({
    filename: path.join(__dirname, "../logs/error.log"),
    level: "error",
    format: fileFormat,
  }),
  new winston.transports.File({
    filename: path.join(__dirname, "../logs/combined.log"),
    format: fileFormat,
  }),
  new winston.transports.File({
    filename: path.join(__dirname, "../logs/notifications.log"),
    level: "info",
    format: fileFormat,
  }),
];

// Main logger instance
const logger = winston.createLogger({
  level: level(),
  levels,
  defaultMeta: { service: "sologram-backend" },
  transports,
});

module.exports = logger;
