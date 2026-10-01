import dotenv from "dotenv";
import dns from "node:dns";
// Trigger nodemon restart

dotenv.config();
dns.setServers(["8.8.8.8", "8.8.4.4"]);

import express from "express";
import cors from "cors";
import bodyParser from "body-parser";
import connectDB from "./config/db.js";

import usersettingRoutes from "./routes/User_Details/usersetting.js";
import authRoutes from "./routes/User_Details/login.js";
import flipbookRoutes from "./routes/Flipbook/flipbook.js";
import threedModelRoutes from "./routes/User_Details/threed_models.js";
import textureRoutes from "./routes/Texture/texture.js";
import exploreRoutes from "./routes/Explore/explore.js";
import profileRoutes from "./routes/User_Details/profile.js";
import activityRoutes from "./routes/User_Details/activity.js";
import compression from "compression";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

// Connect to database
connectDB();


import { SUPABASE_BUCKET, getSupabasePublicUrl, downloadFileFromSupabase } from "./config/supabase.js";
import { checkInkscapeVersion } from "./utils/inkscapeConverter.js";
import { checkLibreOfficeStatus } from "./utils/documentConverter.js";

console.log(`[Supabase] Storage integration initialized for bucket '${SUPABASE_BUCKET}'.`);

checkInkscapeVersion().then((status) => {
  if (status.available) {
    console.log(`[Inkscape] Connected successfully! Version: ${status.version} (${status.path}) | Node Package: ${status.hasNodePackage ? 'Loaded' : 'Pending npm i'}`);
  } else {
    console.warn(`[Inkscape] Warning: Not connected. ${status.error || ''}`);
  }
}).catch(() => {});

checkLibreOfficeStatus().then((status) => {
  if (status.available) {
    console.log(`[LibreOffice] Connected successfully! Version: ${status.version} (${status.path})`);
  } else {
    console.warn(`[LibreOffice] Note: soffice CLI not detected. Word/PowerPoint conversion requires LibreOffice installed.`);
  }
}).catch(() => {});

const mimeTypes = {
  ".glb": "model/gltf-binary",
  ".gltf": "model/gltf+json",
  ".obj": "text/plain",
  ".stl": "model/stl",
  ".png": "image/png",
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
  ".webp": "image/webp",
  ".json": "application/json",
  ".pdf": "application/pdf",
  ".svg": "image/svg+xml",
  ".html": "text/html",
  ".css": "text/css",
  ".js": "application/javascript",
  ".hdr": "image/vnd.radiance"
};


const app = express();
app.use(compression());

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Middleware
app.use(
  cors({
    origin: (origin, callback) => {
      // Allow all origins
      callback(null, true);
    },
    methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization", "X-Requested-With", "Accept"],
    credentials: true,
    optionsSuccessStatus: 200 // Some legacy browsers choke on 204
  }),
);

app.use(express.json({ limit: "500mb" }));
app.use(bodyParser.urlencoded({ limit: "500mb", extended: true }));

// Serve /uploads: check local storage first (handles files too large for Supabase or offline storage), then fallback/redirect to Supabase CDN
app.use("/uploads", (req, res) => {
  const relPath = req.path;

  // 1. Check if the file exists on local disk
  const localFilePath = path.join(__dirname, "uploads", relPath.replace(/^\/+/, ""));
  if (fs.existsSync(localFilePath) && !fs.statSync(localFilePath).isDirectory()) {
    return res.sendFile(localFilePath);
  }

  // 2. Otherwise redirect to Supabase Storage CDN
  try {
    const publicUrl = getSupabasePublicUrl(relPath);
    if (publicUrl) {
      res.setHeader("Cache-Control", "public, max-age=86400, immutable");
      return res.redirect(302, publicUrl);
    }
  } catch (err) {
    console.warn("[Supabase /uploads Redirect Error]:", err);
  }

  console.warn(`[/uploads] File not found in local storage or Supabase: ${relPath}`);
  return res.status(404).json({ message: "File not found in storage" });
});

app.use("/textures", express.static(path.join(__dirname, "Texture")));
app.use("/assets/bgimg", express.static(path.join(__dirname, "assets/bgimg"), { maxAge: '1d', immutable: true }));
app.use("/assets/Videos", express.static(path.join(__dirname, "assets/Videos"), { maxAge: '1d', immutable: true }));

// Serve Templates and Pop-Up Templates from Backend assets
app.use("/assets", express.static(path.join(__dirname, "assets"), {
  maxAge: '1d',
  setHeaders: (res, filePath) => {
    if (filePath.endsWith('.svg')) {
      res.setHeader('Content-Type', 'image/svg+xml');
    }
  }
}));
app.use("/assets/Templates", express.static(path.join(__dirname, "assets", "Templates"), {
  maxAge: '1d',
  setHeaders: (res, filePath) => {
    if (filePath.endsWith('.svg')) res.setHeader('Content-Type', 'image/svg+xml');
  }
}));
app.use(["/assets/Pop-Up%20Templates", "/assets/Pop-Up Templates", "/assets/Pop-Up-Templates", "/assets/popup-templates"], express.static(path.join(__dirname, "assets", "Pop-Up Templates"), {
  maxAge: '1d',
  setHeaders: (res, filePath) => {
    if (filePath.endsWith('.svg')) res.setHeader('Content-Type', 'image/svg+xml');
  }
}));

// API endpoints to dynamically list available assets
app.get("/api/templates/assets-list", (req, res) => {
  const templatesDir = path.join(__dirname, "assets", "Templates");
  fs.readdir(templatesDir, (err, files) => {
    if (err) return res.status(500).json({ error: "Failed to read templates" });
    const svgFiles = (files || []).filter(f => f.endsWith(".svg"));
    res.json({ files: svgFiles });
  });
});

app.get("/api/popup-templates/assets-list", (req, res) => {
  const popupDir = path.join(__dirname, "assets", "Pop-Up Templates");
  fs.readdir(popupDir, (err, files) => {
    if (err) return res.status(500).json({ error: "Failed to read popup templates" });
    const svgFiles = (files || []).filter(f => f.endsWith(".svg"));
    res.json({ files: svgFiles });
  });
});

// API endpoint to discover all full book templates (directories with Page_*.svg)
app.get("/api/templates/books", (req, res) => {
  const templatesDir = path.join(__dirname, "assets", "Templates");
  if (!fs.existsSync(templatesDir)) {
    return res.json({ books: [] });
  }

  try {
    const entries = fs.readdirSync(templatesDir, { withFileTypes: true });
    const books = [];

    // Natural numeric sorting: Page_1.svg, Page_2.svg, ... Page_12.svg
    const naturalSort = (a, b) => {
      const numA = parseInt((a.match(/\d+/) || [0])[0], 10);
      const numB = parseInt((b.match(/\d+/) || [0])[0], 10);
      if (numA !== numB) return numA - numB;
      return a.localeCompare(b);
    };

    for (const entry of entries) {
      if (entry.isDirectory()) {
        const bookFolder = entry.name;
        if (bookFolder === 'popup_template') continue;

        const bookDirPath = path.join(templatesDir, bookFolder);
        const files = fs.readdirSync(bookDirPath);
        const svgFiles = files.filter(f => f.toLowerCase().endsWith('.svg')).sort(naturalSort);

        if (svgFiles.length > 0) {
          const firstPage = svgFiles[0];
          const pageUrls = svgFiles.map(f => `/assets/Templates/${encodeURIComponent(bookFolder)}/${encodeURIComponent(f)}`);

          const title = bookFolder.replace(/[-_]+/g, ' ').trim();

          books.push({
            id: bookFolder.toLowerCase().replace(/[^a-z0-9]+/g, '_'),
            folder: bookFolder,
            title: title,
            thumbnail: `/assets/Templates/${encodeURIComponent(bookFolder)}/${encodeURIComponent(firstPage)}`,
            pagesCount: svgFiles.length,
            pages: pageUrls,
            isMultiPageBook: true
          });
        }
      } else if (entry.isFile() && entry.name.toLowerCase().endsWith('.svg')) {
        const file = entry.name;
        const title = file.replace(/\.svg$/i, '').replace(/[-_]+/g, ' ').trim();
        books.push({
          id: file.toLowerCase().replace(/[^a-z0-9]+/g, '_'),
          title: title,
          thumbnail: `/assets/Templates/${encodeURIComponent(file)}`,
          pagesCount: 1,
          pages: [`/assets/Templates/${encodeURIComponent(file)}`],
          isMultiPageBook: false
        });
      }
    }

    res.json({ books });
  } catch (err) {
    console.error("[/api/templates/books Error]:", err);
    res.status(500).json({ error: "Failed to read template books" });
  }
});




// Basic Route
app.get("/", (req, res) => {
  res.send("API is running...");
});

// Routes
app.use("/api/auth", authRoutes);
app.use("/api/flipbook", flipbookRoutes);
app.use("/api/usersetting", usersettingRoutes);
app.use("/api/3d-models", threedModelRoutes);
app.use("/api/textures", textureRoutes);
app.use("/api/explore", exploreRoutes);
app.use("/api/profile", profileRoutes);
app.use("/api/activity", activityRoutes);

import { startBackgroundTempCleaner } from "./utils/tempCleaner.js";

const PORT = process.env.PORT || 5000;

// Global Error Handler
app.use((err, req, res, next) => {
  console.error("Global Error:", err);
  if (err.code === 'LIMIT_FILE_SIZE') {
    return res.status(413).json({ message: "File too large. Max limit is 500MB." });
  }
  res.status(err.status || 500).json({ 
    message: err.message || "Internal Server Error",
    error: process.env.NODE_ENV === 'development' ? err : {}
  });
});

const server = app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
  // Start automatic cleaner for temp uploads (purges files older than 10 minutes)
  startBackgroundTempCleaner(path.join(__dirname, "temp_uploads"));
});

// Extend server timeouts to 20 minutes for heavy 3D CAD/model conversions
server.timeout = 20 * 60 * 1000;
server.keepAliveTimeout = 65 * 1000;
server.headersTimeout = 70 * 1000;
if (server.requestTimeout !== undefined) {
  server.requestTimeout = 20 * 60 * 1000;
}
