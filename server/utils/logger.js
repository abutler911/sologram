// utils/logger.js
const { Logtail } = require("@logtail/node");
const { LogtailTransport } = require("@logtail/winston");
const winston = require("winston");

// Instantiate Logtail with your source token
const logtail = new Logtail(process.env.LOGTAIL_TOKEN);

// Set log level based on environment
const level = () => (process.env.NODE_ENV === "production" ? "info" : "debug");

// Console format for dev
const consoleFormat = winston.format.combine(
  winston.format.colorize({ all: true }),
  winston.format.timestamp({ format: "YYYY-MM-DD HH:mm:ss" }),
  winston.format.printf(
    ({ timestamp, level, message }) =>
      `[${timestamp}] ${level}: ${
        typeof message === "object" ? JSON.stringify(message) : message
      }`
  )
);

// Define transports
const transports = [new winston.transports.Console({ format: consoleFormat })];

// Only push to Logtail in production
if (process.env.NODE_ENV === "production") {
  transports.push(new LogtailTransport(logtail));
}

const logger = winston.createLogger({
  level: level(),
  format: winston.format.json(),
  transports,
});

module.exports = {
  logger,
  logtail,
};
