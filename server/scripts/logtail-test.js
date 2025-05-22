// logtail-test.js
require("dotenv").config();
const { Logtail } = require("@logtail/node");

// Check if token exists
if (!process.env.LOGTAIL_TOKEN) {
  console.error("❌ LOGTAIL_TOKEN not found in environment variables");
  console.log("Make sure you have LOGTAIL_TOKEN set in your .env file");
  process.exit(1);
}

console.log(
  "🔑 Using token:",
  process.env.LOGTAIL_TOKEN.substring(0, 8) + "..."
);

const logtail = new Logtail(process.env.LOGTAIL_TOKEN);

// Add error handler
logtail.on("error", (error) => {
  console.error("❌ Logtail client error:", error.message);
});

(async () => {
  try {
    console.log("🚀 Sending test log to Logtail...");

    // Send log
    await logtail.info("🧪 Hello from SoloGram test script!", {
      environment: "test",
      app: "sologram",
      timestamp: new Date().toISOString(),
    });

    console.log("📤 Log message sent, flushing...");
    await logtail.flush();
    console.log("✅ Log sent and flushed successfully!");
  } catch (err) {
    console.error("❌ Logtail error:", err.message);
    console.error("Full error:", err);

    // Check if it's an auth error
    if (err.message.includes("Unauthorized")) {
      console.log("\n🔍 Troubleshooting tips:");
      console.log("1. Verify your token is correct in Better Stack dashboard");
      console.log("2. Make sure the token hasn't expired");
      console.log("3. Check if the source is active in Better Stack");
    }
  }
})();
