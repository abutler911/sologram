// Simple icon generator using Jimp
const fs = require("fs");
const path = require("path");
const Jimp = require("jimp");

// Install Jimp if not installed
if (!fs.existsSync(path.join(__dirname, "../node_modules/jimp"))) {
  console.log("Installing Jimp...");
  require("child_process").execSync("npm install jimp", { stdio: "inherit" });
}

// Source image path
const sourceImagePath = process.argv[2] || "SoloGramLogo.png";
console.log(`Using source image: ${sourceImagePath}`);

// Ensure source image exists
if (!fs.existsSync(sourceImagePath)) {
  console.error(`Error: Source image '${sourceImagePath}' not found.`);
  process.exit(1);
}

// Sizes to generate
const sizes = [
  { width: 16, height: 16, name: "favicon-16x16.png" },
  { width: 32, height: 32, name: "favicon-32x32.png" },
  { width: 48, height: 48, name: "favicon-48x48.png" },
  { width: 192, height: 192, name: "logo192.png" },
  { width: 512, height: 512, name: "logo512.png" },
  { width: 180, height: 180, name: "apple-touch-icon.png" },
];

// Create output directory
const outputDir = path.join(__dirname, "../public");
if (!fs.existsSync(outputDir)) {
  fs.mkdirSync(outputDir, { recursive: true });
}

// Process each size
async function generateIcons() {
  try {
    // Read the source image
    const sourceImage = await Jimp.read(sourceImagePath);

    // Generate each icon size
    for (const size of sizes) {
      console.log(`Generating ${size.name}...`);
      const cloned = sourceImage.clone();
      await cloned
        .resize(size.width, size.height)
        .writeAsync(path.join(outputDir, size.name));
    }

    // Create maskable icon with padding
    console.log("Generating maskable_icon.png...");
    const maskable = sourceImage.clone();
    const maskableSize = 192;
    const padding = 22;
    const totalSize = maskableSize + padding * 2;

    const background = new Jimp(totalSize, totalSize, 0x00000000);
    maskable.resize(maskableSize, maskableSize);

    background.composite(maskable, padding, padding);

    await background.writeAsync(path.join(outputDir, "maskable_icon.png"));

    console.log("\nPWA icons generated successfully!");
    console.log(
      "Note: favicon.ico must be generated separately, as Jimp doesn't support .ico format."
    );
    console.log(
      "You can use an online converter like favicon.io for that purpose."
    );
  } catch (error) {
    console.error("Error generating icons:", error);
  }
}

generateIcons();
