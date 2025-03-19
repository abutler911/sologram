const Agenda = require("agenda");
const Story = require("../models/Story");
require("dotenv").config();

const mongoURI =
  process.env.MONGODB_URI || "mongodb://localhost:27017/sologram";

if (!mongoURI) {
  console.error("MongoDB connection string is not defined");
  process.exit(1);
}

const agenda = new Agenda({
  db: {
    address: mongoURI,
    collection: "scheduledJobs",
  },
  processEvery: "1 minute",
});

agenda.define("archive-expired-stories", async () => {
  try {
    const now = new Date();
    const result = await Story.updateMany(
      {
        archived: false,
        expiresAt: { $lt: now },
      },
      {
        $set: {
          archived: true,
          archivedAt: now,
        },
      }
    );

    console.log(`Archived ${result.modifiedCount} expired stories`);
  } catch (error) {
    console.error("Story archiving job failed:", error);
  }
});

async function setupAgenda() {
  try {
    await agenda.start();
    await agenda.every("5 minutes", "archive-expired-stories");

    // Run once on startup to ensure any expired stories are archived immediately
    await agenda.now("archive-expired-stories");

    console.log("Agenda job scheduling initialized");
  } catch (error) {
    console.error("Failed to setup Agenda:", error);
    throw error;
  }
}

async function gracefulShutdown() {
  try {
    await agenda.stop();
    console.log("Agenda jobs stopped");
    process.exit(0);
  } catch (error) {
    console.error("Error during graceful shutdown:", error);
    process.exit(1);
  }
}

process.on("SIGTERM", gracefulShutdown);
process.on("SIGINT", gracefulShutdown);

module.exports = {
  agenda,
  setupAgenda,
};
