const cron = require("node-cron");
const Story = require("../models/Story");

// Run every hour
const scheduleArchiving = () => {
  cron.schedule("0 * * * *", async () => {
    try {
      const now = new Date();

      // Find expired but unarchived stories
      const expiredStories = await Story.find({
        archived: false,
        expiresAt: { $lt: now },
      });

      // Archive each story
      for (const story of expiredStories) {
        story.archived = true;
        await story.save();
        console.log(`Archived story: ${story._id}`);
      }

      console.log(`Archived ${expiredStories.length} expired stories`);
    } catch (error) {
      console.error("Error in story archiving job:", error);
    }
  });

  console.log("Story archiving job scheduled");
};

module.exports = { scheduleArchiving };
