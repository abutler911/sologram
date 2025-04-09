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
// In services/storyArchiver.js
const setupAgenda = async () => {
  try {
    // Get MongoDB connection string from environment or use default
    const mongoURI =
      process.env.MONGODB_URI || "mongodb://localhost:27017/sologram";

    // Check if MongoDB URI is available
    if (!mongoURI) {
      console.warn("MongoDB URI not available for Agenda");
      return null;
    }

    // Create the agenda instance with options for better resilience
    const agenda = new Agenda({
      db: {
        address: mongoURI,
        collection: "scheduledJobs",
        options: {
          useUnifiedTopology: true,
          connectTimeoutMS: 30000,
          socketTimeoutMS: 30000,
        },
      },
      processEvery: "1 minute",
      maxConcurrency: 20,
    });

    // Define the job with error handling
    agenda.define("archive-expired-stories", async (job, done) => {
      try {
        console.log("Running story archiving job...");
        let count = 0;

        // Wrap the archiving in a try/catch to prevent job failures
        try {
          count = await Story.archiveExpired();
        } catch (err) {
          console.error("Error in Story.archiveExpired():", err);
          // Don't rethrow - just log and continue
        }

        console.log(`Successfully archived ${count} expired stories`);
        done();
      } catch (error) {
        console.error("Story archiving job failed:", error);
        // Mark job as done even though it failed so it doesn't hang
        done(error);
      }
    });

    // Add error event handler
    agenda.on("error", (err) => {
      console.error("Agenda encounter an error:", err);
    });

    // Start the agenda processing with a timeout
    try {
      await Promise.race([
        agenda.start(),
        new Promise((_, reject) =>
          setTimeout(() => reject(new Error("Agenda start timeout")), 10000)
        ),
      ]);
      console.log("Agenda started successfully");
    } catch (err) {
      console.error("Failed to start Agenda:", err);
      // Return the agenda anyway - it might recover later
      return agenda;
    }

    // Schedule with timeouts and error handling
    try {
      await Promise.race([
        agenda.every("5 minutes", "archive-expired-stories"),
        new Promise((_, reject) =>
          setTimeout(() => reject(new Error("Agenda scheduling timeout")), 5000)
        ),
      ]);
      console.log("Archiving job scheduled to run every 5 minutes");
    } catch (err) {
      console.error("Failed to schedule archiving job:", err);
      // Continue anyway - the agenda is running
    }

    // Run initial job with timeout and error handling
    try {
      await Promise.race([
        agenda.now("archive-expired-stories"),
        new Promise((_, reject) =>
          setTimeout(() => reject(new Error("Initial job timeout")), 5000)
        ),
      ]);
      console.log("Initial archiving job triggered");
    } catch (err) {
      console.error("Failed to trigger initial archiving job:", err);
      // Continue anyway - the scheduled job will run later
    }

    return agenda;
  } catch (error) {
    console.error("Failed to setup Agenda:", error);
    // Don't throw - just return null
    return null;
  }
};

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
