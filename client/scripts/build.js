// scripts/build.js - Add this to your build process
const fs = require("fs");
const path = require("path");

function updateServiceWorkerVersion() {
  const swPath = path.join(__dirname, "../public/sw.js");
  const buildTime = Date.now();

  try {
    let swContent = fs.readFileSync(swPath, "utf8");

    // Replace the placeholder with actual build time
    swContent = swContent.replace(/__BUILD_TIME__/g, buildTime);

    fs.writeFileSync(swPath, swContent);
    console.log(`✅ Service worker updated with version: ${buildTime}`);
  } catch (error) {
    console.error("❌ Failed to update service worker:", error);
    process.exit(1);
  }
}

// Run if called directly
if (require.main === module) {
  updateServiceWorkerVersion();
}

module.exports = { updateServiceWorkerVersion };
