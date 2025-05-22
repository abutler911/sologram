// utils/logger.js
const { Logtail } = require("@logtail/node");
const { LogtailTransport } = require("@logtail/winston");
const winston = require("winston");

// Initialize Logtail with error handling
let logtail = null;
let logtailTransport = null;

if (process.env.LOGTAIL_TOKEN) {
  try {
    logtail = new Logtail(process.env.LOGTAIL_TOKEN);
    logtailTransport = new LogtailTransport(logtail);

    // Handle Logtail errors
    logtailTransport.on("error", (error) => {
      console.error("Logtail transport error:", error.message);
      // Don't crash the app, just log to console
    });

    logtail.on("error", (error) => {
      console.error("Logtail error:", error.message);
    });
  } catch (error) {
    console.error("Failed to initialize Logtail:", error.message);
    logtail = null;
    logtailTransport = null;
  }
} else {
  console.warn("LOGTAIL_TOKEN not found - logging only to console");
}

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

// Define transports - always include console
const transports = [new winston.transports.Console({ format: consoleFormat })];

// Only add Logtail transport if it was successfully initialized
if (process.env.NODE_ENV === "production" && logtailTransport) {
  transports.push(logtailTransport);
}

const logger = winston.createLogger({
  level: level(),
  format: winston.format.json(),
  transports,
  // Handle logger errors gracefully
  exceptionHandlers: [
    new winston.transports.Console({ format: consoleFormat }),
  ],
  rejectionHandlers: [
    new winston.transports.Console({ format: consoleFormat }),
  ],
});

// Safe flush function
const safeFlush = async () => {
  if (logtail) {
    try {
      await logtail.flush();
      console.log("🧹 Logtail flushed successfully.");
    } catch (error) {
      console.error("❌ Error flushing Logtail:", error.message);
    }
  }
};

module.exports = {
  logger,
  logtail: logtail || { flush: () => Promise.resolve() }, // Provide fallback
  safeFlush,
};
