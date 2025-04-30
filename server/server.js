const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
const morgan = require("morgan");
const helmet = require("helmet");
const path = require("path");
const winston = require("winston");
const mongoSanitize = require("express-mongo-sanitize");
const {
  setupAgenda,
  gracefulShutdown: agendaShutdown,
} = require("./services/storyArchiver");

require("dotenv").config();

const app = express();
const PORT = process.env.PORT || 5000;
const Post = require("./models/Post");

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

// Logger setup
const logger = winston.createLogger({
  level: "info",
  format: winston.format.json(),
  transports: [
    new winston.transports.File({ filename: "error.log", level: "error" }),
    new winston.transports.File({ filename: "combined.log" }),
  ],
});

if (process.env.NODE_ENV !== "production") {
  logger.add(
    new winston.transports.Console({
      format: winston.format.combine(
        winston.format.colorize(),
        winston.format.simple()
      ),
    })
  );
}

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

// Middleware
app.use(cors(corsOptions));
app.use(express.json({ limit: "300mb" }));
app.use(express.urlencoded({ extended: true, limit: "300mb" }));
app.use(mongoSanitize());
app.use(helmet());
app.use(morgan("dev"));

// Routes
const postRoutes = require("./routes/posts");
const storyRoutes = require("./routes/stories");
const authRoutes = require("./routes/auth");
const collectionRoutes = require("./routes/collections");
const archivedStoryRoutes = require("./routes/archivedStories");
const analyticsRoutes = require("./routes/analytics");
const thoughtsRoutes = require("./routes/thoughts");
const cloudinaryRoutes = require("./routes/cloudinaryRoutes");

app.use("/api/posts", postRoutes);
app.use("/api/stories", storyRoutes);
app.use("/api/auth", authRoutes);
app.use("/api/collections", collectionRoutes);
app.use("/api/archived-stories", archivedStoryRoutes);
app.use("/api/analytics", analyticsRoutes);
app.use("/api/thoughts", thoughtsRoutes);
app.use("/api/admin/cloudinary", cloudinaryRoutes);

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
  res.send("🚀 SoloGram backend is live!");
});

// Global error handler
const globalErrorHandler = (err, req, res, next) => {
  logger.error({
    message: "Server error",
    url: req.originalUrl,
    method: req.method,
    error: err.message,
    stack: process.env.NODE_ENV === "development" ? err.stack : undefined,
  });

  res.status(500).json({
    success: false,
    message: "Server error",
    error: process.env.NODE_ENV === "development" ? err.message : undefined,
  });
};
app.use(globalErrorHandler);

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

    const requiredEnv = ["MONGODB_URI", "JWT_SECRET"];
    const missing = requiredEnv.filter((key) => !process.env[key]);
    if (missing.length) {
      logger.warn(`Missing environment variables: ${missing.join(", ")}`);
    }

    const connectDB = require("./config/db");
    const dbConnected = await connectDB();
    if (!dbConnected) {
      logger.warn("MongoDB failed to connect. Server will still start.");
    }

    try {
      await setupAgenda();
      logger.info("Agenda initialized");
    } catch (err) {
      logger.error("Agenda failed to initialize:", err.message);
    }

    const server = app.listen(PORT, () => {
      logger.info(`Server listening on port ${PORT}`);
    });

    server.on("error", (err) => {
      logger.error("Server error", err.message);
    });

    process.on("SIGINT", gracefulShutdown);
    process.on("SIGTERM", gracefulShutdown);

    async function gracefulShutdown() {
      logger.info("Graceful shutdown initiated");
      try {
        await agendaShutdown();
        await mongoose.connection.close();
        logger.info("Shutdown complete");
        process.exit(0);
      } catch (err) {
        logger.error("Shutdown error", err.message);
        process.exit(1);
      }
    }
  } catch (err) {
    logger.error("Server startup failed", err.message);
    setTimeout(() => process.exit(1), 2000);
  }
}

startServer();
