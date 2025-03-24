require("dotenv").config();
const mongoose = require("mongoose");
const bcrypt = require("bcrypt");
const User = require("../models/User");

const createCreatorUser = async () => {
  try {
    // Connect to database
    await mongoose.connect(
      process.env.MONGODB_URI || "mongodb://localhost:27017/sologram"
    );
    console.log("MongoDB connected");

    // Check if creator user already exists
    const existingCreator = await User.findOne({
      email: process.env.CREATOR_EMAIL,
    });

    if (existingCreator) {
      console.log("Creator user already exists");
      process.exit(0);
    }

    // Create salt & hash password
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(
      process.env.CREATOR_PASSWORD,
      salt
    );

    // Create new creator user
    const creatorUser = new User({
      username: process.env.CREATOR_USERNAME || "creator",
      email: process.env.CREATOR_EMAIL,
      password: hashedPassword,
      bio: "SoloGram Creator",
      role: "creator",
    });

    await creatorUser.save();
    console.log("Creator user created successfully");

    process.exit(0);
  } catch (err) {
    console.error("Error creating creator user:", err);
    process.exit(1);
  }
};

createCreatorUser();
