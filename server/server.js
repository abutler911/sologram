const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
const morgan = require("morgan");
const helmet = require("helmet");
const path = require("path");
const winston = require("winston");
const rateLimit = require("express-rate-limit");
const mongoSanitize = require("express-mongo-sanitize");
const {
  setupAgenda,
  gracefulShutdown: agendaShutdown,
} = require("./services/storyArchiver");
require("dotenv").config();

const app = express();
const PORT = process.env.PORT || 5000;

// Graceful error and shutdown handling
process.on("uncaughtException", (error) => {
  console.error("UNCAUGHT EXCEPTION! 💥 Shutting down...");
  console.error(error.stack);
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

// Memory usage logging (optional)
setInterval(() => {
  const used = process.memoryUsage();
  console.log(`Memory usage: ${Math.round(used.rss / 1024 / 1024)}MB`);
}, 60000);

// Logger setup
const logger = winston.createLogger({
  level: "info",
  format: winston.format.json(),
  transports: [
    new winston.transports.File({ filename: "error.log", level: "error" }),
    new winston.transports.File({ filename: "combined.log" }),
  ],
});

// Security and optimization middlewares
const corsOptions = {
  origin:
    process.env.NODE_ENV === "production"
      ? [
          "https://thesologram.com",
          "https://www.thesologram.com",
          "https://sologram.onrender.com",
        ]
      : ["http://localhost:3000"],
  credentials: true,
};
const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 100,
});
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 5,
  message: "Too many authentication attempts, please try again later",
});

// Express setup
app.set("trust proxy", 1);
app.use(express.json({ limit: "300mb" }));
app.use(express.urlencoded({ extended: true, limit: "300mb" }));
app.use(mongoSanitize());
app.use(cors(corsOptions));
app.use(
  helmet({
    contentSecurityPolicy: {
      directives: {
        defaultSrc: ["'self'"],
        scriptSrc: ["'self'", "'unsafe-inline'"],
        styleSrc: ["'self'", "'unsafe-inline'"],
        imgSrc: ["'self'", "data:"],
      },
    },
    xssFilter: true,
    noSniff: true,
    referrerPolicy: { policy: "same-origin" },
  })
);
app.use(morgan("dev"));

// Request logger
app.use((req, res, next) => {
  const start = Date.now();
  res.on("finish", () => {
    const duration = Date.now() - start;
    logger.info({
      method: req.method,
      url: req.originalUrl,
      status: res.statusCode,
      duration: `${duration}ms`,
    });
  });
  next();
});

// Global error handler
app.use((err, req, res, next) => {
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
    stack: process.env.NODE_ENV === "development" ? err.stack : undefined,
  });
});

async function startServer() {
  try {
    logger.info(
      `Starting server in ${process.env.NODE_ENV || "development"} mode`
    );

    // Check for critical environment variables
    const requiredEnv = ["MONGODB_URI", "JWT_SECRET"];
    const missing = requiredEnv.filter((key) => !process.env[key]);
    if (missing.length > 0) {
      logger.warn(`Missing env vars: ${missing.join(", ")}`);
    }

    // Connect to DB
    const connectDB = require("./config/db");
    const dbConnected = await connectDB();
    if (!dbConnected) {
      logger.warn("MongoDB failed initially, retry will be attempted.");
    }

    // Setup background jobs (agenda)
    try {
      await setupAgenda();
      logger.info("✅ Story archiver ready");
    } catch (agendaErr) {
      logger.warn("⚠️ Agenda failed to init:", agendaErr.message);
    }

    // Routes setup
    app.use("/api/posts", require("./routes/posts"));
    app.use("/api/test-cron", require("./routes/testCron"));
    app.use("/api/auth", authLimiter, require("./routes/auth"));
    // ... add more routes as needed

    // Health checks
    app.get("/health", (req, res) => {
      res.status(200).json({
        status: "ok",
        timestamp: new Date(),
        memory: {
          rss: `${Math.round(process.memoryUsage().rss / 1024 / 1024)}MB`,
        },
        mongo:
          mongoose.connection.readyState === 1 ? "connected" : "disconnected",
      });
    });
    app.get("/api/health", (req, res) => {
      res.status(200).json({ status: "ok", timestamp: new Date() });
    });

    // Serve frontend in production
    if (process.env.NODE_ENV === "production") {
      app.use(express.static(path.join(__dirname, "../client/build")));
      app.get("*", (req, res) => {
        res.sendFile(path.resolve(__dirname, "../client/build/index.html"));
      });
    }

    const server = app.listen(PORT, () => {
      logger.info(`🚀 Server running on port ${PORT}`);
    });

    server.on("error", (err) => {
      logger.error("Server error", err.message);
    });

    return server;
  } catch (err) {
    logger.error("Startup failure", {
      error: err.message,
      stack: err.stack,
    });
    setTimeout(() => process.exit(1), 3000);
  }
}

const gracefulShutdown = async () => {
  logger.info("Graceful shutdown started...");
  try {
    await agendaShutdown();
    await mongoose.connection.close();
    logger.info("💾 DB and jobs closed");
    process.exit(0);
  } catch (err) {
    logger.error("Shutdown error", err.message);
    process.exit(1);
  }
};

process.on("SIGINT", gracefulShutdown);
process.on("SIGTERM", gracefulShutdown);

startServer();
