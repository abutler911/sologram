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
    throw error;
  }
}

// Handle graceful shutdown
async function gracefulShutdown() {
  try {
    console.log("Stopping Agenda jobs...");
    await agenda.stop();
    console.log("Agenda jobs stopped successfully");
    process.exit(0);
  } catch (error) {
    console.error("Error during graceful shutdown:", error);
    process.exit(1);
  }
}

// Listen for shutdown signals
process.on("SIGTERM", gracefulShutdown);
process.on("SIGINT", gracefulShutdown);

module.exports = {
  agenda,
  setupAgenda,
  gracefulShutdown
};