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

// Global error handling
process.on("uncaughtException", (error) => {
  console.error("UNCAUGHT EXCEPTION! 💥", error);
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

setInterval(() => {
  const used = process.memoryUsage();
  console.log(`Memory usage: ${Math.round(used.rss / 1024 / 1024)}MB`);
}, 60000);

const logger = winston.createLogger({
  level: "info",
  format: winston.format.json(),
  transports: [
    new winston.transports.File({ filename: "error.log", level: "error" }),
    new winston.transports.File({ filename: "combined.log" }),
  ],
});

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

const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 100,
  standardHeaders: true,
  legacyHeaders: false,
});

const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 5,
  message: "Too many authentication attempts, please try again later",
});

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
    stack: process.env.NODE_ENV === "development" ? err.stack : undefined,
  });
};

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

async function startServer() {
  try {
    logger.info(
      `Starting server in ${process.env.NODE_ENV || "development"} mode`
    );
    logger.info(`Node.js version: ${process.version}`);
    logger.info(`Working directory: ${process.cwd()}`);

    const requiredEnvVars = ["MONGODB_URI", "JWT_SECRET"];
    const missingVars = requiredEnvVars.filter((v) => !process.env[v]);
    if (missingVars.length > 0) {
      logger.warn(`Missing environment variables: ${missingVars.join(", ")}`);
    }

    const connectDB = require("./config/db");
    const dbConnected = await connectDB();
    if (!dbConnected) {
      logger.warn(
        "MongoDB connection failed, retry logic will attempt reconnection."
      );
    }

    try {
      await setupAgenda();
      logger.info("Story archiving service initialized");
    } catch (agendaError) {
      logger.warn("Story archiving setup failed:", agendaError.message);
    }

    // Import routes
    const postRoutes = require("./routes/posts");
    app.use("/api/posts", postRoutes);
    app.use("/api/", apiLimiter);

    // Healthcheck
    app.get("/health", (req, res) => {
      res.status(200).json({
        status: "ok",
        uptime: process.uptime(),
        timestamp: new Date().toISOString(),
        memory: {
          rss: `${Math.round(process.memoryUsage().rss / 1024 / 1024)}MB`,
        },
        mongodb:
          mongoose.connection.readyState === 1 ? "connected" : "disconnected",
      });
    });

    app.get("/api/health", (req, res) => {
      res.status(200).json({
        status: "ok",
        message: "Server is running",
        timestamp: new Date(),
      });
    });

    // Static for production
    if (process.env.NODE_ENV === "production") {
      app.use(express.static(path.join(__dirname, "../client/build")));
      app.get("*", (req, res) => {
        res.sendFile(path.resolve(__dirname, "../client/build", "index.html"));
      });
    }

    app.use(globalErrorHandler);

    const server = app.listen(PORT, () => {
      logger.info(`🚀 Server running on port ${PORT}`);
    });

    server.on("error", (err) => {
      logger.error(`Server error: ${err.message}`);
    });

    return server;
  } catch (error) {
    logger.error("Startup failed", {
      error: error.message,
      stack: error.stack,
    });
    setTimeout(() => process.exit(1), 3000);
  }
}

const gracefulShutdown = async () => {
  logger.info("Graceful shutdown initiated");
  try {
    await agendaShutdown();
    await mongoose.connection.close();
    logger.info("Shutdown complete");
    process.exit(0);
  } catch (err) {
    logger.error("Error during shutdown:", err.message);
    process.exit(1);
  }
};

process.on("SIGTERM", gracefulShutdown);
process.on("SIGINT", gracefulShutdown);

// START SERVER + block process exit
(async () => {
  await startServer();
  setInterval(() => {}, 1 << 30); // Keeps process alive
})();
