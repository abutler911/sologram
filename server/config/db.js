// server/config/db.js
const mongoose = require("mongoose");
const winston = require("winston");

// Use the existing logger or create a new one
const logger = winston.createLogger({
  level: "info",
  format: winston.format.json(),
  transports: [
    new winston.transports.File({ filename: "error.log", level: "error" }),
    new winston.transports.File({ filename: "combined.log" }),
  ],
});

// Add console transport for direct output
if (process.env.NODE_ENV !== "production") {
  logger.add(
    new winston.transports.Console({
      format: winston.format.simple(),
    })
  );
}

const connectDB = async () => {
  const mongoURI =
    process.env.MONGODB_URI || "mongodb://localhost:27017/sologram";

  logger.info(
    `Attempting to connect to MongoDB at ${mongoURI.replace(
      /\/\/([^:]+):[^@]+@/,
      "//***:***@"
    )}`
  );

  // Handle options based on mongoose version
  const options = {
    serverSelectionTimeoutMS: 30000, // 30 seconds
    socketTimeoutMS: 45000, // 45 seconds
    connectTimeoutMS: 30000, // 30 seconds
    // Family 4 = prefer IPv4
    family: 4,
  };

  try {
    const connection = await mongoose.connect(mongoURI, options);

    logger.info(`MongoDB Connected: ${connection.connection.host}`);

    // Set up connection event listeners
    mongoose.connection.on("error", (err) => {
      logger.error(`MongoDB connection error: ${err.message}`);
    });

    mongoose.connection.on("disconnected", () => {
      logger.warn("MongoDB disconnected, attempting to reconnect...");
    });

    mongoose.connection.on("reconnected", () => {
      logger.info("MongoDB reconnected successfully");
    });

    return true;
  } catch (error) {
    logger.error(`MongoDB connection error: ${error.message}`);

    // Log detailed error info
    if (error.name === "MongoServerSelectionError") {
      logger.error("Failed to select a MongoDB server", {
        error: error.message,
        reason: error.reason,
      });
    }

    // Don't exit the process, just return false to indicate failure
    // The caller can decide what to do
    return false;
  }
};

module.exports = connectDB;
