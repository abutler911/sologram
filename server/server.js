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
    // Add startup diagnostics
    logger.info(
      `Starting server in ${process.env.NODE_ENV || "development"} mode`
    );
    logger.info(`Node.js version: ${process.version}`);
    logger.info(`Current working directory: ${process.cwd()}`);

    // Check for critical environment variables
    const requiredEnvVars = ["MONGODB_URI", "JWT_SECRET"];

    const missingVars = requiredEnvVars.filter(
      (varName) => !process.env[varName]
    );
    if (missingVars.length > 0) {
      logger.warn(`Missing environment variables: ${missingVars.join(", ")}`);
    }

    // Connect to database with improved module
    const connectDB = require("./config/db");
    const dbConnected = await connectDB();

    if (!dbConnected) {
      logger.warn(
        "Initial MongoDB connection failed, continuing startup but will retry connection"
      );
      // We continue anyway to let the app start - a retry is happening in the db.js module
    }

    // Initialize Agenda with better error handling
    try {
      await setupAgenda();
      logger.info("Story archiving service initialized");
    } catch (agendaError) {
      logger.warn("Story archiving service initialization failed", {
        error: agendaError.message,
      });
      // Continue without Agenda if it fails
    }

    // Rest of your server setup...
    const postRoutes = require("./routes/posts");
    // ... other route imports

    // Set up routes
    app.use("/api/", apiLimiter);
    // ... other route setup

    // Health check endpoint
    app.get("/health", (req, res) => {
      res.status(200).json({
        status: "ok",
        uptime: process.uptime(),
        timestamp: new Date().toISOString(),
        memory: {
          rss: `${Math.round(process.memoryUsage().rss / 1024 / 1024)}MB`,
          heapTotal: `${Math.round(
            process.memoryUsage().heapTotal / 1024 / 1024
          )}MB`,
          heapUsed: `${Math.round(
            process.memoryUsage().heapUsed / 1024 / 1024
          )}MB`,
        },
        mongodb:
          mongoose.connection.readyState === 1 ? "connected" : "disconnected",
      });
    });
    // Make sure this endpoint is also available at /api/health for consistency
    app.get("/api/health", (req, res) => {
      res.status(200).json({
        status: "ok",
        message: "Server is running",
        timestamp: new Date(),
      });
    });

    // Set up static files for production
    if (process.env.NODE_ENV === "production") {
      app.use(express.static(path.join(__dirname, "../client/build")));
      app.get("*", (req, res) => {
        res.sendFile(path.resolve(__dirname, "../client/build", "index.html"));
      });
    }

    // Register global error handler
    app.use(globalErrorHandler);

    // Start the server
    const server = app.listen(PORT, () => {
      logger.info(
        `Server started on port ${PORT} in ${
          process.env.NODE_ENV || "development"
        } mode`
      );
    });

    // Handle server errors
    server.on("error", (err) => {
      logger.error(`Server error: ${err.message}`);
    });

    return server;
  } catch (error) {
    logger.error("Server startup failed", {
      error: error.message,
      stack: error.stack,
    });
    // Don't exit immediately - give time for logs to be written
    setTimeout(() => {
      process.exit(1);
    }, 3000);
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
