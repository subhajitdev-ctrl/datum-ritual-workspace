import fs from "fs";
import path from "path";
import { Jimp } from "jimp";

// Define paths
const base64JsonPath = path.join(process.cwd(), "src", "assets_base64.json");
const publicDir = path.join(process.cwd(), "public");

async function main() {
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

  // Restore icon-512.png and generate other sizes
  if (data.icon512) {
    const baseBuffer = Buffer.from(data.icon512, "base64");
    fs.writeFileSync(path.join(publicDir, "icon-512.png"), baseBuffer);
    console.log("Restored icon-512.png successfully");

    try {
      const baseImg = await Jimp.read(baseBuffer);
      const targetSizes = [72, 96, 128, 144, 152, 180, 192, 384];
      for (const size of targetSizes) {
        const resized = baseImg.clone().resize({ w: size, h: size });
        const buf = await resized.getBuffer("image/png");
        fs.writeFileSync(path.join(publicDir, `icon-${size}.png`), buf);
        console.log(`Generated icon-${size}.png from 512px source successfully`);
      }
    } catch (err) {
      console.error("Error resizing icons via Jimp:", err);
    }
  } else if (data.icon192) {
    // Fallback if icon512 was not present
    fs.writeFileSync(path.join(publicDir, "icon-192.png"), Buffer.from(data.icon192, "base64"));
    console.log("Restored icon-192.png fallback successfully");
  }

  console.log("All binary assets successfully restored from base64 storage!");
}

main().catch((err) => {
  console.error("Fatal error in generate-images:", err);
  process.exit(1);
});
