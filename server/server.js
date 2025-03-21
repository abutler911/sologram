const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
const morgan = require("morgan");
const helmet = require("helmet");
const path = require("path");
const { setupAgenda, gracefulShutdown: agendaShutdown } = require("./services/storyArchiver");
require("dotenv").config();

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(express.json({ limit: '100mb' }));
app.use(express.urlencoded({ extended: true, limit: '100mb' }));
app.use(cors());
app.use(helmet());
app.use(morgan("dev"));
app.set("trust proxy", true);

// Global error handler middleware
const globalErrorHandler = (err, req, res, next) => {
  console.error("GLOBAL ERROR:", {
    url: req.originalUrl,
    method: req.method,
    message: err.message,
    stack: err.stack,
  });
  res.status(500).json({
    success: false,
    message: "Server error",
    error: process.env.NODE_ENV === "development" ? err.message : undefined,
    stack: process.env.NODE_ENV === "development" ? err.stack : undefined,
  });
};

async function startServer() {
  try {
    const mongoURI =
      process.env.MONGODB_URI || "mongodb://localhost:27017/sologram";
    if (!mongoURI) {
      throw new Error("MongoDB connection string is not defined");
    }
    
    // Connect to MongoDB
    await mongoose.connect(mongoURI);
    console.log("MongoDB connected successfully");
    
    // Initialize the Story archiving scheduler using Agenda
    try {
      await setupAgenda();
      console.log("Story archiving service initialized successfully");
    } catch (agendaError) {
      console.error("Warning: Story archiving service setup failed:", agendaError);
      // Continue server startup even if agenda fails
    }
    
    // Import routes
    const postRoutes = require("./routes/posts");
    const authRoutes = require("./routes/auth");
    const collectionRoutes = require("./routes/collections");
    const storyRoutes = require("./routes/stories");
    const archivedStoryRoutes = require("./routes/archivedStories");
    const subscriberRoutes = require("./routes/subscribers");
    const notificationRoutes = require("./routes/notifications");
    
    // Route validation middleware - helps catch route conflicts
    app.use((req, res, next) => {
      const originalUrl = req.originalUrl;
      console.log(`Request received: ${req.method} ${originalUrl}`);
      next();
    });
    
    // Use routes - order matters for nested routes!
    app.use("/api/auth", authRoutes);
    app.use("/api/posts", postRoutes);
    app.use("/api/collections", collectionRoutes);
    app.use("/api/stories", storyRoutes);
    app.use("/api/archived-stories", archivedStoryRoutes);
    app.use("/api/subscribers", subscriberRoutes);
    app.use("/api/notifications", notificationRoutes);
    
    // Add a health check endpoint
    app.get("/api/health", (req, res) => {
      res.status(200).json({
        status: "ok",
        message: "Server is running",
        timestamp: new Date(),
      });
    });
    
    // Static files for production
    if (process.env.NODE_ENV === "production") {
      app.use(express.static(path.join(__dirname, "../client/build")));
      app.get("*", (req, res) => {
        res.sendFile(path.resolve(__dirname, "../client/build", "index.html"));
      });
    }
    
    // Apply global error handler
    app.use(globalErrorHandler);
    
    app.listen(PORT, () => {
      console.log(`Server running on port ${PORT}`);
    });
  } catch (error) {
    console.error("Server startup failed:", error);
    process.exit(1);
  }
}

startServer();

// Graceful shutdown
const gracefulShutdown = async () => {
  console.log("Shutting down server gracefully...");
  try {
    // Stop the Agenda job scheduler
    try {
      await agendaShutdown();
      console.log("Story archiving service shut down properly");
    } catch (agendaError) {
      console.error("Error shutting down Agenda:", agendaError);
    }
    
    // Close MongoDB connection
    await mongoose.connection.close();
    console.log("MongoDB connection closed");
    
    // Other cleanup tasks can be added here
    
    console.log("All connections closed successfully");
    process.exit(0);
  } catch (err) {
    console.error("Error during graceful shutdown:", err);
    process.exit(1);
  }
};

// Listen for termination signals
process.on("SIGTERM", gracefulShutdown);
process.on("SIGINT", gracefulShutdown);