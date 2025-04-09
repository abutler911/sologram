const mongoose = require("mongoose");

const connectDB = async () => {
  try {
    // Define connection options
    const options = {
      useNewUrlParser: true,
      useUnifiedTopology: true,
      serverSelectionTimeoutMS: 5000,
      socketTimeoutMS: 45000,
      family: 4,
      maxPoolSize: 10,
    };

    // Establish connection
    const conn = await mongoose.connect(
      process.env.MONGODB_URI || "mongodb://localhost:27017/sologram",
      options
    );

    console.log(`MongoDB Connected: ${conn.connection.host}`);

    // Set up event listeners AFTER connection is established
    mongoose.connection.on("error", (err) => {
      console.error(`MongoDB connection error: ${err}`);
    });

    mongoose.connection.on("disconnected", () => {
      console.warn("MongoDB disconnected, attempting to reconnect...");
    });

    mongoose.connection.on("reconnected", () => {
      console.log("MongoDB reconnected successfully");
    });
  } catch (error) {
    console.error(`Error: ${error.message}`);
    console.error("MongoDB connection failed. Will retry...");

    // Don't exit the process immediately - instead, let's retry after a delay
    setTimeout(() => {
      console.log("Attempting to reconnect to MongoDB...");
      connectDB();
    }, 5000);
  }
};

module.exports = connectDB;
