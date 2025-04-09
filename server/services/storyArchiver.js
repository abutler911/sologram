const Agenda = require("agenda");
const Story = require("../models/Story");
require("dotenv").config();

const mongoURI =
  process.env.MONGODB_URI || "mongodb://localhost:27017/sologram";

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

agenda.define("archive-expired-stories", async (job, done) => {
  try {
    console.log("Running story archiving job...");
    let count = 0;
    try {
      count = await Story.archiveExpired();
    } catch (err) {
      console.error("Error in Story.archiveExpired():", err);
    }
    console.log(`Successfully archived ${count} expired stories`);
    done();
  } catch (error) {
    console.error("Story archiving job failed:", error);
    done(error);
  }
});

const setupAgenda = async () => {
  try {
    await agenda.start();
    console.log("Agenda started successfully");
    await agenda.every("5 minutes", "archive-expired-stories");
    console.log("Archiving job scheduled to run every 5 minutes");
    await agenda.now("archive-expired-stories");
    console.log("Initial archiving job triggered");
    return agenda;
  } catch (err) {
    console.error("Failed to setup Agenda:", err);
    return null;
  }
};

const gracefulShutdown = async () => {
  try {
    console.log("Stopping Agenda...");
    await agenda.stop();
    console.log("Agenda stopped");
  } catch (err) {
    console.error("Agenda shutdown failed:", err);
  }
};

module.exports = {
  agenda,
  setupAgenda,
  gracefulShutdown,
};
