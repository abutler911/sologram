// services/storyArchiver.js
const Agenda = require("agenda");
const Story = require("../models/Story");
require("dotenv").config();

// Get MongoDB connection string from environment or use default
const mongoURI =
  process.env.MONGODB_URI || "mongodb://localhost:27017/sologram";

// Initialize Agenda with MongoDB connection
const agenda = new Agenda({
  db: {
    address: mongoURI,
    collection: "scheduledJobs",
  },
  processEvery: "1 minute",
});

// Define the job to archive expired stories
agenda.define("archive-expired-stories", async (job, done) => {
  try {
    console.log("Running story archiving job...");
    const count = await Story.archiveExpired();
    console.log(`Successfully archived ${count} expired stories`);
    done();
  } catch (error) {
    console.error("Story archiving job failed:", error);
    done(error);
  }
});

// Configure and start the agenda instance
async function setupAgenda() {
  try {
    // Start the agenda processing
    await agenda.start();
    console.log("Agenda started successfully");

    // Schedule the archiving job to run every 5 minutes
    await agenda.every("5 minutes", "archive-expired-stories");
    console.log("Archiving job scheduled to run every 5 minutes");

    // Also run the job immediately on server startup
    await agenda.now("archive-expired-stories");
    console.log("Initial archiving job triggered");

    return agenda;
  } catch (error) {
    console.error("Failed to setup Agenda:", error);
    // Don't throw the error - just log it and continue
    // This prevents Agenda errors from crashing the whole server
    return null;
  }
}

// Handle graceful shutdown
async function gracefulShutdown() {
  try {
    console.log("Stopping Agenda jobs...");
    // Add a timeout to ensure it doesn't hang
    const shutdownPromise = agenda.stop();
    const timeoutPromise = new Promise((resolve) => setTimeout(resolve, 5000));

    // Race the promises to ensure we don't hang
    await Promise.race([shutdownPromise, timeoutPromise]);
    console.log("Agenda jobs stopped successfully");
  } catch (error) {
    console.error("Error during Agenda shutdown:", error);
  }
}

async function monitorExpiredStories() {
  const expiredCount = await Story.countDocuments({
    archived: false,
    expiresAt: { $lt: new Date() },
  });

  if (expiredCount > 0) {
    console.log(`Found ${expiredCount} expired stories that need archiving`);
  }
}
// Listen for shutdown signals
process.on("SIGTERM", gracefulShutdown);
process.on("SIGINT", gracefulShutdown);

module.exports = {
  agenda,
  setupAgenda,
  gracefulShutdown,
};
