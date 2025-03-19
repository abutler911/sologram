const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
const morgan = require("morgan");
const helmet = require("helmet");
const path = require("path");
const { scheduleArchiving } = require("./services/storyArchiver");
require("dotenv").config();

// Initialize Express app
const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cors());
app.use(helmet());
app.use(morgan("dev"));

// Database connection
mongoose
  .connect(process.env.MONGODB_URI || "mongodb://localhost:27017/sologram")
  .then(() => console.log("MongoDB connected"))
  .catch((err) => console.error("MongoDB connection error:", err));

app.set("trust proxy", true);

// Import routes
const postRoutes = require("./routes/posts");
const authRoutes = require("./routes/auth");
const collectionRoutes = require("./routes/collections");
const storyRoutes = require("./routes/stories");
const subscriberRoutes = require("./routes/subscribers");
const notificationRoutes = require("./routes/notifications");

// Use routes
app.use("/api/posts", postRoutes);
app.use("/api/auth", authRoutes);
app.use("/api/collections", collectionRoutes);
app.use("/api/stories", storyRoutes);
app.use("/api/subscribers", subscriberRoutes);
app.use("/api/notifications", notificationRoutes);

// Error handling middleware
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).send({ message: "Server error", error: err.message });
});

// Start the server
app.listen(PORT, () => {
  scheduleArchiving();
  console.log(`Server running on port ${PORT}`);
});
