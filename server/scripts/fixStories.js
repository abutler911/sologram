// scripts/fixStories.js
const mongoose = require("mongoose");
const Story = require("../models/Story");
require("dotenv").config();

// Connect to MongoDB
const connectDB = async () => {
  try {
    const mongoURI =
      process.env.MONGODB_URI || "mongodb://localhost:27017/sologram";

    console.log("Connecting to MongoDB...");
    await mongoose.connect(mongoURI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });

    console.log("MongoDB connected successfully");
  } catch (err) {
    console.error("MongoDB connection error:", err);
    process.exit(1);
  }
};

// Function to fix stories
const fixStories = async () => {
  try {
    console.log("Starting story migration...");

    // Find all stories
    const stories = await mongoose.connection
      .collection("stories")
      .find({})
      .toArray();
    console.log(`Found ${stories.length} stories in total`);

    // Count archived stories
    const archivedCount = stories.filter((story) => story.archived).length;
    console.log(`Found ${archivedCount} archived stories`);

    // Update stories that should be archived but aren't
    const now = new Date();
    const expiredStories = stories.filter(
      (story) =>
        !story.archived && story.expiresAt && new Date(story.expiresAt) < now
    );

    console.log(
      `Found ${expiredStories.length} stories that should be archived`
    );

    if (expiredStories.length > 0) {
      for (const story of expiredStories) {
        await mongoose.connection.collection("stories").updateOne(
          { _id: story._id },
          {
            $set: {
              archived: true,
              archivedAt: now,
            },
          }
        );
      }
      console.log(
        `Updated ${expiredStories.length} expired stories to archived status`
      );
    }

    // Fix any stories with missing archivedAt field
    const archivedWithoutDate = stories.filter(
      (story) => story.archived && !story.archivedAt
    );

    console.log(
      `Found ${archivedWithoutDate.length} archived stories without archivedAt date`
    );

    if (archivedWithoutDate.length > 0) {
      for (const story of archivedWithoutDate) {
        await mongoose.connection
          .collection("stories")
          .updateOne({ _id: story._id }, { $set: { archivedAt: new Date() } });
      }
      console.log(
        `Updated ${archivedWithoutDate.length} archived stories with missing archivedAt field`
      );
    }

    // Check for incomplete media entries
    const storiesWithMedia = stories.filter(
      (story) => story.media && story.media.length > 0
    );
    let mediaFixCount = 0;

    for (const story of storiesWithMedia) {
      let needsUpdate = false;

      if (Array.isArray(story.media)) {
        for (const media of story.media) {
          // Check if mediaType is missing or invalid
          if (
            !media.mediaType ||
            !["image", "video"].includes(media.mediaType)
          ) {
            media.mediaType = "image"; // Default to image
            needsUpdate = true;
          }
        }

        if (needsUpdate) {
          await mongoose.connection
            .collection("stories")
            .updateOne({ _id: story._id }, { $set: { media: story.media } });
          mediaFixCount++;
        }
      }
    }

    console.log(`Fixed media entries for ${mediaFixCount} stories`);
    console.log("Story migration completed successfully");
  } catch (err) {
    console.error("Error fixing stories:", err);
  }
};

// Main function
const main = async () => {
  try {
    await connectDB();
    await fixStories();

    console.log("Migration completed successfully");
    process.exit(0);
  } catch (err) {
    console.error("Migration failed:", err);
    process.exit(1);
  }
};

// Run the script
main();
