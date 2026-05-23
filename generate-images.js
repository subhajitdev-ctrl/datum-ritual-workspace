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

      // Generate Android native launcher icons (legacy, round, and adaptive foreground)
      const androidResDir = path.join(process.cwd(), "android", "app", "src", "main", "res");
      if (fs.existsSync(androidResDir)) {
        console.log("Generating Android native launcher icons...");
        const androidMipmaps = [
          { folder: "mipmap-mdpi", size: 48 },
          { folder: "mipmap-hdpi", size: 72 },
          { folder: "mipmap-xhdpi", size: 96 },
          { folder: "mipmap-xxhdpi", size: 144 },
          { folder: "mipmap-xxxhdpi", size: 192 }
        ];

        for (const mipmap of androidMipmaps) {
          const mipmapDir = path.join(androidResDir, mipmap.folder);
          if (!fs.existsSync(mipmapDir)) {
            fs.mkdirSync(mipmapDir, { recursive: true });
          }

          const size = mipmap.size;

          // 1. Generate standard ic_launcher.png
          const icLauncher = baseImg.clone().resize({ w: size, h: size });
          const icLauncherBuf = await icLauncher.getBuffer("image/png");
          fs.writeFileSync(path.join(mipmapDir, "ic_launcher.png"), icLauncherBuf);

          // 2. Generate ic_launcher_round.png
          const icLauncherRound = baseImg.clone().resize({ w: size, h: size });
          const icLauncherRoundBuf = await icLauncherRound.getBuffer("image/png");
          fs.writeFileSync(path.join(mipmapDir, "ic_launcher_round.png"), icLauncherRoundBuf);

          // 3. Generate ic_launcher_foreground.png (safe zone centered on transparent canvas)
          const fgSize = Math.round(size * 0.65);
          const fgIcon = baseImg.clone().resize({ w: fgSize, h: fgSize });
          const blankBg = new Jimp({ width: size, height: size, color: 0x00000000 });
          const offset = Math.round((size - fgSize) / 2);
          blankBg.composite(fgIcon, offset, offset);
          const fgBuf = await blankBg.getBuffer("image/png");
          fs.writeFileSync(path.join(mipmapDir, "ic_launcher_foreground.png"), fgBuf);

          console.log(`Generated Android launcher icons for ${mipmap.folder} (size: ${size}px) successfully`);
        }
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
