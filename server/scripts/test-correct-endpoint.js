// test-correct-endpoint.js
require("dotenv").config({ path: "../.env" });
const { Logtail } = require("@logtail/node");

const token = "XpKPLC3mXdsfvnKLWRP1anDY";
const endpoint = "https://s1319469.eu-nbg-2.betterstackdata.com";

console.log("🎯 Testing with CORRECT endpoint:");
console.log("Token:", token.substring(0, 8) + "...");
console.log("Endpoint:", endpoint);

(async () => {
  try {
    console.log("📤 Testing Node.js client with correct endpoint...");

    const logtail = new Logtail(token, { endpoint });

    await logtail.info("SUCCESS! Using correct endpoint", {
      source: "endpoint-test",
      timestamp: new Date().toISOString(),
      endpoint: endpoint,
    });

    await logtail.flush();
    console.log("✅ Node.js client SUCCESS!");
  } catch (error) {
    console.log("❌ Node.js client FAILED:", error.message);
  }

  try {
    console.log("🌐 Testing HTTP API with correct endpoint...");

    const response = await fetch(endpoint, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({
        dt: new Date().toISOString(),
        message: "HTTP test with correct endpoint",
        level: "info",
      }),
    });

    console.log("HTTP Status:", response.status);

    if (response.ok) {
      console.log("✅ HTTP API SUCCESS!");
    } else {
      console.log("❌ HTTP API FAILED");
      const text = await response.text();
      console.log("Response:", text);
    }
  } catch (error) {
    console.log("❌ HTTP Error:", error.message);
  }
})();
