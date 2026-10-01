import express from "express";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import bcrypt from "bcryptjs";
import multer from "multer";
import { nanoid } from "nanoid";
import Flipbook from "../../models/Flipbook.js";
import FlipbookAsset from "../../models/FlipbookAsset.js";
import Lead from "../../models/Lead.js";
import {
  uploadFileToSupabase,
  uploadBufferToSupabase,
  deleteFileFromSupabase,
  deleteFolderFromSupabase,
  ensureFlipbookFoldersInSupabase,
  renamePathInSupabase,
  getSupabasePublicUrl,
  rewriteUploadsToSupabase
} from "../../config/supabase.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Root folder name for all flipbook storage
const FLIPBOOK_ROOT = "My_Flipbooks";

const router = express.Router();

// ─────────────────────────────────────────────────────────────────────────────
// Shared Helpers & Utilities
// ─────────────────────────────────────────────────────────────────────────────

const sanitizeEmail = (email) => (email || "").replace(/[@.]/g, "_");
const sanitizePathSegment = (name, fallback = "") => (name || fallback).replace(/[^a-zA-Z0-9 _-]/g, "").trim();

const isSupabaseAssetUrl = (url) => {
  if (!url || typeof url !== 'string') return false;
  return url.includes('/storage/v1/object/public/') || (url.includes('.supabase.co') && url.includes('/customized_assets/'));
};

const getAssetTypeFolder = (type) => {
  if (!type) return 'Logo';
  const lower = String(type).toLowerCase();
  if (lower === 'watermark') return 'Watermark';
  if (lower === 'video' || lower === 'videos') return 'Video';
  if (lower === 'image' || lower === 'images') return 'Image';
  if (lower === 'gallery' || lower === 'gallery_image' || lower === 'galleryimage') return 'Gallery_Image';
  if (lower === 'audio' || lower === 'sound' || lower === 'bgaudio') return 'Audio';
  return 'Logo';
};

const cleanupTempFile = (file) => {
  if (file && file.path && fs.existsSync(file.path)) {
    try { fs.unlinkSync(file.path); } catch (e) {}
  }
};

const deleteOldCustomizedAsset = async (oldSrc) => {
  if (oldSrc && typeof oldSrc === 'string' && !oldSrc.startsWith('data:') && (oldSrc.includes('/customized_assets/') || oldSrc.includes('supabase') || oldSrc.includes('/uploads/'))) {
    return deleteFileFromSupabase(oldSrc).catch((err) =>
      console.warn("[Supabase] Delete old replaced asset warning:", err)
    );
  }
};

const resolveFlipbookPaths = async (v_id, fallbackFolder = "My_Flipbooks", fallbackBook = "Untitled Document") => {
  let physicalFolder = sanitizePathSegment(fallbackFolder, "My_Flipbooks");
  let bookName = sanitizePathSegment(fallbackBook, "Untitled Document");

  if (v_id) {
    try {
      const fbDoc = await Flipbook.findOne({ v_id }).select("folderName flipbookName");
      if (fbDoc) {
        if (fbDoc.folderName) {
          const fld = Array.isArray(fbDoc.folderName) ? (fbDoc.folderName.find(f => f !== 'Recent Book' && f !== 'Recent book') || fbDoc.folderName[0]) : fbDoc.folderName;
          if (fld) physicalFolder = sanitizePathSegment(fld, "My_Flipbooks");
        }
        if (fbDoc.flipbookName && fbDoc.flipbookName.length > 0) {
          bookName = sanitizePathSegment(fbDoc.flipbookName, "Untitled Document");
        }
      }
    } catch (e) {}
  }
  return { physicalFolder, bookName };
};

const DEFAULT_LOGO = {
  src: '',
  url: '',
  type: 'Fit',
  opacity: 100,
  cropData: null,
  adjustments: { exposure: 0, contrast: 0, saturation: 0, temperature: 0, tint: 0, highlights: 0, shadows: 0 }
};

const DEFAULT_WATERMARK = {
  src: '',
  type: 'Fit',
  opacity: 64,
  position: 'Bottom Right',
  cropData: null,
  adjustments: { exposure: 0, contrast: 0, saturation: 0, temperature: 0, tint: 0, highlights: 0, shadows: 0 }
};

// ─────────────────────────────────────────────────────────────────────────────
// Asset Processing Helpers
// ─────────────────────────────────────────────────────────────────────────────

export const ensureBackgroundAssetInSupabase = async (imageInput, sEmail, pFolder, bName) => {
  if (!imageInput || typeof imageInput !== 'string') return imageInput;
  if (isSupabaseAssetUrl(imageInput)) return imageInput;

  const isVideo = /\.(mp4|webm|ogv|mov|avi|mkv)$/i.test(imageInput.split('?')[0]) || imageInput.includes('/assets/Videos/') || imageInput.includes('Videos/');
  const targetFolder = isVideo ? 'Video' : 'Image';

  if (imageInput.includes('/assets/bgimg/') || imageInput.includes('bgimg/') || imageInput.includes('/assets/Videos/') || imageInput.includes('Videos/')) {
    try {
      const baseName = path.basename(imageInput.split('?')[0]);
      const ext = path.extname(baseName) || (isVideo ? '.mp4' : '.webp');
      const rawName = path.basename(baseName, ext);
      const fileName = `${rawName}${ext}`;

      const supabasePath = `${sEmail}/${FLIPBOOK_ROOT}/${pFolder}/${bName}/customized_assets/${targetFolder}/${fileName}`;
      let sourceFilePath = path.join(__dirname, isVideo ? "../../assets/Videos" : "../../assets/bgimg", baseName);
      if (!fs.existsSync(sourceFilePath)) {
        sourceFilePath = path.join(__dirname, isVideo ? "../../assets/Videos" : "../../assets/bgimg", rawName + ext);
      }

      if (fs.existsSync(sourceFilePath)) {
        const supabaseUrlResult = await uploadFileToSupabase(sourceFilePath, supabasePath).catch((err) =>
          console.warn("[Supabase] Auto-copy theme asset upload warning:", err)
        );
        const finalUrl = supabaseUrlResult || getSupabasePublicUrl(supabasePath);
        if (finalUrl) return finalUrl;
      } else if (imageInput.startsWith("http://") || imageInput.startsWith("https://")) {
        const resp = await fetch(imageInput).catch(() => null);
        if (resp && resp.ok) {
          const arrayBuffer = await resp.arrayBuffer();
          const buffer = Buffer.from(arrayBuffer);
          const mimeType = isVideo ? 'video/mp4' : (ext === '.png' ? 'image/png' : ext === '.jpg' || ext === '.jpeg' ? 'image/jpeg' : 'image/webp');
          const supabaseUrlResult = await uploadBufferToSupabase(buffer, supabasePath, mimeType).catch((err) =>
            console.warn("[Supabase] Auto-copy theme asset buffer upload warning:", err)
          );
          const finalUrl = supabaseUrlResult || getSupabasePublicUrl(supabasePath);
          if (finalUrl) return finalUrl;
        }
      }
    } catch (err) {
      console.warn("[Supabase] Failed to auto-copy background preset asset:", err);
    }
  }

  if (imageInput.startsWith('data:') || imageInput.startsWith('http://') || imageInput.startsWith('https://')) return imageInput;
  return getSupabasePublicUrl(imageInput) || rewriteUploadsToSupabase(imageInput);
};

export const ensureBrandingAssetInSupabase = async (assetInput, sEmail, pFolder, bName, assetType = 'Logo') => {
  if (!assetInput || typeof assetInput !== 'string') return assetInput;
  if (isSupabaseAssetUrl(assetInput)) return assetInput;

  if (assetInput.startsWith('data:')) {
    try {
      const matches = assetInput.match(/^data:([^;]+);base64,(.+)$/);
      if (matches) {
        const mimeType = matches[1];
        const base64Data = matches[2];
        const buffer = Buffer.from(base64Data, 'base64');
        const extMatch = mimeType.match(/\/([a-zA-Z0-9+-]+)$/);
        let ext = extMatch ? extMatch[1] : 'png';
        if (ext === 'jpeg') ext = 'jpg';
        if (ext.includes('+')) ext = ext.split('+')[0];

        const folderType = getAssetTypeFolder(assetType);
        const fileName = `${folderType.toLowerCase()}_${Date.now()}.${ext}`;
        const supabasePath = `${sEmail}/${FLIPBOOK_ROOT}/${pFolder}/${bName}/customized_assets/${folderType}/${fileName}`;

        const supabaseUrlResult = await uploadBufferToSupabase(buffer, supabasePath, mimeType).catch((err) =>
          console.warn("[Supabase] Auto base64 branding asset upload warning:", err)
        );
        const finalUrl = supabaseUrlResult || getSupabasePublicUrl(supabasePath);
        if (finalUrl) return finalUrl;
      }
    } catch (err) {
      console.warn("[Supabase] Failed to auto-upload base64 branding asset:", err);
    }
  }

  if (assetInput.includes('/assets/bgimg/') || assetInput.includes('bgimg/')) {
    return ensureBackgroundAssetInSupabase(assetInput, sEmail, pFolder, bName);
  }

  if (assetInput.startsWith('http://') || assetInput.startsWith('https://')) return assetInput;
  return getSupabasePublicUrl(assetInput) || rewriteUploadsToSupabase(assetInput);
};

// Configure Multer for branding asset uploads (Logo, Watermark, Preloader, Background images)
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
    cb(null, `${nanoid()}${ext}`);
  },
});

export const brandingUpload = multer({
  storage: brandingStorage,
  limits: { fileSize: 50 * 1024 * 1024 }, // 50MB limit
  fileFilter: (req, file, cb) => {
    const ext = path.extname(file.originalname).toLowerCase();
    const allowed = [".png", ".jpg", ".jpeg", ".gif", ".webp", ".svg", ".bmp", ".avif", ".heic", ".heif", ".tiff", ".ico", ".mp4", ".webm", ".ogv", ".mov", ".avi", ".mkv", ".mp3", ".wav", ".aac", ".ogg", ".flac", ".m4a"];
    if (allowed.includes(ext)) {
      cb(null, true);
    } else {
      cb(new Error(`Invalid file type for customized asset. Allowed: ${allowed.join(", ")}`));
    }
  },
});

// ─────────────────────────────────────────────────────────────────────────────
// Routes
// ─────────────────────────────────────────────────────────────────────────────

// @route   POST /api/flipbook/upload-customized-asset
router.post("/upload-customized-asset", (req, res) => {
  brandingUpload.single("file")(req, res, async (err) => {
    if (err instanceof multer.MulterError) {
      return res.status(413).json({ message: `Upload error: ${err.message}` });
    } else if (err) {
      return res.status(500).json({ message: err.message || "Server error during upload" });
    }

    try {
      const { emailId, assetType, folderName, flipbookName, v_id } = req.body;
      if (!emailId || !req.file) {
        cleanupTempFile(req.file);
        return res.status(400).json({ message: "Missing required fields" });
      }

      const typeFolder = getAssetTypeFolder(assetType);
      const sanitizedEmail = sanitizeEmail(emailId);
      const { physicalFolder, bookName } = await resolveFlipbookPaths(v_id, folderName, flipbookName);

      const fileName = req.file.filename;
      const supabasePath = `${sanitizedEmail}/${FLIPBOOK_ROOT}/${physicalFolder}/${bookName}/customized_assets/${typeFolder}/${fileName}`;

      const uploadedPublicUrl = await uploadFileToSupabase(req.file.path, supabasePath).catch((err) => {
        console.warn("[Supabase] Customized asset upload warning:", err);
        return null;
      });

      cleanupTempFile(req.file);

      const finalPublicUrl = uploadedPublicUrl || getSupabasePublicUrl(supabasePath) || rewriteUploadsToSupabase(`/uploads/${supabasePath}`);

      if (assetType === 'gallery_image' || assetType === 'galleryimage') {
        const fileExt = path.extname(req.file.originalname);
        const file_v_id = fileName.replace(fileExt, '');
        
        try {
          const newAsset = new FlipbookAsset({
            flipbook_v_id: v_id || "temp_" + Date.now(),
            file_v_id: file_v_id || nanoid(),
            page_v_id: "global",
            assetType: "Image",
            fileName: fileName,
            originalName: req.file.originalname,
            userEmail: emailId,
            isGallery: true,
            flipbookName: bookName,
            folderName: physicalFolder,
            url: finalPublicUrl,
            size: req.file.size
          });
          await newAsset.save();
        } catch (dbErr) {
          console.warn("Failed to save gallery_image to FlipbookAsset:", dbErr.message);
        }
      }

      return res.status(200).json({
        message: "Customized asset uploaded successfully",
        url: finalPublicUrl,
        fileName,
        assetType: typeFolder,
        supabasePath
      });
    } catch (err) {
      console.error("Error uploading customized asset:", err);
      cleanupTempFile(req.file);
      return res.status(500).json({ message: "Internal server error", error: err.message });
    }
  });
});

// @route   POST /api/flipbook/delete-customized-asset
router.post("/delete-customized-asset", async (req, res) => {
  try {
    const { url } = req.body;
    if (!url || typeof url !== "string") {
      return res.status(400).json({ message: "Asset URL is required" });
    }

    if (url.includes("/customized_assets/") || url.includes("supabase.co") || url.includes("/uploads/")) {
      await deleteFileFromSupabase(url).catch((err) =>
        console.warn("[Supabase] Direct delete asset warning:", err)
      );
    }

    return res.status(200).json({
      success: true,
      message: "Asset deleted from Supabase successfully"
    });
  } catch (err) {
    console.error("Error deleting customized asset:", err);
    return res.status(500).json({ message: "Internal server error", error: err.message });
  }
});

// @route   GET & POST /api/flipbook/branding
router.route("/branding")
  .get(async (req, res) => {
    try {
      const { v_id } = req.query;
      if (!v_id) {
        return res.status(400).json({ success: false, message: "Missing v_id parameter" });
      }

      const flipbook = await Flipbook.findOne({ v_id }).select("Customized_Settings.Branding settings");
      if (!flipbook) {
        return res.status(404).json({ success: false, message: "Flipbook not found" });
      }

      const branding = flipbook.Customized_Settings?.Branding || {
        logoSettings: flipbook.settings?.logo || null,
        watermarkSettings: flipbook.settings?.watermark || null,
        preloaderSettings: flipbook.settings?.preloader || null,
        profileSettings: flipbook.settings?.profile || null
      };

      return res.status(200).json({ success: true, branding });
    } catch (err) {
      console.error("Error getting branding settings:", err);
      return res.status(500).json({ success: false, message: "Internal server error", error: err.message });
    }
  })
  .post((req, res) => {
    brandingUpload.single("file")(req, res, async (err) => {
      if (err instanceof multer.MulterError) {
        return res.status(413).json({ message: `Upload error: ${err.message}` });
      } else if (err) {
        return res.status(500).json({ message: err.message || "Server error during branding operation" });
      }

      try {
        const action = req.body.action || (req.file ? 'upload' : 'save');

        // 1. ACTION: UPLOAD
        if (action === 'upload' || req.file) {
          const { emailId, v_id, assetType, folderName, flipbookName, oldSrc, previousUrl } = req.body;
          if (!emailId || !req.file) {
            cleanupTempFile(req.file);
            return res.status(400).json({ message: "Missing required fields (emailId or file)" });
          }

          let targetOldSrc = oldSrc || previousUrl;
          if (!targetOldSrc && v_id) {
            try {
              const fbDoc = await Flipbook.findOne({ v_id }).select("Customized_Settings settings");
              if (fbDoc) {
                const lowerType = (assetType || "").toLowerCase();
                if (lowerType === 'logo') {
                  targetOldSrc = fbDoc.Customized_Settings?.Branding?.logoSettings?.src || fbDoc.settings?.logo?.src;
                } else if (lowerType === 'watermark') {
                  targetOldSrc = fbDoc.Customized_Settings?.Branding?.watermarkSettings?.src || fbDoc.settings?.watermark?.src;
                } else if (lowerType === 'image' || lowerType === 'images' || lowerType === 'video' || lowerType === 'videos') {
                  targetOldSrc = fbDoc.Customized_Settings?.Background?.media || fbDoc.Customized_Settings?.Background?.image || fbDoc.settings?.background?.media || fbDoc.settings?.background?.image;
                }
              }
            } catch (e) {}
          }

          await deleteOldCustomizedAsset(targetOldSrc);

          const typeFolder = getAssetTypeFolder(assetType);
          const sanitizedEmail = sanitizeEmail(emailId);
          const { physicalFolder, bookName } = await resolveFlipbookPaths(v_id, folderName, flipbookName);

          if (v_id && bookName !== v_id) {
            deleteFolderFromSupabase(`${sanitizedEmail}/${FLIPBOOK_ROOT}/${physicalFolder}/${v_id}`).catch(() => {});
            deleteFolderFromSupabase(`${sanitizedEmail}/${FLIPBOOK_ROOT}/${v_id}`).catch(() => {});
          }

          const fileName = `${typeFolder.toLowerCase()}_${Date.now()}${path.extname(req.file.originalname) || '.png'}`;
          const supabasePath = `${sanitizedEmail}/${FLIPBOOK_ROOT}/${physicalFolder}/${bookName}/customized_assets/${typeFolder}/${fileName}`;
          
          const supabaseUrlResult = await uploadFileToSupabase(req.file.path, supabasePath).catch((err) =>
            console.warn("[Supabase] Branding asset upload warning:", err)
          );

          cleanupTempFile(req.file);

          const finalPublicUrl = supabaseUrlResult || getSupabasePublicUrl(supabasePath) || rewriteUploadsToSupabase(`/uploads/${supabasePath}`);

          if (v_id) {
            const isLogo = typeFolder.toLowerCase() === 'logo';
            const isWatermark = typeFolder.toLowerCase() === 'watermark';
            const isImage = typeFolder.toLowerCase() === 'image';
            const isVideo = typeFolder.toLowerCase() === 'video';

            const updateQuery = { lastUpdated: new Date() };
            if (isLogo) {
              updateQuery["Customized_Settings.Branding.logoSettings.src"] = finalPublicUrl;
              updateQuery["Customized_Settings.Branding.logoSettings.url"] = finalPublicUrl;
              updateQuery["settings.logo.src"] = finalPublicUrl;
              updateQuery["settings.logo.url"] = finalPublicUrl;
            } else if (isWatermark) {
              updateQuery["Customized_Settings.Branding.watermarkSettings.src"] = finalPublicUrl;
              updateQuery["settings.watermark.src"] = finalPublicUrl;
            } else if (isImage) {
              updateQuery["Customized_Settings.Background.image"] = finalPublicUrl;
              updateQuery["settings.backgroundSettings.image"] = finalPublicUrl;
              updateQuery["settings.appearance.backgroundSettings.image"] = finalPublicUrl;
            } else if (isVideo) {
              updateQuery["Customized_Settings.Background.video"] = finalPublicUrl;
              updateQuery["settings.backgroundSettings.video"] = finalPublicUrl;
              updateQuery["settings.appearance.backgroundSettings.video"] = finalPublicUrl;
            }

            if (Object.keys(updateQuery).length > 1) {
              await Flipbook.findOneAndUpdate({ v_id }, { $set: updateQuery }, { returnDocument: 'after' }).catch((err) =>
                console.warn("[Supabase Upload] Failed to auto-save asset URL to DB:", err)
              );
            }
          }

          return res.status(200).json({
            success: true,
            message: "Branding asset uploaded successfully",
            url: finalPublicUrl,
            fileName,
            assetType: typeFolder,
            supabasePath
          });
        }

        // 2. ACTION: DELETE
        if (action === 'delete') {
          const { emailId, v_id, assetType, src, folderName, flipbookName } = req.body;
          if (!emailId || !v_id || !assetType) {
            return res.status(400).json({ success: false, message: "Missing required fields" });
          }

          const typeFolder = getAssetTypeFolder(assetType);

          if (src) {
            await deleteFileFromSupabase(src).catch((err) =>
              console.warn("[Supabase] Delete branding asset warning:", err)
            );

            const sanitizedEmail = sanitizeEmail(emailId);
            const physicalFolder = sanitizePathSegment(folderName, "My_Flipbooks");
            const bookName = sanitizePathSegment(flipbookName, "Untitled Document");
            const fileName = path.basename(src.split('?')[0]);

            if (fileName && fileName.length > 3) {
              const candidatePath = `${sanitizedEmail}/${FLIPBOOK_ROOT}/${physicalFolder}/${bookName}/customized_assets/${typeFolder}/${fileName}`;
              await deleteFileFromSupabase(candidatePath).catch(() => {});

              const localDiskPath = path.join(__dirname, "../../uploads", candidatePath);
              if (fs.existsSync(localDiskPath)) {
                try { fs.unlinkSync(localDiskPath); } catch (e) {}
              }
            }
          }

          const isLogo = typeFolder.toLowerCase() === 'logo';
          const isWatermark = typeFolder.toLowerCase() === 'watermark';
          const isImage = typeFolder.toLowerCase() === 'image';

          const updateDoc = {};
          if (isLogo) {
            updateDoc["$set"] = {
              "Customized_Settings.Branding.logoSettings": DEFAULT_LOGO,
              "settings.logo": DEFAULT_LOGO,
              lastUpdated: new Date()
            };
          } else if (isWatermark) {
            updateDoc["$set"] = {
              "Customized_Settings.Branding.watermarkSettings": DEFAULT_WATERMARK,
              "settings.watermark": DEFAULT_WATERMARK,
              lastUpdated: new Date()
            };
          } else if (isImage) {
            updateDoc["$set"] = {
              "Customized_Settings.Background.image": null,
              "settings.backgroundSettings.image": null,
              "settings.appearance.backgroundSettings.image": null,
              lastUpdated: new Date()
            };
          }

          let flipbook = null;
          if (Object.keys(updateDoc).length > 0) {
            flipbook = await Flipbook.findOneAndUpdate({ v_id }, updateDoc, { returnDocument: 'after' });
          }

          return res.status(200).json({
            success: true,
            message: `${assetType} deleted from Supabase and reset in database successfully`,
            branding: flipbook?.Customized_Settings?.Branding,
            background: flipbook?.Customized_Settings?.Background
          });
        }

        // 3. ACTION: SAVE
        const { emailId, v_id, logoSettings, watermarkSettings, preloaderSettings, profileSettings } = req.body;
        if (!emailId || !v_id) {
          return res.status(400).json({ success: false, message: "Missing emailId or v_id" });
        }

        const sanitizedEmail = sanitizeEmail(emailId);
        const { physicalFolder, bookName } = await resolveFlipbookPaths(v_id, req.body.folderName, req.body.bookName);

        let processedLogo = logoSettings ? { ...logoSettings } : undefined;
        if (processedLogo) {
          if (processedLogo.src && typeof processedLogo.src === 'string' && processedLogo.src.trim() !== '') {
            processedLogo.src = await ensureBrandingAssetInSupabase(processedLogo.src, sanitizedEmail, physicalFolder, bookName, 'Logo');
          }
          if (processedLogo.url && typeof processedLogo.url === 'string' && processedLogo.url.startsWith('data:')) {
            processedLogo.url = await ensureBrandingAssetInSupabase(processedLogo.url, sanitizedEmail, physicalFolder, bookName, 'Logo');
          }
        }

        let processedWatermark = watermarkSettings ? { ...watermarkSettings } : undefined;
        if (processedWatermark && processedWatermark.src) {
          processedWatermark.src = await ensureBrandingAssetInSupabase(processedWatermark.src, sanitizedEmail, physicalFolder, bookName, 'Watermark');
        }

        const updateFields = { lastUpdated: new Date() };

        if (processedLogo || logoSettings) {
          const l = processedLogo || logoSettings;
          updateFields["Customized_Settings.Branding.logoSettings"] = l;
          updateFields["settings.logo"] = l;
        }
        if (processedWatermark || watermarkSettings) {
          const w = processedWatermark || watermarkSettings;
          updateFields["Customized_Settings.Branding.watermarkSettings"] = w;
          updateFields["settings.watermark"] = w;
        }
        if (preloaderSettings) {
          updateFields["Customized_Settings.Branding.preloaderSettings"] = preloaderSettings;
          updateFields["settings.preloader"] = preloaderSettings;
        }
        if (profileSettings) {
          updateFields["Customized_Settings.Branding.profileSettings"] = profileSettings;
          updateFields["settings.profile"] = profileSettings;
        }

        const flipbook = await Flipbook.findOneAndUpdate(
          { v_id },
          { $set: updateFields },
          { returnDocument: 'after', upsert: false }
        );

        if (!flipbook) {
          return res.status(404).json({ success: false, message: "Flipbook not found" });
        }

        return res.status(200).json({
          success: true,
          message: "Branding settings saved successfully",
          branding: flipbook.Customized_Settings?.Branding
        });
      } catch (err) {
        console.error("Error processing branding operation:", err);
        cleanupTempFile(req.file);
        return res.status(500).json({ success: false, message: "Internal server error", error: err.message });
      }
    });
  });

// @route   GET & POST /api/flipbook/background
router.route("/background")
  .get(async (req, res) => {
    try {
      const { v_id } = req.query;
      if (!v_id) {
        return res.status(400).json({ success: false, message: "Missing v_id parameter" });
      }

      const flipbook = await Flipbook.findOne({ v_id }).select("Customized_Settings.Background settings.appearance.backgroundSettings settings.backgroundSettings");
      if (!flipbook) {
        return res.status(404).json({ success: false, message: "Flipbook not found" });
      }

      const background = flipbook.Customized_Settings?.Background || flipbook.settings?.appearance?.backgroundSettings || flipbook.settings?.backgroundSettings || {};

      return res.status(200).json({ success: true, background });
    } catch (err) {
      console.error("Error getting background settings:", err);
      return res.status(500).json({ success: false, message: "Internal server error", error: err.message });
    }
  })
  .post((req, res) => {
    brandingUpload.single("file")(req, res, async (err) => {
      if (err instanceof multer.MulterError) {
        return res.status(413).json({ message: `Upload error: ${err.message}` });
      } else if (err) {
        return res.status(500).json({ message: err.message || "Server error during background operation" });
      }

      try {
        const action = req.body.action || (req.file ? 'upload' : 'save');

        // 1. ACTION: UPLOAD
        if (action === 'upload' || req.file) {
          const { emailId, v_id, folderName, flipbookName, oldSrc, previousUrl } = req.body;
          if (!emailId || !req.file) {
            cleanupTempFile(req.file);
            return res.status(400).json({ message: "Missing required fields (emailId or file)" });
          }

          let targetOldSrc = oldSrc || previousUrl;
          if (!targetOldSrc && v_id) {
            try {
              const fbDoc = await Flipbook.findOne({ v_id }).select("Customized_Settings settings");
              if (fbDoc) {
                targetOldSrc = fbDoc.Customized_Settings?.Background?.image || fbDoc.settings?.background?.image;
              }
            } catch (e) {}
          }

          await deleteOldCustomizedAsset(targetOldSrc);

          const sanitizedEmail = sanitizeEmail(emailId);
          const { physicalFolder, bookName } = await resolveFlipbookPaths(v_id, folderName, flipbookName);

          if (v_id && bookName !== v_id) {
            deleteFolderFromSupabase(`${sanitizedEmail}/${FLIPBOOK_ROOT}/${physicalFolder}/${v_id}`).catch(() => {});
            deleteFolderFromSupabase(`${sanitizedEmail}/${FLIPBOOK_ROOT}/${v_id}`).catch(() => {});
          }

          await ensureFlipbookFoldersInSupabase(sanitizedEmail, physicalFolder, bookName).catch(() => {});

          const fileName = req.file.filename;
          const supabasePath = `${sanitizedEmail}/${FLIPBOOK_ROOT}/${physicalFolder}/${bookName}/customized_assets/Image/${fileName}`;
          
          const supabaseUrlResult = await uploadFileToSupabase(req.file.path, supabasePath).catch((err) =>
            console.warn("[Supabase] Background image upload warning:", err)
          );

          cleanupTempFile(req.file);

          const finalPublicUrl = supabaseUrlResult || getSupabasePublicUrl(supabasePath) || rewriteUploadsToSupabase(`/uploads/${supabasePath}`);

          return res.status(200).json({
            success: true,
            message: "Background image uploaded successfully",
            url: finalPublicUrl,
            fileName,
            assetType: 'image',
            supabasePath
          });
        }

        // 2. ACTION: SAVE
        const { emailId, v_id, backgroundSettings, background } = req.body;
        if (!emailId || !v_id) {
          return res.status(400).json({ success: false, message: "Missing emailId or v_id" });
        }

        const bgToSave = backgroundSettings || background;
        if (!bgToSave) {
          return res.status(400).json({ success: false, message: "Missing background settings data" });
        }

        const existingFlipbook = await Flipbook.findOne({ v_id }).select("Customized_Settings.Background folderName flipbookName");
        const existingBg = existingFlipbook?.Customized_Settings?.Background || {};

        const processedBg = {
          ...existingBg,
          ...bgToSave
        };

        if (processedBg.image) {
          const sanitizedEmail = sanitizeEmail(emailId);
          const { physicalFolder, bookName } = await resolveFlipbookPaths(v_id, req.body.folderName, req.body.bookName);
          const newBgImage = await ensureBackgroundAssetInSupabase(processedBg.image, sanitizedEmail, physicalFolder, bookName);

          if (existingBg.image && existingBg.image !== newBgImage && typeof existingBg.image === 'string' && existingBg.image.includes('/customized_assets/Image/')) {
            await deleteFileFromSupabase(existingBg.image).catch((err) =>
              console.warn("[Supabase] Delete replaced background image warning:", err)
            );
          }

          processedBg.image = newBgImage;
        }

        if (processedBg.video) {
          const sanitizedEmail = sanitizeEmail(emailId);
          const { physicalFolder, bookName } = await resolveFlipbookPaths(v_id, req.body.folderName, req.body.bookName);
          const newBgVideo = await ensureBackgroundAssetInSupabase(processedBg.video, sanitizedEmail, physicalFolder, bookName);

          if (existingBg.video && existingBg.video !== newBgVideo && typeof existingBg.video === 'string' && existingBg.video.includes('/customized_assets/Video/')) {
            await deleteFileFromSupabase(existingBg.video).catch((err) =>
              console.warn("[Supabase] Delete replaced background video warning:", err)
            );
          }

          processedBg.video = newBgVideo;
        }

        const updateFields = {
          "Customized_Settings.Background": processedBg,
          "settings.appearance.backgroundSettings": processedBg,
          "settings.backgroundSettings": processedBg,
          lastUpdated: new Date()
        };

        const flipbook = await Flipbook.findOneAndUpdate(
          { v_id },
          { $set: updateFields },
          { returnDocument: 'after', upsert: false }
        );

        if (!flipbook) {
          return res.status(404).json({ success: false, message: "Flipbook not found" });
        }

        return res.status(200).json({
          success: true,
          message: "Background settings saved successfully",
          background: flipbook.Customized_Settings?.Background
        });
      } catch (err) {
        console.error("Error processing background operation:", err);
        cleanupTempFile(req.file);
        return res.status(500).json({ success: false, message: "Internal server error", error: err.message });
      }
    });
  });

// Backward-compatibility aliases
router.post("/branding/upload", (req, res) => req.url = "/branding", router.handle.bind(router));
router.post("/branding/save", (req, res) => req.url = "/branding", router.handle.bind(router));
router.post("/branding/delete-asset", (req, res) => req.url = "/branding", router.handle.bind(router));
router.post("/background/upload", (req, res) => req.url = "/background", router.handle.bind(router));
router.post("/background/save", (req, res) => req.url = "/background", router.handle.bind(router));
router.post("/background/delete-asset", (req, res) => req.url = "/background", router.handle.bind(router));

// @route   GET & POST /api/flipbook/menu-bar
router.route("/menu-bar")
  .get(async (req, res) => {
    try {
      const { v_id } = req.query;
      if (!v_id) {
        return res.status(400).json({ success: false, message: "Missing v_id parameter" });
      }

      const flipbook = await Flipbook.findOne({ v_id }).select("Customized_Settings.MenuBar settings");
      if (!flipbook) {
        return res.status(404).json({ success: false, message: "Flipbook not found" });
      }

      const menuBar = flipbook.Customized_Settings?.MenuBar || flipbook.settings?.menuBar || {};

      return res.status(200).json({ success: true, menuBar });
    } catch (err) {
      console.error("Error getting menu bar settings:", err);
      return res.status(500).json({ success: false, message: "Internal server error", error: err.message });
    }
  })
  .post(async (req, res) => {
    try {
      const { emailId, v_id, menuBarSettings, menuBar } = req.body;
      if (!v_id) {
        return res.status(400).json({ success: false, message: "Missing v_id parameter" });
      }

      const mbToSave = menuBarSettings || menuBar || req.body.MenuBar;
      if (!mbToSave) {
        return res.status(400).json({ success: false, message: "Missing menuBar settings data" });
      }

      const existingFlipbook = await Flipbook.findOne({ v_id }).select("Customized_Settings.MenuBar");
      const existingMB = existingFlipbook?.Customized_Settings?.MenuBar || {};

      const processedMB = {
        ...existingMB,
        ...mbToSave,
        navigation: {
          ...(existingMB.navigation || {}),
          ...(mbToSave.navigation || {}),
          addTextToIconsSettings: {
            ...(existingMB.navigation?.addTextToIconsSettings || {}),
            ...(mbToSave.navigation?.addTextToIconsSettings || {}),
            ...(mbToSave.addTextToIconsSettings || {})
          },
          tocSettings: {
            ...(existingMB.navigation?.tocSettings || {}),
            ...(mbToSave.navigation?.tocSettings || {}),
            ...(mbToSave.tocSettings || {})
          },
          bookmarkSettings: {
            ...(existingMB.navigation?.bookmarkSettings || {}),
            ...(mbToSave.navigation?.bookmarkSettings || {}),
            ...(mbToSave.bookmarkSettings || {})
          }
        }
      };

      const updateFields = {
        "Customized_Settings.MenuBar": processedMB,
        "settings.menuBar": processedMB,
        lastUpdated: new Date()
      };

      const flipbook = await Flipbook.findOneAndUpdate(
        { v_id },
        { $set: updateFields },
        { returnDocument: 'after', upsert: false }
      );

      if (!flipbook) {
        return res.status(404).json({ success: false, message: "Flipbook not found" });
      }

      return res.status(200).json({
        success: true,
        message: "Menu bar settings saved successfully",
        menuBar: flipbook.Customized_Settings?.MenuBar
      });
    } catch (err) {
      console.error("Error processing menu bar operation:", err);
      return res.status(500).json({ success: false, message: "Internal server error", error: err.message });
    }
  });

// @route   GET /api/flipbook/background-assets
router.get("/background-assets", (req, res) => {
  try {
    res.setHeader("Cache-Control", "public, max-age=86400");
    const protocol = req.protocol || 'http';
    const host = req.get('host') || 'localhost:5000';
    const baseUrl = `${protocol}://${host}`;

    const bgImgDir = path.join(__dirname, "../../assets/bgimg");
    const vdoDir = path.join(__dirname, "../../assets/Videos");

    let images = [];
    if (fs.existsSync(bgImgDir)) {
      const files = fs.readdirSync(bgImgDir);
      images = files
        .filter(f => /\.(webp|jpg|jpeg|png)$/i.test(f))
        .sort((a, b) => (parseInt(a.replace(/\D/g, ''), 10) || 0) - (parseInt(b.replace(/\D/g, ''), 10) || 0))
        .map(f => `${baseUrl}/assets/bgimg/${f}`);
    }

    let videos = [];
    if (fs.existsSync(vdoDir)) {
      const files = fs.readdirSync(vdoDir);
      videos = files
        .filter(f => /\.(webm|mp4)$/i.test(f))
        .sort((a, b) => (parseInt(a.replace(/\D/g, ''), 10) || 0) - (parseInt(b.replace(/\D/g, ''), 10) || 0))
        .map(f => `${baseUrl}/assets/Videos/${f}`);
    }

    return res.status(200).json({ success: true, images, videos });
  } catch (err) {
    console.error("Error serving background assets:", err);
    return res.status(500).json({ success: false, message: "Internal server error", error: err.message });
  }
});

// @route   POST /api/flipbook/copy-theme-asset
router.post("/copy-theme-asset", async (req, res) => {
  try {
    const { emailId, v_id, folderName, flipbookName, imageUrl, oldSrc, previousUrl } = req.body;
    if (!emailId || !imageUrl) {
      return res.status(400).json({ success: false, message: "Missing required fields (emailId or imageUrl)" });
    }

    let targetOldSrc = oldSrc || previousUrl;
    if (!targetOldSrc && v_id) {
      try {
        const fbDoc = await Flipbook.findOne({ v_id }).select("Customized_Settings settings");
        if (fbDoc) {
          targetOldSrc = fbDoc.Customized_Settings?.Background?.image || fbDoc.settings?.background?.image;
        }
      } catch (e) {}
    }

    await deleteOldCustomizedAsset(targetOldSrc);

    const sanitizedEmail = sanitizeEmail(emailId);
    const { physicalFolder, bookName } = await resolveFlipbookPaths(v_id, folderName, flipbookName);

    await ensureFlipbookFoldersInSupabase(sanitizedEmail, physicalFolder, bookName).catch(() => {});

    const isVideo = /\.(mp4|webm|ogv|mov|avi|mkv)$/i.test(imageUrl.split('?')[0]) || imageUrl.includes('/assets/Videos/') || imageUrl.includes('Videos/');
    const targetFolder = isVideo ? 'Video' : 'Image';

    const baseName = path.basename(imageUrl.split('?')[0]);
    const ext = path.extname(baseName) || (isVideo ? '.mp4' : '.webp');
    const rawName = path.basename(baseName, ext);
    const fileName = `${rawName}${ext}`;

    const supabasePath = `${sanitizedEmail}/${FLIPBOOK_ROOT}/${physicalFolder}/${bookName}/customized_assets/${targetFolder}/${fileName}`;
    let finalPublicUrl = null;

    let sourceFilePath = path.join(__dirname, isVideo ? "../../assets/Videos" : "../../assets/bgimg", baseName);
    if (!fs.existsSync(sourceFilePath)) {
      sourceFilePath = path.join(__dirname, isVideo ? "../../assets/Videos" : "../../assets/bgimg", rawName + ext);
    }

    if (fs.existsSync(sourceFilePath)) {
      const supabaseUrlResult = await uploadFileToSupabase(sourceFilePath, supabasePath).catch((err) =>
        console.warn("[Supabase] Copy theme asset upload warning:", err)
      );
      finalPublicUrl = supabaseUrlResult || getSupabasePublicUrl(supabasePath) || rewriteUploadsToSupabase(`/uploads/${supabasePath}`);
    } else if (imageUrl.startsWith("http://") || imageUrl.startsWith("https://")) {
      const resp = await fetch(imageUrl).catch(() => null);
      if (resp && resp.ok) {
        const arrayBuffer = await resp.arrayBuffer();
        const buffer = Buffer.from(arrayBuffer);
        const mimeType = ext === '.png' ? 'image/png' : ext === '.jpg' || ext === '.jpeg' ? 'image/jpeg' : 'image/webp';
        const supabaseUrlResult = await uploadBufferToSupabase(buffer, supabasePath, mimeType).catch((err) =>
          console.warn("[Supabase] Copy theme asset buffer upload warning:", err)
        );
        finalPublicUrl = supabaseUrlResult || getSupabasePublicUrl(supabasePath) || rewriteUploadsToSupabase(`/uploads/${supabasePath}`);
      }
    }

    if (!finalPublicUrl) {
      finalPublicUrl = getSupabasePublicUrl(supabasePath) || imageUrl;
    }

    return res.status(200).json({
      success: true,
      message: "Theme image copied to Supabase customized_assets/Image successfully",
      url: finalPublicUrl,
      fileName,
      supabasePath
    });
  } catch (err) {
    console.error("Error copying theme asset to Supabase:", err);
    return res.status(500).json({ success: false, message: "Internal server error", error: err.message });
  }
});

// @route   POST /api/flipbook/update-settings
router.post("/update-settings", async (req, res) => {
  try {
    const { emailId, v_id, settings, Customized_Settings, newName, share, Visibility, meta, FlipbookInfo, width, height, templateId, orientation, category, language, tags, quotes, about } = req.body;
    if (!emailId || !v_id) {
      return res.status(400).json({ message: "Missing emailId or v_id" });
    }

    let existingDoc = null;
    if (v_id) {
      existingDoc = await Flipbook.findOne({ v_id });
    }
    if (!existingDoc && emailId) {
      existingDoc = await Flipbook.findOne({ userEmail: new RegExp(`^${emailId.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}$`, 'i') });
    }
    const updateData = {};

    const incomingSettings = Customized_Settings || settings;
    const incomingVis = Visibility || share;
    const incomingFlipbookInfo = FlipbookInfo || req.body.Customized_Settings?.FlipbookInfo || meta;

    if (incomingSettings || incomingVis || incomingFlipbookInfo || category || language || tags || quotes !== undefined || about !== undefined || width || height || templateId || orientation || newName) {
      const currentSettings = existingDoc?.Customized_Settings || existingDoc?.settings || {};
      const currentVis = currentSettings.Visibility || existingDoc?.share || {};
      const currentFlipbookInfo = currentSettings.FlipbookInfo || existingDoc?.meta || {};

      let finalVis = currentVis;
      if (incomingVis) {
        const accVal = incomingVis.access || incomingVis.type || currentVis.access || currentVis.type || 'Public';
        finalVis = {
          ...currentVis,
          ...incomingVis,
          access: accVal,
          type: accVal,
          shareId: incomingVis.shareId || currentVis.shareId || nanoid(12)
        };

        if (finalVis.password && typeof finalVis.password === 'string' && finalVis.password.trim() !== '') {
          const passStr = finalVis.password.trim();
          if (!passStr.startsWith('$2a$') && !passStr.startsWith('$2b$')) {
            finalVis.password = await bcrypt.hash(passStr, 10);
          }
        }

        if (finalVis.accessKey && typeof finalVis.accessKey === 'string' && finalVis.accessKey.trim() !== '') {
          const keyStr = finalVis.accessKey.trim();
          if (!keyStr.startsWith('$2a$') && !keyStr.startsWith('$2b$')) {
            finalVis.accessKey = await bcrypt.hash(keyStr, 10);
          }
        }
      }

      const cleanIncoming = { ...(incomingSettings || {}) };
      delete cleanIncoming.visibility;
      delete cleanIncoming.Visibility;
      delete cleanIncoming.FlipbookInfo;

      const cleanCurrent = { ...(currentSettings || {}) };
      delete cleanCurrent.visibility;
      delete cleanCurrent.Visibility;
      delete cleanCurrent.FlipbookInfo;

      const mergedFlipbookInfo = {
        ...currentFlipbookInfo,
        ...(cleanIncoming.FlipbookInfo || {}),
        ...(incomingFlipbookInfo || {}),
        ...(category ? { category } : {}),
        ...(language ? { language } : {}),
        ...(tags ? { tags } : {}),
        ...(quotes !== undefined ? { quotes } : {}),
        ...(about !== undefined ? { about } : {}),
        ...(width ? { width: Number(width) } : {}),
        ...(height ? { height: Number(height) } : {}),
        ...(templateId ? { templateId } : {}),
        ...(orientation ? { orientation } : {})
      };

      if (newName && existingDoc && existingDoc.flipbookName !== newName.trim()) {
        const oldName = existingDoc.flipbookName;
        const safeNewName = newName.trim();

        if (safeNewName && safeNewName !== oldName) {
          const sanitizedEmail = sanitizeEmail(emailId);
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
            console.warn("[Supabase] Rename flipbook folder warning in update-settings:", err)
          );

          const oldLocalPath = path.join(uploadsDir, sanitizedEmail, FLIPBOOK_ROOT, physicalFolderName, oldName);
          const newLocalPath = path.join(uploadsDir, sanitizedEmail, FLIPBOOK_ROOT, physicalFolderName, safeNewName);
          if (fs.existsSync(oldLocalPath) && !fs.existsSync(newLocalPath)) {
            try {
              fs.renameSync(oldLocalPath, newLocalPath);
            } catch (e) {
              console.warn("[Local Disk] Rename flipbook folder warning in update-settings:", e);
            }
          }

          try {
            const assets = await FlipbookAsset.find({ flipbook_v_id: v_id });
            for (const asset of assets) {
              asset.flipbookName = safeNewName;
              if (asset.url) {
                const emailPart = asset.url.split(`/${FLIPBOOK_ROOT}/`)[0];
                asset.url = `${emailPart}/${FLIPBOOK_ROOT}/${asset.folderName || physicalFolderName}/${safeNewName}/assets/${asset.assetType}/${asset.fileName}`;
              }
              await asset.save();
            }
          } catch (e) {
            console.error("Error updating assets on rename in update-settings:", e);
          }

          updateData.flipbookName = safeNewName;
          mergedFlipbookInfo.flipbookName = safeNewName;
        }
      } else if (newName) {
        updateData.flipbookName = newName;
        mergedFlipbookInfo.flipbookName = newName;
      }

      const rawBranding = req.body.Branding || cleanIncoming.Branding || cleanIncoming.branding || req.body.brandingSettings ||
        (req.body.logoSettings || req.body.watermarkSettings || req.body.preloaderSettings || cleanIncoming.logoSettings || cleanIncoming.watermarkSettings || cleanIncoming.preloaderSettings || cleanIncoming.logo || cleanIncoming.watermark || cleanIncoming.preloader ? {
          logoSettings: req.body.logoSettings || cleanIncoming.logoSettings || cleanIncoming.logo,
          watermarkSettings: req.body.watermarkSettings || cleanIncoming.watermarkSettings || cleanIncoming.watermark,
          preloaderSettings: req.body.preloaderSettings || cleanIncoming.preloaderSettings || cleanIncoming.preloader
        } : null);

      const currentBranding = cleanCurrent.Branding || cleanCurrent.branding || existingDoc?.Customized_Settings?.Branding || {};
      let mergedBranding = currentBranding;

      if (rawBranding) {
        const incLogo = rawBranding.logoSettings !== undefined ? rawBranding.logoSettings : (rawBranding.logo !== undefined ? rawBranding.logo : cleanIncoming.logoSettings);
        const incWatermark = rawBranding.watermarkSettings !== undefined ? rawBranding.watermarkSettings : (rawBranding.watermark !== undefined ? rawBranding.watermark : cleanIncoming.watermarkSettings);
        const incPreloader = rawBranding.preloaderSettings !== undefined ? rawBranding.preloaderSettings : (rawBranding.preloader !== undefined ? rawBranding.preloader : cleanIncoming.preloaderSettings);

        const incProfile = rawBranding.profileSettings !== undefined ? rawBranding.profileSettings : (rawBranding.profile !== undefined ? rawBranding.profile : cleanIncoming.profileSettings);

        let newLogo = { ...(currentBranding.logoSettings || {}) };
        if (incLogo && typeof incLogo === 'object') {
          newLogo = { ...newLogo, ...incLogo };
        }

        let newWatermark = { ...(currentBranding.watermarkSettings || {}) };
        if (incWatermark && typeof incWatermark === 'object') {
          newWatermark = { ...newWatermark, ...incWatermark };
        }

        let newPreloader = { ...(currentBranding.preloaderSettings || {}) };
        if (incPreloader && typeof incPreloader === 'object') {
          newPreloader = { ...newPreloader, ...incPreloader };
        }

        let newProfile = { ...(currentBranding.profileSettings || {}) };
        if (incProfile && typeof incProfile === 'object') {
          newProfile = { ...newProfile, ...incProfile };
        }

        mergedBranding = {
          logoSettings: newLogo,
          watermarkSettings: newWatermark,
          preloaderSettings: newPreloader,
          profileSettings: newProfile
        };
      }

      const sanitizedEmail = sanitizeEmail(emailId);
      const { physicalFolder, bookName } = await resolveFlipbookPaths(v_id, req.body.folderName, newName || existingDoc?.flipbookName);

      if (mergedBranding.logoSettings) {
        if (mergedBranding.logoSettings.src && typeof mergedBranding.logoSettings.src === 'string' && mergedBranding.logoSettings.src.trim() !== '') {
          mergedBranding.logoSettings.src = await ensureBrandingAssetInSupabase(mergedBranding.logoSettings.src, sanitizedEmail, physicalFolder, bookName, 'Logo');
        }
        if (mergedBranding.logoSettings.url && typeof mergedBranding.logoSettings.url === 'string' && mergedBranding.logoSettings.url.startsWith('data:')) {
          mergedBranding.logoSettings.url = await ensureBrandingAssetInSupabase(mergedBranding.logoSettings.url, sanitizedEmail, physicalFolder, bookName, 'Logo');
        }
      }

      if (mergedBranding.watermarkSettings && mergedBranding.watermarkSettings.src && mergedBranding.watermarkSettings.src.trim() !== '') {
        mergedBranding.watermarkSettings.src = await ensureBrandingAssetInSupabase(mergedBranding.watermarkSettings.src, sanitizedEmail, physicalFolder, bookName, 'Watermark');
      }

      const incomingBackground = req.body.Background || cleanIncoming.Background || cleanIncoming.background || req.body.backgroundSettings;
      const currentBackground = cleanCurrent.Background || cleanCurrent.background || existingDoc?.Customized_Settings?.Background || {};
      let mergedBackground = currentBackground;
      if (incomingBackground) {
        mergedBackground = {
          ...currentBackground,
          ...incomingBackground
        };
        if (mergedBackground.image) {
          const newBgImage = await ensureBackgroundAssetInSupabase(mergedBackground.image, sanitizedEmail, physicalFolder, bookName);

          if (currentBackground.image && currentBackground.image !== newBgImage && typeof currentBackground.image === 'string' && currentBackground.image.includes('/customized_assets/Image/')) {
            await deleteFileFromSupabase(currentBackground.image).catch((err) =>
              console.warn("[Supabase] Delete replaced background image warning:", err)
            );
          }

          mergedBackground.image = newBgImage;
        }
        if (mergedBackground.video) {
          const newBgVideo = await ensureBackgroundAssetInSupabase(mergedBackground.video, sanitizedEmail, physicalFolder, bookName);

          if (currentBackground.video && currentBackground.video !== newBgVideo && typeof currentBackground.video === 'string' && currentBackground.video.includes('/customized_assets/Video/')) {
            await deleteFileFromSupabase(currentBackground.video).catch((err) =>
              console.warn("[Supabase] Delete replaced background video warning:", err)
            );
          }

          mergedBackground.video = newBgVideo;
        }
      }

      const incomingMenuBar = req.body.MenuBar || cleanIncoming.MenuBar || cleanIncoming.menuBar || req.body.menuBarSettings;
      const currentMenuBar = cleanCurrent.MenuBar || cleanCurrent.menuBar || existingDoc?.Customized_Settings?.MenuBar || {};
      let mergedMenuBar = currentMenuBar;
      if (incomingMenuBar) {
        const incMedia = incomingMenuBar.media || {};
        const curMedia = currentMenuBar.media || {};
        const bgAudioVal = incMedia.backgroundAudio !== undefined
          ? Boolean(incMedia.backgroundAudio)
          : (incMedia.audio !== undefined ? Boolean(incMedia.audio) : (curMedia.backgroundAudio ?? curMedia.audio ?? true));

        const incAudioSet = incMedia.audioSettings || req.body.otherSetup?.sound || cleanIncoming.otherSetup?.sound || {};
        const curAudioSet = curMedia.audioSettings || {};

        const incInteraction = incomingMenuBar.interaction || {};
        const curInteraction = currentMenuBar.interaction || {};
        const incGallerySettings = incInteraction.gallerySettings || req.body.otherSetup?.gallery || cleanIncoming.otherSetup?.gallery || {};
        const curGallerySettings = curInteraction.gallerySettings || {};

        mergedMenuBar = {
          ...currentMenuBar,
          ...incomingMenuBar,
          interaction: {
            ...curInteraction,
            ...incInteraction,
            gallerySettings: {
              ...curGallerySettings,
              ...incGallerySettings,
              images: Array.isArray(incGallerySettings.images)
                ? incGallerySettings.images
                : (Array.isArray(req.body.otherSetup?.gallery?.images)
                  ? req.body.otherSetup.gallery.images
                  : (curGallerySettings.images || []))
            }
          },
          media: {
            ...curMedia,
            ...incMedia,
            backgroundAudio: bgAudioVal,
            audio: bgAudioVal,
            audioSettings: {
              ...curAudioSet,
              ...incAudioSet,
              bgSound: incAudioSet.bgSound || curAudioSet.bgSound || 'BG Sound 1',
              bgSoundFile: incAudioSet.bgSoundFile !== undefined ? incAudioSet.bgSoundFile : (curAudioSet.bgSoundFile || ''),
              customBgSounds: Array.isArray(incAudioSet.customBgSounds) ? incAudioSet.customBgSounds : (curAudioSet.customBgSounds || []),
              flipSound: incAudioSet.flipSound || curAudioSet.flipSound || 'Soft Paper Flip',
              pageSpecificSound: incAudioSet.pageSpecificSound !== undefined ? Boolean(incAudioSet.pageSpecificSound) : Boolean(curAudioSet.pageSpecificSound)
            }
          },
          navigation: {
            ...(currentMenuBar.navigation || {}),
            ...(incomingMenuBar.navigation || {}),
            addTextToIconsSettings: {
              ...(currentMenuBar.navigation?.addTextToIconsSettings || {}),
              ...(incomingMenuBar.navigation?.addTextToIconsSettings || {}),
              ...(incomingMenuBar.addTextToIconsSettings || {})
            },
            tocSettings: {
              ...(currentMenuBar.navigation?.tocSettings || {}),
              ...(incomingMenuBar.navigation?.tocSettings || {}),
              ...(incomingMenuBar.tocSettings || {})
            },
            bookmarkSettings: {
              ...(currentMenuBar.navigation?.bookmarkSettings || {}),
              ...(incomingMenuBar.navigation?.bookmarkSettings || {}),
              ...(incomingMenuBar.bookmarkSettings || {})
            }
          }
        };
      }

      const rawLayouts = req.body.Layouts || cleanIncoming.Layouts || cleanIncoming.layouts || req.body.layoutSettings;
      const fallbackStyle = req.body.layoutStyle !== undefined ? req.body.layoutStyle : req.body.layout;
      const fallbackColors = req.body.layoutColors;
      const incomingLayouts = rawLayouts || (fallbackStyle !== undefined || fallbackColors !== undefined ? { layoutStyle: fallbackStyle, layoutColors: fallbackColors } : null);
      const currentLayouts = cleanCurrent.Layouts || cleanCurrent.layouts || existingDoc?.Customized_Settings?.Layouts || {};
      let mergedLayouts = currentLayouts;
      if (incomingLayouts) {
        const styleVal = incomingLayouts.layoutStyle !== undefined ? incomingLayouts.layoutStyle : (incomingLayouts.style !== undefined ? incomingLayouts.style : (incomingLayouts.layout !== undefined ? incomingLayouts.layout : currentLayouts.layoutStyle));
        const colorsVal = incomingLayouts.layoutColors !== undefined ? incomingLayouts.layoutColors : currentLayouts.layoutColors;
        mergedLayouts = {
          ...currentLayouts,
          ...incomingLayouts,
          layoutStyle: styleVal !== undefined ? styleVal : 1,
          layoutColors: colorsVal || {
            toolbarColor: { primary: '', secondary: '' },
            popupColor: { primary: '', secondary: '' }
          }
        };
      }

      const rawBookAppearance = req.body.BookAppearance || req.body.bookAppearance || cleanIncoming.BookAppearance || cleanIncoming.bookAppearance || cleanIncoming.appearance || req.body.bookAppearanceSettings;
      const currentBookAppearance = cleanCurrent.BookAppearance || cleanCurrent.bookAppearance || cleanCurrent.appearance || existingDoc?.Customized_Settings?.BookAppearance || {};
      let mergedBookAppearance = currentBookAppearance;
      if (rawBookAppearance) {
        mergedBookAppearance = {
          ...currentBookAppearance,
          ...rawBookAppearance,
          dropShadow: {
            ...(currentBookAppearance.dropShadow || {}),
            ...(rawBookAppearance.dropShadow || {})
          }
        };
      }

      const rawOtherSetup = req.body.otherSetup || req.body.othersetup || cleanIncoming.otherSetup || cleanIncoming.othersetup;
      const currentOtherSetup = cleanCurrent.otherSetup || cleanCurrent.othersetup || existingDoc?.Customized_Settings?.otherSetup || {};
      let mergedOtherSetup = currentOtherSetup;
      if (rawOtherSetup) {
        let galleryImgs = (Array.isArray(rawOtherSetup.gallery?.images) && rawOtherSetup.gallery.images.length > 0)
          ? rawOtherSetup.gallery.images
          : (Array.isArray(mergedMenuBar?.interaction?.gallerySettings?.images)
            ? mergedMenuBar.interaction.gallerySettings.images
            : (currentOtherSetup.gallery?.images || []));

        galleryImgs = galleryImgs.map(img => {
          if (!img) return img;
          let currentUrl = typeof img === 'string' ? img : (img.url || img.src || '');
          if (currentUrl && typeof currentUrl === 'string' && !currentUrl.startsWith('blob:')) {
            const absoluteSupabaseUrl = getSupabasePublicUrl(currentUrl) || rewriteUploadsToSupabase(currentUrl);
            if (typeof img === 'string') return absoluteSupabaseUrl;
            return {
              ...img,
              url: absoluteSupabaseUrl
            };
          }
          return img;
        }).filter(Boolean);

        mergedOtherSetup = {
          ...currentOtherSetup,
          ...rawOtherSetup,
          gallery: {
            ...(currentOtherSetup.gallery || {}),
            ...(rawOtherSetup.gallery || {}),
            images: galleryImgs
          },
          sound: {
            ...(currentOtherSetup.sound || {}),
            ...(rawOtherSetup.sound || {})
          }
        };

        if (mergedMenuBar) {
          if (mergedMenuBar.interaction) {
            mergedMenuBar.interaction.gallerySettings = {
              ...(mergedMenuBar.interaction?.gallerySettings || {}),
              images: galleryImgs
            };
          }
          if (rawOtherSetup.sound) {
            mergedMenuBar.media = {
              ...(mergedMenuBar.media || {}),
              audioSettings: {
                ...(mergedMenuBar.media?.audioSettings || {}),
                ...(rawOtherSetup.sound || {})
              }
            };
          }
        }

        const oldGalleryImgs = (currentOtherSetup.gallery?.images || []).concat(currentMenuBar.interaction?.gallerySettings?.images || []);
        const oldUrls = oldGalleryImgs.map(img => typeof img === 'string' ? img : (img?.url || img?.src)).filter(Boolean);
        const newUrls = galleryImgs.map(img => typeof img === 'string' ? img : (img?.url || img?.src)).filter(Boolean);

        const removedUrls = oldUrls.filter(oldUrl => oldUrl && !newUrls.includes(oldUrl));

        for (const removedUrl of removedUrls) {
          if (removedUrl && typeof removedUrl === 'string' && (removedUrl.includes('/customized_assets/') || removedUrl.includes('supabase.co'))) {
            deleteFileFromSupabase(removedUrl).catch((err) =>
              console.warn("[Supabase] Delete removed gallery asset warning:", err)
            );
          }
        }
      }

      const rawLeadForm = req.body.leadForm || req.body.leadform || cleanIncoming.leadForm || cleanIncoming.leadform;
      const currentLeadForm = cleanCurrent.leadForm || cleanCurrent.leadform || existingDoc?.Customized_Settings?.leadForm || {};
      let mergedLeadForm = currentLeadForm;
      if (rawLeadForm) {
        mergedLeadForm = {
          ...currentLeadForm,
          ...rawLeadForm,
          appearance: {
            ...(currentLeadForm.appearance || {}),
            ...(rawLeadForm.appearance || {})
          }
        };
      }

      const mergedCustomizedSettings = {
        ...cleanCurrent,
        ...cleanIncoming,
        Visibility: finalVis,
        FlipbookInfo: mergedFlipbookInfo,
        Branding: mergedBranding,
        Background: mergedBackground,
        MenuBar: mergedMenuBar,
        Layouts: mergedLayouts,
        BookAppearance: mergedBookAppearance,
        otherSetup: mergedOtherSetup,
        leadForm: mergedLeadForm
      };

      updateData.Customized_Settings = mergedCustomizedSettings;
    }

    updateData.lastUpdated = new Date();

    const updatedDoc = await Flipbook.findOneAndUpdate(
      existingDoc ? { _id: existingDoc._id } : { v_id },
      {
        $set: updateData,
        $unset: { share: 1, settings: 1, meta: 1, category: 1, language: 1, tags: 1, quotes: 1, about: 1, width: 1, height: 1, templateId: 1, orientation: 1 }
      },
      { returnDocument: 'after' }
    );

    if (!updatedDoc) {
      return res.status(404).json({ message: "Flipbook not found" });
    }

    const activeVis = updatedDoc.Customized_Settings?.Visibility || updatedDoc.share;
    const responseSettings = { ...(updatedDoc.Customized_Settings || updatedDoc.settings || {}) };
    delete responseSettings.FlipbookInfo;
    delete responseSettings.visibility;

    res.json({
      message: "Settings updated",
      v_id: updatedDoc.v_id,
      Visibility: activeVis,
      share: activeVis,
      Customized_Settings: responseSettings,
      settings: responseSettings,
      FlipbookInfo: updatedDoc.Customized_Settings?.FlipbookInfo
    });
  } catch (err) {
    console.error("Error updating settings:", err);
    res.status(500).json({ message: "Server error" });
  }
});

// @route   GET /api/flipbook/customized-settings
router.get(["/customized-settings", "/customized_settings"], async (req, res) => {
  try {
    const { v_id, emailId, folderName, bookName } = req.query;
    if (!v_id && (!emailId || !bookName)) {
      return res.status(400).json({ success: false, message: "Missing required query parameters (v_id or emailId & bookName)" });
    }

    let flipbook = null;
    if (v_id) {
      flipbook = await Flipbook.findOne({ v_id }).select("Customized_Settings settings v_id flipbookName userEmail folderName");
    } else {
      flipbook = await Flipbook.findOne({ userEmail: emailId, flipbookName: bookName }).select("Customized_Settings settings v_id flipbookName userEmail folderName");
    }

    if (!flipbook) {
      return res.status(404).json({ success: false, message: "Flipbook not found" });
    }

    const customizedSettings = flipbook.Customized_Settings || flipbook.settings || {};

    return res.status(200).json({
      success: true,
      v_id: flipbook.v_id,
      flipbookName: flipbook.flipbookName,
      userEmail: flipbook.userEmail,
      Customized_Settings: customizedSettings
    });
  } catch (err) {
    console.error("Error fetching customized settings:", err);
    return res.status(500).json({ success: false, message: "Internal server error", error: err.message });
  }
});

const getClientIp = (req) => {
  let rawIp = req.body?.viewerIp ||
              req.headers['cf-connecting-ip'] ||
              req.headers['x-client-ip'] ||
              req.headers['x-real-ip'] ||
              req.headers['x-forwarded-for'] ||
              req.ip ||
              req.socket?.remoteAddress ||
              req.connection?.remoteAddress ||
              '';

  if (typeof rawIp === 'string' && rawIp) {
    if (rawIp.includes(',')) {
      rawIp = rawIp.split(',')[0].trim();
    }
    if (rawIp.startsWith('::ffff:')) {
      rawIp = rawIp.replace('::ffff:', '');
    }
    if (rawIp === '::1') {
      rawIp = '127.0.0.1';
    }
  }
  return rawIp || '';
};

// @route   POST /api/flipbook/submit-lead
// @desc    Collect a lead submitted by a viewer
router.post(['/submit-lead', '/public/submit-lead'], async (req, res) => {
  try {
    const { v_id, shareId, flipbookName, userEmail, leadData } = req.body;
    if (!leadData || typeof leadData !== 'object') {
      return res.status(400).json({ success: false, message: 'Invalid leadData' });
    }

    let flipbook = null;
    if (v_id && v_id !== 'preview') {
      flipbook = await Flipbook.findOne({ v_id });
    }

    if (!flipbook && shareId) {
      flipbook = await Flipbook.findOne({
        $or: [
          { 'Customized_Settings.Visibility.shareId': shareId },
          { 'share.shareId': shareId }
        ]
      });
    }

    if (!flipbook && flipbookName && userEmail) {
      flipbook = await Flipbook.findOne({ userEmail, flipbookName });
    }

    const effectiveVId = (flipbook ? flipbook.v_id : null) || (v_id && v_id !== 'preview' ? v_id : null) || 'preview';
    const effectiveShareId = shareId || flipbook?.Customized_Settings?.Visibility?.shareId || flipbook?.share?.shareId || '';
    const effectiveBookName = flipbook?.flipbookName || flipbookName || 'Flipbook';
    const effectiveUserEmail = flipbook?.userEmail || userEmail || '';
    const detectedViewerIp = getClientIp(req);

    const newLead = new Lead({
      leadId: nanoid(12),
      v_id: effectiveVId,
      shareId: effectiveShareId,
      flipbookName: effectiveBookName,
      userEmail: effectiveUserEmail,
      leadData: leadData,
      viewerIp: detectedViewerIp
    });

    await newLead.save();

    if (flipbook) {
      flipbook.collectedLeads = flipbook.collectedLeads || [];
      flipbook.collectedLeads.push({
        leadId: newLead.leadId,
        submittedAt: newLead.submittedAt,
        data: leadData,
        viewerIp: newLead.viewerIp
      });
      await flipbook.save().catch(err => console.warn("Flipbook lead push warning:", err));
    }

    return res.json({ success: true, message: 'Lead submitted successfully', leadId: newLead.leadId });
  } catch (err) {
    console.error('Error submitting lead:', err);
    return res.status(500).json({ success: false, message: 'Internal server error', error: err.message });
  }
});

// @route   GET /api/flipbook/get-leads
// @desc    Get all collected leads for a flipbook
router.get('/get-leads', async (req, res) => {
  try {
    const { v_id, emailId, bookName } = req.query;
    let effectiveVId = v_id;
    if (!effectiveVId && emailId && bookName) {
      const doc = await Flipbook.findOne({ userEmail: emailId, flipbookName: bookName }).select('v_id');
      if (doc) effectiveVId = doc.v_id;
    }

    if (!effectiveVId && !emailId) {
      return res.status(400).json({ success: false, message: 'Missing v_id or emailId' });
    }

    let filter = {};
    if (effectiveVId) filter.v_id = effectiveVId;
    else if (emailId) filter.userEmail = emailId;

    const leads = await Lead.find(filter).sort({ createdAt: -1 });

    return res.json({
      success: true,
      v_id: effectiveVId || null,
      leads: leads
    });
  } catch (err) {
    console.error('Error fetching leads:', err);
    return res.status(500).json({ success: false, message: 'Internal server error', error: err.message });
  }
});

export default router;
