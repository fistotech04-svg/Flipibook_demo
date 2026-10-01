import express from "express";
import mongoose from "mongoose";
import fs from "fs";
import path from "path";
import crypto from "crypto";
import { fileURLToPath } from "url";
import nodemailer from "nodemailer";
import bcrypt from "bcryptjs";
import Flipbook from "../../models/Flipbook.js"; // Import Model
import Profile from "../../models/Profile.js"; // Import Profile Model
import { nanoid } from "nanoid";
import { PDFDocument } from "pdf-lib";

const compareKeys = async (input, stored) => {
  if (!input || !stored) return false;
  const inStr = String(input).trim();
  const stStr = String(stored).trim();

  if (stStr.startsWith('$2a$') || stStr.startsWith('$2b$')) {
    return await bcrypt.compare(inStr, stStr);
  }
  return inStr === stStr;
};
import multer from "multer";
import FlipbookAsset from "../../models/FlipbookAsset.js";
import UserSettings from "../../models/UserSettings.js";
import UserFolder from "../../models/UserFolder.js";
import ThreedModel from "../../models/ThreedModel.js";
import InteractionThreedModel from "../../models/InteractionThreedModel.js";

import { exec } from "child_process";
import { promisify } from "util";
import { uploadFileToSupabase, uploadBufferToSupabase, uploadFolderToSupabase, deleteFileFromSupabase, deleteFolderFromSupabase, ensureFlipbookFoldersInSupabase, renamePathInSupabase, copyPathInSupabase, downloadFileFromSupabase, rewriteUploadsToSupabase, listFoldersFromSupabase, listFilesInSupabaseFolder, getUserStorageSizeFromSupabase, getFolderSizeFromSupabase, getSupabasePublicUrl } from "../../config/supabase.js";
import { calculateActiveUserStorage } from "../User_Details/usersetting.js";
import { logActivity } from "../../utils/activityLogger.js";
import { convertPdfWithInkscape, checkInkscapeVersion, exportSvgsToVectorPdf } from "../../utils/inkscapeConverter.js";
import { convertOfficeToPdf, isOfficeDocument, checkLibreOfficeStatus } from "../../utils/documentConverter.js";

// Helper to get Gmail Transporter
const getTransporter = () => {
  const user = (process.env.EMAIL_USER || '').trim();
  const pass = (process.env.EMAIL_APP_PASSWORD || '').replace(/\s+/g, '');
  return nodemailer.createTransport({
    service: 'gmail',
    auth: {
      user: user,
      pass: pass,
    },
  });
};











const execAsync = promisify(exec);

import customizedSettingsRouter, {
  ensureBackgroundAssetInSupabase,
  ensureBrandingAssetInSupabase
} from "./customized_settings.js";

const router = express.Router();
router.use(customizedSettingsRouter);

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Root folder name for all flipbook storage
const FLIPBOOK_ROOT = "My_Flipbooks";

// Helper to escape regex special characters
const escapeRegex = (str) => str.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");




const processAndSaveBase64Assets = ({
  htmlContent,
  pageVId,
  sanitizedEmail,
  physicalFolderName,
  flipbookName,
  flipbookDir,
  flipbook_v_id,
  newFlipbookAssets = [],
  savedBase64Map = new Map(),
  skipBase64Extraction = false,
  pendingUploadPromises = []
}) => {
  if (!htmlContent) return "";
  if (skipBase64Extraction) return htmlContent;

  // Protect PDF Background elements from being extracted into separate asset files.
  // The PDF attributes (data-name="PDF Background", data-type="pdf-vector-layer", data-locked="true")
  // are set on a common enclosing <g> group rather than directly on <image> tags.
  // Any embedded image files existing within this group (e.g. photos, logos, graphics) must retain
  // their inline base64 content intact and NOT be converted to external files (./assets/Image/asset_...).
  const pdfBgPlaceholders = new Map();
  let contentToProcess = htmlContent;

  // 1. Protect entire <g data-name="PDF Background" ...> ... </g> groups (including nested <g> tags)
  const pdfBgGroupRegex = /<g\b[^>]*data-name=["'](?:PDF Background|pdf background)["'][^>]*>/gi;
  let gMatch;
  while ((gMatch = pdfBgGroupRegex.exec(contentToProcess)) !== null) {
    const startIdx = gMatch.index;
    let depth = 1;
    let currIdx = startIdx + gMatch[0].length;
    const tagRegex = /<\/?g\b[^>]*\/?>/gi;
    tagRegex.lastIndex = currIdx;
    let tagMatch;
    let endIdx = -1;
    while ((tagMatch = tagRegex.exec(contentToProcess)) !== null) {
      const tagStr = tagMatch[0];
      if (tagStr.startsWith('</')) {
        depth--;
        if (depth === 0) {
          endIdx = tagMatch.index + tagStr.length;
          break;
        }
      } else if (!tagStr.endsWith('/>')) {
        depth++;
      }
    }

    if (endIdx !== -1) {
      const fullGroup = contentToProcess.substring(startIdx, endIdx);
      const phKey = `__PDF_BG_GROUP_PH_${Math.random().toString(36).substr(2, 9)}__`;
      pdfBgPlaceholders.set(phKey, fullGroup);
      contentToProcess = contentToProcess.substring(0, startIdx) + phKey + contentToProcess.substring(endIdx);
      pdfBgGroupRegex.lastIndex = startIdx + phKey.length;
    } else {
      break;
    }
  }

  // 2. Also protect standalone <image ... data-name="PDF Background"> tags for backward compatibility
  const pdfBgTagRegex = /<image\b[^>]*data-name=["'](?:PDF Background|pdf background)["'][^>]*\/?>/gi;
  contentToProcess = contentToProcess.replace(pdfBgTagRegex, (tagMatch) => {
    const phKey = `__PDF_BG_IMAGE_PH_${Math.random().toString(36).substr(2, 9)}__`;
    pdfBgPlaceholders.set(phKey, tagMatch);
    return phKey;
  });

  const base64Regex = /data:([^;]+);base64,([^"&'<>)\s]+)/g;
  let processedHtml = contentToProcess.replace(base64Regex, (match, mimeType, base64Data) => {
    if (savedBase64Map.has(base64Data)) {
      return savedBase64Map.get(base64Data);
    }

    let isDownload = false;
    let actualMimeType = mimeType;
    if (mimeType.startsWith('download-')) {
      isDownload = true;
      actualMimeType = mimeType.replace('download-', '');
    }

    const parts = actualMimeType ? actualMimeType.split('/') : ['unknown', 'bin'];
    const type = parts[0] || 'unknown';
    const ext = parts[1] || 'bin';
    let subfolder = type;
    let normalizedExt = ext;
    
    if (isDownload) {
      subfolder = 'download';
    } else {
      if (type === 'image') subfolder = 'Image';
      else if (type === 'audio') subfolder = 'audio';
      else if (type === 'video') subfolder = 'video';
      else if (type === 'model' || ['glb', 'gltf', 'obj', 'stl'].includes(ext)) subfolder = '3D_Model';
      else subfolder = 'download';
    }

    if (!isDownload && ext === 'gif') subfolder = 'gif';
    if (normalizedExt.includes('+')) normalizedExt = normalizedExt.split('+')[0];
    
    const contentHash = crypto.createHash('md5').update(base64Data).digest('hex').slice(0, 16);
    const assetFileName = `asset_${contentHash}.${normalizedExt}`;
    const relativePath = `./assets/${subfolder}/${assetFileName}`;
    
    try {
      const buffer = Buffer.from(base64Data, 'base64');
      const assetDestPath = `${sanitizedEmail}/${FLIPBOOK_ROOT}/${physicalFolderName}/${flipbookName}/assets/${subfolder}/${assetFileName}`;
      
      const uploadPromise = uploadBufferToSupabase(buffer, assetDestPath, actualMimeType).catch(err => 
        console.warn("[Supabase] Asset upload warning:", err)
      );
      pendingUploadPromises.push(uploadPromise);

      const absoluteUrl = `/uploads/${sanitizedEmail}/${FLIPBOOK_ROOT}/${physicalFolderName}/${flipbookName}/assets/${subfolder}/${assetFileName}`;
      
      newFlipbookAssets.push({
        flipbook_v_id: flipbook_v_id,
        file_v_id: nanoid(),
        assetType: subfolder,
        fileName: assetFileName,
        page_v_id: pageVId,
        flipbookName: flipbookName,
        folderName: physicalFolderName,
        url: absoluteUrl,
        size: buffer.length
      });

      savedBase64Map.set(base64Data, relativePath);
      return relativePath;
    } catch(err) {
      console.error("Error saving base64 asset:", err);
      return match;
    }
  });

  // Restore protected PDF Background groups/tags with their original base64 content intact
  if (pdfBgPlaceholders.size > 0) {
    pdfBgPlaceholders.forEach((origTag, phKey) => {
      processedHtml = processedHtml.split(phKey).join(origTag);
    });
  }

  return processedHtml;
};


// Configure multer for asset uploads in temp_uploads
const assetStorage = multer.diskStorage({
  destination: (req, file, cb) => {
    const tempDir = path.join(__dirname, "../../temp_uploads/flipbook_assets");
    if (!fs.existsSync(tempDir)) {
      fs.mkdirSync(tempDir, { recursive: true });
    }
    cb(null, tempDir);
  },
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname);
    const uniqueName = `${nanoid()}${ext}`;
    cb(null, uniqueName);
  },
});

const assetUpload = multer({
  storage: assetStorage,
  limits: {
    fileSize: 50 * 1024 * 1024, // 50MB limit
  },
  fileFilter: (req, file, cb) => {
    const { assetType } = req.body;
    const allowedTypes = {
      Image: /jpeg|jpg|png|gif|webp|svg|bmp|avif|heic|heif|tiff|ico/i,
      video: /mp4|webm|ogg|mov/i,
      gif: /gif/i,
    };

    const ext = path.extname(file.originalname).toLowerCase().slice(1);
    const typePattern = allowedTypes[assetType];

    if (typePattern && typePattern.test(ext)) {
      cb(null, true);
    } else {
      cb(
        new Error(
          `Invalid file type for ${assetType}. Allowed: ${typePattern}`,
        ),
      );
    }
  },
});

// Configure multer for 3D model uploads in temp_uploads
const model3DStorage = multer.diskStorage({
  destination: (req, file, cb) => {
    const tempDir = path.join(__dirname, "../../temp_uploads/flipbook_assets");
    if (!fs.existsSync(tempDir)) {
      fs.mkdirSync(tempDir, { recursive: true });
    }
    cb(null, tempDir);
  },
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname);
    const uniqueName = `${nanoid()}${ext}`;
    cb(null, uniqueName);
  },
});

const model3DUpload = multer({
  storage: model3DStorage,
  limits: {
    fileSize: 500 * 1024 * 1024, // 500MB limit for 3D models
  },
  fileFilter: (req, file, cb) => {
    const ext = path.extname(file.originalname).toLowerCase();
    const allowed = [".glb", ".gltf", ".obj", ".stl", ".fbx"];
    if (allowed.includes(ext)) {
      cb(null, true);
    } else {
      cb(new Error(`Invalid file type for 3D model. Allowed: ${allowed.join(", ")}`));
    }
  },
});

// Configure multer for branding asset uploads (Logo, Watermark, Preloader images)
const brandingStorage = multer.diskStorage({
  destination: (req, file, cb) => {
    const tempDir = path.join(__dirname, "../../temp_uploads/branding_assets");
    if (!fs.existsSync(tempDir)) {
      fs.mkdirSync(tempDir, { recursive: true });
    }
    cb(null, tempDir);
  },
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname);
    const uniqueName = `${nanoid()}${ext}`;
    cb(null, uniqueName);
  },
});

const brandingUpload = multer({
  storage: brandingStorage,
  limits: {
    fileSize: 50 * 1024 * 1024, // 50MB limit for branding assets
  },
  fileFilter: (req, file, cb) => {
    const ext = path.extname(file.originalname).toLowerCase();
    const allowed = [".png", ".jpg", ".jpeg", ".gif", ".webp", ".svg", ".bmp", ".avif", ".heic", ".heif", ".tiff", ".ico"];
    if (allowed.includes(ext)) {
      cb(null, true);
    } else {
      cb(new Error(`Invalid image file type for branding asset. Allowed: ${allowed.join(", ")}`));
    }
  },
});

// Configure multer for PDF uploads in temp_uploads (for vector Inkscape conversion)
const pdfStorage = multer.diskStorage({
  destination: (req, file, cb) => {
    const tempDir = path.join(__dirname, "../../temp_uploads/pdf_uploads");
    if (!fs.existsSync(tempDir)) {
      fs.mkdirSync(tempDir, { recursive: true });
    }
    cb(null, tempDir);
  },
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname) || ".pdf";
    const uniqueName = `pdf_${nanoid()}${ext}`;
    cb(null, uniqueName);
  },
});

const pdfUpload = multer({
  storage: pdfStorage,
  limits: {
    fileSize: 500 * 1024 * 1024, // 500MB limit for high-res vector PDFs
  },
  fileFilter: (req, file, cb) => {
    const ext = path.extname(file.originalname).toLowerCase();
    const allowedExts = [".pdf", ".doc", ".docx", ".ppt", ".pptx", ".odt", ".odp", ".rtf", ".txt"];
    if (allowedExts.includes(ext) || file.mimetype === "application/pdf") {
      cb(null, true);
    } else {
      cb(new Error("Allowed formats: PDF, Word (.doc, .docx), and PowerPoint (.ppt, .pptx)."));
    }
  },
});

// @route   POST /api/flipbook/upload-3d-model
// @desc    Upload a 3D model file into the flipbook's assets/3D_Model folder
// @access  Public
router.post("/upload-3d-model", (req, res) => {
  model3DUpload.single("model")(req, res, async (err) => {
    if (err instanceof multer.MulterError) {
      console.error("Multer Error (3D model):", err);
      return res.status(413).json({ message: `Upload error: ${err.message}` });
    } else if (err) {
      console.error("Upload Error (3D model):", err);
      return res.status(500).json({ message: err.message || "Server error during upload" });
    }

    try {
      const { emailId, folderName, flipbookName } = req.body;
      if (!emailId || !folderName || !flipbookName) {
        if (req.file && fs.existsSync(req.file.path)) fs.unlinkSync(req.file.path);
        return res.status(400).json({ message: "Missing required fields" });
      }
      if (!req.file) {
        return res.status(400).json({ message: "No file uploaded" });
      }

      // Relative URL stored in the page HTML (flipbook-portable)
      const relativeUrl = `./assets/3D_Model/${req.file.filename}`;
      const type = path.extname(req.file.filename).slice(1);
      const sizeStr = (req.file.size / (1024 * 1024)).toFixed(2) + " MB";

      const sanitizedEmail = emailId.replace(/[@.]/g, "_");

      // ── Upload 3D model to Supabase Storage under flipbook assets/3D_Model ──
      const flipbookAssetSupabasePath = `${sanitizedEmail}/${FLIPBOOK_ROOT}/${folderName}/${flipbookName}/assets/3D_Model/${req.file.filename}`;
      await uploadFileToSupabase(req.file.path, flipbookAssetSupabasePath).catch((err) =>
        console.warn("[Supabase] 3D Model flipbook asset upload warning:", err)
      );

      // ── Resolve flipbook_v_id ──────────────────────────────────────────────
      let flipbook_v_id = req.body.flipbook_v_id || req.body.v_id || null;
      if (!flipbook_v_id) {
        try {
          const existingFb = await Flipbook.findOne({ userEmail: emailId, folderName, flipbookName });
          if (existingFb) flipbook_v_id = existingFb.v_id;
        } catch (e) {}
      }

      // ── Resolve hotspots & displayName ─────────────────────────────────────
      let hotspots = [];
      if (req.body.hotspots) {
        try {
          hotspots = typeof req.body.hotspots === 'string' ? JSON.parse(req.body.hotspots) : req.body.hotspots;
        } catch (e) {}
      } else if (req.body.sourceModelId) {
        try {
          const src = await ThreedModel.findOne({ modelId: req.body.sourceModelId }) || await InteractionThreedModel.findOne({ v_id: req.body.sourceModelId });
          if (src && src.hotspots) hotspots = src.hotspots;
        } catch (e) {}
      }

      // ── Save to InteractionThreedModel for flipbook-specific record ────────
      const newInteractionModel = await InteractionThreedModel.create({
        v_id: nanoid(20),
        flipbook_v_id: flipbook_v_id || null,
        userEmail: emailId,
        flipbookName,
        folderName,
        fileName: req.file.filename,
        displayName: req.body.displayName || null,
        url: relativeUrl,
        size: sizeStr,
        type: type,
        hotspots: Array.isArray(hotspots) ? hotspots : []
      });

      // ── Also copy to user's global 3D_Modals in Supabase ──────────────────────
      let globalUrl = null;
      if (req.body.skipGlobalGallery !== 'true') {
        const globalSupabasePath = `${sanitizedEmail}/3D_Modals/${req.file.filename}`;
        await uploadFileToSupabase(req.file.path, globalSupabasePath).catch((err) =>
          console.warn("[Supabase] Global 3D Model upload warning:", err)
        );

        globalUrl = `/uploads/${sanitizedEmail}/3D_Modals/${req.file.filename}`;

        const existingModel = await ThreedModel.findOne({
          userEmail: emailId,
          name: req.file.filename,
        });

        if (!existingModel) {
          await ThreedModel.create({
            userEmail: emailId,
            name: req.file.filename,
            displayName: req.body.displayName || null,
            url: globalUrl,
            type,
            size: sizeStr,
            hotspots: Array.isArray(hotspots) ? hotspots : []
          });
        }
      }

      // Cleanup local temp file
      if (req.file && fs.existsSync(req.file.path)) {
        try { fs.unlinkSync(req.file.path); } catch(e) {}
      }

      res.status(200).json({
        message: "3D model uploaded successfully",
        url: relativeUrl,       // relative path for page HTML
        globalUrl,              // absolute path in 3D_Modals gallery
        filename: req.file.filename,
        v_id: newInteractionModel.v_id,
        displayName: newInteractionModel.displayName,
        hotspots: newInteractionModel.hotspots || []
      });
    } catch (error) {
      if (req.file && fs.existsSync(req.file.path)) {
        try { fs.unlinkSync(req.file.path); } catch(e) {}
      }
      console.error("Error processing 3D model upload:", error);
      res.status(500).json({ success: false, message: "Internal server error", error: error.message });
    }
  });
});

// @route   POST /api/flipbook/save/chunk
// @desc    Upload a chunk of page content
router.post("/save/chunk", async (req, res) => {
  try {
    const { uploadId, chunkIndex, totalChunks, chunkData } = req.body;
    if (!uploadId || chunkIndex === undefined || !chunkData) {
      return res.status(400).json({ message: "Missing chunk metadata" });
    }

    const tempDir = path.join(__dirname, "../../temp_uploads", uploadId);
    if (!fs.existsSync(tempDir)) {
      fs.mkdirSync(tempDir, { recursive: true });
    }

    const chunkPath = path.join(tempDir, `chunk_${chunkIndex}`);
    fs.writeFileSync(chunkPath, chunkData, "utf8");

    res.status(200).json({ message: "Chunk uploaded", chunkIndex });
  } catch (error) {
    console.error("Error uploading chunk:", error);
    res.status(500).json({ message: "Chunk upload failed" });
  }
});

// @route   POST /api/flipbook/save
// @desc    Save user flipbook as HTML files
// @access  Public (should be protected in production)
router.post("/save", async (req, res) => {
  try {
    const { emailId, flipbookName, pages, overwrite, folderName, keepBase64: reqKeepBase64 } = req.body;

    if (!emailId || !flipbookName || !pages || !Array.isArray(pages)) {
      return res
        .status(400)
        .json({
          message:
            "Missing required fields: emailId, flipbookName, or pages array",
        });
    }

    // Sanitize email to match the formatting used in login.js
    const sanitizedEmail = emailId.replace(/[@.]/g, "_");

    // Determine target folder (default to 'My_Flipbooks' if not specified or special non-folder view)
    const rawFolderName = folderName ? folderName.replace(/[^a-zA-Z0-9 _-]/g, "").trim() : "";
    const isSpecialView = !rawFolderName || rawFolderName === 'All Flipbook' || rawFolderName === 'All Flipbooks' || rawFolderName === 'Recent Book' || rawFolderName === 'Recent' || rawFolderName === 'Trash' || rawFolderName === 'Favorites';
    const targetFolder = isSpecialView ? "My_Flipbooks" : rawFolderName;

    // Paths
    const uploadsDir = path.join(__dirname, "../../uploads");
    const myFlipbooksDir = path.join(
      uploadsDir,
      sanitizedEmail,
      FLIPBOOK_ROOT,
    );

    // Fetch existing doc to detect renames and determine correct physical path
    let existingDoc = null;
    if (req.body.v_id) {
      existingDoc = await Flipbook.findOne({
        userEmail: emailId,
        v_id: req.body.v_id,
      });
    } else {
      existingDoc = await Flipbook.findOne({
        userEmail: emailId,
        flipbookName: flipbookName,
        folderName: targetFolder,
      });
    }

    // PHYSICAL PATH RESOLUTION
    let physicalFolderName = (targetFolder && targetFolder !== "Recent Book" && targetFolder !== "Recent book")
      ? targetFolder
      : "My_Flipbooks";

    // If updating an existing book, use its existing physical folder (to handle 'Recent Book' cases)
    if (existingDoc && existingDoc.folderName) {
      const folders = Array.isArray(existingDoc.folderName)
        ? existingDoc.folderName
        : [existingDoc.folderName];
      // The "Real" folder is the one that isn't 'Recent Book'
      const realFolder = folders.find(
        (f) => f !== "Recent Book" && f !== "Recent book",
      );
      if (realFolder) physicalFolderName = realFolder;
    }

    let oldFlipbookName = null;

    // SUPABASE FOLDER RENAME DETECTION
    if (existingDoc && existingDoc.flipbookName !== flipbookName) {
      oldFlipbookName = existingDoc.flipbookName;
      const oldPath = `${sanitizedEmail}/${FLIPBOOK_ROOT}/${physicalFolderName}/${oldFlipbookName}`;
      const newPath = `${sanitizedEmail}/${FLIPBOOK_ROOT}/${physicalFolderName}/${flipbookName}`;
      await renamePathInSupabase(oldPath, newPath).catch(err =>
        console.warn("[Supabase] Rename flipbook folder warning:", err)
      );

      // PRE-PROCESS PAGES: Update URLs in the current request payload to reflect new name
      const escapedFolder = escapeRegex(physicalFolderName).replace(/ /g, "(?: |%20)");
      const escapedOldName = escapeRegex(oldFlipbookName).replace(/ /g, "(?: |%20)");
      const pathRegex = new RegExp(`/[^/]+/${escapedFolder}/${escapedOldName}/`, "g");
      const replacementPath = `/${FLIPBOOK_ROOT}/${physicalFolderName}/${flipbookName}/`;

      pages.forEach((p) => {
        if (p.content) {
          p.content = p.content.replace(pathRegex, replacementPath);
        }
      });
      console.log(`Updated URLs in ${pages.length} pages in memory before write.`);
    }

    const savedPages = [];
    const dbPages = [];
    const savedFileNames = new Set();
    const newPageIds = new Set();

    // Ensure Default Assets Folders exist in Supabase Storage
    ensureFlipbookFoldersInSupabase(sanitizedEmail, physicalFolderName, flipbookName).catch(err =>
      console.warn("[Supabase] Auto subfolder create warning:", err)
    );

    // Cache to prevent saving the same base64 string multiple times
    const savedBase64Map = new Map();
    const newFlipbookAssets = [];
    const pendingUploadPromises = [];
    const pageUploadPromises = [];
    const flipbook_v_id = req.body.v_id || (existingDoc ? existingDoc.v_id : nanoid(20));
    const keepBase64 = reqKeepBase64 !== undefined ? Boolean(reqKeepBase64) : false;

    const extractBase64AndSave = (htmlContent, pageVId) => {
      return processAndSaveBase64Assets({
        htmlContent,
        pageVId,
        sanitizedEmail,
        physicalFolderName,
        flipbookName,
        flipbookDir: "",
        flipbook_v_id,
        newFlipbookAssets,
        savedBase64Map,
        pendingUploadPromises,
        skipBase64Extraction: keepBase64
      });
    };

    const pageHtmlMap = new Map();
    const modifiedPageIds = new Set();
    const usedPageVIds = new Set();
    let allHtmlContents = "";

    for (let i = 0; i < pages.length; i++) {
      const page = pages[i];
      const { pageName, content, hide, v_id: incomingPageVId } = page;
      if (!pageName) continue;

      const baseFileName = pageName.endsWith(".html")
        ? pageName
        : `${pageName}.html`;

      let fileName = baseFileName;
      if (savedFileNames.has(fileName)) {
        const ext = path.extname(baseFileName) || ".html";
        const base = path.basename(baseFileName, ext);
        let counter = 2;
        while (savedFileNames.has(`${base} (${counter})${ext}`)) {
          counter++;
        }
        fileName = `${base} (${counter})${ext}`;
      }

      // Resolve pageVId early so we can use it for DB assets
      let pageVId = incomingPageVId;
      if (!pageVId && existingDoc && existingDoc.pages) {
        const existingPage = existingDoc.pages.find((p) => p.name === pageName);
        if (existingPage && existingPage.v_id && !usedPageVIds.has(existingPage.v_id)) {
          pageVId = existingPage.v_id;
        }
      }
      if (!pageVId || usedPageVIds.has(pageVId)) {
        pageVId = nanoid();
      }
      usedPageVIds.add(pageVId);

      const pageDestPath = `${sanitizedEmail}/${FLIPBOOK_ROOT}/${physicalFolderName}/${flipbookName}/${fileName}`;
      let processedContent = "";

      const isContentProvided = (content !== undefined && content !== null) || page.contentChunkId !== undefined;

      if (content !== undefined && content !== null) {
        processedContent = extractBase64AndSave(content, pageVId);
        const pageBuffer = Buffer.from(processedContent, "utf8");
        pageUploadPromises.push(uploadBufferToSupabase(pageBuffer, pageDestPath, "text/html").catch(err => console.warn("[Supabase] Page upload warning:", err)));
      } else if (page.contentChunkId) {
        // Reassemble from chunks in temp_uploads
        const tempDir = path.join(__dirname, "../../temp_uploads", page.contentChunkId);
        if (fs.existsSync(tempDir)) {
          const chunks = fs.readdirSync(tempDir).sort((a, b) => {
            return parseInt(a.split('_')[1]) - parseInt(b.split('_')[1]);
          });
          
          let assembledContent = "";
          for (const chunkFile of chunks) {
            assembledContent += fs.readFileSync(path.join(tempDir, chunkFile), "utf8");
          }
          
          processedContent = extractBase64AndSave(assembledContent, pageVId);
          const pageBuffer = Buffer.from(processedContent, "utf8");
          pageUploadPromises.push(uploadBufferToSupabase(pageBuffer, pageDestPath, "text/html").catch(err => console.warn("[Supabase] Page upload warning:", err)));
          
          // Cleanup chunks after save
          try { fs.rmSync(tempDir, { recursive: true, force: true }); } catch (e) {}
        }
      } else if (incomingPageVId && existingDoc && existingDoc.pages) {
        // Fallback: If content was not sent for a duplicated page whose destination file is new,
        // copy the file content from the source page in existingDoc
        const srcPage = existingDoc.pages.find(p => p.v_id === incomingPageVId);
        if (srcPage && srcPage.fileName && srcPage.fileName !== fileName) {
          const srcPath = `${sanitizedEmail}/${FLIPBOOK_ROOT}/${physicalFolderName}/${flipbookName}/${srcPage.fileName}`;
          const copyPromise = downloadFileFromSupabase(srcPath).then(async (buf) => {
            if (buf && buf.length > 0) {
              await uploadBufferToSupabase(buf, pageDestPath, "text/html");
            }
          }).catch(err => console.warn("[Supabase] Fallback page copy warning:", err));
          pageUploadPromises.push(copyPromise);
        }
      }

      if (isContentProvided && processedContent) {
        allHtmlContents += " " + processedContent;
        pageHtmlMap.set(pageVId, processedContent.toLowerCase());
        modifiedPageIds.add(pageVId);
      }

      savedPages.push(fileName);
      savedFileNames.add(fileName);

      const existingPage = existingDoc?.pages?.find((p) => p.name === pageName || (pageVId && p.v_id === pageVId));
      const existingPageSize = existingPage?.size || 0;
      const pageSize = (isContentProvided && processedContent)
        ? Buffer.byteLength(processedContent, 'utf8')
        : (page.size || existingPageSize);

      dbPages.push({
        pageNumber: i + 1,
        name: pageName,
        fileName: fileName,
        hide: hide || 0,
        v_id: pageVId,
        size: pageSize,
      });
    }

    // Await all base64 Supabase asset uploads and page HTML uploads concurrently
    const allPendingUploads = [...pendingUploadPromises, ...pageUploadPromises];
    if (allPendingUploads.length > 0) {
      await Promise.all(allPendingUploads);
      console.log(`[Save] Awaited and stored ${pendingUploadPromises.length} extracted assets and ${pageUploadPromises.length} pages in Supabase.`);
    }

    const incomingFlipbookInfo = req.body.FlipbookInfo || req.body.Customized_Settings?.FlipbookInfo || req.body.meta || {};
    const totalPagesSize = dbPages.reduce((sum, p) => sum + (p.size || 0), 0);
    const existingTotalSize = existingDoc?.fileSize || 0;
    const requestedFileSize = req.body.fileSize || incomingFlipbookInfo.fileSize || incomingFlipbookInfo.pdfSize;

    let calculatedFileSize = 0;
    if (requestedFileSize && requestedFileSize > 0) {
      calculatedFileSize = requestedFileSize;
    } else if (totalPagesSize > 0) {
      calculatedFileSize = totalPagesSize;
    } else if (existingTotalSize > 0) {
      calculatedFileSize = existingTotalSize;
    }

    // Upsert base64 assets into DB (prevents duplicate DB rows for identical asset filenames)
    if (newFlipbookAssets.length > 0) {
      try {
        for (const assetObj of newFlipbookAssets) {
          await FlipbookAsset.updateOne(
            { flipbook_v_id: assetObj.flipbook_v_id, fileName: assetObj.fileName },
            { $set: assetObj },
            { upsert: true }
          );
        }
        console.log(`Upserted ${newFlipbookAssets.length} extracted base64 assets in DB`);
      } catch (err) {
        console.error("Error upserting extracted assets:", err);
      }
    }

    // Handle Cascading Deletion & Deduplication of DB Asset Records
    try {
      let currentFlipbookVId = req.body.v_id || (existingDoc && existingDoc.v_id) || flipbook_v_id;
      const allHtmlLower = allHtmlContents ? allHtmlContents.toLowerCase() : "";
      const existingPageVIds = new Set(existingDoc && existingDoc.pages ? existingDoc.pages.map(p => p.v_id) : []);
      
      // Determine if all pages in the flipbook were submitted in this save request
      const totalBookPagesCount = existingDoc?.pages?.length || pages.length;
      const allPagesSavedInRequest = modifiedPageIds.size >= totalBookPagesCount;

      // 1. Clean up FlipbookAsset records: ONLY delete if asset is truly removed from all canvas pages AND saved
      const allFlipbookAssets = await FlipbookAsset.find({ flipbook_v_id: currentFlipbookVId });
      const seenAssets = new Set();
      const deletionPromises = [];
      
      for (const asset of allFlipbookAssets) {
        // Protect global gallery & user library assets from being deleted during flipbook save
        const isGalleryAsset = (
          asset.folderName === 'Gallery' ||
          asset.isGallery === true ||
          (asset.url && (
            asset.url.toLowerCase().includes(`/${sanitizedEmail}/images/`) ||
            asset.url.toLowerCase().includes(`/${sanitizedEmail}/videos/`) ||
            asset.url.toLowerCase().includes(`/${sanitizedEmail}/gifs/`) ||
            asset.url.toLowerCase().includes(`/${sanitizedEmail}/3d_models/`) ||
            asset.url.toLowerCase().includes(`/${sanitizedEmail}/3d_modals/`) ||
            asset.url.toLowerCase().includes(`/${sanitizedEmail}/texture/`) ||
            asset.url.toLowerCase().includes(`/${sanitizedEmail}/profile/`) ||
            asset.url.toLowerCase().includes(`/${sanitizedEmail}/company_logo/`) ||
            asset.url.toLowerCase().includes('/images/') ||
            asset.url.toLowerCase().includes('/videos/') ||
            asset.url.toLowerCase().includes('/gifs/') ||
            asset.url.toLowerCase().includes('/3d_models/') ||
            asset.url.toLowerCase().includes('/3d_modals/')
          ))
        );

        // Check if the asset is used ANYWHERE across all saved pages of this flipbook
        const fileNameLower = asset.fileName ? asset.fileName.toLowerCase() : "";
        const fileVIdLower = asset.file_v_id ? asset.file_v_id.toLowerCase() : "";
        const encodedFileNameLower = asset.fileName ? encodeURIComponent(asset.fileName).toLowerCase() : "";
        let urlBaseNameLower = "";
        try {
          if (asset.url) {
            urlBaseNameLower = path.basename(decodeURIComponent(asset.url)).toLowerCase();
          }
        } catch(e) {}

        const isAssetUsedInFlipbook = (
          (fileNameLower && allHtmlLower.includes(fileNameLower)) ||
          (fileVIdLower && allHtmlLower.includes(fileVIdLower)) ||
          (encodedFileNameLower && allHtmlLower.includes(encodedFileNameLower)) ||
          (urlBaseNameLower && allHtmlLower.includes(urlBaseNameLower)) ||
          (asset.url && allHtmlLower.includes(asset.url.toLowerCase()))
        );

        // If not all pages were provided in this save request, only check assets whose page was actually modified
        const isTargetPageChecked = allPagesSavedInRequest || (asset.page_v_id && modifiedPageIds.has(asset.page_v_id));

        // An asset is removed from the canvas ONLY if its page was checked, the asset is NOT used anywhere in the canvas,
        // and it's not a gallery file.
        const isCanvasSaved = allHtmlLower.trim().length > 0;
        const isRemovedFromCanvas = isCanvasSaved && isTargetPageChecked && !isAssetUsedInFlipbook && !isGalleryAsset;

        if (isRemovedFromCanvas) {
          console.log(`[Save Cleanup] Processing canvas-removed asset from Supabase: ${asset.fileName}`);
          const assetSubFolder = asset.assetType || "Image";
          const supabaseAssetPath = `${sanitizedEmail}/${FLIPBOOK_ROOT}/${physicalFolderName}/${flipbookName}/assets/${assetSubFolder}/${asset.fileName}`;
          
          deletionPromises.push(
            deleteFileFromSupabase(supabaseAssetPath).catch((e) =>
              console.warn("[Supabase] Delete orphaned asset warning:", e)
            )
          );
          if (asset.url && !isGalleryAsset) {
            deletionPromises.push(
              deleteFileFromSupabase(asset.url).catch((e) =>
                console.warn("[Supabase] Delete orphaned asset URL warning:", e)
              )
            );
          }
          await FlipbookAsset.deleteOne({ _id: asset._id });
        } else if (seenAssets.has(asset.fileName)) {
          console.log(`[Save Cleanup] Purging duplicate DB asset document: ${asset.fileName}`);
          await FlipbookAsset.deleteOne({ _id: asset._id });
        } else {
          seenAssets.add(asset.fileName);
        }
      }

      // 2. Clean up unreferenced InteractionThreedModel records & files (ONLY when entire flipbook is saved and model is truly removed)
      if (allPagesSavedInRequest && allHtmlLower.trim().length > 0) {
        const all3DModels = await InteractionThreedModel.find({
          userEmail: emailId,
          $or: [
            { flipbook_v_id: currentFlipbookVId },
            { flipbookName: flipbookName }
          ]
        });

        for (const model of all3DModels) {
          const isGalleryModel = model.url && (
            model.url.toLowerCase().includes('/3d_models/') ||
            model.url.toLowerCase().includes('/3d_modals/') ||
            model.url.toLowerCase().includes(`/${sanitizedEmail}/3d_models/`) ||
            model.url.toLowerCase().includes(`/${sanitizedEmail}/3d_modals/`)
          );

          const modelFileNameLower = model.fileName ? model.fileName.toLowerCase() : "";
          const modelVIdLower = model.v_id ? model.v_id.toLowerCase() : "";
          const encodedFileNameLower = model.fileName ? encodeURIComponent(model.fileName).toLowerCase() : "";
          let urlBaseNameLower = "";
          try {
            if (model.url) {
              urlBaseNameLower = path.basename(decodeURIComponent(model.url)).toLowerCase();
            }
          } catch(e) {}

          const isModelUsed = (
            (modelFileNameLower && allHtmlLower.includes(modelFileNameLower)) ||
            (modelVIdLower && allHtmlLower.includes(modelVIdLower)) ||
            (encodedFileNameLower && allHtmlLower.includes(encodedFileNameLower)) ||
            (urlBaseNameLower && allHtmlLower.includes(urlBaseNameLower)) ||
            (model.url && allHtmlLower.includes(model.url.toLowerCase()))
          );

          if (!isGalleryModel && !isModelUsed) {
            console.log(`[Save Cleanup] Deleting removed 3D model from Supabase: ${model.fileName}`);
            const supabaseModelPath = `${sanitizedEmail}/${FLIPBOOK_ROOT}/${physicalFolderName}/${flipbookName}/assets/3D_Model/${model.fileName}`;
            deletionPromises.push(
              deleteFileFromSupabase(supabaseModelPath).catch((e) =>
                console.warn("[Supabase] Delete orphaned 3D model warning:", e)
              )
            );
            deletionPromises.push(
              deleteFileFromSupabase(`${sanitizedEmail}/${FLIPBOOK_ROOT}/${physicalFolderName}/${flipbookName}/assets/3D_Modals/${model.fileName}`).catch(() => {})
            );
            if (model.url) {
              deletionPromises.push(
                deleteFileFromSupabase(model.url).catch((e) =>
                  console.warn("[Supabase] Delete orphaned 3D model URL warning:", e)
                )
              );
            }
            await InteractionThreedModel.deleteOne({ _id: model._id });
          }
        }
      }

      // 3. Clean up deleted HTML page files from Supabase Storage
      if (existingDoc && existingDoc.pages) {
        for (const oldPage of existingDoc.pages) {
          if (oldPage.fileName && !savedFileNames.has(oldPage.fileName)) {
            console.log(`[Save Cleanup] Deleting removed page file from Supabase: ${oldPage.fileName}`);
            const supabasePagePath = `${sanitizedEmail}/${FLIPBOOK_ROOT}/${physicalFolderName}/${flipbookName}/${oldPage.fileName}`;
            deletionPromises.push(
              deleteFileFromSupabase(supabasePagePath).catch((e) =>
                console.warn("[Supabase] Delete removed page file warning:", e)
              )
            );
          }
        }
      }

      if (deletionPromises.length > 0) {
        await Promise.all(deletionPromises);
        console.log(`[Save Cleanup] Awaited and deleted ${deletionPromises.length} removed files from Supabase.`);
      }
    } catch (err) {
      console.error("Error cleaning up orphaned assets and pages:", err);
    }

    // Prepare Folder List for DB (Current Physical Folder + 'Recent Book')
    const folderList = [physicalFolderName];
    if (!folderList.includes("Recent Book")) {
      folderList.push("Recent Book");
    }
    const uniqueFolders = [...new Set(folderList)];

    // Save Metadata to MongoDB
    const v_id = flipbook_v_id; // Use the one we generated at the top

    if (oldFlipbookName) {
      console.log(
        `Flipbook rename detected in DB initialization: "${oldFlipbookName}" → "${flipbookName}"`,
      );
    }

    const updateQuery =
      req.body.v_id || (existingDoc && existingDoc.v_id)
        ? { userEmail: emailId, v_id: req.body.v_id || existingDoc.v_id }
        : {
            userEmail: emailId,
            flipbookName: flipbookName,
            folderName: physicalFolderName,
          };

    let templateIdVal = req.body.templateId || incomingFlipbookInfo.templateId || req.body.settings?.templateId;
    let orientationVal = req.body.orientation || incomingFlipbookInfo.orientation || req.body.settings?.orientation;
    const isSquare = (templateIdVal && templateIdVal.toLowerCase() === 'square') || (orientationVal && orientationVal.toLowerCase() === 'square');

    if (isSquare) {
      templateIdVal = 'square';
      orientationVal = 'square';
    }

    const widthVal = isSquare ? 210 : (req.body.width || incomingFlipbookInfo.width || req.body.settings?.width);
    const heightVal = isSquare ? 210 : (req.body.height || incomingFlipbookInfo.height || req.body.settings?.height);

    const existingShare = existingDoc?.share || existingDoc?.Customized_Settings?.Visibility || {};
    const effectiveShareId = existingShare.shareId || req.body.share?.shareId || req.body.Customized_Settings?.Visibility?.shareId || nanoid(12);

    const existingFlipbookInfo = existingDoc?.Customized_Settings?.FlipbookInfo || existingDoc?.meta || {};

    const mergedFlipbookInfo = {
      ...existingFlipbookInfo,
      ...incomingFlipbookInfo,
      flipbookName,
      folderName: uniqueFolders,
      ...(widthVal ? { width: Number(widthVal) } : {}),
      ...(heightVal ? { height: Number(heightVal) } : {}),
      ...(templateIdVal ? { templateId: templateIdVal } : {}),
      ...(orientationVal ? { orientation: orientationVal } : {})
    };

    const updateSet = {
      flipbookName: flipbookName, // Ensure name is updated if it changed
      pages: dbPages,
      ...(calculatedFileSize ? { fileSize: calculatedFileSize } : {}),
      lastUpdated: new Date(),
      folderName: uniqueFolders, // Update tags
      Customized_Settings: {
        ...(existingDoc?.Customized_Settings || {}),
        ...(req.body.Customized_Settings || {}),
        Visibility: {
          ...existingShare,
          ...(req.body.Customized_Settings?.Visibility || {}),
          shareId: effectiveShareId
        },
        FlipbookInfo: mergedFlipbookInfo
      }
    };

    const savedDoc = await Flipbook.findOneAndUpdate(
      updateQuery,
      {
        $set: updateSet,
        $setOnInsert: { v_id: v_id },
        $unset: { share: 1, settings: 1, meta: 1, category: 1, language: 1, tags: 1, quotes: 1, about: 1, width: 1, height: 1, templateId: 1, orientation: 1 }
      },
      { upsert: true, returnDocument: 'after', setDefaultsOnInsert: true },
    );

    // Automatically add newly created book to myShelf if not already present
    try {
      let profile = await Profile.findOne({ emailId: emailId.trim().toLowerCase() });
      if (!profile) {
        profile = new Profile({ emailId: emailId.trim().toLowerCase() });
      }
      if (!profile.myShelf) profile.myShelf = {};
      if (!profile.myShelf.folders) profile.myShelf.folders = [];
      if (!profile.myShelf.shelfCount) profile.myShelf.shelfCount = 1;
      
      let folder = profile.myShelf.folders.find(f => f.folderName === physicalFolderName);
      if (!folder) {
        profile.myShelf.folders.push({ folderName: physicalFolderName, shelf_design: 1, books: [] });
        folder = profile.myShelf.folders.find(f => f.folderName === physicalFolderName);
      }
      
      if (!folder.books) folder.books = [];
      
      const bookExists = folder.books.some(b => {
        const id = typeof b === 'string' ? b : b.v_id;
        return id === savedDoc.v_id;
      });
      
      if (!bookExists) {
        const currentCount = folder.books.length;
        folder.books.push({
          v_id: savedDoc.v_id,
          row: Math.floor(currentCount / 6),
          order: currentCount % 6
        });
        profile.updatedAt = new Date();
        profile.markModified('myShelf.folders');
        profile.markModified('myShelf');
        await profile.save();
        console.log(`Automatically added created book ${savedDoc.v_id} to myShelf in folder ${physicalFolderName}`);
      }
    } catch (shelfErr) {
      console.error("Error adding created book to myShelf:", shelfErr);
    }

    // FIFO Logic for 'Recent Book' Tag
    // Ensure v_id exists (backfill for legacy docs)
    if (!savedDoc.v_id) {
      savedDoc.v_id = nanoid(10);
      await savedDoc.save();
    }

    // UPDATE InteractionThreedModel and ASSET URLs IF FLIPBOOK WAS RENAMED OR SAVED
    try {
      if (oldFlipbookName && oldFlipbookName !== flipbookName) {
        console.log(`Updating InteractionThreedModel for renamed flipbook...`);
        await InteractionThreedModel.updateMany(
          { userEmail: emailId, flipbookName: oldFlipbookName },
          { $set: { flipbookName: flipbookName, flipbook_v_id: savedDoc.v_id } }
        );
      } else {
        await InteractionThreedModel.updateMany(
          { userEmail: emailId, flipbookName: flipbookName, $or: [{ flipbook_v_id: null }, { flipbook_v_id: "" }, { flipbook_v_id: { $exists: false } }] },
          { $set: { flipbook_v_id: savedDoc.v_id } }
        );
      }
    } catch (err) {
      console.error("Error updating InteractionThreedModel flipbook_v_id:", err);
    }

    if (oldFlipbookName && oldFlipbookName !== flipbookName) {
      try {
        console.log(`Updating assets for renamed flipbook...`);

        // Find all assets for this flipbook using v_id
        const assets = await FlipbookAsset.find({
          flipbook_v_id: savedDoc.v_id,
        });

        if (assets.length > 0) {
          // Update flipbookName field and reconstruct URL
          for (const asset of assets) {
            // Update the flipbookName field
            asset.flipbookName = flipbookName;

            // Reconstruct URL with new flipbook name
            // URL format: /uploads/{email}/My_Flipbooks/{folder}/{flipbook}/assets/{type}/{filename}
            const emailPart = asset.url.split(`/${FLIPBOOK_ROOT}/`)[0];
            asset.url = `${emailPart}/${FLIPBOOK_ROOT}/${asset.folderName}/${flipbookName}/assets/${asset.assetType}/${asset.fileName}`;

            await asset.save();
            console.log(`✓ Updated: ${asset.fileName}`);
          }

          console.log(
            `✅ Updated ${assets.length} asset(s) for renamed flipbook`,
          );
        } else {
          console.log(`No assets found for flipbook (v_id: ${savedDoc.v_id})`);
        }
      } catch (err) {
        console.error("❌ Error updating assets after rename:", err);
      }
    }

    // FIFO Logic for 'Recent Book' Tag
    try {
      const recentBooks = await Flipbook.find({
        userEmail: emailId,
        folderName: "Recent Book",
      }).sort({ lastUpdated: -1 }); // Newest first

      if (recentBooks.length > 10) {
        const toRemoveTag = recentBooks.slice(10); // The oldest ones

        for (const book of toRemoveTag) {
          // Remove 'Recent Book' from folderName array
          await Flipbook.updateOne(
            { _id: book._id },
            { $pull: { folderName: "Recent Book" } },
          );
        }
      }
    } catch (err) {
      console.error("Error enforcing Recent Book tag limit:", err);
    }

    const supabaseLocation = `/uploads/${sanitizedEmail}/${FLIPBOOK_ROOT}/${physicalFolderName}/${flipbookName}`;

    // Log user activity
    logActivity({
      userEmail: emailId,
      type: existingDoc ? 'edit_flip' : 'create',
      title: existingDoc ? 'You edited a flipbook' : 'You created a new flipbook',
      desc: existingDoc ? `Flipbook: ${flipbookName}` : `Flipbook name: ${flipbookName}`,
      entityId: savedDoc?.v_id,
      entityName: flipbookName
    });

    res.status(200).json({
      message: "Flipbook saved successfully",
      flipbookName,
      v_id: savedDoc.v_id,
      pages: savedDoc.pages,
      savedPagesCount: savedPages.length,
      location: supabaseLocation,
    });
  } catch (error) {
    console.error("Error saving flipbook:", error);
    res.status(500).json({ message: "Server error processing request", error: error.message, stack: error.stack });
  }
});

// @route  POST /api/flipbook/save-page
// @desc   Save / update a single page's HTML content for an existing flipbook.
//         Used when uploading large PDFs page-by-page to avoid oversized requests.
// @body   { emailId, v_id, pageName, content, pageNumber }
router.post("/save-page", async (req, res) => {
  try {
    const { emailId, v_id, pageName, content, pageNumber, keepBase64: reqKeepBase64 } = req.body;

    if (!emailId || !v_id || !pageName || content === undefined) {
      return res.status(400).json({ message: "Missing required fields: emailId, v_id, pageName, content" });
    }

    // Locate the flipbook document
    const doc = await Flipbook.findOne({ userEmail: emailId, v_id });
    if (!doc) {
      return res.status(404).json({ message: "Flipbook not found" });
    }

    // Resolve the physical folder (skip the virtual 'Recent Book' tag)
    const realFolders = Array.isArray(doc.folderName)
      ? doc.folderName.filter((f) => f !== "Recent Book" && f !== "Recent book")
      : [doc.folderName];
    const realFolder = realFolders[0] || "My_Flipbooks";

    const sanitizedEmail = emailId.replace(/[@.]/g, "_");
    const fileName = pageName.endsWith(".html") ? pageName : `${pageName}.html`;

    const keepBase64 = reqKeepBase64 !== undefined ? Boolean(reqKeepBase64) : false;
    const newFlipbookAssets = [];
    const processedContent = processAndSaveBase64Assets({
      htmlContent: content,
      pageVId: v_id,
      sanitizedEmail,
      physicalFolderName: realFolder,
      flipbookName: doc.flipbookName,
      flipbookDir: "",
      flipbook_v_id: doc.v_id,
      newFlipbookAssets,
      skipBase64Extraction: keepBase64
    });

    const pageDestPath = `${sanitizedEmail}/${FLIPBOOK_ROOT}/${realFolder}/${doc.flipbookName}/${fileName}`;
    const pageBuffer = Buffer.from(processedContent, "utf8");
    await uploadBufferToSupabase(pageBuffer, pageDestPath, "text/html").catch(err => console.warn("[Supabase] Page upload warning:", err));

    if (newFlipbookAssets.length > 0) {
      try {
        await FlipbookAsset.insertMany(newFlipbookAssets);
      } catch (err) {
        console.error("Error inserting extracted page assets:", err);
      }
    }

    // Update or insert this page in the DB pages array
    const pageSize = pageBuffer.length;
    const existingPageIdx = doc.pages ? doc.pages.findIndex((p) => p.name === pageName) : -1;
    if (existingPageIdx >= 0) {
      // Update existing page record
      doc.pages[existingPageIdx].fileName = fileName;
      if (pageNumber !== undefined) doc.pages[existingPageIdx].pageNumber = pageNumber;
      doc.pages[existingPageIdx].size = pageSize;
    } else {
      // Append new page record
      const newPageVId = `page_${Math.random().toString(36).substr(2, 9)}`;
      doc.pages = doc.pages || [];
      doc.pages.push({
        pageNumber: pageNumber || doc.pages.length + 1,
        name: pageName,
        fileName,
        v_id: newPageVId,
        size: pageSize,
      });
    }

    doc.fileSize = (doc.pages || []).reduce((sum, p) => sum + (p.size || 0), 0);
    doc.lastUpdated = new Date();
    doc.markModified("pages");
    await doc.save();

    res.status(200).json({ message: "Page saved", pageName, fileName });
  } catch (error) {
    console.error("Error saving page:", error);
    res.status(500).json({ message: "Server error saving page", error: error.message });
  }
});

// @route  POST /api/flipbook/save-pages-batch
// @desc   Save multiple pages' HTML content for an existing flipbook in one request.
//         Optimizes large PDF uploads by processing batches (e.g. 5-10 pages at a time).
// @body   { emailId, v_id, pages: [{ pageName, content, pageNumber }] }
router.post("/save-pages-batch", async (req, res) => {
  try {
    const { emailId, v_id, pages, keepBase64 = true } = req.body;

    if (!emailId || !v_id || !Array.isArray(pages) || pages.length === 0) {
      return res.status(400).json({ message: "Missing required fields or pages array is empty" });
    }

    // Locate the flipbook document
    const doc = await Flipbook.findOne({ userEmail: emailId, v_id });
    if (!doc) return res.status(404).json({ message: "Flipbook not found" });

    // Resolve the physical folder
    const realFolders = Array.isArray(doc.folderName)
      ? doc.folderName.filter((f) => f !== "Recent Book" && f !== "Recent book")
      : [doc.folderName];
    const realFolder = realFolders[0] || "My_Flipbooks";

    const sanitizedEmail = emailId.replace(/[@.]/g, "_");

    doc.pages = doc.pages || [];
    const newFlipbookAssets = [];
    const savedBase64Map = new Map();

    const uploadResults = await Promise.all(pages.map(async (page) => {
      const { pageName, content, pageNumber, v_id: pageVId } = page;
      const fileName = pageName.endsWith(".html") ? pageName : `${pageName}.html`;

      const processedContent = processAndSaveBase64Assets({
        htmlContent: content,
        pageVId: pageVId || `page_${Math.random().toString(36).substr(2, 9)}`,
        sanitizedEmail,
        physicalFolderName: realFolder,
        flipbookName: doc.flipbookName,
        flipbookDir: "",
        flipbook_v_id: doc.v_id,
        newFlipbookAssets,
        savedBase64Map,
        skipBase64Extraction: keepBase64
      });

      const pageDestPath = `${sanitizedEmail}/${FLIPBOOK_ROOT}/${realFolder}/${doc.flipbookName}/${fileName}`;
      const pageBuffer = Buffer.from(processedContent, "utf8");
      await uploadBufferToSupabase(pageBuffer, pageDestPath, "text/html").catch(err => console.warn("[Supabase] Page upload warning:", err));

      const pageSize = pageBuffer.length;
      return {
        pageName,
        fileName,
        pageNumber,
        pageVId,
        pageSize
      };
    }));

    for (const res of uploadResults) {
      const existingPageIdx = doc.pages.findIndex((p) => p.name === res.pageName);
      if (existingPageIdx >= 0) {
        doc.pages[existingPageIdx].fileName = res.fileName;
        if (res.pageNumber !== undefined) doc.pages[existingPageIdx].pageNumber = res.pageNumber;
        doc.pages[existingPageIdx].size = res.pageSize;
      } else {
        doc.pages.push({
          pageNumber: res.pageNumber || doc.pages.length + 1,
          name: res.pageName,
          fileName: res.fileName,
          v_id: res.pageVId || `page_${Math.random().toString(36).substr(2, 9)}`,
          size: res.pageSize,
        });
      }
    }

    if (newFlipbookAssets.length > 0) {
      try {
        await FlipbookAsset.insertMany(newFlipbookAssets);
      } catch (err) {
        console.error("Error inserting extracted batch assets:", err);
      }
    }

    if (req.body.fileSize && req.body.fileSize > 0) {
      doc.fileSize = req.body.fileSize;
    } else {
      const calculatedPagesSize = (doc.pages || []).reduce((sum, p) => sum + (p.size || 0), 0);
      if (calculatedPagesSize > 0) {
        doc.fileSize = calculatedPagesSize;
      }
    }

    doc.lastUpdated = new Date();
    doc.markModified("pages");
    await doc.save();

    res.status(200).json({ message: "Batch saved successfully", pagesSaved: pages.length });
  } catch (error) {
    console.error("Error saving pages batch:", error);
    res.status(500).json({ message: "Server error saving pages batch", error: error.message });
  }
});

// Helper to get folder size
const getDirSize = (dirPath) => {
  let size = 0;
  try {
    const files = fs.readdirSync(dirPath);
    for (const file of files) {
      const filePath = path.join(dirPath, file);
      const stats = fs.statSync(filePath);
      if (stats.isDirectory()) {
        size += getDirSize(filePath);
      } else {
        size += stats.size;
      }
    }
  } catch (e) {
    return 0;
  }
  return size;
};

const formatSize = (bytes) => {
  if (bytes === 0) return "0 B";
  const k = 1024;
  const sizes = ["B", "KB", "MB", "GB", "TB"];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i];
};

// @route   GET /api/flipbook/inkscape-status
// @desc    Check if Inkscape node package / executable is connected and available
router.get("/inkscape-status", async (req, res) => {
  try {
    const status = await checkInkscapeVersion();
    res.json(status);
  } catch (err) {
    res.status(500).json({ available: false, error: err.message });
  }
});

// @route   GET /api/flipbook/office-status
// @desc    Check if LibreOffice / document converter is connected and available
router.get("/office-status", async (req, res) => {
  try {
    const status = await checkLibreOfficeStatus();
    res.json(status);
  } catch (err) {
    res.status(500).json({ available: false, error: err.message });
  }
});

// @route   POST /api/flipbook/convert-office-to-pdf
// @desc    Convert uploaded Word (.doc, .docx) or PowerPoint (.ppt, .pptx) file to PDF
router.post("/convert-office-to-pdf", (req, res) => {
  pdfUpload.single("document")(req, res, async (err) => {
    if (err) {
      console.error("[Flipbook] Multer office upload error:", err);
      return res.status(400).json({ success: false, message: err.message });
    }

    const file = req.file || (req.files && req.files[0]);
    if (!file) {
      return res.status(400).json({ success: false, message: "No document file uploaded" });
    }

    const tempDocPath = file.path;
    const tempPdfPath = path.join(
      path.dirname(tempDocPath),
      `converted_${nanoid()}.pdf`
    );

    try {
      await convertOfficeToPdf(tempDocPath, tempPdfPath);

      if (!fs.existsSync(tempPdfPath) || fs.statSync(tempPdfPath).size === 0) {
        throw new Error("Conversion failed: Output PDF is empty");
      }

      const origName = file.originalname.replace(/\.[^/.]+$/, "") + ".pdf";
      res.setHeader("Content-Type", "application/pdf");
      res.setHeader("Content-Disposition", `attachment; filename="${encodeURIComponent(origName)}"`);

      const readStream = fs.createReadStream(tempPdfPath);
      readStream.pipe(res);

      readStream.on("close", () => {
        if (fs.existsSync(tempPdfPath)) {
          try { fs.unlinkSync(tempPdfPath); } catch (e) {}
        }
      });
    } catch (convErr) {
      console.error("[Flipbook] Document to PDF conversion error:", convErr);
      if (fs.existsSync(tempPdfPath)) {
        try { fs.unlinkSync(tempPdfPath); } catch (e) {}
      }
      const rawMsg = convErr.message || "";
      return res.status(400).json({
        success: false,
        isCorrupted: true,
        message: rawMsg.includes("is corrupted")
          ? rawMsg
          : `Your file "${file.originalname}" is corrupted, unreadable, or password-protected. Please check your document in PowerPoint/Word and try again.`
      });
    } finally {
      if (fs.existsSync(tempDocPath)) {
        try { fs.unlinkSync(tempDocPath); } catch (e) {}
      }
    }
  });
});

// @route   POST /api/flipbook/inspect-document
// @desc    Inspect uploaded PDF, Word (.doc, .docx), or PowerPoint (.ppt, .pptx) to get exact page/slide count and dimensions
router.post("/inspect-document", (req, res) => {
  pdfUpload.single("document")(req, res, async (err) => {
    if (err) {
      console.error("[Flipbook] Multer inspect upload error:", err);
      return res.status(400).json({ success: false, message: err.message });
    }

    const file = req.file || (req.files && req.files[0]);
    if (!file) {
      return res.status(400).json({ success: false, message: "No document file uploaded" });
    }

    const tempPath = file.path;
    const ext = path.extname(file.originalname).toLowerCase();
    let tempPdfPath = null;

    try {
      let targetPdfPath = tempPath;

      // 1. Fast-path: for PPTX, count slide XML files inside the zip directly in memory (~5ms)
      if (ext === ".pptx") {
        try {
          const AdmZipModule = await import("adm-zip");
          const AdmZip = AdmZipModule.default || AdmZipModule;
          const zip = new AdmZip(tempPath);
          const zipEntries = zip.getEntries();
          const slideEntries = zipEntries.filter((e) => /^ppt\/slides\/slide\d+\.xml$/i.test(e.entryName));
          if (slideEntries.length > 0) {
            let width = 297, height = 167;
            const presEntry = zip.getEntry("ppt/presentation.xml");
            if (presEntry) {
              const presXml = presEntry.getData().toString("utf8");
              const cxMatch = presXml.match(/<[a-z0-9:]*sldSz[^>]*cx=["'](\d+)["']/i);
              const cyMatch = presXml.match(/<[a-z0-9:]*sldSz[^>]*cy=["'](\d+)["']/i);
              if (cxMatch && cyMatch) {
                const cx = parseInt(cxMatch[1], 10);
                const cy = parseInt(cyMatch[1], 10);
                if (cx > 0 && cy > 0) {
                  width = Math.round((cx / 36000) * 10) / 10;
                  height = Math.round((cy / 36000) * 10) / 10;
                }
              }
            }
            return res.json({
              success: true,
              count: slideEntries.length,
              width,
              height,
              isUniform: true,
              pages: Array.from({ length: slideEntries.length }, (_, i) => ({
                pageNumber: i + 1,
                width,
                height
              }))
            });
          }
        } catch (zipErr) {
          console.warn("[Inspect] Fast PPTX inspection failed, falling back to LibreOffice:", zipErr.message);
        }
      }

      // 1b. Fast-path: for DOCX, extract page count and dimensions directly in memory (~5ms)
      if (ext === ".docx") {
        try {
          const AdmZipModule = await import("adm-zip");
          const AdmZip = AdmZipModule.default || AdmZipModule;
          const zip = new AdmZip(tempPath);
          let count = 1;
          let width = 210, height = 297;

          const appEntry = zip.getEntry("docProps/app.xml");
          if (appEntry) {
            const appXml = appEntry.getData().toString("utf8");
            const m = appXml.match(/<Pages>(\d+)<\/Pages>/i);
            if (m && parseInt(m[1], 10) > 0) count = parseInt(m[1], 10);
          }

          const docEntry = zip.getEntry("word/document.xml");
          if (docEntry) {
            const docXml = docEntry.getData().toString("utf8");
            const breaks = docXml.match(/<w:lastRenderedPageBreak\b|<w:br[^>]*w:type=["']page["']/gi);
            if (breaks && breaks.length + 1 > count) count = breaks.length + 1;

            const pgSzMatch = docXml.match(/<w:pgSz[^>]*w:w=["'](\d+)["'][^>]*w:h=["'](\d+)["']/i) ||
                              docXml.match(/<w:pgSz[^>]*w:h=["'](\d+)["'][^>]*w:w=["'](\d+)["']/i);
            if (pgSzMatch) {
              const isLandscape = /w:orient=["']landscape["']/i.test(pgSzMatch[0]);
              let wMm = Math.round((parseInt(pgSzMatch[1], 10) / 56.6929) * 10) / 10;
              let hMm = Math.round((parseInt(pgSzMatch[2], 10) / 56.6929) * 10) / 10;
              if (isLandscape && wMm < hMm) {
                const tmp = wMm; wMm = hMm; hMm = tmp;
              }
              width = wMm;
              height = hMm;
            }
          }

          return res.json({
            success: true,
            count,
            width,
            height,
            isUniform: true,
            pages: Array.from({ length: count }, (_, i) => ({
              pageNumber: i + 1,
              width,
              height
            }))
          });
        } catch (docxZipErr) {
          console.warn("[Inspect] Fast DOCX inspection failed, falling back to LibreOffice:", docxZipErr.message);
        }
      }

      // 2. If it's an Office document (.doc, .docx, .ppt), convert to PDF first via LibreOffice
      if (isOfficeDocument(file.originalname)) {
        tempPdfPath = path.join(path.dirname(tempPath), `inspect_${nanoid()}.pdf`);
        await convertOfficeToPdf(tempPath, tempPdfPath);
        targetPdfPath = tempPdfPath;
      }

      // 3. Verify PDF exists and has content
      if (!fs.existsSync(targetPdfPath) || fs.statSync(targetPdfPath).size === 0) {
        throw new Error("Unable to parse document: output PDF was empty");
      }

      // 4. Read PDF using pdf-lib for 100% exact page count & dimensions
      const pdfBytes = fs.readFileSync(targetPdfPath);
      const pdfDoc = await PDFDocument.load(pdfBytes, { ignoreEncryption: true });
      const count = pdfDoc.getPageCount();
      const pages = [];
      const ptToMm = 25.4 / 72;

      for (let i = 0; i < count; i++) {
        const page = pdfDoc.getPage(i);
        const { width: widthPt, height: heightPt } = page.getSize();
        const rotation = page.getRotation().angle;
        const isRotated = rotation === 90 || rotation === 270;
        const finalWidthPt = isRotated ? heightPt : widthPt;
        const finalHeightPt = isRotated ? widthPt : heightPt;
        const widthMm = Math.round(finalWidthPt * ptToMm * 10) / 10;
        const heightMm = Math.round(finalHeightPt * ptToMm * 10) / 10;
        pages.push({
          pageNumber: i + 1,
          width: widthMm,
          height: heightMm
        });
      }

      const firstPage = pages[0] || { width: 210, height: 297 };
      const isUniform = pages.every(
        (p) => Math.abs(p.width - firstPage.width) < 1 && Math.abs(p.height - firstPage.height) < 1
      );

      return res.json({
        success: true,
        count,
        width: firstPage.width,
        height: firstPage.height,
        isUniform,
        pages
      });
    } catch (inspectErr) {
      console.error("[Flipbook] Document inspection error:", inspectErr);
      const rawMsg = inspectErr.message || "";
      const isCorrupt = /corrupt|cannot be read|not be loaded|damaged|password|format error|failed to parse|invalid pdf|syntax error|unexpected end|end-of-file|could not be opened|command failed/i.test(rawMsg);
      return res.status(400).json({
        success: false,
        isCorrupted: isCorrupt,
        message: isCorrupt
          ? (rawMsg.includes("is corrupted") ? rawMsg : `Your file "${file.originalname}" is corrupted, unreadable, or password-protected. Please check your document and try again.`)
          : (rawMsg || "Failed to inspect document")
      });
    } finally {
      if (fs.existsSync(tempPath)) {
        try { fs.unlinkSync(tempPath); } catch (e) {}
      }
      if (tempPdfPath && fs.existsSync(tempPdfPath)) {
        try { fs.unlinkSync(tempPdfPath); } catch (e) {}
      }
    }
  });
});

// @route   POST /api/flipbook/convert-pdf-inkscape
// @desc    Convert uploaded PDF(s), Word, or PowerPoint into SVG pages with text outlined via Inkscape
router.post("/convert-pdf-inkscape", (req, res) => {
  pdfUpload.any()(req, res, async (err) => {
    if (err) {
      console.error("[Flipbook] Multer PDF/Document upload error:", err);
      return res.status(400).json({ success: false, message: err.message });
    }

    let files = req.files || (req.file ? [req.file] : []);
    if (!files || files.length === 0) {
      return res.status(400).json({ success: false, message: "No PDF or document file uploaded" });
    }

    // Deduplicate in case client sent the same file under multiple field names (e.g. 'pdf' and 'pdfs')
    const seenFiles = new Set();
    files = files.filter((f) => {
      const key = `${f.originalname}_${f.size}`;
      if (seenFiles.has(key)) {
        if (fs.existsSync(f.path)) {
          try { fs.unlinkSync(f.path); } catch (e) {}
        }
        return false;
      }
      seenFiles.add(key);
      return true;
    });

    const tempFilePaths = files.map((f) => f.path);
    const intermediatePdfs = [];

    try {
      const maxPages = req.body.maxPages ? parseInt(req.body.maxPages, 10) : Infinity;

      // If any file is a Word or PowerPoint document, convert it to PDF first
      const processedPdfPaths = [];
      for (const p of tempFilePaths) {
        if (isOfficeDocument(p)) {
          const outPdf = path.join(path.dirname(p), `doc_to_pdf_${nanoid()}.pdf`);
          await convertOfficeToPdf(p, outPdf);
          processedPdfPaths.push(outPdf);
          intermediatePdfs.push(outPdf);
        } else {
          processedPdfPaths.push(p);
        }
      }

      const result = await convertPdfWithInkscape(processedPdfPaths, { maxPages });

      return res.json({
        success: true,
        pages: result.pages,
        width: result.width,
        height: result.height,
        isUniform: result.isUniform,
        totalPages: result.totalPages
      });
    } catch (conversionErr) {
      console.error("[Flipbook] Inkscape / Document conversion error:", conversionErr);
      const rawMsg = conversionErr.message || "";
      const isCorrupt = /corrupt|cannot be read|not be loaded|damaged|password|format error|failed to parse|invalid pdf|syntax error|unexpected end|end-of-file|could not be opened|command failed/i.test(rawMsg);
      const firstFileName = files[0]?.originalname ? ` "${files[0].originalname}"` : "";
      return res.status(400).json({
        success: false,
        isCorrupted: isCorrupt,
        message: isCorrupt
          ? (rawMsg.includes("is corrupted") ? rawMsg : `Your file${firstFileName} is corrupted, unreadable, or password-protected. Please check your document and try again.`)
          : (rawMsg || "Failed to convert document with Inkscape")
      });
    } finally {
      tempFilePaths.forEach((p) => {
        if (fs.existsSync(p)) {
          try { fs.unlinkSync(p); } catch (e) {}
        }
      });
      intermediatePdfs.forEach((p) => {
        if (fs.existsSync(p)) {
          try { fs.unlinkSync(p); } catch (e) {}
        }
      });
    }
  });
});

// @route   POST /api/flipbook/export-vector-pdf
// @desc    Export SVG page(s) into a true vector PDF via Inkscape with text outlined into vector paths
router.post("/export-vector-pdf", async (req, res) => {
  try {
    const { pages, bookName } = req.body;
    if (!pages || !Array.isArray(pages) || pages.length === 0) {
      return res.status(400).json({ success: false, message: "No SVG pages provided for PDF export" });
    }

    const sanitizedBookName = (bookName || "flipbook").replace(/[^a-zA-Z0-9_-]/g, "_");
    console.log(`[Flipbook] Generating true vector PDF export for "${sanitizedBookName}" (${pages.length} pages)...`);

    const pdfBuffer = await exportSvgsToVectorPdf(pages, { bookName: sanitizedBookName });

    res.setHeader("Content-Type", "application/pdf");
    res.setHeader("Content-Disposition", `attachment; filename="${sanitizedBookName}.pdf"`);
    res.setHeader("Content-Length", pdfBuffer.length);
    return res.end(pdfBuffer);
  } catch (err) {
    console.error("[Flipbook] Vector PDF export error:", err);
    return res.status(500).json({
      success: false,
      message: err.message || "Failed to generate vector PDF"
    });
  }
});

// @route   GET /api/flipbook/list
// @desc    Get all flipbooks with metadata
router.get("/list", async (req, res) => {
  try {
    const { emailId } = req.query;
    if (!emailId) return res.status(400).json({ message: "Missing emailId" });

    const sanitizedEmail = emailId.replace(/[@.]/g, "_");
    const uploadsDir = path.join(__dirname, "../../uploads");
    const myFlipbooksDir = path.join(
      uploadsDir,
      sanitizedEmail,
      FLIPBOOK_ROOT,
    );

    // 0. Fetch all DB records for this user
    const userDbBooks = await Flipbook.find({ userEmail: emailId }).sort({ lastUpdated: -1 });

    // Fetch all assets for this user to use as thumbnails AND calculate sizes
    const bookVIds = userDbBooks.map((b) => b.v_id).filter(Boolean);
    const allAssets = await FlipbookAsset.find({
      $or: [
        { flipbook_v_id: { $in: bookVIds } },
        { userEmail: emailId }
      ]
    });

    const firstImageAssetMap = new Map();
    const bookSizeMap = new Map();

    allAssets.sort((a, b) =>
      (a.fileName || '').localeCompare(b.fileName || '', undefined, {
        numeric: true,
        sensitivity: "base",
      }),
    );
    allAssets.forEach((asset) => {
      if (asset.assetType === "image" && asset.flipbook_v_id && !firstImageAssetMap.has(asset.flipbook_v_id)) {
        firstImageAssetMap.set(asset.flipbook_v_id, asset.url);
      }

      if (asset.size && asset.flipbook_v_id) {
        const currentSize = bookSizeMap.get(asset.flipbook_v_id) || 0;
        bookSizeMap.set(asset.flipbook_v_id, currentSize + asset.size);
      }
    });

    const getFlipbookPhysicalSize = async (doc, realFolder) => {
      try {
        // 1. Check local disk first
        const bookPath = path.join(uploadsDir, sanitizedEmail, FLIPBOOK_ROOT, realFolder, doc.flipbookName);
        const diskSize = getDirSize(bookPath);
        if (diskSize > 0) return diskSize;

        // 2. Query physical size directly from Supabase Storage
        const supabasePath = `${sanitizedEmail}/${FLIPBOOK_ROOT}/${realFolder}/${doc.flipbookName}`;
        const supabaseSize = await getFolderSizeFromSupabase(supabasePath);
        if (supabaseSize > 0) return supabaseSize;

        // 3. Fallback to asset and page buffers if storage query was empty
        const assetSize = (doc.v_id && bookSizeMap.get(doc.v_id)) || 0;
        if (doc.pages && doc.pages.length > 0) {
          const pagesSize = doc.pages.reduce((acc, p) => acc + (p.size || 0), 0);
          if (pagesSize > 0) return pagesSize + assetSize;
        }
        if (assetSize > 0) return assetSize;
      } catch (e) {
        console.warn("Error getting physical size for book:", doc.flipbookName, e);
      }
      return 0;
    };

    // Calculate physical sizes in parallel for all user books
    const bookSizesList = await Promise.all(userDbBooks.map(async (doc) => {
      const realFolders = Array.isArray(doc.folderName)
        ? doc.folderName.filter((f) => f !== "Recent Book" && f !== "Recent book")
        : [doc.folderName];
      const folder = realFolders[0] || "My_Flipbooks";
      const size = await getFlipbookPhysicalSize(doc, folder);
      return { v_id: doc.v_id, size };
    }));

    const bookPhysicalSizeMap = new Map();
    bookSizesList.forEach(({ v_id, size }) => {
      if (v_id) bookPhysicalSizeMap.set(v_id, size);
    });

    let books = [];
    const processedVIds = new Set();

    // 1. Process all MongoDB DB books first (primary source of truth)
    for (const doc of userDbBooks) {
      if (doc.folderName === "Recent Book" || (Array.isArray(doc.folderName) && doc.folderName.length === 1 && doc.folderName[0] === "Recent Book")) {
        continue; // Handled in recentBooks section
      }

      const realFolders = Array.isArray(doc.folderName)
        ? doc.folderName.filter((f) => f !== "Recent Book" && f !== "Recent book")
        : [doc.folderName];
      const folder = realFolders[0] || "My_Flipbooks";

      const createdDate = doc.createdAt
        ? new Date(doc.createdAt).toLocaleDateString("en-GB").replace(/\//g, "-") + " " + new Date(doc.createdAt).toLocaleTimeString("en-US", { hour: '2-digit', minute: '2-digit' })
        : "";

      const rawSize = (doc.v_id && bookPhysicalSizeMap.get(doc.v_id)) || 0;

      processedVIds.add(doc.v_id);

      const flipbookInfo = doc.Customized_Settings?.FlipbookInfo || doc.meta || {};
      const quotes = flipbookInfo.quotes || doc.quotes || "";
      const about = flipbookInfo.about || doc.about || "";
      const category = flipbookInfo.category || doc.category || "Product Based";
      const language = flipbookInfo.language || doc.language || "English";
      const tags = flipbookInfo.tags || doc.tags || [];

      const actualViews = (Array.isArray(doc.viewers) && doc.viewers.length > 0)
        ? doc.viewers.length
        : (typeof doc.viewsCount === 'number' ? doc.viewsCount : 0);

      const isTrashed = Boolean(doc.trash);

      books.push({
        id: isTrashed ? `Trash_${doc.v_id || doc.flipbookName}` : `${folder}_${doc.flipbookName}`,
        v_id: doc.v_id,
        realName: doc.flipbookName,
        title: doc.flipbookName,
        folder: isTrashed ? "Trash" : folder,
        originalFolder: folder,
        pages: doc.pages ? doc.pages.length : 0,
        created: createdDate,
        trashedAt: doc.trashedAt || null,
        views: actualViews,
        viewsCount: actualViews,
        viewersCount: Array.isArray(doc.viewers) ? doc.viewers.length : 0,
        size: formatSize(rawSize),
        sizeBytes: rawSize,
        image: firstImageAssetMap.get(doc.v_id) || null,
        mtime: doc.lastUpdated || doc.createdAt,
        share: doc.Customized_Settings?.Visibility || doc.share || null,
        Visibility: doc.Customized_Settings?.Visibility || doc.share || null,
        isPublished: Boolean(doc.isPublished),
        isFavorite: Boolean(doc.isFavorite),
        trash: isTrashed,
        quotes: quotes,
        about: about,
        category: category,
        language: language,
        tags: tags,
        FlipbookInfo: flipbookInfo,
        Customized_Settings: doc.Customized_Settings || null,
      });
    }

    // 2. Generate 'Recent Book' view for all non-trashed user flipbooks sorted by lastUpdated
    const sortedUserBooks = [...userDbBooks]
      .filter((b) => !b.trash)
      .sort((a, b) => new Date(b.lastUpdated || b.createdAt) - new Date(a.lastUpdated || a.createdAt));

    const recentBooks = sortedUserBooks.map((doc) => {
      const realFolders = Array.isArray(doc.folderName)
        ? doc.folderName.filter((f) => f !== "Recent Book" && f !== "Recent book")
        : doc.folderName === "Recent Book"
          ? []
          : [doc.folderName];
      const realFolder = realFolders.length > 0 ? realFolders[0] : "My_Flipbooks";

      const createdDate = doc.createdAt
        ? new Date(doc.createdAt).toLocaleDateString("en-GB").replace(/\//g, "-") + " " + new Date(doc.createdAt).toLocaleTimeString("en-US", { hour: '2-digit', minute: '2-digit' })
        : "";

      const rawSize = (doc.v_id && bookPhysicalSizeMap.get(doc.v_id)) || 0;

      const flipbookInfo = doc.Customized_Settings?.FlipbookInfo || doc.meta || {};
      const quotes = flipbookInfo.quotes || doc.quotes || "";
      const about = flipbookInfo.about || doc.about || "";
      const category = flipbookInfo.category || doc.category || "Product Based";
      const language = flipbookInfo.language || doc.language || "English";
      const tags = flipbookInfo.tags || doc.tags || [];

      const actualViews = (Array.isArray(doc.viewers) && doc.viewers.length > 0)
        ? doc.viewers.length
        : (typeof doc.viewsCount === 'number' ? doc.viewsCount : 0);

      return {
        id: `Recent_${doc.v_id || doc.flipbookName}`,
        realName: doc.flipbookName,
        v_id: doc.v_id,
        title: doc.flipbookName,
        folder: "Recent Book",
        actualFolder: realFolder,
        pages: doc.pages ? doc.pages.length : 0,
        created: createdDate,
        views: actualViews,
        viewsCount: actualViews,
        viewersCount: Array.isArray(doc.viewers) ? doc.viewers.length : 0,
        size: formatSize(rawSize),
        sizeBytes: rawSize,
        image: firstImageAssetMap.get(doc.v_id) || null,
        mtime: doc.lastUpdated || doc.createdAt,
        share: doc.Customized_Settings?.Visibility || doc.share || null,
        Visibility: doc.Customized_Settings?.Visibility || doc.share || null,
        isPublished: Boolean(doc.isPublished),
        isFavorite: Boolean(doc.isFavorite),
        quotes: quotes,
        about: about,
        category: category,
        language: language,
        tags: tags,
        FlipbookInfo: flipbookInfo,
        Customized_Settings: doc.Customized_Settings || null,
      };
    });

    const allBooks = [...books, ...recentBooks];
    res.json({ books: allBooks });
  } catch (err) {
    console.error("Error in /list:", err);
    res.status(500).json({ message: "Server error" });
  }
});

// @route   GET /api/flipbook/preview/:v_id
// @desc    Return first-page HTML for a single flipbook (lazy preview)
// @access  Public
router.get("/preview/:v_id", async (req, res) => {
  try {
    const { v_id } = req.params;
    const { emailId: reqEmailId } = req.query;
    if (!v_id) {
      return res.status(400).json({ message: "Missing v_id" });
    }

    const doc = await Flipbook.findOne({ v_id });
    if (!doc) return res.status(404).json({ message: "Flipbook not found" });

    const emailId = reqEmailId || doc.userEmail;

    // Resolve physical folder (skip 'Recent Book' virtual tag)
    const realFolders = Array.isArray(doc.folderName)
      ? doc.folderName.filter((f) => f !== "Recent Book" && f !== "Recent book")
      : [doc.folderName];
    const realFolder = realFolders[0] || "My_Flipbooks";

    const sanitizedEmail = emailId.replace(/[@.]/g, "_");
    const bookPath = path.join(
      __dirname,
      "../../uploads",
      sanitizedEmail,
      FLIPBOOK_ROOT,
      realFolder,
      doc.flipbookName,
    );

    const visiblePages = doc.pages?.filter(p => p.hide != 1 && String(p.hide) !== '1') || [];
    const firstPage = visiblePages.length > 0 ? (visiblePages.find(p => p.pageNumber === 1) || visiblePages[0]) : null;
    if (!firstPage) return res.json({ html: null });

    let html = null;
    const supabasePath = `${sanitizedEmail}/${FLIPBOOK_ROOT}/${realFolder}/${doc.flipbookName}/${firstPage.fileName}`;
    const buf = await downloadFileFromSupabase(supabasePath);
    if (buf) {
      html = buf.toString("utf8");
    } else {
      const firstPagePath = path.join(bookPath, firstPage.fileName);
      if (fs.existsSync(firstPagePath)) {
        html = fs.readFileSync(firstPagePath, "utf8");
      }
    }


    res.json({ html });
  } catch (err) {
    console.error("Error fetching preview:", err);
    res.status(500).json({ message: "Server error" });
  }
});


// @route   GET /api/flipbook/folders
// @route   GET /api/flipbook/folders
// @desc    Get list of folders in My_Flipbooks with database-maintained id and order
// @access  Public
router.get("/folders", async (req, res) => {
  try {
    const { emailId } = req.query;
    if (!emailId) {
      return res.status(400).json({ message: "Missing emailId" });
    }

    const folderMap = new Map(); // name -> id (string)
    const sanitizedEmail = emailId.replace(/[@.]/g, "_");

    // 1. Fetch from UserFolder DB model
    const userFolderDoc = await UserFolder.findOne({ emailId: emailId.toLowerCase() });
    const rawStoredFolders = userFolderDoc?.folders || [];

    const isSystemFolder = (fName) => {
      if (!fName) return true;
      const lower = String(fName).toLowerCase().trim();
      return (
        lower === 'recent book' ||
        lower === 'recent' ||
        lower === 'public book' ||
        lower === 'trash' ||
        lower === 'all flipbook' ||
        lower === 'all flipbooks' ||
        lower === 'favorites'
      );
    };

    // Map existing stored folders (using default MongoDB _id / id)
    const dbOrder = [];
    rawStoredFolders.forEach((item) => {
      const name = typeof item === 'string' ? item : item?.name;
      const id = (item && (item._id || item.id)) ? String(item._id || item.id) : new mongoose.Types.ObjectId().toString();
      if (name && !isSystemFolder(name)) {
        if (!folderMap.has(name)) {
          folderMap.set(name, id);
          dbOrder.push({ id, name });
        }
      }
    });

    // Ensure default 'My_Flipbooks' folder is always present
    if (!folderMap.has("My_Flipbooks")) {
      const defaultId = new mongoose.Types.ObjectId().toString();
      folderMap.set("My_Flipbooks", defaultId);
      dbOrder.unshift({ id: defaultId, name: "My_Flipbooks" });
    }

    // 2. Fetch all folders from MongoDB Flipbook documents (legacy/existing documents)
    const dbBooks = await Flipbook.find({ userEmail: emailId });
    dbBooks.forEach((doc) => {
      if (Array.isArray(doc.folderName)) {
        doc.folderName.forEach((f) => {
          if (f && !isSystemFolder(f) && !folderMap.has(f)) {
            folderMap.set(f, new mongoose.Types.ObjectId().toString());
          }
        });
      } else if (doc.folderName && !isSystemFolder(doc.folderName) && !folderMap.has(doc.folderName)) {
        folderMap.set(doc.folderName, new mongoose.Types.ObjectId().toString());
      }
    });

    // 3. Fetch all folders from Supabase Storage
    const supabaseFolders = await listFoldersFromSupabase(sanitizedEmail);
    supabaseFolders.forEach((f) => {
      if (f && !isSystemFolder(f) && !folderMap.has(f)) {
        folderMap.set(f, new mongoose.Types.ObjectId().toString());
      }
    });

    // 4. Also check disk directory if present
    const uploadsDir = path.join(__dirname, "../../uploads");
    const myFlipbooksDir = path.join(uploadsDir, sanitizedEmail, FLIPBOOK_ROOT);
    if (fs.existsSync(myFlipbooksDir)) {
      try {
        const items = fs.readdirSync(myFlipbooksDir, { withFileTypes: true });
        items
          .filter((item) => item.isDirectory())
          .forEach((item) => {
            if (!isSystemFolder(item.name) && !folderMap.has(item.name)) {
              folderMap.set(item.name, new mongoose.Types.ObjectId().toString());
            }
          });
      } catch (e) {}
    }

    // 5. Construct final list maintaining saved order, appending newly discovered folders
    const orderedFolders = [];
    const addedNames = new Set();

    dbOrder.forEach((item) => {
      if (folderMap.has(item.name)) {
        orderedFolders.push(item);
        addedNames.add(item.name);
      }
    });

    Array.from(folderMap.entries()).forEach(([name, id]) => {
      if (!addedNames.has(name)) {
        orderedFolders.push({ id, name });
        addedNames.add(name);
      }
    });

    // Auto-sync UserFolder document in background if new folders or ids were added
    if (userFolderDoc) {
      userFolderDoc.folders = orderedFolders.map(f => ({
        _id: mongoose.Types.ObjectId.isValid(f.id) ? new mongoose.Types.ObjectId(f.id) : new mongoose.Types.ObjectId(),
        name: f.name
      }));
      userFolderDoc.save().catch(() => {});
    } else if (orderedFolders.length > 0) {
      UserFolder.create({
        emailId: emailId.toLowerCase(),
        folders: orderedFolders.map(f => ({
          _id: mongoose.Types.ObjectId.isValid(f.id) ? new mongoose.Types.ObjectId(f.id) : new mongoose.Types.ObjectId(),
          name: f.name
        }))
      }).catch(() => {});
    }

    res.status(200).json({ folders: orderedFolders });
  } catch (error) {
    console.error("Error fetching folders:", error);
    res.status(500).json({ message: "Server error" });
  }
});

// @route POST /api/flipbook/folder/reorder
// @desc  Persist rearranged folder order in MongoDB UserFolder schema
// @access Public
router.post("/folder/reorder", async (req, res) => {
  try {
    const { emailId, folders } = req.body;
    if (!emailId || !Array.isArray(folders)) {
      return res.status(400).json({ message: "Missing emailId or folders array" });
    }

    const safeFolders = folders
      .filter(f => {
        const name = typeof f === 'string' ? f : f?.name;
        return name && name !== "Recent Book" && name !== "Recent book" && name !== "Public Book";
      })
      .map(f => {
        const name = typeof f === 'string' ? f.trim() : String(f.name).trim();
        const rawId = typeof f === 'object' ? (f._id || f.id) : null;
        const mongoId = rawId && mongoose.Types.ObjectId.isValid(rawId)
          ? new mongoose.Types.ObjectId(rawId)
          : new mongoose.Types.ObjectId();
        return {
          _id: mongoId,
          name
        };
      });

    const updatedDoc = await UserFolder.findOneAndUpdate(
      { emailId: emailId.toLowerCase() },
      { $set: { folders: safeFolders } },
      { upsert: true, new: true, setDefaultsOnInsert: true }
    );

    const formattedFolders = (updatedDoc.folders || []).map(f => ({
      id: f._id ? f._id.toString() : String(f.id),
      name: f.name
    }));

    res.json({ message: "Folder order updated", folders: formattedFolders });
  } catch (err) {
    console.error("Error updating folder order:", err);
    res.status(500).json({ message: "Server error updating folder order" });
  }
});

// @route POST /api/flipbook/folder/create
router.post("/folder/create", async (req, res) => {
  try {
    const { emailId, folderName } = req.body;
    if (!emailId || !folderName)
      return res.status(400).json({ message: "Missing fields" });

    const sanitizedEmail = emailId.replace(/[@.]/g, "_");
    const safeFolderName = folderName.replace(/[^a-zA-Z0-9 _-]/g, "").trim();
    const newMongoId = new mongoose.Types.ObjectId();

    // 1. Maintain in MongoDB UserFolder document
    const userFolderDoc = await UserFolder.findOne({ emailId: emailId.toLowerCase() });
    if (userFolderDoc) {
      const exists = userFolderDoc.folders.some(f => f.name.toLowerCase() === safeFolderName.toLowerCase());
      if (!exists) {
        userFolderDoc.folders.push({ _id: newMongoId, name: safeFolderName });
        await userFolderDoc.save();
      }
    } else {
      await UserFolder.create({
        emailId: emailId.toLowerCase(),
        folders: [{ _id: newMongoId, name: safeFolderName }]
      });
    }

    // 2. Sync folder creation to Supabase Storage in background
    const supabaseFolderKeep = `${sanitizedEmail}/${FLIPBOOK_ROOT}/${safeFolderName}/.keep`;
    uploadBufferToSupabase(Buffer.from(""), supabaseFolderKeep, "text/plain").catch((err) =>
      console.warn("[Supabase] Folder create warning:", err)
    );

    res.json({ message: "Folder created", folder: safeFolderName, id: newMongoId.toString() });
  } catch (err) {
    console.error("Error creating folder:", err);
    res.status(500).json({ message: "Server error" });
  }
});

// @route DELETE /api/flipbook/folder
router.delete("/folder", async (req, res) => {
  try {
    const { emailId, folderName, folderId } = req.body;
    if (!emailId || (!folderName && !folderId))
      return res.status(400).json({ message: "Missing fields" });

    const sanitizedEmail = emailId.replace(/[@.]/g, "_");

    // 1. Remove from MongoDB UserFolder document immediately
    const filterConds = [];
    if (folderName) filterConds.push({ name: folderName });
    if (folderId && mongoose.Types.ObjectId.isValid(folderId)) {
      filterConds.push({ _id: new mongoose.Types.ObjectId(folderId) });
    }

    if (filterConds.length > 0) {
      await UserFolder.findOneAndUpdate(
        { emailId: emailId.toLowerCase() },
        { $pull: { folders: { $or: filterConds } } }
      ).catch(() => {});
    }

    // Respond immediately for super fast client response
    res.json({ message: "Folder deleted successfully" });

    // 2. Clean up flipbooks, assets, and storage in the background
    (async () => {
      try {
        if (folderName) {
          await Flipbook.deleteMany({
            userEmail: emailId,
            $or: [{ folderName: folderName }, { folderName: { $in: [folderName] } }]
          });

          await FlipbookAsset.deleteMany({
            userEmail: emailId,
            folderName: folderName
          });

          const supabasePrefix = `${sanitizedEmail}/${FLIPBOOK_ROOT}/${folderName}`;
          deleteFolderFromSupabase(supabasePrefix).catch(() => {});

          const uploadsDir = path.join(__dirname, "../../uploads");
          const localDir = path.join(uploadsDir, sanitizedEmail, FLIPBOOK_ROOT, folderName);
          if (fs.existsSync(localDir)) {
            try { fs.rmSync(localDir, { recursive: true, force: true }); } catch (e) {}
          }
        }
      } catch (bgErr) {
        console.error("Background folder cleanup error:", bgErr);
      }
    })();
  } catch (err) {
    console.error("Error deleting folder:", err);
    res.status(500).json({ message: "Server error deleting folder" });
  }
});

// @route POST /api/flipbook/folder/rename
router.post("/folder/rename", async (req, res) => {
  try {
    const { emailId, oldName, newName, folderId } = req.body;
    if (!emailId || !oldName || !newName)
      return res.status(400).json({ message: "Missing fields" });

    const sanitizedEmail = emailId.replace(/[@.]/g, "_");
    const safeNewName = newName.replace(/[^a-zA-Z0-9 _-]/g, "").trim();

    // 1. Update folder in MongoDB UserFolder schema instantly
    let resolvedId = folderId || null;
    const userFolderDoc = await UserFolder.findOne({ emailId: emailId.toLowerCase() });
    if (userFolderDoc && Array.isArray(userFolderDoc.folders)) {
      userFolderDoc.folders = userFolderDoc.folders.map(f => {
        const fIdStr = f._id ? f._id.toString() : (f.id ? String(f.id) : null);
        const isMatch = (folderId && fIdStr === String(folderId)) || f.name === oldName;
        if (isMatch) {
          resolvedId = fIdStr || resolvedId || new mongoose.Types.ObjectId().toString();
          return {
            _id: mongoose.Types.ObjectId.isValid(resolvedId) ? new mongoose.Types.ObjectId(resolvedId) : new mongoose.Types.ObjectId(),
            name: safeNewName
          };
        }
        return f;
      });
      await userFolderDoc.save();
    }

    // 2. Update Flipbook documents in MongoDB using fast bulk updateMany
    await Flipbook.updateMany(
      { userEmail: emailId, folderName: oldName },
      { $set: { "folderName.$[elem]": safeNewName, lastUpdated: new Date() } },
      { arrayFilters: [{ "elem": oldName }] }
    );

    // Handle flipbooks where folderName was a single string instead of array
    await Flipbook.updateMany(
      { userEmail: emailId, folderName: oldName },
      { $set: { folderName: [safeNewName], lastUpdated: new Date() } }
    );

    // Respond immediately so user rename is fast (<150ms)
    res.json({
      message: "Renamed successfully",
      newName: safeNewName,
      folderId: resolvedId
    });

    // 3. Heavy storage renames executed asynchronously in background without blocking the UI
    (async () => {
      try {
        const oldSupabasePrefix = `${sanitizedEmail}/${FLIPBOOK_ROOT}/${oldName}`;
        const newSupabasePrefix = `${sanitizedEmail}/${FLIPBOOK_ROOT}/${safeNewName}`;
        await renamePathInSupabase(oldSupabasePrefix, newSupabasePrefix).catch((err) =>
          console.warn("[Supabase] Background folder rename warning:", err)
        );

        // Update assets
        const assets = await FlipbookAsset.find({
          userEmail: emailId,
          $or: [{ folderName: oldName }, { url: { $regex: new RegExp(`/${FLIPBOOK_ROOT}/${oldName}/`) } }]
        });

        for (const asset of assets) {
          asset.folderName = safeNewName;
          if (asset.url) {
            asset.url = asset.url.replace(
              `/${FLIPBOOK_ROOT}/${oldName}/`,
              `/${FLIPBOOK_ROOT}/${safeNewName}/`
            );
          }
          await asset.save();
        }
      } catch (bgErr) {
        console.warn("Background storage rename error:", bgErr);
      }
    })();

  } catch (err) {
    console.error("Error renaming folder:", err);
    res.status(500).json({ message: "Server error" });
  }
});

// @route POST /api/flipbook/folder/duplicate
router.post("/folder/duplicate", async (req, res) => {
  try {
    const { emailId, folderName } = req.body;
    if (!emailId || !folderName)
      return res.status(400).json({ message: "Missing fields" });

    const sanitizedEmail = emailId.replace(/[@.]/g, "_");

    // Fetch MongoDB Documents for this folder
    const sourceDocs = await Flipbook.find({
      userEmail: emailId,
      $or: [{ folderName: folderName }, { folderName: { $in: [folderName] } }]
    });

    if (sourceDocs.length === 0) {
      return res.status(404).json({ message: "Folder not found" });
    }

    // Determine unique copy name
    const existingDbBooks = await Flipbook.find({ userEmail: emailId });
    const existingFolders = new Set();
    existingDbBooks.forEach(b => {
      if (Array.isArray(b.folderName)) b.folderName.forEach(f => existingFolders.add(f));
      else if (b.folderName) existingFolders.add(b.folderName);
    });

    let copyName = `${folderName}_Copy`;
    let counter = 1;
    while (existingFolders.has(copyName)) {
      copyName = `${folderName}_Copy_${counter}`;
      counter++;
    }

    // Initialize .keep in Supabase Storage for the duplicated folder
    const supabaseFolderKeep = `${sanitizedEmail}/${FLIPBOOK_ROOT}/${copyName}/.keep`;
    await uploadBufferToSupabase(Buffer.from(""), supabaseFolderKeep, "text/plain").catch(() => {});

    // Copy MongoDB Documents & Rename each book to <bookName>_copy
    for (const doc of sourceDocs) {
      const newBookName = `${doc.flipbookName}_copy`;
      const newVId = nanoid(20);
      const pageIdMap = new Map();

      const newPages = (doc.pages || []).map((page) => {
        const newPageVId = nanoid(20);
        if (page.v_id) pageIdMap.set(page.v_id, newPageVId);

        return {
          pageNumber: page.pageNumber,
          name: page.name,
          fileName: page.fileName,
          v_id: newPageVId,
          size: page.size || 0,
        };
      });

      await Flipbook.create({
        userEmail: doc.userEmail,
        folderName: [copyName],
        flipbookName: newBookName,
        pages: newPages,
        fileSize: doc.fileSize || 0,
        v_id: newVId,
        Customized_Settings: {
          ...(doc.Customized_Settings || doc.settings || {}),
          Visibility: {
            shareId: nanoid(12),
            access: doc.Customized_Settings?.Visibility?.access || doc.share?.access || 'public'
          },
          FlipbookInfo: {
            ...(doc.Customized_Settings?.FlipbookInfo || doc.meta || {}),
            flipbookName: newBookName,
            folderName: [copyName]
          }
        },
        lastUpdated: new Date(),
      });

      // Duplicate asset records
      const sourceAssets = await FlipbookAsset.find({ flipbook_v_id: doc.v_id });
      if (sourceAssets.length > 0) {
        const newAssets = sourceAssets.map(asset => {
          const assetObj = asset.toObject();
          delete assetObj._id;
          assetObj.flipbook_v_id = newVId;
          assetObj.folderName = copyName;
          assetObj.flipbookName = newBookName;
          assetObj.file_v_id = nanoid(20);
          if (assetObj.page_v_id && pageIdMap.has(assetObj.page_v_id)) {
            assetObj.page_v_id = pageIdMap.get(assetObj.page_v_id);
          }
          if (assetObj.url) {
            assetObj.url = assetObj.url
              .replace(`/${FLIPBOOK_ROOT}/${folderName}/`, `/${FLIPBOOK_ROOT}/${copyName}/`)
              .replace(`/${doc.flipbookName}/`, `/${newBookName}/`);
          }
          return assetObj;
        });
        await FlipbookAsset.insertMany(newAssets);
      }

      // Duplicate 3D model interaction records
      const sourceModels = await InteractionThreedModel.find({ userEmail: doc.userEmail, flipbookName: doc.flipbookName });
      if (sourceModels.length > 0) {
        const newModels = sourceModels.map(model => {
          const modelObj = model.toObject();
          delete modelObj._id;
          modelObj.v_id = nanoid(20);
          modelObj.flipbook_v_id = newVId;
          modelObj.flipbookName = newBookName;
          modelObj.folderName = copyName;
          if (modelObj.page_v_id && pageIdMap.has(modelObj.page_v_id)) {
            modelObj.page_v_id = pageIdMap.get(modelObj.page_v_id);
          }
          return modelObj;
        });
        await InteractionThreedModel.insertMany(newModels);
      }

      // Copy book files in Supabase Storage directly from old book prefix to new book prefix
      const sourceBookSupabasePrefix = `${sanitizedEmail}/${FLIPBOOK_ROOT}/${folderName}/${doc.flipbookName}`;
      const targetBookSupabasePrefix = `${sanitizedEmail}/${FLIPBOOK_ROOT}/${copyName}/${newBookName}`;
      await copyPathInSupabase(sourceBookSupabasePrefix, targetBookSupabasePrefix).catch((err) =>
        console.warn("[Supabase] Book copy error:", err)
      );

      ensureFlipbookFoldersInSupabase(sanitizedEmail, copyName, newBookName).catch(() => {});
    }

    // Add duplicated folder to UserFolder document right after the original folder
    let newFolderMongoId = new mongoose.Types.ObjectId();
    try {
      const userFolderDoc = await UserFolder.findOne({ emailId: emailId.toLowerCase() });
      if (userFolderDoc && Array.isArray(userFolderDoc.folders)) {
        const srcIdx = userFolderDoc.folders.findIndex(f => {
          const fName = typeof f === 'string' ? f : f?.name;
          return fName === folderName;
        });
        const newFolderObj = { _id: newFolderMongoId, name: copyName };
        if (srcIdx >= 0) {
          userFolderDoc.folders.splice(srcIdx + 1, 0, newFolderObj);
        } else {
          userFolderDoc.folders.push(newFolderObj);
        }
        await userFolderDoc.save();
      }
    } catch (e) {
      console.warn("Could not add duplicated folder to UserFolder:", e);
    }

    res.json({ message: "Duplicated successfully", newFolderName: copyName, id: newFolderMongoId.toString() });
  } catch (err) {
    console.error("Error duplicating folder:", err);
    res.status(500).json({ message: "Server error" });
  }
});


// @route POST /api/flipbook/duplicate (Duplicate Book)
router.post("/duplicate", async (req, res) => {
  try {
    const { emailId, folderName, bookName } = req.body;
    if (!emailId || !folderName || !bookName)
      return res.status(400).json({ message: "Missing fields" });

    const sanitizedEmail = emailId.replace(/[@.]/g, "_");

    // Fetch MongoDB Document for source book
    const sourceDoc = await Flipbook.findOne({
      userEmail: emailId,
      flipbookName: bookName,
    });

    if (!sourceDoc) {
      return res.status(404).json({ message: "Book not found" });
    }

    // Determine unique copy name
    const existingDbBooks = await Flipbook.find({ userEmail: emailId });
    const existingNames = new Set(existingDbBooks.map(b => b.flipbookName));

    let copyName = `${bookName}_Copy`;
    let counter = 1;
    while (existingNames.has(copyName)) {
      copyName = `${bookName}_Copy ${counter}`;
      counter++;
    }

    // Duplicate MongoDB Document
    let createdDoc = null;
    if (sourceDoc) {
      const newFlipbookVId = nanoid(20);
      const pageIdMap = new Map();

      const newPages = (sourceDoc.pages || []).map((page) => {
        const newPageVId = nanoid(20);
        if (page.v_id) pageIdMap.set(page.v_id, newPageVId);

        return {
          pageNumber: page.pageNumber,
          name: page.name,
          fileName: page.fileName,
          v_id: newPageVId,
          size: page.size || 0,
        };
      });

      createdDoc = await Flipbook.create({
        userEmail: emailId,
        folderName: Array.isArray(sourceDoc.folderName) ? sourceDoc.folderName : [folderName],
        flipbookName: copyName,
        pages: newPages,
        fileSize: sourceDoc.fileSize || 0,
        v_id: newFlipbookVId,
        Customized_Settings: {
          ...(sourceDoc.Customized_Settings || sourceDoc.settings || {}),
          Visibility: {
            shareId: nanoid(12),
            access: sourceDoc.Customized_Settings?.Visibility?.access || sourceDoc.share?.access || 'public'
          },
          FlipbookInfo: {
            ...(sourceDoc.Customized_Settings?.FlipbookInfo || sourceDoc.meta || {}),
            flipbookName: copyName,
            folderName: Array.isArray(sourceDoc.folderName) ? sourceDoc.folderName : [folderName]
          }
        },
        lastUpdated: new Date(),
      });

      // Duplicate asset records
      if (sourceDoc.v_id) {
        try {
          const assets = await FlipbookAsset.find({
            flipbook_v_id: sourceDoc.v_id,
          });

          if (assets.length > 0) {
            const newAssets = assets.map(asset => {
              const newFileVId = nanoid(20);
              return {
                flipbook_v_id: newFlipbookVId,
                file_v_id: newFileVId,
                page_v_id: asset.page_v_id && pageIdMap.has(asset.page_v_id) ? pageIdMap.get(asset.page_v_id) : "global",
                assetType: asset.assetType,
                fileName: asset.fileName,
                flipbookName: copyName,
                folderName: folderName,
                url: asset.url ? asset.url.replace(`/${bookName}/`, `/${copyName}/`) : "",
                size: asset.size,
                userEmail: emailId
              };
            });
            await FlipbookAsset.insertMany(newAssets);
          }
        } catch (assetErr) {
          console.error("Error duplicating assets:", assetErr);
        }
      }

      // Duplicate 3D model interaction records
      try {
        const sourceModels = await InteractionThreedModel.find({ userEmail: emailId, flipbookName: bookName });
        if (sourceModels.length > 0) {
          const newModels = sourceModels.map(model => {
            const modelObj = model.toObject();
            delete modelObj._id;
            modelObj.v_id = nanoid(20);
            modelObj.flipbook_v_id = newFlipbookVId;
            modelObj.flipbookName = copyName;
            modelObj.folderName = folderName;
            if (modelObj.page_v_id && pageIdMap.has(modelObj.page_v_id)) {
              modelObj.page_v_id = pageIdMap.get(modelObj.page_v_id);
            }
            return modelObj;
          });
          await InteractionThreedModel.insertMany(newModels);
        }
      } catch (modelErr) {
        console.error("Error duplicating 3D models:", modelErr);
      }

      // Initialize Supabase Storage structure for duplicated book
      ensureFlipbookFoldersInSupabase(sanitizedEmail, folderName, copyName).catch(() => {});
    }

    // Duplicate book in Supabase Storage in background
    const oldSupabaseBookPrefix = `${sanitizedEmail}/${FLIPBOOK_ROOT}/${folderName}/${bookName}`;
    const newSupabaseBookPrefix = `${sanitizedEmail}/${FLIPBOOK_ROOT}/${folderName}/${copyName}`;
    copyPathInSupabase(oldSupabaseBookPrefix, newSupabaseBookPrefix).catch((err) =>
      console.warn("[Supabase] Duplicate book warning:", err)
    );

    res.json({ message: "Duplicated successfully", newBookName: copyName, newDoc: createdDoc });
  } catch (err) {
    console.error("Error duplicating book:", err);
    res.status(500).json({ message: "Server error" });
  }
});


// @route   GET /api/flipbook/get
// @desc    Get specific flipbook content (pages)
router.get("/get", async (req, res) => {
  try {
    const { emailId: reqEmailId, folderName, bookName, v_id, metadataOnly, initialPages } = req.query;

    // V_ID Lookup Logic
    let dbDoc = null;
    if (v_id) {
      dbDoc = await Flipbook.findOne({ v_id: v_id });
    }

    const emailId = reqEmailId || (dbDoc ? dbDoc.userEmail : null);

    if (!emailId || (!v_id && (!folderName || !bookName)))
      return res.status(400).json({ message: "Missing fields" });

    const sanitizedEmail = emailId.replace(/[@.]/g, "_");
    const uploadsDir = path.join(__dirname, "../../uploads");
    let effectiveFolderName = folderName;
    let effectiveBookName = bookName;

    if (dbDoc) {
      if (reqEmailId && dbDoc.userEmail !== reqEmailId && !dbDoc.isPublished)
        return res.status(403).json({ message: "Unauthorized" });

      effectiveBookName = dbDoc.flipbookName;


      // Resolve folder logic
      if (Array.isArray(dbDoc.folderName)) {
        const realFolders = dbDoc.folderName.filter((f) => f !== "Recent Book");
        if (realFolders.length > 0) effectiveFolderName = realFolders[0];
        else effectiveFolderName = "My_Flipbooks"; // Fallback
      } else {
        effectiveFolderName = dbDoc.folderName;
      }
    } else {
      // Fallback if v_id wasn't found (could be a book name) or wasn't provided
      if (!folderName || !bookName) {
        return res.status(404).json({ message: "Flipbook not found" });
      }

      effectiveFolderName = folderName;
      effectiveBookName = bookName;

      // Logic for folderName/bookName driven request
      if (effectiveFolderName === "Recent Book") {
        // If requested from Recent Book, find the specific doc tagged with 'Recent Book'
        const recentDbDoc = await Flipbook.findOne({
          userEmail: emailId,
          flipbookName: effectiveBookName,
          folderName: "Recent Book",
        });

        if (recentDbDoc && recentDbDoc.folderName) {
          if (Array.isArray(recentDbDoc.folderName)) {
            // Get the first non-Recent folder (the physical one)
            const realFolders = recentDbDoc.folderName.filter(
              (f) => f !== "Recent Book",
            );
            if (realFolders.length > 0) effectiveFolderName = realFolders[0];
          } else if (recentDbDoc.folderName !== "Recent Book") {
            effectiveFolderName = recentDbDoc.folderName;
          }
        }
      }
    }

    const bookPath = path.join(
      uploadsDir,
      sanitizedEmail,
      FLIPBOOK_ROOT,
      effectiveFolderName,
      effectiveBookName,
    );

    let pages = [];

    // 1. Try fetching from MongoDB first
    let dbBook = dbDoc;
    if (!dbBook) {
      dbBook = await Flipbook.findOne({
        userEmail: emailId,
        flipbookName: effectiveBookName,
      });
    }

    if (!dbBook && !fs.existsSync(bookPath)) {
      return res.status(404).json({ message: "Book not found" });
    }


    if (dbBook) {
      dbBook.lastUpdated = new Date();
      dbBook.save().catch(() => {});
    }

    if (dbBook && dbBook.pages && dbBook.pages.length > 0) {
      // Sort by pageNumber to ensure correct order
      dbBook.pages.sort((a, b) => a.pageNumber - b.pageNumber);

      // Auto-heal check: test if first page exists under effectiveBookName in Supabase
      if (metadataOnly !== 'true') {
        const firstPageFileName = dbBook.pages[0].fileName;
        const testPath = `${sanitizedEmail}/${FLIPBOOK_ROOT}/${effectiveFolderName}/${effectiveBookName}/${firstPageFileName}`;
        let testBuf = await downloadFileFromSupabase(testPath);
        if (!testBuf || testBuf.length === 0) {
          const testLocalPath = path.join(bookPath, firstPageFileName);
          if (!fs.existsSync(testLocalPath)) {
            console.log(`[Auto-Heal] Page not found at ${testPath}. Checking legacy folders...`);
            try {
              const allFolders = await listFoldersFromSupabase(sanitizedEmail);
              for (const folderCandidate of allFolders) {
                if (folderCandidate === effectiveBookName) continue;
                const candidatePath = `${sanitizedEmail}/${FLIPBOOK_ROOT}/${effectiveFolderName}/${folderCandidate}/${firstPageFileName}`;
                const candidateBuf = await downloadFileFromSupabase(candidatePath);
                if (candidateBuf && candidateBuf.length > 0) {
                  console.log(`[Auto-Heal] Found page in legacy folder "${folderCandidate}". Renaming to "${effectiveBookName}" in Supabase...`);
                  const oldSupabasePath = `${sanitizedEmail}/${FLIPBOOK_ROOT}/${effectiveFolderName}/${folderCandidate}`;
                  const newSupabasePath = `${sanitizedEmail}/${FLIPBOOK_ROOT}/${effectiveFolderName}/${effectiveBookName}`;
                  await renamePathInSupabase(oldSupabasePath, newSupabasePath).catch(err =>
                    console.warn("[Auto-Heal] Supabase rename error:", err)
                  );
                  break;
                }
              }
            } catch (healErr) {
              console.warn("[Auto-Heal] Legacy check error:", healErr);
            }
          }
        }
      }

      const limitInitial = initialPages ? parseInt(initialPages, 10) : null;
      const pagePromises = dbBook.pages.map(async (p, pIdx) => {
        try {
          if (metadataOnly === 'true' || (limitInitial !== null && pIdx >= limitInitial)) {
             return {
                name: p.name,
                fileName: p.fileName,
                html: "",
                hide: p.hide || 0,
                v_id: p.v_id,
                isLazy: metadataOnly !== 'true' && limitInitial !== null && pIdx >= limitInitial
             };
          }
          // Fetch from Supabase Storage with local disk fallback
          const supabasePath = `${sanitizedEmail}/${FLIPBOOK_ROOT}/${effectiveFolderName}/${effectiveBookName}/${p.fileName}`;
          let buf = await downloadFileFromSupabase(supabasePath);

          if (!buf || buf.length === 0) {
            const localFilePath = path.join(bookPath, p.fileName);
            if (fs.existsSync(localFilePath)) {
              buf = fs.readFileSync(localFilePath);
              // Trigger background upload to Supabase if missing
              uploadFileToSupabase(localFilePath, supabasePath).catch(() => {});
            }
          }

          // Rewrite /uploads/ and relative ./assets/ references to Supabase CDN
          const flipbookPrefix = `${sanitizedEmail}/${FLIPBOOK_ROOT}/${effectiveFolderName}/${effectiveBookName}`;
          const content = buf ? rewriteUploadsToSupabase(buf.toString("utf8"), flipbookPrefix) : "";

          return {
            name: p.name,
            fileName: p.fileName,
            html: content,
            hide: p.hide || 0,
            v_id: p.v_id,
          };


        } catch (e) {
          return null;
        }
      });
      pages = (await Promise.all(pagePromises)).filter(Boolean);
    }

    // 2. Fallback: If DB has pages but Supabase returned no content, list files from Supabase via DB metadata
    if (pages.length === 0 && dbBook && dbBook.pages && dbBook.pages.length > 0) {
      pages = dbBook.pages.map(p => ({
        name: p.name,
        fileName: p.fileName,
        html: "",
        hide: p.hide || 0,
        v_id: p.v_id,
      }));
    }

    // Ensure shareId / Visibility exists (Auto-heal for legacy data)
    let finalVisibility = dbBook ? (dbBook.Customized_Settings?.Visibility || dbBook.share) : {};
    if (dbBook) {
      if (!finalVisibility || !finalVisibility.shareId) {
        finalVisibility = {
          shareId: finalVisibility?.shareId || nanoid(12),
          access: finalVisibility?.access || 'public'
        };
        dbBook.set('Customized_Settings.Visibility', finalVisibility);
        try {
          await dbBook.save();
        } catch (saveErr) {
          console.error("Error auto-healing shareId:", saveErr);
        }
      }
    }

    const docFlipbookInfo = dbBook?.Customized_Settings?.FlipbookInfo || dbBook?.meta || {};
    const rawSettings = dbBook ? (dbBook.Customized_Settings || dbBook.settings || {}) : {};
    const docSettings = { ...rawSettings };
    delete docSettings.visibility;
    delete docSettings.FlipbookInfo;
    const docWidth = docFlipbookInfo?.width || dbBook?.width || docSettings?.width;
    const docHeight = docFlipbookInfo?.height || dbBook?.height || docSettings?.height;
    const docTemplateId = docFlipbookInfo?.templateId || dbBook?.templateId || docSettings?.templateId;
    const docOrientation = docFlipbookInfo?.orientation || dbBook?.orientation || docSettings?.orientation;

    const flipbookInfoObj = {
      ...docFlipbookInfo,
      flipbookName: effectiveBookName,
      folderName: effectiveFolderName,
      v_id: dbBook ? dbBook.v_id : null,
      width: docWidth,
      height: docHeight,
      templateId: docTemplateId,
      orientation: docOrientation,
      isPublished: dbBook ? Boolean(dbBook.isPublished) : false,
      quotes: docFlipbookInfo.quotes || dbBook?.quotes || "",
      about: docFlipbookInfo.about || dbBook?.about || "",
      category: docFlipbookInfo.category || dbBook?.category || "Product Based",
      language: docFlipbookInfo.language || dbBook?.language || "English",
      tags: docFlipbookInfo.tags || dbBook?.tags || [],
      baseUrl: `/uploads/${sanitizedEmail}/${FLIPBOOK_ROOT}/${effectiveFolderName}/${effectiveBookName}/`
    };

    res.json({
      _id: dbBook ? dbBook._id : null,
      v_id: dbBook ? dbBook.v_id : (v_id || null),
      flipbookName: effectiveBookName,
      folderName: dbBook ? dbBook.folderName : effectiveFolderName,
      userEmail: emailId,
      createdAt: dbBook ? dbBook.createdAt : null,
      lastUpdated: dbBook ? dbBook.lastUpdated : null,
      isPublished: dbBook ? Boolean(dbBook.isPublished) : false,
      pages,
      Customized_Settings: docSettings,
      settings: docSettings,
      Visibility: finalVisibility,
      share: finalVisibility,
      quotes: flipbookInfoObj.quotes,
      about: flipbookInfoObj.about,
      category: flipbookInfoObj.category,
      language: flipbookInfoObj.language,
      tags: flipbookInfoObj.tags,
      FlipbookInfo: flipbookInfoObj,
      meta: flipbookInfoObj,
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error" });
  }
});

// @route   GET /api/flipbook/get-page
// @desc    Get content for a single flipbook page on-demand
router.get("/get-page", async (req, res) => {
  try {
    const { emailId: reqEmailId, folderName, bookName, v_id, pageIndex, pageName, fileName } = req.query;

    let dbDoc = null;
    if (v_id) {
      dbDoc = await Flipbook.findOne({ v_id: v_id });
    }

    const emailId = reqEmailId || (dbDoc ? dbDoc.userEmail : null);
    if (!emailId || (!v_id && (!folderName || !bookName))) {
      return res.status(400).json({ message: "Missing fields" });
    }

    const sanitizedEmail = emailId.replace(/[@.]/g, "_");
    const uploadsDir = path.join(__dirname, "../../uploads");
    let effectiveFolderName = folderName;
    let effectiveBookName = bookName;

    if (dbDoc) {
      effectiveBookName = dbDoc.flipbookName;
      if (Array.isArray(dbDoc.folderName)) {
        const realFolders = dbDoc.folderName.filter((f) => f !== "Recent Book");
        effectiveFolderName = realFolders.length > 0 ? realFolders[0] : "My_Flipbooks";
      } else {
        effectiveFolderName = dbDoc.folderName;
      }
    }

    let targetPage = null;
    if (dbDoc && dbDoc.pages && dbDoc.pages.length > 0) {
      if (pageName) targetPage = dbDoc.pages.find(p => p.name === pageName);
      if (!targetPage && fileName) targetPage = dbDoc.pages.find(p => p.fileName === fileName);
      if (!targetPage && pageIndex !== undefined) {
        const idx = parseInt(pageIndex, 10);
        if (!isNaN(idx) && idx >= 0 && idx < dbDoc.pages.length) {
          targetPage = dbDoc.pages[idx];
        }
      }
    }

    if (!targetPage) {
      return res.status(404).json({ message: "Page not found" });
    }

    const targetFileName = targetPage.fileName || (targetPage.name ? `${targetPage.name}.html` : null);
    const supabasePath = `${sanitizedEmail}/${FLIPBOOK_ROOT}/${effectiveFolderName}/${effectiveBookName}/${targetFileName}`;
    let buf = await downloadFileFromSupabase(supabasePath);

    const bookPath = path.join(uploadsDir, sanitizedEmail, FLIPBOOK_ROOT, effectiveFolderName, effectiveBookName);
    if (!buf || buf.length === 0) {
      const localFilePath = path.join(bookPath, targetFileName);
      if (fs.existsSync(localFilePath)) {
        buf = fs.readFileSync(localFilePath);
      }
    }

    const flipbookPrefix = `${sanitizedEmail}/${FLIPBOOK_ROOT}/${effectiveFolderName}/${effectiveBookName}`;
    const content = buf ? rewriteUploadsToSupabase(buf.toString("utf8"), flipbookPrefix) : "";

    res.json({
      name: targetPage.name,
      fileName: targetFileName,
      html: content,
      hide: targetPage.hide || 0,
      v_id: targetPage.v_id
    });
  } catch (err) {
    console.error("Error fetching single page:", err);
    res.status(500).json({ message: "Server error fetching page", error: err.message });
  }
});



// @route   POST /api/flipbook/publish
// @desc    Publish a flipbook with category, language, tags & quotes
router.post('/publish', async (req, res) => {
  try {
    const { emailId, v_id, bookName, category, language, tags, quotes, about } = req.body;
    if (!emailId || !v_id) {
      return res.status(400).json({ message: "Missing emailId or v_id" });
    }

    const updateData = {
      isPublished: true,
      lastUpdated: new Date(),
      'Customized_Settings.FlipbookInfo.publishedAt': new Date()
    };

    const existingDoc = await Flipbook.findOne({ userEmail: emailId, v_id: v_id });

    if (bookName && existingDoc && existingDoc.flipbookName !== bookName.trim()) {
      const oldName = existingDoc.flipbookName;
      const safeNewName = bookName.trim();

      if (safeNewName && safeNewName !== oldName) {
        const sanitizedEmail = emailId.replace(/[@.]/g, "_");
        const uploadsDir = path.join(__dirname, "../../uploads");

        let physicalFolderName = req.body.folderName || "My_Flipbooks";
        if (existingDoc.folderName) {
          const folders = Array.isArray(existingDoc.folderName) ? existingDoc.folderName : [existingDoc.folderName];
          const realFolder = folders.find(f => f !== "Recent Book" && f !== "Recent book");
          if (realFolder) physicalFolderName = realFolder;
        }

        const oldSupabasePath = `${sanitizedEmail}/${FLIPBOOK_ROOT}/${physicalFolderName}/${oldName}`;
        const newSupabasePath = `${sanitizedEmail}/${FLIPBOOK_ROOT}/${physicalFolderName}/${safeNewName}`;
        await renamePathInSupabase(oldSupabasePath, newSupabasePath).catch(err =>
          console.warn("[Supabase] Rename flipbook folder warning in publish:", err)
        );

        const oldLocalPath = path.join(uploadsDir, sanitizedEmail, FLIPBOOK_ROOT, physicalFolderName, oldName);
        const newLocalPath = path.join(uploadsDir, sanitizedEmail, FLIPBOOK_ROOT, physicalFolderName, safeNewName);
        if (fs.existsSync(oldLocalPath) && !fs.existsSync(newLocalPath)) {
          try {
            fs.renameSync(oldLocalPath, newLocalPath);
          } catch (e) {
            console.warn("[Local Disk] Rename flipbook folder warning in publish:", e);
          }
        }

        updateData.flipbookName = safeNewName;
        updateData['Customized_Settings.FlipbookInfo.flipbookName'] = safeNewName;
      }
    } else if (bookName) {
      updateData.flipbookName = bookName;
      updateData['Customized_Settings.FlipbookInfo.flipbookName'] = bookName;
    }
    if (category) {
      updateData['Customized_Settings.FlipbookInfo.category'] = category;
    }
    if (language) {
      updateData['Customized_Settings.FlipbookInfo.language'] = language;
    }
    if (tags) {
      updateData['Customized_Settings.FlipbookInfo.tags'] = tags;
    }
    if (quotes !== undefined) {
      updateData['Customized_Settings.FlipbookInfo.quotes'] = quotes;
    }
    if (about !== undefined) {
      updateData['Customized_Settings.FlipbookInfo.about'] = about;
    }

    const updatedDoc = await Flipbook.findOneAndUpdate(
      { userEmail: emailId, v_id: v_id },
      {
        $set: updateData,
        $unset: { share: 1, settings: 1, meta: 1, category: 1, language: 1, tags: 1, quotes: 1, about: 1, width: 1, height: 1, templateId: 1, orientation: 1 }
      },
      { returnDocument: 'after' }
    );

    if (!updatedDoc) {
      return res.status(404).json({ message: "Flipbook not found" });
    }

    // Log user activity
    logActivity({
      userEmail: emailId,
      type: 'publish',
      title: 'You published a flipbook',
      desc: `Flipbook: ${updatedDoc.flipbookName || bookName || 'Flipbook'}`,
      entityId: v_id,
      entityName: updatedDoc.flipbookName || bookName || ''
    });

    res.json({ message: "Flipbook published successfully", flipbook: updatedDoc });
  } catch (err) {
    console.error("Error publishing flipbook:", err);
    res.status(500).json({ message: "Server error" });
  }
});

// @route   POST /api/flipbook/unpublish
// @desc    Unpublish a flipbook
router.post('/unpublish', async (req, res) => {
  try {
    const { emailId, v_id } = req.body;
    if (!emailId || !v_id) {
      return res.status(400).json({ message: "Missing emailId or v_id" });
    }

    const updatedDoc = await Flipbook.findOneAndUpdate(
      { userEmail: emailId, v_id: v_id },
      {
        $set: { isPublished: false, 'Customized_Settings.FlipbookInfo.tags': [], lastUpdated: new Date() },
        $unset: { share: 1, settings: 1, meta: 1, category: 1, language: 1, tags: 1, quotes: 1, about: 1, width: 1, height: 1, templateId: 1, orientation: 1 }
      },
      { returnDocument: 'after' }
    );

    if (!updatedDoc) {
      return res.status(404).json({ message: "Flipbook not found" });
    }

    // Remove from everyone's shelf
    try {
      await Profile.updateMany(
        {},
        { $pull: { "myShelf.folders.$[].books": { v_id: v_id } } }
      );
    } catch (shelfErr) {
      console.error("Error removing unpublished flipbook from shelves:", shelfErr);
    }

    // Log user activity
    logActivity({
      userEmail: emailId,
      type: 'unpublish',
      title: 'You un-published a flipbook',
      desc: `Flipbook: ${updatedDoc.flipbookName || 'Flipbook'}`,
      entityId: v_id,
      entityName: updatedDoc.flipbookName || ''
    });

    res.json({ message: "Flipbook unpublished successfully", flipbook: updatedDoc });
  } catch (err) {
    console.error("Error unpublishing flipbook:", err);
    res.status(500).json({ message: "Server error" });
  }
});

// Helper to check if Invite Only auto expire timer has passed
const checkInviteAutoExpired = (autoExpire, fallbackDate) => {
  if (!autoExpire || !autoExpire.enabled) return false;

  const rawGranted = autoExpire.grantedAt || autoExpire.createdAt || fallbackDate;
  if (!rawGranted) return false;
  const grantedAt = new Date(rawGranted).getTime();

  // Parse days: e.g. "0 Days", "1 Days", "5 Days"
  const daysStr = String(autoExpire.days || '0');
  const daysMatch = daysStr.match(/(\d+)/);
  const daysNum = daysMatch ? parseInt(daysMatch[1], 10) : 0;

  // Parse time: e.g. "5 Mins", "15 Mins", "30 Mins", "1 Hour"
  const timeStr = String(autoExpire.time || '0');
  const timeMatch = timeStr.match(/(\d+)/);
  const timeNum = timeMatch ? parseInt(timeMatch[1], 10) : 0;

  let timeInMs = 0;
  if (timeStr.toLowerCase().includes('hour')) {
    timeInMs = timeNum * 60 * 60 * 1000;
  } else {
    timeInMs = timeNum * 60 * 1000;
  }

  const daysInMs = daysNum * 24 * 60 * 60 * 1000;
  const totalAllowedMs = daysInMs + timeInMs;

  if (totalAllowedMs <= 0) return false;

  const now = Date.now();
  const elapsed = now - grantedAt;

  return elapsed > totalAllowedMs;
};

// @route   GET /api/flipbook/public/get/:shareId
// @desc    Get specific flipbook content publicly for sharing
router.get("/public/get/:shareId", async (req, res) => {
  try {
    const { shareId } = req.params;
    if (!shareId) return res.status(400).json({ message: "Missing shareId" });

    // Find strictly by shareId inside Customized_Settings.Visibility or share
    const dbDoc = await Flipbook.findOne({
      $or: [
        { "Customized_Settings.Visibility.shareId": shareId },
        { "share.shareId": shareId },
        { v_id: shareId }  // fallback: editor preview passes v_id when no shareId is configured
      ]
    }).lean();
    if (!dbDoc) return res.status(404).json({ message: "Flipbook not found" });

    const vis = dbDoc.Customized_Settings?.Visibility || dbDoc.share || {};

    const reqEmail = (req.query.emailId || '').trim().toLowerCase();
    const ownerEmail = (dbDoc.userEmail || '').trim().toLowerCase();
    const isOwner = Boolean(reqEmail && ownerEmail && reqEmail === ownerEmail);
    const accessMode = String(vis.access || vis.type || 'public').toLowerCase();

    // Publication check (Owner can view unpublished flipbook, public readers cannot view ANY unpublished flipbook)
    if (!isOwner && (dbDoc.isPublished === false || !dbDoc.isPublished)) {
      return res.status(403).json({
        message: "This Flipbook not Yet Published",
        isUnpublished: true
      });
    }

    // Check visibility access controls
    const reqPassword = req.query.password;
    const reqAccessKey = req.query.accessKey;

    // Pre-build preview page structures for background blur preview
    const previewPages = (dbDoc.pages || []).map(p => ({
      id: p.pageNumber,
      name: p.name,
      fileName: p.fileName,
      html: "",
      v_id: p.v_id,
      hide: p.hide || 0
    }));

    // 1. Private access check (Private flipbooks cannot be viewed via public share links)
    if (accessMode.includes('private') && !isOwner) {
      return res.status(403).json({ message: "This flipbook is private. It cannot be viewed via public link.", isPrivate: true, accessMode: 'private' });
    }

    // 2. Password Protect access check (Strictly require matching Access Key ONLY for Share View Book)
    if (accessMode.includes('password')) {
      const inputKey = (reqAccessKey || reqPassword || '').trim();
      const keyMatches = await compareKeys(inputKey, vis.accessKey);
      if (!keyMatches) {
        return res.status(401).json({
          message: "Invalid Access Key",
          isPasswordProtected: true,
          bookName: dbDoc.flipbookName,
          accessMode: 'password',
          pages: previewPages,
          FlipbookInfo: dbDoc.Customized_Settings?.FlipbookInfo || dbDoc.meta || {},
          meta: dbDoc.Customized_Settings?.FlipbookInfo || dbDoc.meta || {},
          Customized_Settings: dbDoc.Customized_Settings || dbDoc.settings || {}
        });
      }
    }

    // 3. Invite Only Access check
    if (accessMode.includes('invite')) {
      const isOwner = reqEmail && reqEmail === dbDoc.userEmail;
      if (!isOwner) {
        const allowedEmails = (vis.inviteOnly?.emails || []).map(e => (e.email || e).toLowerCase());
        const allowedDomains = (vis.inviteOnly?.domains || []).map(d => (d.domain || d).toLowerCase());
        
        const userEmailLower = (reqEmail || '').toLowerCase();
        const userDomainLower = userEmailLower.includes('@') ? userEmailLower.split('@')[1] : '';

        const isEmailAllowed = allowedEmails.includes(userEmailLower);
        const isDomainAllowed = allowedDomains.some(dom => userDomainLower === dom || userDomainLower.endsWith('.' + dom));

        if (!userEmailLower || (!isEmailAllowed && !isDomainAllowed)) {
          return res.status(403).json({
            message: "Invite only access required",
            isInviteOnly: true,
            accessMode: 'invite',
            pages: previewPages,
            FlipbookInfo: dbDoc.Customized_Settings?.FlipbookInfo || dbDoc.meta || {},
            meta: dbDoc.Customized_Settings?.FlipbookInfo || dbDoc.meta || {},
            Customized_Settings: dbDoc.Customized_Settings || dbDoc.settings || {}
          });
        }

        // Check Auto Expire timer for invited readers
        const autoExpire = vis.inviteOnly?.autoExpire;
        if (autoExpire && autoExpire.enabled) {
          const isExpired = checkInviteAutoExpired(autoExpire, dbDoc.updatedAt || dbDoc.createdAt);
          if (isExpired) {
            return res.status(403).json({
              message: "Time Expired! The access time granted for this flipbook has expired.",
              isExpired: true,
              isInviteOnly: true,
              accessMode: 'invite',
              pages: previewPages,
              FlipbookInfo: dbDoc.Customized_Settings?.FlipbookInfo || dbDoc.meta || {},
              meta: dbDoc.Customized_Settings?.FlipbookInfo || dbDoc.meta || {},
              Customized_Settings: dbDoc.Customized_Settings || dbDoc.settings || {}
            });
          }
        }
      }
    }

    // Fetch pages
    const sanitizedEmail = dbDoc.userEmail.replace(/[@.]/g, "_");
    const realFolders = Array.isArray(dbDoc.folderName)
      ? dbDoc.folderName.filter(f => f !== "Recent Book" && f !== "Recent book")
      : [dbDoc.folderName];
    const effectiveFolderName = realFolders.length > 0 ? realFolders[0] : "My_Flipbooks";
    const effectiveBookName = dbDoc.flipbookName;

    const uploadsDir = path.join(__dirname, "../../uploads");
    const bookPath = path.join(
      uploadsDir,
      sanitizedEmail,
      FLIPBOOK_ROOT,
      effectiveFolderName,
      effectiveBookName,
    );

    // AUTO-HEAL: If DB has no pages but files exist on disk, populate it
    // Note: dbDoc is a lean plain object, so we use Flipbook.updateOne() instead of dbDoc.save()
    if (!dbDoc.pages || dbDoc.pages.length === 0) {
      if (fs.existsSync(bookPath)) {
        try {
          const files = await fs.promises.readdir(bookPath);
          const svgFiles = files.filter(f => f.endsWith('.svg') || f.endsWith('.html')).sort((a, b) => {
            const aNum = parseInt(a.match(/\d+/)?.[0] || 0);
            const bNum = parseInt(b.match(/\d+/)?.[0] || 0);
            return aNum - bNum;
          });

          if (svgFiles.length > 0) {
            const autoHealedPages = svgFiles.map((fileName, idx) => ({
              pageNumber: idx + 1,
              name: `Page ${idx + 1}`,
              fileName: fileName,
              v_id: `page_${nanoid(8)}`
            }));

            dbDoc.pages = autoHealedPages;
            // Use updateOne since dbDoc is a lean plain object (no .save())
            await Flipbook.updateOne({ _id: dbDoc._id }, { $set: { pages: autoHealedPages } });
          }
        } catch (e) {
          console.error(`[PublicGet] Auto-heal failed for v_id: ${dbDoc.v_id}`, e);
        }
      }
    }

    if (dbDoc.pages) {
      dbDoc.pages.sort((a, b) => a.pageNumber - b.pageNumber);
    }
    const flipbookPrefix = `${sanitizedEmail}/${FLIPBOOK_ROOT}/${effectiveFolderName}/${effectiveBookName}`;

    const pagePromises = (dbDoc.pages || []).map(async (p) => {
      try {
        const supabasePath = `${flipbookPrefix}/${p.fileName}`;
        let buf = await downloadFileFromSupabase(supabasePath);

        if (!buf || buf.length === 0) {
          const localFilePath = path.join(bookPath, p.fileName);
          if (fs.existsSync(localFilePath)) {
            buf = await fs.promises.readFile(localFilePath);
          }
        }

        const content = buf ? rewriteUploadsToSupabase(buf.toString("utf8"), flipbookPrefix) : "";
        return {
          id: p.pageNumber,
          name: p.name,
          fileName: p.fileName,
          html: content || "",
          v_id: p.v_id,
          hide: p.hide || 0,
        };
      } catch (e) {
        return {
          id: p.pageNumber,
          name: p.name,
          fileName: p.fileName,
          html: "",
          v_id: p.v_id,
        };
      }
    });

    // Run Profile fetch in parallel with page downloads for speed
    const profilePromise = dbDoc.userEmail
      ? Profile.findOne({ emailId: new RegExp(`^${dbDoc.userEmail.replace(/[.*+?^${}()|[\\]\\]/g, '\\$&')}$`, 'i') }).lean().catch(() => null)
      : Promise.resolve(null);

    let [pages, authorProfile] = await Promise.all([
      Promise.all(pagePromises).then(p => p.filter(Boolean)),
      profilePromise
    ]);

    // Fallback: If pages returned no content, map DB metadata pages
    if (pages.length === 0 && dbDoc.pages && dbDoc.pages.length > 0) {
      pages = dbDoc.pages.map(p => ({
        id: p.pageNumber,
        name: p.name,
        fileName: p.fileName,
        html: "",
        v_id: p.v_id,
        hide: p.hide || 0,
      }));
    }

    const docFlipbookInfo = dbDoc.Customized_Settings?.FlipbookInfo || dbDoc.meta || {};
    const docSettings = { ...(dbDoc.Customized_Settings || dbDoc.settings || {}) };
    delete docSettings.FlipbookInfo;
    delete docSettings.visibility;

    const ratings = dbDoc.bookRating || [];
    const totalRatings = ratings.length;
    const avgRating = totalRatings > 0
      ? Number((ratings.reduce((sum, r) => sum + (r.ratingValue || 0), 0) / totalRatings).toFixed(1))
      : 0;

    const publisherName = docFlipbookInfo.publisher || authorProfile?.companyName || authorProfile?.name || (dbDoc.userEmail ? dbDoc.userEmail.split('@')[0] : 'FIST-O Tech Pvt Ltd');

    const accurateViews = (Array.isArray(dbDoc.viewers) && dbDoc.viewers.length > 0)
      ? dbDoc.viewers.length
      : (typeof dbDoc.viewsCount === 'number' ? dbDoc.viewsCount : 0);

    const flipbookInfoObj = {
      ...docFlipbookInfo,
      flipbookName: effectiveBookName,
      folderName: effectiveFolderName,
      v_id: dbDoc.v_id,
      baseUrl: `/uploads/${sanitizedEmail}/${FLIPBOOK_ROOT}/${effectiveFolderName}/${effectiveBookName}/`,
      publisher: publisherName,
      category: docFlipbookInfo.category || 'General',
      language: docFlipbookInfo.language || 'English',
      quotes: docFlipbookInfo.quotes || '',
      about: docFlipbookInfo.about || '',
      viewsCount: accurateViews,
      addedToShelfCount: dbDoc.addedToShelfCount || 0,
      createdAt: dbDoc.createdAt,
      publishedAt: docFlipbookInfo.publishedAt || dbDoc.lastUpdated || dbDoc.createdAt
    };

    res.json({
      v_id: dbDoc.v_id,
      flipbookName: dbDoc.flipbookName,
      folderName: effectiveFolderName,
      userEmail: dbDoc.userEmail,
      isOwner,  // allow frontend to skip a separate check-owner call
      pages,
      Customized_Settings: docSettings,
      settings: docSettings,
      Visibility: vis,
      share: vis,
      isPublished: Boolean(dbDoc.isPublished),
      FlipbookInfo: flipbookInfoObj,
      meta: flipbookInfoObj,
      viewsCount: accurateViews,
      addedToShelfCount: dbDoc.addedToShelfCount || 0,
      bookRating: ratings,
      averageRating: avgRating,
      totalRatings: totalRatings,
      publisher: publisherName,
      createdAt: dbDoc.createdAt,
      publishedAt: docFlipbookInfo.publishedAt || dbDoc.lastUpdated || dbDoc.createdAt,
      authorProfile: authorProfile ? {
        name: authorProfile.name,
        picture: authorProfile.picture,
        companyName: authorProfile.companyName,
        city: authorProfile.city,
        state: authorProfile.state,
        country: authorProfile.country
      } : null
    });
  } catch (err) {
    console.error("Error in /public/get:", err);
    res.status(500).json({ message: "Server error" });
  }
});

// @route   POST /api/flipbook/public/view/:shareId
// @desc    Increment the view count for a flipbook only for unique users
router.post("/public/view/:shareId", async (req, res) => {
  try {
    const { shareId } = req.params;
    if (!shareId) return res.status(400).json({ message: "Missing shareId" });

    const rawEmail = (req.body.userEmail || req.body.emailId || req.query.emailId || '').trim().toLowerCase();
    const rawViewerId = (req.body.viewerId || req.query.viewerId || '').trim();
    const clientIp = (req.headers['x-forwarded-for'] || req.socket.remoteAddress || '').split(',')[0].trim();
    const viewerKey = rawEmail || rawViewerId || (clientIp ? `ip_${clientIp}` : 'anonymous');

    const query = {
      $or: [
        { "Customized_Settings.Visibility.shareId": shareId },
        { "share.shareId": shareId },
        { v_id: shareId }
      ]
    };

    const existingDoc = await Flipbook.findOne(query);
    if (!existingDoc) {
      return res.status(404).json({ message: "Flipbook not found" });
    }

    const viewersList = Array.isArray(existingDoc.viewers) ? existingDoc.viewers : [];

    // Check if viewer has already viewed
    const isAlreadyRecorded = viewersList.includes(viewerKey) ||
      (rawEmail && viewersList.includes(rawEmail)) ||
      (rawViewerId && viewersList.includes(rawViewerId));

    if (isAlreadyRecorded) {
      const accurateCount = viewersList.length > 0 ? viewersList.length : (existingDoc.viewsCount || 0);
      return res.status(200).json({
        success: true,
        message: "View already recorded for this user",
        viewsCount: accurateCount,
        alreadyViewed: true
      });
    }

    // First time view: add to viewers set and synchronize viewsCount
    const updatedDoc = await Flipbook.findOneAndUpdate(
      query,
      {
        $addToSet: { viewers: viewerKey }
      },
      { returnDocument: 'after' }
    );

    const accurateViewsCount = updatedDoc.viewers ? updatedDoc.viewers.length : 1;
    await Flipbook.updateOne(query, { $set: { viewsCount: accurateViewsCount } });

    return res.status(200).json({
      success: true,
      message: "View recorded",
      viewsCount: accurateViewsCount,
      alreadyViewed: false
    });
  } catch (err) {
    console.error("Error recording view:", err);
    return res.status(500).json({ success: false, message: "Server error while recording view" });
  }
});

// @route   GET /api/flipbook/public/ratings/:shareId
// @desc    Get all reviews and rating breakdown for a flipbook
router.get("/public/ratings/:shareId", async (req, res) => {
  try {
    const { shareId } = req.params;
    if (!shareId) return res.status(400).json({ message: "Missing shareId" });

    const dbDoc = await Flipbook.findOne({
      $or: [
        { "Customized_Settings.Visibility.shareId": shareId },
        { "share.shareId": shareId },
        { v_id: shareId }
      ]
    }).lean();

    if (!dbDoc) {
      return res.status(404).json({ message: "Flipbook not found" });
    }

    const ratings = (dbDoc.bookRating || []).sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
    const totalRatings = ratings.length;
    const avgRating = totalRatings > 0
      ? Number((ratings.reduce((sum, r) => sum + (r.ratingValue || 0), 0) / totalRatings).toFixed(1))
      : 0;

    const distribution = { 5: 0, 4: 0, 3: 0, 2: 0, 1: 0 };
    ratings.forEach(r => {
      const val = Math.min(5, Math.max(1, Math.round(r.ratingValue || 0)));
      if (distribution[val] !== undefined) distribution[val]++;
    });

    return res.status(200).json({
      success: true,
      ratings,
      averageRating: avgRating,
      totalRatings,
      distribution
    });
  } catch (err) {
    console.error("Error fetching ratings:", err);
    return res.status(500).json({ success: false, message: "Server error while fetching ratings" });
  }
});

// @route   POST /api/flipbook/public/rate/:shareId
// @route   POST /api/flipbook/public/rate/:shareId
// @desc    Submit or edit a rating and review for a flipbook
router.post("/public/rate/:shareId", async (req, res) => {
  try {
    const { shareId } = req.params;
    const { ratingId, name, ratingValue, review, userEmail, profileImgUrl } = req.body;

    if (!shareId) return res.status(400).json({ message: "Missing shareId" });
    if (!name || !name.trim()) return res.status(400).json({ message: "Name is required" });
    if (!ratingValue || Number(ratingValue) < 1 || Number(ratingValue) > 5) {
      return res.status(400).json({ message: "Rating must be between 1 and 5" });
    }

    const dbDoc = await Flipbook.findOne({
      $or: [
        { "Customized_Settings.Visibility.shareId": shareId },
        { "share.shareId": shareId },
        { v_id: shareId }
      ]
    });

    if (!dbDoc) {
      return res.status(404).json({ message: "Flipbook not found" });
    }

    if (!Array.isArray(dbDoc.bookRating)) {
      dbDoc.bookRating = [];
    }

    let existingRating = null;
    if (ratingId) {
      existingRating = dbDoc.bookRating.find(r => String(r._id) === String(ratingId));
    }

    if (existingRating) {
      // Update existing review
      existingRating.name = name.trim();
      if (userEmail) existingRating.userEmail = userEmail.trim().toLowerCase();
      existingRating.ratingValue = Number(ratingValue);
      existingRating.review = review ? review.trim() : "";
      if (profileImgUrl) existingRating.profileImgUrl = profileImgUrl;
    } else {
      // Create new review
      const newRating = {
        name: name.trim(),
        userEmail: userEmail ? userEmail.trim().toLowerCase() : "",
        ratingValue: Number(ratingValue),
        review: review ? review.trim() : "",
        profileImgUrl: profileImgUrl || "",
        createdAt: new Date()
      };
      dbDoc.bookRating.unshift(newRating);
    }

    const totalRatings = dbDoc.bookRating.length;
    const avgRating = totalRatings > 0
      ? Number((dbDoc.bookRating.reduce((sum, r) => sum + (r.ratingValue || 0), 0) / totalRatings).toFixed(1))
      : 0;

    dbDoc.averageRating = avgRating;
    dbDoc.totalRatings = totalRatings;

    await dbDoc.save();

    return res.status(200).json({
      success: true,
      message: existingRating ? "Rating updated successfully" : "Rating submitted successfully",
      bookRating: dbDoc.bookRating,
      averageRating: avgRating,
      totalRatings
    });
  } catch (err) {
    console.error("Error submitting rating:", err);
    return res.status(500).json({ success: false, message: "Server error while submitting rating" });
  }
});

// @route   PUT /api/flipbook/public/rate/:shareId/:ratingId
// @desc    Edit an existing rating and review
router.put("/public/rate/:shareId/:ratingId", async (req, res) => {
  try {
    const { shareId, ratingId } = req.params;
    const { name, ratingValue, review, userEmail, profileImgUrl } = req.body;

    if (!shareId || !ratingId) return res.status(400).json({ message: "Missing shareId or ratingId" });
    if (!name || !name.trim()) return res.status(400).json({ message: "Name is required" });
    if (!ratingValue || Number(ratingValue) < 1 || Number(ratingValue) > 5) {
      return res.status(400).json({ message: "Rating must be between 1 and 5" });
    }

    const dbDoc = await Flipbook.findOne({
      $or: [
        { "Customized_Settings.Visibility.shareId": shareId },
        { "share.shareId": shareId },
        { v_id: shareId }
      ]
    });

    if (!dbDoc) {
      return res.status(404).json({ message: "Flipbook not found" });
    }

    if (!Array.isArray(dbDoc.bookRating)) {
      dbDoc.bookRating = [];
    }

    const existingRating = dbDoc.bookRating.find(r => String(r._id) === String(ratingId));
    if (!existingRating) {
      return res.status(404).json({ message: "Rating not found" });
    }

    existingRating.name = name.trim();
    if (userEmail) existingRating.userEmail = userEmail.trim().toLowerCase();
    existingRating.ratingValue = Number(ratingValue);
    existingRating.review = review ? review.trim() : "";
    if (profileImgUrl) existingRating.profileImgUrl = profileImgUrl;

    const totalRatings = dbDoc.bookRating.length;
    const avgRating = totalRatings > 0
      ? Number((dbDoc.bookRating.reduce((sum, r) => sum + (r.ratingValue || 0), 0) / totalRatings).toFixed(1))
      : 0;

    dbDoc.averageRating = avgRating;
    dbDoc.totalRatings = totalRatings;

    await dbDoc.save();

    return res.status(200).json({
      success: true,
      message: "Rating updated successfully",
      bookRating: dbDoc.bookRating,
      averageRating: avgRating,
      totalRatings
    });
  } catch (err) {
    console.error("Error updating rating:", err);
    return res.status(500).json({ success: false, message: "Server error while updating rating" });
  }
});

// @route   DELETE /api/flipbook/public/rate/:shareId/:ratingId
// @desc    Delete a rating and review from a flipbook
router.delete("/public/rate/:shareId/:ratingId", async (req, res) => {
  try {
    const { shareId, ratingId } = req.params;

    if (!shareId || !ratingId) {
      return res.status(400).json({ message: "Missing shareId or ratingId" });
    }

    const dbDoc = await Flipbook.findOne({
      $or: [
        { "Customized_Settings.Visibility.shareId": shareId },
        { "share.shareId": shareId },
        { v_id: shareId }
      ]
    });

    if (!dbDoc) {
      return res.status(404).json({ message: "Flipbook not found" });
    }

    if (!Array.isArray(dbDoc.bookRating)) {
      dbDoc.bookRating = [];
    }

    dbDoc.bookRating = dbDoc.bookRating.filter(r => String(r._id) !== String(ratingId));

    const totalRatings = dbDoc.bookRating.length;
    const avgRating = totalRatings > 0
      ? Number((dbDoc.bookRating.reduce((sum, r) => sum + (r.ratingValue || 0), 0) / totalRatings).toFixed(1))
      : 0;

    dbDoc.averageRating = avgRating;
    dbDoc.totalRatings = totalRatings;

    await dbDoc.save();

    return res.status(200).json({
      success: true,
      message: "Rating deleted successfully",
      bookRating: dbDoc.bookRating,
      averageRating: avgRating,
      totalRatings
    });
  } catch (err) {
    console.error("Error deleting rating:", err);
    return res.status(500).json({ success: false, message: "Server error while deleting rating" });
  }
});

// @route   GET /api/flipbook/check-owner/:shareId
// @desc    Check if a flipbook belongs to a specific user email via shareId
router.get("/check-owner/:shareId", async (req, res) => {
  try {
    const { shareId } = req.params;
    const { emailId } = req.query;
    
    if (!shareId || !emailId) return res.status(400).json({ message: "Missing shareId or emailId" });

    const dbDoc = await Flipbook.findOne({
      $or: [
        { "Customized_Settings.Visibility.shareId": shareId },
        { "share.shareId": shareId },
        { v_id: shareId }  // fallback for editor preview passing v_id
      ]
    }).lean();
    if (!dbDoc) return res.status(404).json({ message: "Flipbook not found" });

    if (dbDoc.userEmail !== emailId) {
      return res.status(403).json({ message: "Unauthorized", isOwner: false });
    }

    res.json({ message: "Authorized", isOwner: true });
  } catch (err) {
    console.error("Error in check-owner:", err);
    res.status(500).json({ message: "Server error" });
  }
});

// @route   POST /api/flipbook/public/verify-password
// @desc    Verify password or accessKey for a password-protected flipbook
router.post("/public/verify-password", async (req, res) => {
  try {
    const { shareId, password, accessKey } = req.body;
    if (!shareId) return res.status(400).json({ message: "Missing shareId" });

    const dbDoc = await Flipbook.findOne({
      $or: [
        { "Customized_Settings.Visibility.shareId": shareId },
        { "share.shareId": shareId }
      ]
    });
    if (!dbDoc) return res.status(404).json({ message: "Flipbook not found" });

    const vis = dbDoc.Customized_Settings?.Visibility || dbDoc.share || {};
    const inputKey = accessKey || password;

    if (inputKey) {
      const isKeyMatch = await compareKeys(inputKey, vis.accessKey);
      if (isKeyMatch) {
        return res.json({ success: true, message: "Verification successful" });
      }
    }

    return res.status(401).json({ success: false, message: "Invalid Access Key" });
  } catch (err) {
    console.error("Error verifying password:", err);
    res.status(500).json({ message: "Server error" });
  }
});

// @route   POST /api/flipbook/verify-credential
// @desc    Verify current password or access key for editing visibility settings
router.post('/verify-credential', async (req, res) => {
  try {
    const { v_id, input, mode } = req.body;
    if (!input) return res.status(400).json({ message: "Missing input" });

    if (v_id) {
      const dbDoc = await Flipbook.findOne({
        $or: [{ v_id: v_id }, { flipbookName: v_id }]
      });

      if (dbDoc) {
        const vis = dbDoc.Customized_Settings?.Visibility || dbDoc.share || {};

        if (mode === 'password') {
          const isPassMatch = await compareKeys(input, vis.password);
          if (isPassMatch) {
            return res.json({ success: true, message: "Verification successful" });
          }
          return res.status(400).json({ message: "Current password is incorrect." });
        } else if (mode === 'accessKey') {
          const isKeyMatch = await compareKeys(input, vis.accessKey);
          if (isKeyMatch) {
            return res.json({ success: true, message: "Verification successful" });
          }
          return res.status(400).json({ message: "Current access key is incorrect." });
        } else {
          const isPassMatch = await compareKeys(input, vis.password);
          const isKeyMatch = await compareKeys(input, vis.accessKey);
          if (isPassMatch || isKeyMatch) {
            return res.json({ success: true, message: "Verification successful" });
          }
        }
      }
    }

    return res.status(400).json({ message: mode === 'accessKey' ? "Current access key is incorrect." : "Current password is incorrect." });
  } catch (err) {
    console.error("Error verifying credential:", err);
    res.status(500).json({ message: "Server error verifying credential" });
  }
});

// @route   POST /api/flipbook/send-visibility-otp
// @desc    Send OTP to user email for visibility settings & store OTP in Flipbook model
router.post('/send-visibility-otp', async (req, res) => {
  try {
    const { emailId, v_id } = req.body;
    if (!emailId) return res.status(400).json({ message: "Missing emailId" });

    // Generate 4-digit OTP
    const otp = Math.floor(1000 + Math.random() * 9000).toString();
    const hashedOtp = await bcrypt.hash(otp, 10);

    // Store hashed OTP in Flipbook document if v_id is provided
    if (v_id) {
      await Flipbook.findOneAndUpdate(
        { v_id: v_id },
        { 
          $set: { 
            'Customized_Settings.Visibility.otp': hashedOtp,
            'share.otp': hashedOtp 
          } 
        }
      );
    }

    // Try sending email via Nodemailer
    try {
      const transporter = getTransporter();
      await transporter.sendMail({
        from: `Fisto <${process.env.EMAIL_USER || 'no-reply@fistotech.com'}>`,
        to: emailId,
        subject: 'Your Verification Code',
        html: `
          <!DOCTYPE html>
          <html>
          <body style="margin: 0; padding: 0; background-color: #f4f7f6; font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;">
            <div style="max-width: 600px; margin: 40px auto; background-color: #ffffff; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 15px rgba(0,0,0,0.05); border: 1px solid #eaeaea;">
              <div style="background: linear-gradient(135deg, #4c5add, #3f4bc0); padding: 30px 20px; text-align: center;">
                <h1 style="color: #ffffff; margin: 0; font-size: 28px; font-weight: 600; letter-spacing: 2px;">FIST-O</h1>
              </div>
              <div style="padding: 40px 30px;">
                <h2 style="color: #333333; font-size: 22px; font-weight: 600; margin-top: 0; text-align: center;">Verification Code</h2>
                <p style="color: #555555; font-size: 16px; line-height: 1.6;">Hello,</p>
                <p style="color: #555555; font-size: 16px; line-height: 1.6;">Please use the verification code below to update your flipbook security settings.</p>
                
                <div style="background-color: #f8f9fe; border: 2px dashed #4c5add; border-radius: 8px; padding: 24px; text-align: center; margin: 30px 0;">
                  <span style="display: block; font-size: 36px; font-weight: 700; color: #4c5add; letter-spacing: 8px; margin-left: 8px;">${otp}</span>
                </div>

                <p style="color: #777777; font-size: 14px; line-height: 1.6; margin-bottom: 0;">
                  This code is valid for a limited time. If you did not request this code, you can safely ignore this email.
                </p>
              </div>
              <div style="background-color: #f9f9f9; padding: 20px; text-align: center; border-top: 1px solid #eaeaea;">
                <p style="color: #999999; font-size: 12px; margin: 0;">&copy; ${new Date().getFullYear()} Fisto Tech. All rights reserved.</p>
              </div>
            </div>
          </body>
          </html>
        `
      });
    } catch (emailErr) {
      console.error("Nodemailer error sending visibility OTP:", emailErr);
      console.log(`[DEV OTP FALLBACK] Visibility OTP for ${emailId} (${v_id}): ${otp}`);
    }

    return res.json({ success: true, message: "OTP sent successfully", devOtp: otp });
  } catch (err) {
    console.error("Error sending visibility OTP:", err);
    res.status(500).json({ message: "Server error sending OTP" });
  }
});

// @route   POST /api/flipbook/verify-visibility-otp
// @desc    Verify OTP stored in Flipbook Visibility settings
router.post('/verify-visibility-otp', async (req, res) => {
  try {
    const { emailId, v_id, otp } = req.body;
    if (!otp) return res.status(400).json({ message: "Missing OTP code" });

    const inputOtp = String(otp).trim();

    if (v_id) {
      const dbDoc = await Flipbook.findOne({
        $or: [{ v_id: v_id }, { flipbookName: v_id }]
      });

      if (dbDoc) {
        const storedOtp = dbDoc.Customized_Settings?.Visibility?.otp || dbDoc.share?.otp;
        if (storedOtp) {
          const isOtpMatch = (await bcrypt.compare(inputOtp, String(storedOtp).trim())) || String(storedOtp).trim() === inputOtp;
          if (isOtpMatch) {
            // Clear OTP after successful verification
            await Flipbook.updateOne({ _id: dbDoc._id }, { $unset: { 'Customized_Settings.Visibility.otp': 1, 'share.otp': 1 } });
            return res.json({ success: true, message: "OTP verified successfully" });
          }
        }
      }
    }

    // Fallback user OTP verify check if User model has OTP
    const userDoc = await User.findOne({ 
      $or: [{ emailId: emailId }, { emailId: { $regex: new RegExp(`^${(emailId || '').trim()}$`, 'i') } }]
    });

    if (userDoc && userDoc.otp) {
      const isMatch = await bcrypt.compare(inputOtp, userDoc.otp);
      if (isMatch) {
        userDoc.otp = null;
        await userDoc.save();
        return res.json({ success: true, message: "OTP verified successfully" });
      }
    }

    return res.status(400).json({ message: "Invalid OTP code" });
  } catch (err) {
    console.error("Error verifying visibility OTP:", err);
    res.status(500).json({ message: "Server error verifying OTP" });
  }
});

// @route   POST /api/flipbook/public/verify-invite
// @desc    Verify if user email or domain is allowed for an invite-only flipbook
router.post("/public/verify-invite", async (req, res) => {
  try {
    const { shareId, email } = req.body;
    if (!shareId || !email) return res.status(400).json({ message: "Missing shareId or email" });

    const dbDoc = await Flipbook.findOne({
      $or: [
        { "Customized_Settings.Visibility.shareId": shareId },
        { "share.shareId": shareId }
      ]
    });
    if (!dbDoc) return res.status(404).json({ message: "Flipbook not found" });

    const vis = dbDoc.Customized_Settings?.Visibility || dbDoc.share || {};
    const userEmailLower = email.trim().toLowerCase();
    const userDomainLower = userEmailLower.includes('@') ? userEmailLower.split('@')[1] : '';

    const allowedEmails = (vis.inviteOnly?.emails || []).map(e => (e.email || e).toLowerCase());
    const allowedDomains = (vis.inviteOnly?.domains || []).map(d => (d.domain || d).toLowerCase());

    const isEmailAllowed = allowedEmails.includes(userEmailLower);
    const isDomainAllowed = allowedDomains.some(dom => userDomainLower === dom || userDomainLower.endsWith('.' + dom));

    if (isEmailAllowed || isDomainAllowed) {
      // Check Auto Expire timer
      const autoExpire = vis.inviteOnly?.autoExpire;
      if (autoExpire && autoExpire.enabled) {
        const isExpired = checkInviteAutoExpired(autoExpire, dbDoc.updatedAt || dbDoc.createdAt);
        if (isExpired) {
          return res.status(403).json({
            success: false,
            isExpired: true,
            message: "Time Expired! The access time granted for this flipbook has expired."
          });
        }
      }

      return res.json({ success: true, message: "Invite access verified" });
    }

    return res.status(403).json({ success: false, message: "Your email or domain is not authorized to view this flipbook" });
  } catch (err) {
    console.error("Error verifying invite:", err);
    res.status(500).json({ message: "Server error" });
  }
});

// @route DELETE /api/flipbook/folder
router.delete("/folder", async (req, res) => {
  try {
    const { emailId, folderName } = req.body;
    if (!emailId || !folderName)
      return res.status(400).json({ message: "Missing fields" });

    const sanitizedEmail = emailId.replace(/[@.]/g, "_");
    const uploadsDir = path.join(__dirname, "../../uploads");
    const targetDir = path.join(
      uploadsDir,
      sanitizedEmail,
      "My_Flipbooks",
      folderName,
    );

    // Delete local directory if it exists
    if (fs.existsSync(targetDir)) {
      try {
        fs.rmSync(targetDir, { recursive: true, force: true });
      } catch (rmErr) {
        console.warn("Local folder rmSync warning:", rmErr);
      }
    }

    // Delete folder from Supabase Storage in background
    const supabaseFolderPrefix = `${sanitizedEmail}/${FLIPBOOK_ROOT}/${folderName}`;
    deleteFolderFromSupabase(supabaseFolderPrefix).catch((e) =>
      console.warn("[Supabase] Delete folder warning:", e)
    );



    // Find all books to be deleted to get their v_ids
    const booksToDelete = await Flipbook.find({
      userEmail: emailId,
      $or: [{ folderName: folderName }, { folderName: { $in: [folderName] } }]
    });
    const bookVIds = booksToDelete.map((b) => b.v_id).filter(Boolean);

    if (bookVIds.length > 0) {
      console.log(
        `Deleting assets for ${bookVIds.length} flipbooks in folder: ${folderName}`,
      );
      try {
        const folderAssets = await FlipbookAsset.find({ flipbook_v_id: { $in: bookVIds } });
        for (const asset of folderAssets) {
          if (asset.url) {
            deleteFileFromSupabase(asset.url).catch(e => console.warn("[Supabase] Delete asset warning:", e));
          }
        }
        // Remove asset records
        const result = await FlipbookAsset.deleteMany({
          flipbook_v_id: { $in: bookVIds },
        });
        console.log(`Deleted ${result.deletedCount} asset records.`);
      } catch (assetErr) {
        console.error("Error cleaning up folder assets:", assetErr);
      }
    }

    // Delete from MongoDB
    await Flipbook.deleteMany({
      userEmail: emailId,
      $or: [{ folderName: folderName }, { folderName: { $in: [folderName] } }]
    });

    // Remove deleted books from everyone's shelf
    if (bookVIds && bookVIds.length > 0) {
      try {
        await Profile.updateMany(
          {},
          { $pull: { "myShelf.folders.$[].books": { v_id: { $in: bookVIds } } } }
        );
      } catch (shelfErr) {
        console.error("Error removing deleted folder books from shelves:", shelfErr);
      }
    }

    res.json({ message: "Deleted successfully" });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error" });
  }
});

// @route POST /api/flipbook/rename
router.post("/rename", async (req, res) => {
  try {
    const { emailId, folderName, oldName, newName } = req.body;
    const sanitizedEmail = emailId.replace(/[@.]/g, "_");

    // Resolve Real Folder
    let effectiveFolderName = folderName;
    if (folderName === "Recent Book") {
      const dbDoc = await Flipbook.findOne({
        userEmail: emailId,
        flipbookName: oldName,
        folderName: "Recent Book",
      });
      if (dbDoc && dbDoc.folderName) {
        if (Array.isArray(dbDoc.folderName)) {
          const realFolders = dbDoc.folderName.filter(
            (f) => f !== "Recent Book",
          );
          if (realFolders.length > 0) effectiveFolderName = realFolders[0];
        } else if (dbDoc.folderName !== "Recent Book") {
          effectiveFolderName = dbDoc.folderName;
        }
      }
    }

    const safeNewName = newName.replace(/[^a-zA-Z0-9 _-]/g, "");

    // Check MongoDB for source book and target conflict
    const docToUpdate = await Flipbook.findOne({
      userEmail: emailId,
      flipbookName: oldName,
    });

    const targetDoc = await Flipbook.findOne({
      userEmail: emailId,
      flipbookName: safeNewName,
    });

    if (targetDoc && targetDoc.v_id !== docToUpdate?.v_id) {
      return res.status(409).json({ message: "Name exists" });
    }

    if (!docToUpdate) {
      return res.status(404).json({ message: "Book not found" });
    }

    // Sync book folder rename to Supabase Storage
    const oldSupabaseBookPrefix = `${sanitizedEmail}/${FLIPBOOK_ROOT}/${effectiveFolderName}/${oldName}`;
    const newSupabaseBookPrefix = `${sanitizedEmail}/${FLIPBOOK_ROOT}/${effectiveFolderName}/${safeNewName}`;
    await renamePathInSupabase(oldSupabaseBookPrefix, newSupabaseBookPrefix).catch((err) =>
      console.warn("[Supabase] Book rename warning:", err)
    );

    // Update MongoDB
    if (docToUpdate) {
      docToUpdate.flipbookName = safeNewName;
      docToUpdate.lastUpdated = new Date();
      await docToUpdate.save();
    }

    // UPDATE ASSETS: Update flipbookName and reconstruct URLs
    if (docToUpdate && docToUpdate.v_id) {
      try {
        console.log(
          `Updating assets for renamed flipbook: "${oldName}" → "${safeNewName}"`,
        );

        const assets = await FlipbookAsset.find({
          flipbook_v_id: docToUpdate.v_id,
        });

        if (assets.length > 0) {
          for (const asset of assets) {
            asset.flipbookName = safeNewName;
            const emailPart = asset.url.split(`/${FLIPBOOK_ROOT}/`)[0];
            asset.url = `${emailPart}/${FLIPBOOK_ROOT}/${asset.folderName}/${safeNewName}/assets/${asset.assetType}/${asset.fileName}`;
            await asset.save();
          }
          console.log(
            `✅ Updated ${assets.length} asset(s) for renamed flipbook`,
          );
        }
      } catch (err) {
        console.error("❌ Error updating assets after rename:", err);
      }
    }

    res.json({ message: "Renamed", newName: safeNewName });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error" });
  }
});

// @route POST /api/flipbook/move
router.post("/move", async (req, res) => {
  try {
    const { emailId, bookName, currentFolder, targetFolder } = req.body;
    const sanitizedEmail = emailId.replace(/[@.]/g, "_");

    // Resolve Real Source Folder
    let effectiveCurrentFolder = currentFolder;
    if (currentFolder === "Recent Book") {
      const dbDoc = await Flipbook.findOne({
        userEmail: emailId,
        flipbookName: bookName,
        folderName: "Recent Book",
      });
      if (dbDoc && dbDoc.folderName) {
        if (Array.isArray(dbDoc.folderName)) {
          const realFolders = dbDoc.folderName.filter(
            (f) => f !== "Recent Book",
          );
          if (realFolders.length > 0) effectiveCurrentFolder = realFolders[0];
        } else if (dbDoc.folderName !== "Recent Book") {
          effectiveCurrentFolder = dbDoc.folderName;
        }
      }
    }

    // Move flipbook directory in Supabase Storage in background
    const oldSupabaseMovePrefix = `${sanitizedEmail}/${FLIPBOOK_ROOT}/${effectiveCurrentFolder}/${bookName}`;
    const newSupabaseMovePrefix = `${sanitizedEmail}/${FLIPBOOK_ROOT}/${targetFolder}/${bookName}`;
    renamePathInSupabase(oldSupabaseMovePrefix, newSupabaseMovePrefix).catch((err) =>
      console.warn("[Supabase] Book move warning:", err)
    );

    // Update MongoDB
    const bookToMove = await Flipbook.findOne({
      userEmail: emailId,
      folderName: { $in: [effectiveCurrentFolder] },
      flipbookName: bookName,
    });

    if (bookToMove) {
      if (Array.isArray(bookToMove.folderName)) {
        let tags = bookToMove.folderName.filter(
          (f) => f !== effectiveCurrentFolder,
        );
        tags.push(targetFolder);
        bookToMove.folderName = [...new Set(tags)];
      } else {
        bookToMove.folderName = [targetFolder];
      }
      bookToMove.lastUpdated = new Date();
      await bookToMove.save();

      // UPDATE ASSETS: Update folderName and reconstruct URLs
      if (bookToMove.v_id) {
        try {
          const assets = await FlipbookAsset.find({
            flipbook_v_id: bookToMove.v_id,
          });

          if (assets.length > 0) {
            for (const asset of assets) {
              asset.folderName = targetFolder;
              const emailPart = asset.url.split(`/${FLIPBOOK_ROOT}/`)[0];
              asset.url = `${emailPart}/${FLIPBOOK_ROOT}/${targetFolder}/${asset.flipbookName}/assets/${asset.assetType}/${asset.fileName}`;
              await asset.save();
            }
            console.log(
              `✅ Updated ${assets.length} asset(s) for moved flipbook`,
            );
          }
        } catch (err) {
          console.error("❌ Error updating assets after move:", err);
        }
      }
    }

    res.json({ message: "Moved" });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error" });
  }
});

// @route POST /api/flipbook/remove-recent
router.post("/remove-recent", async (req, res) => {
  try {
    const { emailId, bookName } = req.body;
    if (!emailId || !bookName)
      return res.status(400).json({ message: "Missing fields" });

    await Flipbook.updateOne(
      { userEmail: emailId, flipbookName: bookName, folderName: "Recent Book" },
      { $pull: { folderName: "Recent Book" } },
    );
    res.json({ message: "Removed from Recent" });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error" });
  }
});

// @route POST /api/flipbook/trash
// @desc Move flipbook to trash
router.post("/trash", async (req, res) => {
  try {
    const { emailId, folderName, bookName, v_id } = req.body;
    if (!emailId || (!bookName && !v_id)) {
      return res.status(400).json({ message: "Missing required fields" });
    }

    const query = { userEmail: emailId };
    if (v_id) {
      query.v_id = v_id;
    } else {
      query.flipbookName = bookName;
      if (folderName && folderName !== "Recent Book" && folderName !== "Trash") {
        query.$or = [{ folderName: folderName }, { folderName: { $in: [folderName] } }];
      }
    }

    let updated = await Flipbook.findOneAndUpdate(
      query,
      {
        $set: { 
          trash: true, 
          trashedAt: new Date(), 
          isPublished: false,
          'Customized_Settings.FlipbookInfo.tags': []
        },
        $pull: { folderName: { $in: ["Recent Book", "Recent", "Recent book"] } }
      },
      { new: true }
    );

    if (!updated && !v_id) {
      updated = await Flipbook.findOneAndUpdate(
        { userEmail: emailId, flipbookName: bookName },
        {
          $set: { 
            trash: true, 
            trashedAt: new Date(), 
            isPublished: false,
            'Customized_Settings.FlipbookInfo.tags': []
          },
          $pull: { folderName: { $in: ["Recent Book", "Recent", "Recent book"] } }
        },
        { new: true }
      );
    }

    // Ensure all documents associated with this book (by v_id or flipbookName) are marked trash: true and pulled from Recent Book
    const orConditions = [];
    if (v_id) orConditions.push({ v_id });
    if (updated?.v_id) orConditions.push({ v_id: updated.v_id });
    if (bookName) orConditions.push({ flipbookName: bookName });
    if (updated?.flipbookName) orConditions.push({ flipbookName: updated.flipbookName });

    if (orConditions.length > 0) {
      await Flipbook.updateMany(
        { userEmail: emailId, $or: orConditions },
        {
          $set: { 
            trash: true, 
            trashedAt: new Date(), 
            isPublished: false,
            'Customized_Settings.FlipbookInfo.tags': []
          },
          $pull: { folderName: { $in: ["Recent Book", "Recent", "Recent book"] } }
        }
      ).catch(() => {});
    }

    // Remove from everyone's shelf if it was on shelves
    if (updated?.v_id) {
      Profile.updateMany(
        {},
        { $pull: { "myShelf.folders.$[].books": { v_id: updated.v_id } } }
      ).catch(() => {});
    }

    logActivity({
      userEmail: emailId,
      type: 'trash_flip',
      title: 'You moved a flipbook to trash',
      desc: `Flipbook: ${bookName || updated?.flipbookName}`,
      entityId: updated?.v_id || v_id || '',
      entityName: bookName || updated?.flipbookName
    });

    res.json({ message: "Moved to trash successfully", book: updated });
  } catch (err) {
    console.error("Error moving flipbook to trash:", err);
    res.status(500).json({ message: "Server error" });
  }
});

// @route POST /api/flipbook/restore
// @desc Restore flipbook from trash
router.post("/restore", async (req, res) => {
  try {
    const { emailId, bookName, v_id } = req.body;
    if (!emailId || (!bookName && !v_id)) {
      return res.status(400).json({ message: "Missing required fields" });
    }

    const query = { userEmail: emailId };
    if (v_id) {
      query.v_id = v_id;
    } else {
      query.flipbookName = bookName;
    }

    const updated = await Flipbook.findOneAndUpdate(
      query,
      { $set: { trash: false, trashedAt: null } },
      { new: true }
    );

    logActivity({
      userEmail: emailId,
      type: 'restore_flip',
      title: 'You restored a flipbook',
      desc: `Flipbook: ${bookName || updated?.flipbookName}`,
      entityId: updated?.v_id || v_id || '',
      entityName: bookName || updated?.flipbookName
    });

    res.json({ message: "Flipbook restored successfully", book: updated });
  } catch (err) {
    console.error("Error restoring flipbook:", err);
    res.status(500).json({ message: "Server error" });
  }
});

// @route POST /api/flipbook/empty-trash
// @desc Permanently delete all books in trash
router.post("/empty-trash", async (req, res) => {
  try {
    const { emailId } = req.body;
    if (!emailId) return res.status(400).json({ message: "Missing emailId" });

    const trashedBooks = await Flipbook.find({ userEmail: emailId, trash: true });
    const sanitizedEmail = emailId.replace(/[@.]/g, "_");

    for (const book of trashedBooks) {
      const realFolders = Array.isArray(book.folderName)
        ? book.folderName.filter(f => f !== "Recent Book" && f !== "Recent book" && f !== "Trash")
        : [book.folderName];
      const folder = realFolders[0] || "My_Flipbooks";

      const supabaseBookPrefix = `${sanitizedEmail}/${FLIPBOOK_ROOT}/${folder}/${book.flipbookName}`;
      await deleteFolderFromSupabase(supabaseBookPrefix).catch(() => {});

      if (book.v_id) {
        try {
          const assets = await FlipbookAsset.find({ flipbook_v_id: book.v_id });
          for (const asset of assets) {
            if (asset.url) await deleteFileFromSupabase(asset.url).catch(() => {});
          }
          await FlipbookAsset.deleteMany({ flipbook_v_id: book.v_id });
        } catch (e) {}

        try {
          await InteractionThreedModel.deleteMany({ userEmail: emailId, flipbookName: book.flipbookName });
        } catch (e) {}
      }
    }

    await Flipbook.deleteMany({ userEmail: emailId, trash: true });
    res.json({ message: "Trash emptied successfully", deletedCount: trashedBooks.length });
  } catch (err) {
    console.error("Error emptying trash:", err);
    res.status(500).json({ message: "Server error" });
  }
});

// @route POST /api/flipbook/favorite
// @desc Toggle or set favorite status for a flipbook
router.post("/favorite", async (req, res) => {
  try {
    const { emailId, bookName, v_id, isFavorite } = req.body;
    if (!emailId) return res.status(400).json({ message: "Missing emailId" });

    const query = {
      $or: [
        { userEmail: emailId },
        { userEmail: emailId.toLowerCase() }
      ]
    };
    if (v_id) {
      query.v_id = v_id;
    } else if (bookName) {
      query.flipbookName = bookName;
    }

    const result = await Flipbook.updateMany(
      query,
      { $set: { isFavorite: Boolean(isFavorite) } }
    );
    res.json({ message: "Favorite updated", isFavorite: Boolean(isFavorite), matchedCount: result.matchedCount });
  } catch (err) {
    console.error("Error updating favorite:", err);
    res.status(500).json({ message: "Server error" });
  }
});

// @route DELETE /api/flipbook/delete
router.delete("/delete", async (req, res) => {
  try {
    const { emailId, folderName, bookName, v_id } = req.body;
    const sanitizedEmail = emailId.replace(/[@.]/g, "_");

    // First find the book to know its real folder and v_id
    let targetBook = null;
    if (v_id) {
      targetBook = await Flipbook.findOne({ userEmail: emailId, v_id });
    }
    if (!targetBook && bookName) {
      if (folderName && folderName !== "Trash" && folderName !== "Recent Book") {
        targetBook = await Flipbook.findOne({
          userEmail: emailId,
          flipbookName: bookName,
          $or: [{ folderName: folderName }, { folderName: { $in: [folderName] } }]
        });
      }
      if (!targetBook) {
        targetBook = await Flipbook.findOne({ userEmail: emailId, flipbookName: bookName });
      }
    }

    const realFolders = targetBook && Array.isArray(targetBook.folderName)
      ? targetBook.folderName.filter(f => f !== "Recent Book" && f !== "Recent book" && f !== "Trash")
      : (targetBook && targetBook.folderName ? [targetBook.folderName] : [folderName || "My_Flipbooks"]);
    const storageFolder = (folderName && folderName !== "Trash" && folderName !== "Recent Book") ? folderName : (realFolders[0] || "My_Flipbooks");
    const targetBookName = targetBook ? targetBook.flipbookName : bookName;

    // Delete flipbook folder and all files from Supabase Storage
    const supabaseBookPrefix = `${sanitizedEmail}/${FLIPBOOK_ROOT}/${storageFolder}/${targetBookName}`;
    await deleteFolderFromSupabase(supabaseBookPrefix).catch(e => console.warn("[Supabase] Delete book folder warning:", e));

    // Delete from MongoDB
    let deletedBook = null;
    if (targetBook) {
      deletedBook = await Flipbook.findByIdAndDelete(targetBook._id);
    } else {
      deletedBook = await Flipbook.findOneAndDelete({
        userEmail: emailId,
        flipbookName: bookName,
      });
    }

    const bookVId = deletedBook?.v_id || targetBook?.v_id || v_id;
    if (bookVId) {
      console.log(`Deleting assets for flipbook: ${targetBookName} (${bookVId})`);
      try {
        const assets = await FlipbookAsset.find({ flipbook_v_id: bookVId });
        for (const asset of assets) {
          if (asset.url) {
            await deleteFileFromSupabase(asset.url).catch(e => console.warn("[Supabase] Delete asset warning:", e));
          }
        }
        await FlipbookAsset.deleteMany({ flipbook_v_id: bookVId });
      } catch (assetErr) {
        console.error("Error cleaning up assets:", assetErr);
      }

      try {
        await InteractionThreedModel.deleteMany({
          userEmail: emailId,
          flipbookName: targetBookName,
        });
      } catch (modelErr) {
        console.error("Error cleaning up 3D model records:", modelErr);
      }
    }

    // Log user activity
    logActivity({
      userEmail: emailId,
      type: 'delete_flip',
      title: 'You deleted a flipbook permanently',
      desc: `Flipbook: ${targetBookName}`,
      entityId: bookVId || '',
      entityName: targetBookName
    });

    res.json({ message: "Deleted" });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error" });
  }
});

const tempUploadsDir = path.join(__dirname, "../../temp_uploads");
if (!fs.existsSync(tempUploadsDir)) {
  fs.mkdirSync(tempUploadsDir, { recursive: true });
}

const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, tempUploadsDir);
  },
  filename: function (req, file, cb) {
    cb(null, Date.now() + "-" + file.originalname);
  },
});

const upload = multer({ 
  storage: storage,
  limits: {
    fileSize: 50 * 1024 * 1024,
  },
});

router.post("/convert-pdf-to-svg", upload.single("pdf"), async (req, res) => {
  try {
    const file = req.file;
    if (!file) {
      return res.status(400).json({ message: "No file uploaded" });
    }

    // Temporary output directory for SVG files in temp_uploads
    const outDir = path.join(__dirname, "../../temp_uploads/temp_svg_" + Date.now());
    if (!fs.existsSync(outDir)) {
      fs.mkdirSync(outDir, { recursive: true });
    }

    // Output pattern for pdf2svg
    const outPattern = path.join(outDir, "page-%d.svg");

    try {
      let commandFailed = false;
      try {
        // Attempt 1: Execute pdf2svg command if it exists in system PATH
        await execAsync(`pdf2svg "${file.path}" "${outPattern}" all`);
      } catch (err1) {
        console.warn("pdf2svg failed or not found, attempting local pdftocairo fallback...", err1.message);
        commandFailed = true;
      }

      if (commandFailed) {
        // Attempt 2: Fallback to local pdftocairo (Poppler Windows binary)
        const pdftocairoPath = path.join(__dirname, "../../poppler/poppler-24.08.0/Library/bin/pdftocairo.exe");
        const outPrefix = path.join(outDir, "page");
        
        // pdftocairo syntax: pdftocairo -svg input.pdf output_prefix
        // Generates: output_prefix-1.svg, output_prefix-2.svg, etc.
        await execAsync(`"${pdftocairoPath}" -svg "${file.path}" "${outPrefix}"`);
      }

      // Read all generated SVG files
      const files = fs.readdirSync(outDir).filter(f => f.endsWith(".svg"));
      
      // Sort files by page number: page-1.svg, page-2.svg, etc.
      files.sort((a, b) => {
        const numA = parseInt(a.replace(/\D/g, ''));
        const numB = parseInt(b.replace(/\D/g, ''));
        return numA - numB;
      });

      const svgs = [];
      for (const svgFile of files) {
        const svgPath = path.join(outDir, svgFile);
        const svgContent = fs.readFileSync(svgPath, "utf-8");
        svgs.push({ content: svgContent });
      }

      // Cleanup temp directory and original uploaded PDF
      fs.rmSync(outDir, { recursive: true, force: true });
      if (fs.existsSync(file.path)) fs.unlinkSync(file.path);

      res.status(200).json({ svgs });

    } catch (err) {
      console.error("Error running pdf2svg / pdftocairo:", err);
      // Cleanup on error
      if (fs.existsSync(outDir)) fs.rmSync(outDir, { recursive: true, force: true });
      if (fs.existsSync(file.path)) fs.unlinkSync(file.path);
      
      res.status(500).json({ 
        message: "Failed to convert PDF using native tools. Please ensure pdf2svg is installed in PATH, or the local pdftocairo binary has finished downloading.", 
        error: err.message 
      });
    }

  } catch (error) {
    console.error("PDF to SVG conversion error:", error);
    res.status(500).json({ message: "Internal server error" });
  }
});

router.post("/upload-asset", upload.single("file"), async (req, res) => {
  try {
    console.log("Upload Asset Request Body:", req.body);
    const { emailId, type, v_id, replacing_file_v_id, replacing_file_url, page_v_id } = req.body;
    let { folderName, flipbookName } = req.body;
    const file = req.file;

    if (!file) {
      console.error("Upload Asset: No file in request");
      return res.status(400).json({ message: "No file uploaded" });
    }

    if (!emailId) {
      if (fs.existsSync(file.path)) fs.unlinkSync(file.path);
      return res.status(400).json({ message: "Missing fields: emailId" });
    }

    // --- Storage Limit Check ---
    try {
      const userSettings = await UserSettings.findOne({ emailId });
      const maxStorage = userSettings?.maxStorage || 300 * 1024 * 1024;
      
      const currentUsedStorage = await calculateActiveUserStorage(emailId);

      if (currentUsedStorage + file.size > maxStorage) {
        if (fs.existsSync(file.path)) fs.unlinkSync(file.path);
        return res.status(413).json({ 
          message: `Storage limit reached (${Math.round(maxStorage / (1024 * 1024))}MB). Please upgrade your plan to upload more assets.`,
          code: "STORAGE_LIMIT_EXCEEDED"
        });
      }
    } catch (storageErr) {
      console.error("Error during storage limit check:", storageErr);
    }

    // 1. Resolve Project Metadata (V_ID, Folder, Name)
    if (v_id) {
      const dbDoc = await Flipbook.findOne({ v_id });
      if (dbDoc) {
        flipbookName = dbDoc.flipbookName;
        // Resolve folder
        if (Array.isArray(dbDoc.folderName)) {
          const realFolders = dbDoc.folderName.filter(
            (f) => f !== "Recent Book",
          );
          folderName =
            realFolders.length > 0
              ? realFolders[0]
              : dbDoc.folderName[0] || "My_Flipbooks";
        } else {
          folderName = dbDoc.folderName;
        }
        // Verify ownership
        if (dbDoc.userEmail !== emailId) {
          if (fs.existsSync(file.path)) fs.unlinkSync(file.path);
          return res.status(403).json({ message: "Unauthorized" });
        }
      }
    }

    // Sanitize identifiers to avoid illegal path characters & Ensure non-empty fallback
    let safeFolderName = (folderName || "My_Flipbooks")
      .replace(/[^a-zA-Z0-9 _-]/g, "")
      .trim();
    if (!safeFolderName) safeFolderName = FLIPBOOK_ROOT;

    let safeFlipbookName = (flipbookName || "Untitled Document")
      .replace(/[^a-zA-Z0-9 _-]/g, "")
      .trim();
    if (!safeFlipbookName) safeFlipbookName = "Untitled_Document";

    const sanitizedEmail = emailId.replace(/[@.]/g, "_");

    // Define Paths
    let relativeUrlBase; // Base for URL

    const assetType = (type || "video").toLowerCase();

    if (req.body.isGallery === "true" || req.body.isGallery === true) {
      const typeMap = {
        image: "Images",
        video: "Videos",
        gif: "gifs",
        svg: "Images",
      };
      const targetFolder = typeMap[assetType] || "Images";
      relativeUrlBase = `/uploads/${sanitizedEmail}/${targetFolder}`;

      safeFolderName = "Gallery";
      safeFlipbookName = targetFolder;
    } else {
      let subFolder = assetType;
      if (assetType === 'image' || assetType === 'images') subFolder = 'Image';
      else if (assetType === 'audio') subFolder = 'audio';
      else if (assetType === 'video') subFolder = 'video';
      else if (assetType === '3d' || assetType === '3d_model' || assetType === '3d_modals' || assetType === 'model') subFolder = '3D_Model';
      else if (assetType === 'gif') subFolder = 'gif';

      relativeUrlBase = `/uploads/${sanitizedEmail}/${FLIPBOOK_ROOT}/${safeFolderName}/${safeFlipbookName}/assets/${subFolder}`;
    }

    // --- Handle Replacement / Old File Deletion ---
    let oldFilename = null;
    let oldUrl = null;

    if (replacing_file_v_id || replacing_file_url) {
      console.log(`Replacing asset. replacing_file_v_id: ${replacing_file_v_id}, replacing_file_url: ${replacing_file_url}`);
      try {
        let oldAsset = null;
        if (replacing_file_v_id) {
          oldAsset = await FlipbookAsset.findOne({ file_v_id: replacing_file_v_id });
        } else if (replacing_file_url) {
          let urlQuery = replacing_file_url.startsWith('http') 
              ? new URL(replacing_file_url).pathname 
              : replacing_file_url;
          urlQuery = decodeURIComponent(urlQuery);
          const escapedUrlQuery = urlQuery.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
          oldAsset = await FlipbookAsset.findOne({ url: { $regex: escapedUrlQuery + '$' } });
        }

        if (oldAsset) {
          console.log(`Found old asset in DB: ${oldAsset._id} with URL ${oldAsset.url}`);
          oldFilename = oldAsset.fileName;
          oldUrl = oldAsset.url;

          // Delete Supabase asset
          if (oldAsset.url) {
            deleteFileFromSupabase(oldAsset.url).catch(e => console.warn("[Supabase] Delete old asset warning:", e));
          }
          // Delete DB record
          await FlipbookAsset.deleteOne({ _id: oldAsset._id });
        }
      } catch (delErr) {
        console.warn("Failed to delete old asset:", delErr.message);
      }
    }

    // Generate Unique Filename
    const fileExt = path.extname(file.originalname);
    const file_v_id = nanoid();
    const uniqueFilename = `${file_v_id}${fileExt}`;
    const finalPageVId = page_v_id || "global";

    // Generate relative URL
    const relativeUrl = `${relativeUrlBase}/${uniqueFilename}`;

    // Upload new asset to Supabase Storage directly from temp file
    const supabaseDestPath = relativeUrl.replace(/^\/uploads\//, "");
    await uploadFileToSupabase(file.path, supabaseDestPath).catch(err => console.warn("[Supabase] Asset upload warning:", err));

    // Cleanup temp file
    if (file && file.path && fs.existsSync(file.path)) {
      try { fs.unlinkSync(file.path); } catch(e) {}
    }

    // Save to Database
    let savedAssetType = assetType;
    if (assetType === 'image' || assetType === 'images') savedAssetType = 'Image';
    else if (assetType === '3d' || assetType === '3d_model' || assetType === '3d_modals' || assetType === 'model') savedAssetType = '3D_Model';

    const newAsset = new FlipbookAsset({
      flipbook_v_id: v_id || "temp_" + Date.now(),
      file_v_id: file_v_id,
      page_v_id: finalPageVId,
      assetType: savedAssetType,
      fileName: uniqueFilename,
      originalName: file.originalname,
      userEmail: emailId,
      isGallery: req.body.isGallery === "true" || req.body.isGallery === true,
      flipbookName: safeFlipbookName,
      folderName: safeFolderName,
      url: relativeUrl,
      size: file.size,
    });

    await newAsset.save();

    console.log(`Asset saved successfully to Supabase: ${uniqueFilename}`);
    res.json({
      url: relativeUrl,
      file_v_id: file_v_id,
      filename: uniqueFilename,
    });
  } catch (err) {
    console.error("CRITICAL UPLOAD ERROR:", err);
    if (req.file && req.file.path && fs.existsSync(req.file.path)) {
      try {
        fs.unlinkSync(req.file.path);
      } catch (e) {}
    }
    res.status(500).json({
      message: `Server Error: ${err.message}`,
      details: err.toString(),
    });
  }
});

// @route GET /api/flipbook/get-gallery-assets
// @desc Get global gallery assets (images, videos, gifs, 3d models) from Supabase Storage & MongoDB
router.get("/get-gallery-assets", async (req, res) => {
  try {
    const { emailId, type, currentUrl, currentFileName } = req.query;

    if (!emailId) {
      return res.status(400).json({ message: "Missing emailId" });
    }

    const sanitizedEmail = emailId.replace(/[@.]/g, "_");
    const requestedType = type ? type.toLowerCase() : null;
    const assetsMap = new Map();
    const validMediaExtensions = /\.(jpg|jpeg|png|gif|webp|svg|mp4|webm|mov|mkv|glb|gltf|fbx|obj)$/i;

    // 1. Query MongoDB FlipbookAsset collection ONLY for global gallery assets (excluding page assets under My_Flipbooks)
    const escapedEmail = escapeRegex(sanitizedEmail);
    const dbAssets = await FlipbookAsset.find({
      $and: [
        {
          $or: [
            { userEmail: emailId },
            { url: { $regex: `\/uploads\/${escapedEmail}\/` } }
          ]
        },
        {
          $or: [
            { folderName: "Gallery" },
            { isGallery: true },
            { url: { $regex: `\/uploads\/${escapedEmail}\/(?:Images|Videos|gifs|3D_Models|3D_Modals|Image|video|gif)\/` } }
          ]
        }
      ]
    }).sort({ createdAt: -1 });

    for (const asset of dbAssets) {
      if (asset.url && asset.fileName && validMediaExtensions.test(asset.fileName)) {
        // Exclude currently selected asset if specified
        if (currentFileName && (asset.fileName === currentFileName || asset.file_v_id === currentFileName)) continue;
        if (currentUrl && asset.url && asset.url.toLowerCase().includes(currentUrl.toLowerCase())) continue;

        let detectedType = (asset.assetType || "").toLowerCase();
        if (!detectedType) {
          if (asset.url.includes('/Videos/') || asset.url.includes('/video/')) detectedType = 'video';
          else if (asset.url.includes('/gifs/') || asset.url.includes('/gif/')) detectedType = 'gif';
          else if (asset.url.includes('/3D_Model/') || asset.url.includes('/3D_Models/') || asset.url.includes('/3D_Modals/')) detectedType = '3d';
          else detectedType = 'image';
        } else if (detectedType === 'images') detectedType = 'image';
        else if (detectedType === 'videos') detectedType = 'video';
        else if (detectedType === '3d_model' || detectedType === '3d_models' || detectedType === '3d_modals') detectedType = '3d';

        if (!requestedType || detectedType === requestedType || (requestedType === 'image' && detectedType === 'image') || (requestedType === '3d' && detectedType === '3d')) {
          assetsMap.set(asset.fileName, {
            id: asset.fileName,
            name: asset.originalName || asset.fileName,
            url: asset.url,
            type: detectedType,
            size: asset.size || 0,
            uploadedAt: asset.createdAt || new Date()
          });
        }
      }
    }

    // 2. Fetch files directly from global user Supabase Storage gallery subfolders
    const supabaseFolderMap = {
      image: [`${sanitizedEmail}/Images`, `${sanitizedEmail}/Image`],
      video: [`${sanitizedEmail}/Videos`, `${sanitizedEmail}/video`],
      gif: [`${sanitizedEmail}/gifs`, `${sanitizedEmail}/gif`],
      '3d': [`${sanitizedEmail}/3D_Models`, `${sanitizedEmail}/3D_Modals`, `${sanitizedEmail}/3D_Model`]
    };

    const targetTypes = requestedType ? [requestedType] : ['image', 'video', 'gif', '3d'];

    for (const t of targetTypes) {
      const folders = supabaseFolderMap[t] || [];
      for (const folder of folders) {
        const supabaseFiles = await listFilesInSupabaseFolder(folder);
        for (const fileObj of supabaseFiles) {
          if (fileObj.name && validMediaExtensions.test(fileObj.name) && !assetsMap.has(fileObj.name)) {
            // Exclude currently selected asset if specified
            if (currentFileName && fileObj.name === currentFileName) continue;
            const folderBaseName = path.basename(folder);
            const publicUrl = `/uploads/${sanitizedEmail}/${folderBaseName}/${fileObj.name}`;
            if (currentUrl && publicUrl.toLowerCase().includes(currentUrl.toLowerCase())) continue;

            assetsMap.set(fileObj.name, {
              id: fileObj.name,
              name: fileObj.name,
              url: publicUrl,
              type: t,
              size: fileObj.metadata?.size || 0,
              uploadedAt: fileObj.created_at || fileObj.updated_at || new Date()
            });
          }
        }
      }
    }

    let assets = Array.from(assetsMap.values());
    if (requestedType) {
      assets = assets.filter(a => a.type === requestedType || (requestedType === 'image' && a.type === 'image') || (requestedType === '3d' && (a.type === '3d' || a.type === '3d_model')));
    }
    assets.sort((a, b) => new Date(b.uploadedAt) - new Date(a.uploadedAt));

    res.json({ assets });
  } catch (err) {
    console.error("Error fetching gallery assets:", err);
    res.status(500).json({
      message: "Server error",
      details: err.toString(),
    });
  }
});

// @route POST /api/flipbook/delete-gallery-asset
// @desc Delete global gallery asset from Supabase Storage & MongoDB
router.post("/delete-gallery-asset", async (req, res) => {
  try {
    const { emailId, url, fileName, file_v_id } = req.body;
    if (!emailId) {
      return res.status(400).json({ message: "Missing emailId" });
    }

    const sanitizedEmail = emailId.replace(/[@.]/g, "_");

    // 1. Delete from MongoDB FlipbookAsset collection
    if (file_v_id) {
      await FlipbookAsset.deleteMany({ file_v_id });
    }
    if (fileName) {
      await FlipbookAsset.deleteMany({ fileName });
    }

    // 2. Delete file from Supabase Storage
    let targetUrl = url;
    if (!targetUrl && fileName) {
      targetUrl = `/uploads/${sanitizedEmail}/${fileName}`;
    }

    if (targetUrl) {
      deleteFileFromSupabase(targetUrl).catch(err => console.warn("[Supabase] Delete asset warning:", err));
    }

    return res.json({ success: true, message: "Asset deleted successfully" });
  } catch (err) {
    console.error("Error deleting gallery asset:", err);
    return res.status(500).json({ message: err.message });
  }
});

// @route POST /api/flipbook/rename-gallery-asset
// @desc Rename global gallery asset in MongoDB
router.post("/rename-gallery-asset", async (req, res) => {
  try {
    const { emailId, file_v_id, fileName, newName } = req.body;
    if (!emailId || !newName) {
      return res.status(400).json({ message: "Missing emailId or newName" });
    }

    // Don't search by userEmail since the schema does not have userEmail, wait, does FlipbookAsset have userEmail?
    // Wait! In the get-gallery-assets it uses userEmail: emailId ? Let me check schema.
    let query = {};
    if (file_v_id) {
      query.file_v_id = file_v_id;
    } else if (fileName) {
      query.fileName = fileName;
    } else {
      return res.status(400).json({ message: "Missing file identifier" });
    }

    const updatedAsset = await FlipbookAsset.findOneAndUpdate(
      query,
      { $set: { originalName: newName } },
      { new: true }
    );

    if (!updatedAsset) {
      return res.status(404).json({ message: "Asset not found" });
    }

    return res.json({ success: true, message: "Asset renamed successfully", name: updatedAsset.originalName || updatedAsset.fileName });
  } catch (err) {
    console.error("Error renaming gallery asset:", err);
    return res.status(500).json({ message: err.message });
  }
});

// @route   POST & DELETE /api/flipbook/delete-asset
// @desc    Delete an asset from flipbook & Supabase Storage
// @access  Public
const deleteAssetHandler = async (req, res) => {
  try {
    const fileVId = req.body?.file_v_id || req.body?.fileVId || req.query?.file_v_id || req.query?.fileVId;
    const emailId = req.body?.emailId || req.query?.emailId;
    const assetUrl = req.body?.url || req.query?.url;
    let fileName = req.body?.fileName || req.body?.filename || req.query?.fileName || req.query?.filename;
    if (!fileName && assetUrl) fileName = path.basename(assetUrl);
    if (!fileName && req.body?.src) fileName = path.basename(req.body.src);
    if (!fileName && req.body?.name) fileName = path.basename(req.body.name);
    const folderName = req.body?.folderName || req.query?.folderName;
    const bookName = req.body?.bookName || req.body?.flipbookName || req.query?.bookName || req.query?.flipbookName;
    const assetType = req.body?.assetType || req.query?.assetType || "Image";



    let asset = null;
    if (fileVId) {
      asset = await FlipbookAsset.findOne({ file_v_id: fileVId });
    }
    if (!asset && assetUrl) {
      let urlQuery = assetUrl.startsWith('http') ? new URL(assetUrl).pathname : assetUrl;
      urlQuery = decodeURIComponent(urlQuery);
      const escaped = urlQuery.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
      asset = await FlipbookAsset.findOne({ url: { $regex: escaped + '$' } });
    }
    if (!asset && fileName && emailId) {
      const sanitizedEmail = emailId.replace(/[@.]/g, "_");
      asset = await FlipbookAsset.findOne({ fileName: fileName, url: { $regex: sanitizedEmail } });
    }

    if (asset) {
      fileName = asset.fileName;
    }

    const candidateUrls = new Set();
    if (asset && asset.url) candidateUrls.add(asset.url);
    if (assetUrl) candidateUrls.add(assetUrl);

    if (emailId) {
      const sanitizedEmail = emailId.replace(/[@.]/g, "_");
      const targetFolder = (folderName || "My_Flipbooks").replace(/[^a-zA-Z0-9 _-]/g, "").trim();
      const targetBook = (bookName || "Untitled Document").replace(/[^a-zA-Z0-9 _-]/g, "").trim();

      if (fileName) {
        candidateUrls.add(`/uploads/${sanitizedEmail}/${FLIPBOOK_ROOT}/${targetFolder}/${targetBook}/assets/${assetType}/${fileName}`);
        candidateUrls.add(`/uploads/${sanitizedEmail}/${FLIPBOOK_ROOT}/${targetFolder}/${targetBook}/assets/3D_Model/${fileName}`);
        candidateUrls.add(`/uploads/${sanitizedEmail}/${FLIPBOOK_ROOT}/${targetFolder}/${targetBook}/assets/3D_Models/${fileName}`);
        candidateUrls.add(`/uploads/${sanitizedEmail}/${FLIPBOOK_ROOT}/${targetFolder}/${targetBook}/assets/3D_Modals/${fileName}`);
        candidateUrls.add(`/uploads/${sanitizedEmail}/${FLIPBOOK_ROOT}/${targetFolder}/${targetBook}/assets/3d_model/${fileName}`);
        candidateUrls.add(`/uploads/${sanitizedEmail}/${FLIPBOOK_ROOT}/${targetFolder}/${targetBook}/assets/Image/${fileName}`);
        candidateUrls.add(`/uploads/${sanitizedEmail}/${FLIPBOOK_ROOT}/${targetFolder}/${targetBook}/assets/gif/${fileName}`);
        candidateUrls.add(`/uploads/${sanitizedEmail}/${FLIPBOOK_ROOT}/${targetFolder}/${targetBook}/assets/video/${fileName}`);
        candidateUrls.add(`/uploads/${sanitizedEmail}/${FLIPBOOK_ROOT}/${targetFolder}/${targetBook}/assets/audio/${fileName}`);
        candidateUrls.add(`/uploads/${sanitizedEmail}/${FLIPBOOK_ROOT}/${targetFolder}/${targetBook}/assets/download/${fileName}`);
        candidateUrls.add(`/uploads/${sanitizedEmail}/${FLIPBOOK_ROOT}/${targetFolder}/${targetBook}/customized_assets/Logo/${fileName}`);
        candidateUrls.add(`/uploads/${sanitizedEmail}/${FLIPBOOK_ROOT}/${targetFolder}/${targetBook}/customized_assets/Watermark/${fileName}`);
        candidateUrls.add(`/uploads/${sanitizedEmail}/${FLIPBOOK_ROOT}/${targetFolder}/${targetBook}/customized_assets/Image/${fileName}`);
      }
    }

    for (const urlPath of candidateUrls) {
      await deleteFileFromSupabase(urlPath).catch((e) =>
        console.warn("[Supabase] Delete asset candidate warning:", e)
      );
    }

    if (asset) {
      await FlipbookAsset.deleteOne({ _id: asset._id });
    } else if (fileVId) {
      await FlipbookAsset.deleteOne({ file_v_id: fileVId });
    }

    if (fileName && emailId && (assetType === '3d' || assetType === '3d_model' || assetType === '3d_modals' || assetType === 'model')) {
      await InteractionThreedModel.deleteOne({ userEmail: emailId, fileName: fileName }).catch(() => {});
    }

    res.status(200).json({ message: "Asset deleted successfully from Supabase" });

  } catch (error) {
    console.error("Error deleting asset:", error);
    res.status(500).json({
      message: "Server error deleting asset",
      error: error.message,
    });
  }
};

router.post("/delete-asset", deleteAssetHandler);
router.delete("/delete-asset", deleteAssetHandler);



// @route  POST /api/flipbook/inline-svgs
// @desc   Migration: read HTML pages that reference external SVG asset files and
//         replace href="./assets/image/xxx.svg" with an inline base64 data URI.
//         Run once per flipbook to make pages self-contained (no separate SVG fetch).
// @body   { emailId, folderName, flipbookName }
router.post("/inline-svgs", async (req, res) => {
  try {
    const { emailId, folderName, flipbookName } = req.body;
    if (!emailId || !folderName || !flipbookName) {
      return res.status(400).json({ message: "Missing emailId, folderName, or flipbookName" });
    }

    const sanitizedEmail = emailId.replace(/[@.]/g, "_");
    const uploadsDir = path.join(__dirname, "../../uploads");
    const flipbookDir = path.join(
      uploadsDir,
      sanitizedEmail,
      FLIPBOOK_ROOT,
      folderName,
      flipbookName
    );

    if (!fs.existsSync(flipbookDir)) {
      return res.status(404).json({ message: "Flipbook directory not found" });
    }

    const htmlFiles = fs.readdirSync(flipbookDir).filter((f) => f.endsWith(".html"));
    let pagesUpdated = 0;
    let pagesSkipped = 0;

    // Regex to find: href="./assets/image/FILENAME.svg"  (or assets/Image/ any case)
    const svgHrefRegex = /href="(\.\/assets\/[Ii]mage\/([^"]+\.svg))"/gi;

    for (const htmlFile of htmlFiles) {
      const filePath = path.join(flipbookDir, htmlFile);
      let content = fs.readFileSync(filePath, "utf8");

      // Check if this page references an external SVG asset
      if (!svgHrefRegex.test(content)) {
        pagesSkipped++;
        svgHrefRegex.lastIndex = 0; // reset regex state
        continue;
      }
      svgHrefRegex.lastIndex = 0;

      let updated = false;
      content = content.replace(svgHrefRegex, (match, relPath, filename) => {
        // Resolve the SVG file relative to the flipbook directory
        // relPath is like "./assets/image/xxx.svg" or "./assets/Image/xxx.svg"
        const svgPath = path.join(flipbookDir, relPath.replace(/^\.\//, ""));

        if (!fs.existsSync(svgPath)) {
          console.warn(`SVG file not found, skipping: ${svgPath}`);
          return match; // leave unchanged if file missing
        }

        try {
          const svgBuffer = fs.readFileSync(svgPath);
          const base64 = svgBuffer.toString("base64");
          const dataUri = `data:image/svg+xml;base64,${base64}`;
          updated = true;
          return `href="${dataUri}"`;
        } catch (e) {
          console.warn(`Failed to read/encode SVG: ${svgPath}`, e.message);
          return match;
        }
      });

      if (updated) {
        fs.writeFileSync(filePath, content, "utf8");
        pagesUpdated++;
        console.log(`✓ Inlined SVG in: ${htmlFile}`);
      } else {
        pagesSkipped++;
      }
    }

    res.json({
      message: "SVG inline migration complete",
      flipbook: flipbookName,
      folder: folderName,
      pagesUpdated,
      pagesSkipped,
      totalPages: htmlFiles.length,
    });
  } catch (error) {
    console.error("Error inlining SVGs:", error);
    res.status(500).json({ message: "Server error during SVG inline migration", error: error.message });
  }
});

export default router;

