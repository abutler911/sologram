// server.js
const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
const morgan = require("morgan");
const helmet = require("helmet");
const path = require("path");
const { logger, logtail } = require("./utils/logger");

const mongoSanitize = require("express-mongo-sanitize");
const {
  setupAgenda,
  gracefulShutdown: agendaShutdown,
} = require("./services/storyArchiver");
const securityHeaders = require("./middleware/securityHeaders");
const errorHandler = require("./middleware/errorHandler");
const requestIdMiddleware = require("./middleware/requestId");
const AppError = require("./utils/AppError");
const cookieParser = require("cookie-parser");

// Load environment variables
require("dotenv").config();

// Check critical environment variables
const checkEnvVariables = () => {
  const requiredVars = ["JWT_SECRET", "JWT_REFRESH_SECRET", "MONGODB_URI"];

  const missing = requiredVars.filter((varName) => !process.env[varName]);

  if (missing.length > 0) {
    console.warn(
      `WARNING: Missing environment variables: ${missing.join(", ")}`
    );

    if (process.env.NODE_ENV === "production") {
      console.error(
        "Missing required environment variables in production. This is a security risk!"
      );
    } else {
      console.warn(
        "Using fallback values for development only. DO NOT use in production!"
      );

      // Set temporary development values (only for non-production)
      if (!process.env.JWT_SECRET) {
        process.env.JWT_SECRET = "temp_dev_secret_" + Date.now();
      }

      if (!process.env.JWT_REFRESH_SECRET) {
        process.env.JWT_REFRESH_SECRET = "temp_refresh_secret_" + Date.now();
      }
    }
  }
};

// Run environment variable check
checkEnvVariables();

const app = express();
const PORT = process.env.PORT || 5000;

// Global error handling for unhandled exceptions
process.on("uncaughtException", (err) => {
  console.error("UNCAUGHT EXCEPTION! 💥", err);
  setTimeout(() => process.exit(1), 1000);
});

process.on("unhandledRejection", (reason) => {
  console.error("UNHANDLED REJECTION! 💥", reason);
  setTimeout(() => process.exit(1), 1000);
});

process.on("SIGTERM", () => {
  console.log("👋 SIGTERM RECEIVED. Shutting down gracefully");
  setTimeout(() => process.exit(0), 2000);
});

// CORS options
const corsOptions = {
  origin:
    process.env.NODE_ENV === "production"
      ? [
          "https://thesologram.com",
          "https://www.thesologram.com",
          "https://sologram.onrender.com",
        ]
      : ["http://localhost:3000"],
  methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
  allowedHeaders: ["Content-Type", "Authorization"],
  credentials: true,
  maxAge: 86400,
};

// Middleware setup
// Must be set before rate limiter middleware
app.set("trust proxy", 1);

// Apply security headers early in middleware chain
securityHeaders(app);

// Add request ID for tracing
app.use(requestIdMiddleware);

// Parse cookies for auth
app.use(cookieParser());

// Standard middleware
app.use(cors(corsOptions));
app.use(express.json({ limit: "300mb" }));
app.use(express.urlencoded({ extended: true, limit: "300mb" }));
app.use(mongoSanitize());
app.use(helmet());
app.use(
  morgan("combined", {
    stream: {
      write: (message) => logger.http(message.trim()),
    },
  })
);

// Routes
const postRoutes = require("./routes/posts");
const storyRoutes = require("./routes/stories");
const authRoutes = require("./routes/auth");
const collectionRoutes = require("./routes/collections");
const archivedStoryRoutes = require("./routes/archivedStories");
const analyticsRoutes = require("./routes/analytics");
const thoughtsRoutes = require("./routes/thoughts");
const cloudinaryRoutes = require("./routes/cloudinaryRoutes");
const uploadRoutes = require("./routes/uploadRoutes");
const aiContentRoutes = require("./routes/admin/aiContent");

// Apply routes
app.use("/api/posts", postRoutes);
app.use("/api/stories", storyRoutes);
app.use("/api/auth", authRoutes);
app.use("/api/collections", collectionRoutes);
app.use("/api/archived-stories", archivedStoryRoutes);
app.use("/api/analytics", analyticsRoutes);
app.use("/api/thoughts", thoughtsRoutes);
app.use("/api/admin/cloudinary", cloudinaryRoutes);
app.use("/api/upload", uploadRoutes);
app.use("/api/admin/ai-content", aiContentRoutes);

// Logging all requests except health
app.use((req, res, next) => {
  if (!req.originalUrl.includes("/health")) {
    logger.http(`${req.method} ${req.originalUrl}`);
  }
  next();
});

// API health check
app.get("/health", (req, res) => {
  res.status(200).json({
    status: "ok",
    memory: process.memoryUsage(),
    mongodb:
      mongoose.connection.readyState === 1 ? "connected" : "disconnected",
  });
});

// Root route
app.get("/", (req, res) => {
  res.send(`🚀 SoloGram backend is live on Port: ${PORT}!`);
});

// Handle undefined routes
app.all("*", (req, res, next) => {
  next(new AppError(`Cannot find ${req.originalUrl} on this server!`, 404));
});

// Apply error handling middleware - only once
app.use(errorHandler);

// Static files for production
if (process.env.NODE_ENV === "production") {
  app.use(express.static(path.join(__dirname, "../client/build")));

  // React catch-all for non-API routes
  app.get(/^\/(?!api|health).*/, (req, res) => {
    res.sendFile(path.resolve(__dirname, "../client/build", "index.html"));
  });
}

// Server start logic
async function startServer() {
  try {
    logger.info(
      `Starting server in ${process.env.NODE_ENV || "development"} mode`
    );

    // Check environment variables
    const requiredEnv = ["MONGODB_URI", "JWT_SECRET"];
    const missing = requiredEnv.filter((key) => !process.env[key]);
    if (missing.length) {
      logger.warn(`Missing environment variables: ${missing.join(", ")}`);
    }

    // Connect to database
    const connectDB = require("./config/db");
    const dbConnected = await connectDB();
    if (!dbConnected) {
      logger.warn("MongoDB failed to connect. Server will still start.");
    }

    // Setup background jobs
    try {
      await setupAgenda();
      logger.info("Agenda initialized");
    } catch (err) {
      logger.error("Agenda failed to initialize:", err.message);
    }

    // Start server
    const server = app.listen(PORT, () => {
      logger.info(`Server listening on port ${PORT}`);
    });

    server.on("error", (err) => {
      logger.error("Server error", err.message);
    });

    // Handle graceful shutdown
    process.on("SIGINT", gracefulShutdown);
    process.on("SIGTERM", gracefulShutdown);

    async function gracefulShutdown() {
      logger.info("Graceful shutdown initiated");

      // Add timeout to force exit if shutdown hangs
      const shutdownTimeout = setTimeout(() => {
        logger.error("Shutdown timed out, forcing exit");
        process.exit(1);
      }, 10000); // 10 second timeout

      try {
        await agendaShutdown();
        await mongoose.connection.close();
        clearTimeout(shutdownTimeout);
        logger.info("Shutdown complete");
        process.exit(0);
      } catch (err) {
        clearTimeout(shutdownTimeout);
        logger.error("Shutdown error", err.message);
        process.exit(1);
      }
    }
  } catch (err) {
    logger.error("Server startup failed", err.message);
    setTimeout(() => process.exit(1), 2000);
  }
}
logger.info("🔥 Hello from SoloGram in production!");
logger.info(`🚀 LOGTAIL_TOKEN present: ${!!process.env.LOGTAIL_TOKEN}`);
logger.info("✅ Logtail is working and flushing enabled.");

// Start the server
startServer();

// Replace this section at the bottom of server.js
process.on("beforeExit", async () => {
  const { safeFlush } = require("./utils/logger");
  await safeFlush();
});
