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

// Add this to the top of your server.js file

// Enhanced error handling for Node.js
process.on("uncaughtException", (error) => {
  console.error("UNCAUGHT EXCEPTION! 💥 Shutting down...");
  console.error(error.name, error.message, error.stack);
  // Give the server time to log the error before exiting
  setTimeout(() => {
    process.exit(1);
  }, 1000);
});

process.on("unhandledRejection", (reason, promise) => {
  console.error("UNHANDLED REJECTION! 💥");
  console.error("Reason:", reason);
  // Give the server time to log the error before exiting
  setTimeout(() => {
    process.exit(1);
  }, 1000);
});

// Add proper signal handling
process.on("SIGTERM", () => {
  console.log("👋 SIGTERM RECEIVED. Shutting down gracefully");
  // Give time for existing connections to finish
  setTimeout(() => {
    console.log("💥 Process terminated!");
    process.exit(0);
  }, 2000);
});

// Add memory monitoring (optional)
setInterval(() => {
  const used = process.memoryUsage();
  console.log(`Memory usage: ${Math.round(used.rss / 1024 / 1024)}MB`);
}, 60000); // Log memory usage every minute

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
  trustProxy: false,
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
    const mongoURI =
      process.env.MONGODB_URI || "mongodb://localhost:27017/sologram";
    if (!mongoURI) {
      throw new Error("MongoDB connection string is not defined");
    }

    await mongoose.connect(mongoURI);
    logger.info("Database connection established");

    try {
      await setupAgenda();
      logger.info("Story archiving service initialized");
    } catch (agendaError) {
      logger.warn("Story archiving service initialization failed", {
        error: agendaError.message,
      });
    }

    const postRoutes = require("./routes/posts");
    const authRoutes = require("./routes/auth");
    const collectionRoutes = require("./routes/collections");
    const storyRoutes = require("./routes/stories");
    const archivedStoryRoutes = require("./routes/archivedStories");
    const subscriberRoutes = require("./routes/subscribers");
    const notificationRoutes = require("./routes/notifications");

    app.use("/api/", apiLimiter);
    app.use("/api/auth/", authLimiter);
    app.use("/api/auth", authRoutes);
    app.use("/api/posts", postRoutes);
    app.use("/api/collections", collectionRoutes);
    app.use("/api/stories", storyRoutes);
    app.use("/api/archived-stories", archivedStoryRoutes);
    app.use("/api/subscribers", subscriberRoutes);
    app.use("/api/notifications", notificationRoutes);

    app.get("/api/health", (req, res) => {
      res.status(200).json({
        status: "ok",
        message: "Server is running",
        timestamp: new Date(),
      });
    });

    if (process.env.NODE_ENV === "production") {
      app.use(express.static(path.join(__dirname, "../client/build")));
      app.get("*", (req, res) => {
        res.sendFile(path.resolve(__dirname, "../client/build", "index.html"));
      });
    }

    app.use(globalErrorHandler);

    app.listen(PORT, () => {
      logger.info(
        `Server started on port ${PORT} in ${
          process.env.NODE_ENV || "development"
        } mode`
      );
    });
  } catch (error) {
    logger.error("Server startup failed", {
      error: error.message,
      stack: error.stack,
    });
    process.exit(1);
  }
}

const gracefulShutdown = async () => {
  logger.info("Graceful shutdown initiated");
  try {
    try {
      await agendaShutdown();
      logger.info("Story archiving service stopped");
    } catch (agendaError) {
      logger.error("Agenda shutdown error", { error: agendaError.message });
    }

    await mongoose.connection.close();
    logger.info("Database connection closed");

    logger.info("Server shutdown complete");
    process.exit(0);
  } catch (err) {
    logger.error("Error during shutdown", { error: err.message });
    process.exit(1);
  }
};

process.on("SIGTERM", gracefulShutdown);
process.on("SIGINT", gracefulShutdown);

startServer();
