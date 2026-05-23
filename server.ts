import express from "express";
import path from "path";
import fs from "fs";
import AdmZip from "adm-zip";

async function startServer() {
  const app = express();
  const PORT = 3000;

  // Logging middleware
  app.use((req, res, next) => {
    console.log(`[HTTP] ${req.method} ${req.url}`);
    next();
  });

  // API route to build and download ZIP on-the-fly
  app.get("/api/download-zip", (req, res) => {
    console.log("Generating fresh, binary-safe ZIP archive for download...");
    try {
      const zip = new AdmZip();
      const rootDir = process.cwd();
      const zipFileName = "DATUM_Android_Capacitor_Project.zip";

      function shouldIgnore(relativePath: string) {
        const parts = relativePath.split(path.sep);
        
        // Ignore folders
        if (
          parts.includes("node_modules") ||
          parts.includes("dist") ||
          parts.includes(".git") ||
          parts.includes(".github") ||
          parts.includes("build")
        ) {
          return true;
        }

        // Ignore specific files
        const filename = parts[parts.length - 1];
        if (
          filename === zipFileName ||
          filename === "create-zip.js" ||
          filename === "package-lock.json"
        ) {
          return true;
        }

        return false;
      }

      function addFolderRecursive(currentDir: string) {
        const items = fs.readdirSync(currentDir);
        for (const item of items) {
          const fullPath = path.join(currentDir, item);
          const relativePath = path.relative(rootDir, fullPath);

          if (shouldIgnore(relativePath)) {
            continue;
          }

          const stat = fs.statSync(fullPath);
          if (stat.isDirectory()) {
            addFolderRecursive(fullPath);
          } else {
            const zipPath = path.dirname(relativePath);
            const targetZipFolder = zipPath === "." ? "" : zipPath;
            zip.addLocalFile(fullPath, targetZipFolder);
          }
        }
      }

      addFolderRecursive(rootDir);

      // Add self-contained capacitor-android core library to avoid requiring node_modules locally!
      const localCapacitorAndroidPath = path.join(rootDir, "node_modules/@capacitor/android/capacitor");
      if (fs.existsSync(localCapacitorAndroidPath)) {
        console.log("Adding local self-contained capacitor-android module to ZIP...");
        zip.addLocalFolder(localCapacitorAndroidPath, "android/capacitor-android");
      }

      // Generate buffer
      const buffer = zip.toBuffer();
      console.log(`In-memory ZIP successfully prepared: ${(buffer.length / 1024 / 1024).toFixed(2)} MB`);

      // Set headers for file download
      res.setHeader("Content-Type", "application/zip");
      res.setHeader("Content-Disposition", "attachment; filename=DATUM_Android_Capacitor_Project.zip");
      res.setHeader("Content-Length", buffer.length.toString());
      res.setHeader("Cache-Control", "no-cache");
      
      // Send binary buffer directly
      res.end(buffer);
    } catch (err: any) {
      console.error("Failed to compile ZIP archive:", err);
      res.status(500).send(`Failed to build ZIP archive safely: ${err.message}`);
    }
  });

  // Vite middleware for development
  if (process.env.NODE_ENV !== "production") {
    console.log("Starting server in DEVELOPMENT mode with Vite dev middleware...");
    const { createServer: createViteServer } = await import("vite");
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    console.log("Starting server in PRODUCTION mode with static file assets...");
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server fully started on http://0.0.0.0:${PORT}`);
  });
}

startServer().catch((err) => {
  console.error("Critical server startup crash:", err);
});
