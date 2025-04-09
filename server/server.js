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
const Post = require("./models/Post");

// Error handling
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
});
app.use(cors(corsOptions));

const postRoutes = require("./routes/posts");
const storyRoutes = require("./routes/stories");
const authRoutes = require("./routes/auth");
const collectionRoutes = require("./routes/collections");

app.use("/api/posts", postRoutes);
app.use("/api/stories", storyRoutes);
app.use("/api/auth", authRoutes);
app.use("/api/collections", collectionRoutes);

app.set("trust proxy", 1);
app.use(express.json({ limit: "300mb" }));
app.use(express.urlencoded({ extended: true, limit: "300mb" }));
app.use(mongoSanitize());
app.use(cors(corsOptions));
app.use(helmet());
app.use(morgan("dev"));

app.use((req, res, next) => {
  const start = Date.now();
  res.on("finish", () => {
    logger.info({
      method: req.method,
      url: req.originalUrl,
      status: res.statusCode,
      duration: `${Date.now() - start}ms`,
    });
  });
  next();
});
app.use((req, res, next) => {
  if (!req.originalUrl.includes("/health")) {
    console.log(`${req.method} ${req.originalUrl}`);
  }
  next();
});
const globalErrorHandler = (err, req, res, next) => {
  logger.error({
    message: "Server error",
    url: req.originalUrl,
    method: req.method,
    error: err.message,
  });

  res.status(500).json({
    success: false,
    message: "Server error",
    error: process.env.NODE_ENV === "development" ? err.message : undefined,
  });
};

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

    app.get("/health", (req, res) => {
      res.status(200).json({
        status: "ok",
        memory: process.memoryUsage(),
        mongodb:
          mongoose.connection.readyState === 1 ? "connected" : "disconnected",
      });
    });

    app.get("/", (req, res) => {
      res.send("🚀 SoloGram backend is live!");
    });

    app.get("/api/test-db", async (req, res) => {
      try {
        const count = await Post.countDocuments();
        res.status(200).json({ connected: true, posts: count });
      } catch (err) {
        res.status(500).json({ connected: false, error: err.message });
      }
    });

    if (process.env.NODE_ENV === "production") {
      app.use(express.static(path.join(__dirname, "../client/build")));
      app.get("*", (req, res) => {
        res.sendFile(path.resolve(__dirname, "../client/build", "index.html"));
      });
    }

    app.use(globalErrorHandler);

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
