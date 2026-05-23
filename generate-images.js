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
    console.log("Processing icon assets...");

    try {
      const baseImg = await Jimp.read(baseBuffer);

      // 1. Generate standard solid Google Play Store square listing icon (512x512) with NO transparency
      // This solves the Google Play alpha channel reject warning.
      const playStoreIcon = new Jimp({ width: 512, height: 512, color: 0xFDF9F1FF });
      const playIconResized = baseImg.clone().resize({ w: 400, h: 400 });
      playStoreIcon.composite(playIconResized, 56, 56);
      const playIconBuf = await playStoreIcon.getBuffer("image/png");
      fs.writeFileSync(path.join(publicDir, "icon-512.png"), playIconBuf);
      console.log("Restored solid, non-transparent icon-512.png successfully");

      // Generate other client Web/PWA launcher sizes
      const targetSizes = [72, 96, 128, 144, 152, 180, 192, 384];
      for (const size of targetSizes) {
        const resizedBg = new Jimp({ width: size, height: size, color: 0xFDF9F1FF });
        const iconSize = Math.round(size * 0.8);
        const iconResized = baseImg.clone().resize({ w: iconSize, h: iconSize });
        const offset = Math.round((size - iconSize) / 2);
        resizedBg.composite(iconResized, offset, offset);
        const buf = await resizedBg.getBuffer("image/png");
        fs.writeFileSync(path.join(publicDir, `icon-${size}.png`), buf);
        console.log(`Generated icon-${size}.png from 512px source successfully`);
      }

      // 2. Generate Android native launcher icons (legacy solid, round, and adaptive transparent foreground)
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

          // Standard solid legacy ic_launcher.png (non-adaptive)
          const icLauncherBg = new Jimp({ width: size, height: size, color: 0xFDF9F1FF });
          const mainSize = Math.round(size * 0.8);
          const legacyIcon = baseImg.clone().resize({ w: mainSize, h: mainSize });
          const legacyOffset = Math.round((size - mainSize) / 2);
          icLauncherBg.composite(legacyIcon, legacyOffset, legacyOffset);
          const icLauncherBuf = await icLauncherBg.getBuffer("image/png");
          fs.writeFileSync(path.join(mipmapDir, "ic_launcher.png"), icLauncherBuf);

          // Solid ic_launcher_round.png
          const icLauncherRoundBg = new Jimp({ width: size, height: size, color: 0xFDF9F1FF });
          icLauncherRoundBg.composite(legacyIcon, legacyOffset, legacyOffset);
          const icLauncherRoundBuf = await icLauncherRoundBg.getBuffer("image/png");
          fs.writeFileSync(path.join(mipmapDir, "ic_launcher_round.png"), icLauncherRoundBuf);

          // Core transparent ic_launcher_foreground.png (safe zone adaptive content)
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

      // 3. Generate high-end, store-listing certified Google Play Feature Graphic (1024x500 px)
      console.log("Generating high-end Google Play Feature Graphic (1024x500)...");
      const featGraphic = new Jimp({ width: 1024, height: 500, color: 0xFDF9F1FF });
      
      // Brand logo centered on left
      const logoForFeat = baseImg.clone().resize({ w: 180, h: 180 });
      featGraphic.composite(logoForFeat, 120, 160);
      
      const narrowPath = path.join(publicDir, "screenshot-narrow.jpg");
      if (fs.existsSync(narrowPath)) {
        const screenshotRaw = await Jimp.read(narrowPath);
        
        // Mockup frame configurations
        const mockWidth = 200;
        const mockHeight = 432;
        const screenshotMock = screenshotRaw.clone().resize({ w: mockWidth, h: mockHeight });
        
        // Bevel frame and drop shadows
        const shadow = new Jimp({ width: mockWidth + 16, height: mockHeight + 16, color: 0x1C1C171A });
        featGraphic.composite(shadow, 680, 48); // offset light drop shadow
        
        const frame = new Jimp({ width: mockWidth + 8, height: mockHeight + 8, color: 0x1C1C17FF });
        featGraphic.composite(frame, 676, 40); // smooth flagship border
        
        featGraphic.composite(screenshotMock, 680, 44);
      }
      const featBuf = await featGraphic.getBuffer("image/png");
      fs.writeFileSync(path.join(publicDir, "feature-graphic.png"), featBuf);
      console.log("Feature Graphic generated successfully at public/feature-graphic.png");

      // 4. Generate Portrait Store screenshots (1080x1920 px) in multiples
      console.log("Generating three premium Google Play Portrait Screenshots (1080x1920)...");
      if (fs.existsSync(narrowPath)) {
        const screenshotRaw = await Jimp.read(narrowPath);
        
        // Screenshot 1: BREATHE & ALIGN (Core Space)
        const shot1 = new Jimp({ width: 1080, height: 1920, color: 0xFDF9F1FF });
        const sh1Width = 720;
        const sh1Height = 1530;
        const sh1Resized = screenshotRaw.clone().resize({ w: sh1Width, h: sh1Height });
        
        const shadow1 = new Jimp({ width: sh1Width + 40, height: sh1Height + 40, color: 0x1C1C171A });
        shot1.composite(shadow1, 160, 270);
        
        const bezel1 = new Jimp({ width: sh1Width + 20, height: sh1Height + 20, color: 0x1C1C17FF });
        shot1.composite(bezel1, 170, 260);
        
        shot1.composite(sh1Resized, 180, 270);
        const shot1Buf = await shot1.getBuffer("image/png");
        fs.writeFileSync(path.join(publicDir, "screenshot-1-ritual.png"), shot1Buf);
        
        // Screenshot 2: TRACK PROGRESS (Focused Center View / Insights Screen)
        const shot2 = new Jimp({ width: 1080, height: 1920, color: 0xF2EDE5FF });
        const sh2CropY = Math.round(screenshotRaw.height * 0.15);
        const sh2CropH = Math.round(screenshotRaw.height * 0.85);
        const cropped2 = screenshotRaw.clone().crop({ x: 0, y: sh2CropY, w: screenshotRaw.width, h: sh2CropH });
        const sh2Resized = cropped2.resize({ w: sh1Width, h: sh1Height });
        
        const shadow2 = new Jimp({ width: sh1Width + 40, height: sh1Height + 40, color: 0x1C1C171A });
        shot2.composite(shadow2, 160, 270);
        
        const bezel2 = new Jimp({ width: sh1Width + 20, height: sh1Height + 20, color: 0x1C1C17FF });
        shot2.composite(bezel2, 170, 260);
        
        shot2.composite(sh2Resized, 180, 270);
        const shot2Buf = await shot2.getBuffer("image/png");
        fs.writeFileSync(path.join(publicDir, "screenshot-2-progress.png"), shot2Buf);

        // Screenshot 3: INTENTIONAL DESIGN (Focused Top View)
        const shot3 = new Jimp({ width: 1080, height: 1920, color: 0xFDF9F1FF });
        const cropped3 = screenshotRaw.clone().crop({ x: 0, y: 0, w: screenshotRaw.width, h: Math.round(screenshotRaw.height * 0.75) });
        const sh3Resized = cropped3.resize({ w: sh1Width, h: sh1Height });

        const shadow3 = new Jimp({ width: sh1Width + 40, height: sh1Height + 40, color: 0x1C1C171A });
        shot3.composite(shadow3, 160, 270);
        
        const bezel3 = new Jimp({ width: sh1Width + 20, height: sh1Height + 20, color: 0x1C1C17FF });
        shot3.composite(bezel3, 170, 260);
        
        shot3.composite(sh3Resized, 180, 270);
        const shot3Buf = await shot3.getBuffer("image/png");
        fs.writeFileSync(path.join(publicDir, "screenshot-3-utility.png"), shot3Buf);
        
        console.log("All Play Store screenshots compiled successfully!");
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
