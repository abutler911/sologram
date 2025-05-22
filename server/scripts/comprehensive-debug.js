// fixed-debug.js
// Load .env from parent directory
require("dotenv").config({ path: "../.env" });
const { Logtail } = require("@logtail/node");

console.log("🔍 FIXED LOGTAIL DEBUG");
console.log("=====================================");

// 1. Environment Check
console.log("\n1️⃣ Environment Variables:");
console.log("NODE_ENV:", process.env.NODE_ENV);
console.log("LOGTAIL_TOKEN exists:", !!process.env.LOGTAIL_TOKEN);
if (process.env.LOGTAIL_TOKEN) {
  console.log("Token length:", process.env.LOGTAIL_TOKEN.length);
  console.log("Token starts with:", process.env.LOGTAIL_TOKEN.substring(0, 8));
  console.log("Token ends with:", process.env.LOGTAIL_TOKEN.slice(-4));
}

// 2. Check Logtail package
console.log("\n📦 Package Information:");
try {
  const packageJson = require("../package.json");
  console.log(
    "@logtail/node version:",
    packageJson.dependencies["@logtail/node"]
  );
  console.log(
    "@logtail/winston version:",
    packageJson.dependencies["@logtail/winston"]
  );
} catch (e) {
  console.log("Could not read package.json");
}

// 3. Test Logtail instantiation
console.log("\n🧪 Testing Logtail instantiation:");
const testToken = process.env.LOGTAIL_TOKEN || "zEhmX8EYFydmtt9qy4mXLGVC";

try {
  console.log("Creating Logtail instance...");
  const logtail = new Logtail(testToken);
  console.log("✅ Logtail instance created successfully");
  console.log(
    "Logtail methods available:",
    Object.getOwnPropertyNames(Object.getPrototypeOf(logtail))
  );

  // Check if methods exist
  console.log("Has .info method:", typeof logtail.info === "function");
  console.log("Has .flush method:", typeof logtail.flush === "function");
  console.log("Has .on method:", typeof logtail.on === "function");
} catch (error) {
  console.log("❌ Failed to create Logtail instance:", error.message);
}

// 4. Test basic logging (without .on method)
async function testBasicLogging() {
  console.log("\n📤 Testing basic logging:");

  try {
    const logtail = new Logtail(testToken);

    console.log("Sending test log...");
    await logtail.info("Test log from debug script", {
      timestamp: new Date().toISOString(),
      test: true,
    });

    console.log("Flushing...");
    await logtail.flush();
    console.log("✅ Basic logging SUCCESS!");
  } catch (error) {
    console.log("❌ Basic logging FAILED:", error.message);
    console.log("Error details:", error);

    if (error.message.includes("Unauthorized")) {
      console.log("\n💡 This is likely a token issue");
    }
  }
}

// 5. Test HTTP directly
async function testHTTPDirect() {
  console.log("\n🌐 Testing HTTP API directly:");

  try {
    // Use node's built-in fetch if available, otherwise skip
    if (typeof fetch === "undefined") {
      console.log("⚠️ Fetch not available, skipping HTTP test");
      return;
    }

    const response = await fetch("https://in.logs.betterstack.com", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${testToken}`,
      },
      body: JSON.stringify({
        dt: new Date().toISOString(),
        message: "Direct HTTP test from debug script",
        level: "info",
      }),
    });

    console.log("HTTP Status:", response.status);
    console.log("HTTP Status Text:", response.statusText);

    if (response.ok) {
      console.log("✅ Direct HTTP SUCCESS!");
    } else {
      console.log("❌ Direct HTTP FAILED");
      const text = await response.text();
      console.log("Response:", text);
    }
  } catch (error) {
    console.log("❌ HTTP Error:", error.message);
  }
}

// Run tests
(async () => {
  await testBasicLogging();
  await testHTTPDirect();
  console.log("\n🏁 Debug complete!");
})();
