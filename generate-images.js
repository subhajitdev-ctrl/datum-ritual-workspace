import fs from "fs";
import path from "path";

// Define paths
const base64JsonPath = path.join(process.cwd(), "src", "assets_base64.json");
const publicDir = path.join(process.cwd(), "public");

function main() {
  console.log("Restoring binary assets from base64 JSON...");
  
  if (!fs.existsSync(base64JsonPath)) {
    console.error("Error: src/assets_base64.json not found!");
    process.exit(1);
  }

  const data = JSON.parse(fs.readFileSync(base64JsonPath, "utf8"));
  
  // Ensure public directory exists
  if (!fs.existsSync(publicDir)) {
    fs.mkdirSync(publicDir, { recursive: true });
  }

  // Restore icon-192.png
  if (data.icon192) {
    fs.writeFileSync(path.join(publicDir, "icon-192.png"), Buffer.from(data.icon192, "base64"));
    console.log("Restored icon-192.png successfully");
  }

  // Restore icon-512.png
  if (data.icon512) {
    fs.writeFileSync(path.join(publicDir, "icon-512.png"), Buffer.from(data.icon512, "base64"));
    console.log("Restored icon-512.png successfully");
  }

  // Restore screenshot-wide.jpg
  if (data.screenshotWide) {
    fs.writeFileSync(path.join(publicDir, "screenshot-wide.jpg"), Buffer.from(data.screenshotWide, "base64"));
    console.log("Restored screenshot-wide.jpg successfully");
  }

  // Restore screenshot-narrow.jpg
  if (data.screenshotNarrow) {
    fs.writeFileSync(path.join(publicDir, "screenshot-narrow.jpg"), Buffer.from(data.screenshotNarrow, "base64"));
    console.log("Restored screenshot-narrow.jpg successfully");
  }

  console.log("All binary assets successfully restored from base64 storage!");
}

main();
