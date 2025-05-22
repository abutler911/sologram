// utils/logger.js
const { Logtail } = require("@logtail/node");
const { LogtailTransport } = require("@logtail/winston");
const winston = require("winston");

// Initialize Logtail with error handling and custom endpoint support
let logtail = null;
let logtailTransport = null;

if (process.env.LOGTAIL_TOKEN) {
  try {
    // Configure Logtail with custom endpoint if provided
    const logtailOptions = {};

    // Add custom endpoint if specified
    if (process.env.LOGTAIL_ENDPOINT) {
      logtailOptions.endpoint = process.env.LOGTAIL_ENDPOINT;
      console.log(
        `🌐 Using custom Logtail endpoint: ${process.env.LOGTAIL_ENDPOINT}`
      );
    }

    console.log("🔧 Initializing Logtail with options:", {
      hasToken: !!process.env.LOGTAIL_TOKEN,
      endpoint:
        logtailOptions.endpoint || "default (https://in.logs.betterstack.com)",
      tokenPreview: process.env.LOGTAIL_TOKEN.substring(0, 8) + "...",
    });

    // Create Logtail instance with options
    logtail = new Logtail(process.env.LOGTAIL_TOKEN, logtailOptions);
    logtailTransport = new LogtailTransport(logtail);

    // Handle Logtail transport errors
    logtailTransport.on("error", (error) => {
      console.error("❌ Logtail transport error:", error.message);
      if (error.response) {
        console.error("Response status:", error.response.status);
        console.error("Response data:", error.response.data);
      }
    });

    // Handle Logtail client errors
    if (typeof logtail.on === "function") {
      logtail.on("error", (error) => {
        console.error("❌ Logtail client error:", error.message);
      });
    }

    console.log("✅ Logtail initialized successfully");
  } catch (error) {
    console.error("❌ Failed to initialize Logtail:", error.message);
    console.error("Full error:", error);
    logtail = null;
    logtailTransport = null;
  }
} else {
  console.warn("⚠️ LOGTAIL_TOKEN not found - logging only to console");
}

// Set log level based on environment
const level = () => (process.env.NODE_ENV === "production" ? "info" : "debug");

// Console format for development and fallback
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
  console.log("📤 Logtail transport added to Winston for production");
} else if (process.env.NODE_ENV === "production") {
  console.warn("⚠️ Production mode but Logtail transport not available");
}

// Create Winston logger
const logger = winston.createLogger({
  level: level(),
  format: winston.format.json(),
  transports,
  // Handle uncaught exceptions and rejections gracefully
  exceptionHandlers: [
    new winston.transports.Console({ format: consoleFormat }),
  ],
  rejectionHandlers: [
    new winston.transports.Console({ format: consoleFormat }),
  ],
});

// Safe flush function with timeout protection
const safeFlush = async (timeoutMs = 5000) => {
  if (logtail) {
    try {
      console.log("🔄 Flushing Logtail logs...");

      // Add timeout to prevent hanging
      const flushPromise = logtail.flush();
      const timeoutPromise = new Promise((_, reject) =>
        setTimeout(() => reject(new Error("Flush timeout")), timeoutMs)
      );

      await Promise.race([flushPromise, timeoutPromise]);
      console.log("✅ Logtail flushed successfully.");
    } catch (error) {
      console.error("❌ Error flushing Logtail:", error.message);
    }
  } else {
    console.log("ℹ️ No Logtail instance to flush");
  }
};

module.exports = {
  logger,
  logtail: logtail || { flush: () => Promise.resolve() }, // Provide fallback
  safeFlush,
};
