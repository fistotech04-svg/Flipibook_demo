import express from "express";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import multer from "multer";
import ThreedModel from "../../models/ThreedModel.js";
import InteractionThreedModel from "../../models/InteractionThreedModel.js";
import { uploadFileToSupabase, uploadBufferToSupabase, downloadFileFromSupabase, deleteFileFromSupabase, renamePathInSupabase } from "../../config/supabase.js";
import { convertWithAssimp, is3DFormat, isGlbFormat, isCadFormat } from "../../utils/assimpConverter.js";
import { scheduleTempCleanup, scheduleSupabaseCleanup } from "../../utils/tempCleaner.js";


const router = express.Router();

// Get the directory name for ES modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Configure multer for 3D model uploads (temporary local storage before Supabase)
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const tempDir = path.join(__dirname, "../../temp_uploads/3d_models");
    if (!fs.existsSync(tempDir)) {
      fs.mkdirSync(tempDir, { recursive: true });
    }
    cb(null, tempDir);
  },
  filename: (req, file, cb) => {
    cb(null, file.originalname);
  },
});

const upload = multer({
  storage: storage,
  limits: {
    fileSize: 500 * 1024 * 1024, // 500MB limit for 3D models (direct uploads)
  },
});

// Configure multer for CHUNKED uploads in temp_uploads
const chunkStorage = multer.diskStorage({
  destination: (req, file, cb) => {
    const { uploadId } = req.body;
    if (!uploadId) return cb(new Error("uploadId is required"));
    
    const tempDir = path.join(__dirname, "../../temp_uploads/3d_models/temp", uploadId);
    if (!fs.existsSync(tempDir)) {
      fs.mkdirSync(tempDir, { recursive: true });
    }
    cb(null, tempDir);
  },
  filename: (req, file, cb) => {
    const { chunkIndex } = req.body;
    cb(null, `chunk_${chunkIndex || 0}`);
  },
});
const uploadChunk = multer({ storage: chunkStorage });

// @route   POST /api/3d-models/convert-model
// @desc    Convert any 3D model file to GLB using Assimp and upload directly to Supabase in user's 3D_Converter folder
// @access  Public
router.post("/convert-model", (req, res) => {
  upload.single("model")(req, res, async (err) => {
    if (err instanceof multer.MulterError) {
      console.error("Multer Error in convert-model:", err);
      return res.status(413).json({ message: `Upload error: ${err.message}` });
    } else if (err) {
      console.error("Unknown Upload Error in convert-model:", err);
      return res.status(500).json({ message: err.message || "Server error during upload" });
    }

    if (!req.file) {
      return res.status(400).json({ message: "No 3D model file uploaded" });
    }

    const emailId = req.body.emailId || req.query.emailId || "guest_user";
    const sanitizedEmail = emailId.replace(/[@.]/g, "_");

    const inputPath = req.file.path;
    const originalExt = path.extname(req.file.originalname).toLowerCase();
    const baseName = path.basename(req.file.originalname, path.extname(req.file.originalname)).replace(/[^a-zA-Z0-9_-]/g, "_");
    
    const convertedDir = path.join(__dirname, "../../temp_uploads/converted_models");
    if (!fs.existsSync(convertedDir)) {
      fs.mkdirSync(convertedDir, { recursive: true });
    }

    const outputGlbName = `${baseName}_converted_${Date.now()}.glb`;
    const outputGlbPath = path.join(convertedDir, outputGlbName);
    const destinationPath = `${sanitizedEmail}/3D_Converter/${outputGlbName}`;

    try {
      // If already a GLB file, copy to convertedDir
      if (originalExt === ".glb") {
        fs.copyFileSync(inputPath, outputGlbPath);
      } else {
        const engine = isCadFormat(req.file.originalname) ? "OpenCASCADE" : "Assimp";
        console.log(`[${engine}] Converting uploaded file: ${req.file.originalname} -> ${outputGlbName}`);
        await convertWithAssimp(inputPath, outputGlbPath);
      }

      if (!fs.existsSync(outputGlbPath) || fs.statSync(outputGlbPath).size === 0) {
        throw new Error("Conversion finished but output GLB file was not created or is empty.");
      }

      const fileStats = fs.statSync(outputGlbPath);
      const sizeInMB = (fileStats.size / (1024 * 1024)).toFixed(2);

      // Immediately preserve in local converted directory for 1-hour with instant HTTP delivery
      scheduleTempCleanup(outputGlbPath, 60 * 60 * 1000);
      try { if (fs.existsSync(inputPath)) fs.unlinkSync(inputPath); } catch (e) {}

      // Fast local serving URL (loads in ~100ms instead of waiting for cloud upload)
      const finalUrl = `/api/3d-models/converted/${outputGlbName}`;

      // Asynchronously sync to Supabase in background (non-blocking)
      uploadFileToSupabase(outputGlbPath, destinationPath)
        .then((supabaseUrl) => {
          if (supabaseUrl) {
            scheduleSupabaseCleanup(destinationPath, 60 * 60 * 1000);
            console.log(`[Supabase Background Sync] Stored converted GLB: ${destinationPath}`);
          }
        })
        .catch((sbErr) => {
          console.warn("[Supabase Background Sync Notice]:", sbErr.message);
        });

      res.setHeader("Access-Control-Allow-Origin", "*");

      return res.status(200).json({
        success: true,
        url: finalUrl,
        name: baseName,
        sizeInMB: sizeInMB
      });
    } catch (convErr) {
      const engine = isCadFormat(req.file?.originalname) ? "OpenCASCADE" : "Assimp";
      console.error(`[${engine}] Conversion error:`, convErr);
      try { if (fs.existsSync(inputPath)) fs.unlinkSync(inputPath); } catch (e) {}
      try { if (fs.existsSync(outputGlbPath)) fs.unlinkSync(outputGlbPath); } catch (e) {}
      
      let clientMsg = `Failed to convert ${originalExt.toUpperCase()} file to GLB: ${convErr.message}`;
      if (originalExt === ".blend") {
        clientMsg = "This .blend file contains complex Blender mesh modifiers/BMesh data that Assimp cannot parse directly. Please open Blender and export your model as .GLB (glTF 2.0), .FBX, or .OBJ (File > Export), which are fully supported.";
      }

      res.setHeader("Access-Control-Allow-Origin", "*");
      return res.status(422).json({ 
        message: clientMsg 
      });
    }
  });
});

// @route   GET /api/3d-models/converted/:filename
// @desc    Directly serve locally converted GLB models
// @access  Public
router.get("/converted/:filename", (req, res) => {
  const filename = path.basename(req.params.filename);
  const filePath = path.join(__dirname, "../../temp_uploads/converted_models", filename);
  if (!fs.existsSync(filePath)) {
    return res.status(404).json({ message: "Converted model not found or expired" });
  }
  res.setHeader("Content-Type", "model/gltf-binary");
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Cache-Control", "public, max-age=3600");
  return res.sendFile(filePath);
});

// @route   POST /api/3d-models/upload-texture
// @desc    Upload a texture or environment map image (PNG, JPG, WEBP, HDR, etc.) without Assimp conversion
// @access  Public
router.post("/upload-texture", (req, res) => {
  upload.single("texture")(req, res, async (err) => {
    if (err) {
      console.error("[Upload-Texture] Multer error:", err);
      return res.status(400).json({ message: err.message });
    }

    try {
      const emailId = req.body.emailId;
      if (!emailId || !req.file) {
        return res.status(400).json({ message: "emailId and texture file are required" });
      }

      const sanitizedEmail = emailId.replace(/[@.]/g, "_");
      const ext = path.extname(req.file.originalname) || ".png";
      const cleanBase = path.basename(req.file.originalname, ext).replace(/[^a-zA-Z0-9_-]/g, "_");
      const finalFileName = `${cleanBase}_${Date.now()}${ext}`;

      // Upload to Supabase Storage
      const destinationPath = `${sanitizedEmail}/3D_Modals/Textures/${finalFileName}`;
      const supabaseUrl = await uploadFileToSupabase(req.file.path, destinationPath);

      let finalUrl = supabaseUrl;
      if (!finalUrl) {
        // Fallback to local storage on server
        const localDir = path.join(__dirname, `../../uploads/${sanitizedEmail}/3D_Modals/Textures`);
        if (!fs.existsSync(localDir)) fs.mkdirSync(localDir, { recursive: true });
        const localPath = path.join(localDir, finalFileName);
        fs.copyFileSync(req.file.path, localPath);
        finalUrl = `/uploads/${sanitizedEmail}/3D_Modals/Textures/${finalFileName}`;
      }

      try { if (fs.existsSync(req.file.path)) fs.unlinkSync(req.file.path); } catch (e) {}

      res.status(200).json({
        success: true,
        url: finalUrl,
        fileName: finalFileName
      });
    } catch (error) {
      if (req.file && req.file.path && fs.existsSync(req.file.path)) {
        try { fs.unlinkSync(req.file.path); } catch (e) {}
      }
      console.error("[Upload-Texture] Error:", error);
      res.status(500).json({ message: error.message });
    }
  });
});

// @route   POST /api/3d-models/upload-model
// @desc    Upload a 3D model to the user's 3D_Modals folder (converts non-GLB to GLB with Assimp)
// @access  Public
router.post("/upload-model", (req, res) => {
  upload.single("model")(req, res, async (err) => {
    if (err instanceof multer.MulterError) {
      console.error("Multer Error:", err);
      return res.status(413).json({ message: `Upload error: ${err.message}` });
    } else if (err) {
      console.error("Unknown Upload Error:", err);
      return res.status(500).json({ message: err.message || "Server error during upload" });
    }

    try {
      const { emailId, modelId } = req.body;
      if (!emailId) {
        return res.status(400).json({ message: "Email ID is required" });
      }

      if (!req.file) {
        return res.status(400).json({ message: "No file uploaded" });
      }

      const sanitizedEmail = emailId.replace(/[@.]/g, "_");
      const fileExt = path.extname(req.file.filename).toLowerCase();
      const isImage = [".png", ".jpg", ".jpeg", ".webp", ".hdr", ".exr", ".svg"].includes(fileExt);

      // If the file is an image/texture rather than a 3D model, upload directly without running Assimp
      if (isImage) {
        const destinationPath = `${sanitizedEmail}/3D_Modals/Textures/${req.file.filename}`;
        const supabaseUrl = await uploadFileToSupabase(req.file.path, destinationPath);
        let finalTextureUrl = supabaseUrl;

        if (!finalTextureUrl) {
          const localDir = path.join(__dirname, `../../uploads/${sanitizedEmail}/3D_Modals/Textures`);
          if (!fs.existsSync(localDir)) fs.mkdirSync(localDir, { recursive: true });
          const localPath = path.join(localDir, req.file.filename);
          fs.copyFileSync(req.file.path, localPath);
          finalTextureUrl = `/uploads/${sanitizedEmail}/3D_Modals/Textures/${req.file.filename}`;
        }

        try { if (fs.existsSync(req.file.path)) fs.unlinkSync(req.file.path); } catch (e) {}

        return res.status(200).json({
          message: "Texture uploaded successfully",
          url: finalTextureUrl,
          name: req.file.filename
        });
      }

      let fileToUploadPath = req.file.path;
      let finalFilename = req.file.filename;
      let convertedGlbPath = null;

      // If not already a .glb file, convert to .glb with Assimp
      if (!isGlbFormat(req.file.filename)) {
        const baseName = path.basename(req.file.filename, path.extname(req.file.filename)).replace(/[^a-zA-Z0-9_-]/g, "_");
        finalFilename = `${baseName}.glb`;
        convertedGlbPath = path.join(path.dirname(req.file.path), `${baseName}_converted_${Date.now()}.glb`);
        
        const engine = isCadFormat(req.file.filename) ? "OpenCASCADE" : "Assimp";
        console.log(`[Upload] Converting ${req.file.filename} to GLB via ${engine}...`);
        await convertWithAssimp(req.file.path, convertedGlbPath);
        fileToUploadPath = convertedGlbPath;
      }

      let relativeUrl = `/uploads/${sanitizedEmail}/3D_Modals/${finalFilename}`;

      // Upload file to Supabase Storage
      const destinationPath = `${sanitizedEmail}/3D_Modals/${finalFilename}`;
      const supabaseUrl = await uploadFileToSupabase(fileToUploadPath, destinationPath);
      if (supabaseUrl) {
        relativeUrl = supabaseUrl;
      } else {
        // Fallback to local storage if Supabase failed or payload too large
        const localUploadsDir = path.join(__dirname, `../../uploads/${sanitizedEmail}/3D_Modals`);
        if (!fs.existsSync(localUploadsDir)) fs.mkdirSync(localUploadsDir, { recursive: true });
        const localTargetFile = path.join(localUploadsDir, finalFilename);
        try { fs.copyFileSync(fileToUploadPath, localTargetFile); } catch (e) {}
      }

      const stats = fs.statSync(fileToUploadPath);
      const type = "glb";
      const sizeStr = (stats.size / (1024 * 1024)).toFixed(2) + " MB";

      let model;
      let interactionModel = null;
      let finalRelativeUrl = relativeUrl;

      if (modelId) {
          model = await ThreedModel.findOne({ modelId, userEmail: emailId });
          if (!model) {
              interactionModel = await InteractionThreedModel.findOne({ v_id: modelId, userEmail: emailId });
          }
      }

      if (model) {
          // Update ThreedModel
          model.name = finalFilename;
          model.url = finalRelativeUrl;
          model.type = type;
          model.size = sizeStr;
          await model.save();
      } else if (interactionModel) {
          // Update InteractionThreedModel
          interactionModel.fileName = finalFilename;
          interactionModel.url = `./assets/3D_Model/${finalFilename}`;
          interactionModel.type = type;
          interactionModel.size = sizeStr;
          await interactionModel.save();

          finalRelativeUrl = `/uploads/${sanitizedEmail}/My_Flipbooks/${interactionModel.folderName}/${interactionModel.flipbookName}/assets/3D_Model/${interactionModel.fileName}`;

          // Upload 3D model to Supabase Storage in flipbook assets/3D_Model
          const interactionSupabasePath = `${sanitizedEmail}/My_Flipbooks/${interactionModel.folderName}/${interactionModel.flipbookName}/assets/3D_Model/${interactionModel.fileName}`;
          uploadFileToSupabase(fileToUploadPath, interactionSupabasePath).catch(err => console.warn("[Supabase] 3D Model asset upload warning:", err));
      } else {
          // Save as new ThreedModel (Global)
          model = new ThreedModel({
            userEmail: emailId,
            name: finalFilename,
            url: finalRelativeUrl,
            type: type,
            size: sizeStr
          });
          await model.save();
      }

      // Cleanup local temp files after uploading to Supabase
      if (req.file && req.file.path && fs.existsSync(req.file.path)) {
        try { fs.unlinkSync(req.file.path); } catch(e) {}
      }
      if (convertedGlbPath && fs.existsSync(convertedGlbPath)) {
        try { fs.unlinkSync(convertedGlbPath); } catch(e) {}
      }

      res.status(200).json({
        message: modelId ? "Model updated successfully" : "Model uploaded successfully",
        url: finalRelativeUrl,
        name: finalFilename,
        type: type,
        size: sizeStr,
        modelId: model ? model.modelId : (interactionModel ? interactionModel.v_id : null)
      });
    } catch (error) {
      if (req.file && req.file.path && fs.existsSync(req.file.path)) {
        try { fs.unlinkSync(req.file.path); } catch(e) {}
      }
      console.error("Error processing 3D model:", error);
      res.status(500).json({ message: "Server error during processing: " + error.message });
    }
  });
});

// @route   POST /api/3d-models/upload-chunk
// @desc    Receive a file chunk and merge if last (converts to GLB if needed)
// @access  Public
router.post("/upload-chunk", uploadChunk.single("chunk"), async (req, res) => {
  try {
    const { uploadId, chunkIndex, totalChunks, fileName, emailId, modelId } = req.body;

    if (!uploadId || !fileName) {
      return res.status(400).json({ message: "Missing required chunk metadata (uploadId, fileName)" });
    }

    const curIndex = parseInt(chunkIndex);
    const total = parseInt(totalChunks);

    // If it's the last chunk, start merging in tempDir
    if (curIndex === total - 1) {
      const tempDir = path.join(__dirname, "../../temp_uploads/3d_models/temp", uploadId);
      const sanitizedEmail = (emailId || "guest_user").replace(/[@.]/g, "_");

      if (!fs.existsSync(tempDir)) {
        fs.mkdirSync(tempDir, { recursive: true });
      }

      const finalPath = path.join(tempDir, fileName);
      const writeStream = fs.createWriteStream(finalPath);

      // Merge chunks sequentially
      for (let i = 0; i < total; i++) {
        const chunkPath = path.join(tempDir, `chunk_${i}`);
        
        // Wait for file to exist (small delay for fs sync if needed)
        let retry = 0;
        while(!fs.existsSync(chunkPath) && retry < 10) {
            await new Promise(r => setTimeout(r, 100));
            retry++;
        }

        if (fs.existsSync(chunkPath)) {
            const data = fs.readFileSync(chunkPath);
            writeStream.write(data);
            fs.unlinkSync(chunkPath); // Delete chunk after reading
        } else {
            console.error(`Missing chunk ${i} for upload ${uploadId}`);
        }
      }
      writeStream.end();

      writeStream.on("finish", async () => {
        try {
          let uploadFilePath = finalPath;
          let finalFileName = fileName;

          const isConverter = req.body.isConverter === "true" || req.body.isConverter === true;
          const baseName = path.basename(fileName, path.extname(fileName)).replace(/[^a-zA-Z0-9_-]/g, "_");

          // Convert to GLB if not already GLB
          if (!isGlbFormat(fileName)) {
            finalFileName = isConverter ? `${baseName}_converted_${Date.now()}.glb` : `${baseName}.glb`;
            const convertedGlbPath = path.join(tempDir, finalFileName);
            
            const engine = isCadFormat(fileName) ? "OpenCASCADE" : "Assimp";
            console.log(`[Chunk Upload] Converting merged ${fileName} to GLB via ${engine}...`);
            await convertWithAssimp(finalPath, convertedGlbPath);
            uploadFilePath = convertedGlbPath;
          }

          const stats = fs.statSync(uploadFilePath);
          const type = "glb";
          const sizeStr = (stats.size / (1024 * 1024)).toFixed(2) + " MB";

          if (isConverter) {
            // Save converted file locally for instant fast delivery
            const convertedDir = path.join(__dirname, "../../temp_uploads/converted_models");
            if (!fs.existsSync(convertedDir)) fs.mkdirSync(convertedDir, { recursive: true });
            const localSavedPath = path.join(convertedDir, finalFileName);
            try { fs.copyFileSync(uploadFilePath, localSavedPath); } catch (e) {}
            scheduleTempCleanup(localSavedPath, 60 * 60 * 1000);
            try { fs.rmSync(tempDir, { recursive: true, force: true }); } catch (e) {}
            
            const finalModelUrl = `/api/3d-models/converted/${finalFileName}`;

            // Background sync to Supabase (non-blocking)
            const destinationPath = `${sanitizedEmail}/3D_Converter/${finalFileName}`;
            uploadFileToSupabase(localSavedPath, destinationPath)
              .then((sbUrl) => {
                if (sbUrl) {
                  scheduleSupabaseCleanup(destinationPath, 60 * 60 * 1000);
                  console.log(`[Chunk Upload Background Sync] Stored in Supabase: ${destinationPath}`);
                }
              })
              .catch((sbErr) => console.warn("[Chunk Upload Background Sync Notice]:", sbErr.message));

            return res.status(200).json({
                success: true,
                message: "Model converted successfully",
                url: finalModelUrl,
                name: baseName,
                sizeInMB: (stats.size / (1024 * 1024)).toFixed(2)
            });
          }

          // Saving to permanent user 3D_Modals folder in Supabase
          const destinationPath = `${sanitizedEmail}/3D_Modals/${finalFileName}`;
          const supabaseUrl = await uploadFileToSupabase(uploadFilePath, destinationPath);
          let modelUrl = supabaseUrl;

          if (!modelUrl) {
            console.warn(`[Chunk Upload] Supabase upload failed (e.g. file size exceeded limit). Saving locally to disk.`);
            const localUploadsDir = path.join(__dirname, `../../uploads/${sanitizedEmail}/3D_Modals`);
            if (!fs.existsSync(localUploadsDir)) {
              fs.mkdirSync(localUploadsDir, { recursive: true });
            }
            const localTargetFile = path.join(localUploadsDir, finalFileName);
            try {
              fs.copyFileSync(uploadFilePath, localTargetFile);
              modelUrl = `/uploads/${sanitizedEmail}/3D_Modals/${finalFileName}`;
            } catch (copyErr) {
              console.error("[Chunk Upload] Failed to save local fallback copy:", copyErr);
            }
          }

          // Immediately clean up local temporary directory
          try { fs.rmSync(tempDir, { recursive: true, force: true }); } catch (e) {}

          let existing = null;
          if (modelId) {
            existing = await ThreedModel.findOne({ modelId, userEmail: emailId });
          }
          if (!existing) {
            existing = await ThreedModel.findOne({ userEmail: emailId, name: finalFileName });
          }

          let parsedHotspots = [];
          if (req.body.hotspots) {
            try {
              parsedHotspots = typeof req.body.hotspots === 'string' ? JSON.parse(req.body.hotspots) : req.body.hotspots;
            } catch (_) {}
          }
          const incomingDisplayName = req.body.displayName || null;

          let savedModel;
          if (!existing) {
              const newModel = new ThreedModel({
                  userEmail: emailId,
                  name: finalFileName,
                  displayName: incomingDisplayName,
                  url: modelUrl,
                  type: type,
                  size: sizeStr,
                  hotspots: Array.isArray(parsedHotspots) ? parsedHotspots : []
              });
              await newModel.save();
              savedModel = newModel;
          } else {
              existing.name = finalFileName;
              if (incomingDisplayName) existing.displayName = incomingDisplayName;
              existing.url = modelUrl;
              existing.type = type;
              existing.size = sizeStr;
              if (Array.isArray(parsedHotspots) && parsedHotspots.length > 0) {
                existing.hotspots = parsedHotspots;
              }
              await existing.save();
              savedModel = existing;
          }

          res.status(200).json({
              success: true,
              message: "Model uploaded and saved successfully",
              url: savedModel.url,
              name: finalFileName,
              displayName: savedModel.displayName || null,
              hotspots: savedModel.hotspots || [],
              modelId: savedModel.modelId
          });
        } catch (mergeErr) {
          try { fs.rmSync(tempDir, { recursive: true, force: true }); } catch (e) {}
          console.error("Chunk Merge / Conversion Error:", mergeErr);
          
          let clientMsg = `Model conversion failed: ${mergeErr.message}`;
          if (fileName && fileName.toLowerCase().endsWith(".blend")) {
            clientMsg = "This .blend file contains complex Blender mesh modifiers/BMesh data that Assimp cannot parse directly. Please open Blender and export your model as .GLB (glTF 2.0), .FBX, or .OBJ (File > Export), which are fully supported.";
          }

          res.setHeader("Access-Control-Allow-Origin", "*");
          res.status(422).json({
              message: clientMsg
          });
        }
      });

      writeStream.on("error", (err) => {
        console.error("Stream Merge Error:", err);
        res.status(500).json({ message: "Error during file merging" });
      });
    } else {
      res.status(200).json({ message: `Chunk ${curIndex} accepted` });
    }
  } catch (error) {
    console.error("Chunk Upload Error:", error);
    res.status(500).json({ message: "Server error during chunk upload" });
  }
});

// @route   GET /api/3d-models/get-models
// @desc    Get all 3D models for the user
// @access  Public
router.get("/get-models", async (req, res) => {
  try {
    const { emailId } = req.query;
    if (!emailId) {
      return res.status(400).json({ message: "Email ID is required" });
    }

    // Get models from Database
    const dbModels = await ThreedModel.find({ userEmail: emailId }).sort({ createdAt: -1 });

    const models = dbModels.map(m => ({
        modelId: m.modelId,
        name: m.name,
        displayName: m.displayName || null,
        url: m.url,
        thumbnailUrl: m.thumbnailUrl,
        size: m.size,
        type: m.type,
        hotspots: Array.isArray(m.hotspots) ? m.hotspots : [],
        uploadedAt: m.createdAt
    }));

    res.json({ models });
  } catch (error) {
    console.error("Error fetching 3D models:", error);
    res.status(500).json({ message: "Server error" });
  }
});

// @route   POST /api/3d-models/save-session
// @desc    Save the current 3D editor state (JSON) to Supabase Storage
// @access  Public
router.post("/save-session", async (req, res) => {
  try {
    const { emailId, state } = req.body;
    if (!emailId || !state) {
      return res.status(400).json({ message: "Email and state are required" });
    }

    const sanitizedEmail = emailId.replace(/[@.]/g, "_");
    const sessionBuffer = Buffer.from(JSON.stringify(state, null, 2), "utf-8");
    const destinationPath = `${sanitizedEmail}/3D_Modals/session.json`;
    await uploadBufferToSupabase(sessionBuffer, destinationPath, "application/json");

    res.status(200).json({ message: "3D Session saved successfully" });
  } catch (error) {
    console.error("Error saving 3D session:", error);
    res.status(500).json({ message: "Server error" });
  }
});

// @route   POST /api/3d-models/rename-model
// @desc    Rename a model file in Supabase Storage and DB
// @access  Public
router.post("/rename-model", async (req, res) => {
  try {
    const { emailId, oldName, newName, modelId } = req.body;
    if (!emailId || !oldName || !newName) {
      return res.status(400).json({ message: "Missing required fields" });
    }

    const sanitizedEmail = emailId.replace(/[@.]/g, "_");
    
    let interactionModel = null;
    let finalUrl = null;

    if (modelId) {
       interactionModel = await InteractionThreedModel.findOne({ v_id: modelId, userEmail: emailId });
    }
    
    const ext = path.extname(oldName);
    let cleanNewName = newName.replace(/[^a-z0-9]/gi, '_').toLowerCase();
    if (!cleanNewName.endsWith(ext.toLowerCase())) {
        cleanNewName += ext;
    }
    
    if (interactionModel) {
        const oldSupabasePath = `${sanitizedEmail}/My_Flipbooks/${interactionModel.folderName}/${interactionModel.flipbookName}/assets/3D_Model/${interactionModel.fileName}`;
        const newSupabasePath = `${sanitizedEmail}/My_Flipbooks/${interactionModel.folderName}/${interactionModel.flipbookName}/assets/3D_Model/${cleanNewName}`;
        await renamePathInSupabase(oldSupabasePath, newSupabasePath);

        interactionModel.fileName = cleanNewName;
        interactionModel.url = `./assets/3D_Model/${cleanNewName}`;
        await interactionModel.save();
        
        finalUrl = `/uploads/${sanitizedEmail}/My_Flipbooks/${interactionModel.folderName}/${interactionModel.flipbookName}/assets/3D_Model/${cleanNewName}`;
    }

    const dbModel = await ThreedModel.findOne({ userEmail: emailId, name: oldName });
    if (dbModel) {
        const oldSupabasePath = `${sanitizedEmail}/3D_Modals/${oldName}`;
        const newSupabasePath = `${sanitizedEmail}/3D_Modals/${cleanNewName}`;
        await renamePathInSupabase(oldSupabasePath, newSupabasePath);
        // Fallback for models stored under 3D_Models
        await renamePathInSupabase(`${sanitizedEmail}/3D_Models/${oldName}`, newSupabasePath);

        const relativeUrl = `/uploads/${sanitizedEmail}/3D_Modals/${cleanNewName}`;
        if (!finalUrl) finalUrl = relativeUrl;

        let newThumbUrl = dbModel.thumbnailUrl;
        if (dbModel.thumbnailUrl) {
          const oldBase = path.basename(oldName, ext);
          const newBase = path.basename(cleanNewName, ext);
          const thumbExt = path.extname(dbModel.thumbnailUrl);
          const oldThumbPath = `${sanitizedEmail}/3D_Modals/${oldBase}${thumbExt}`;
          const newThumbPath = `${sanitizedEmail}/3D_Modals/${newBase}${thumbExt}`;
          await renamePathInSupabase(oldThumbPath, newThumbPath);
          await renamePathInSupabase(`${sanitizedEmail}/3D_Models/${oldBase}${thumbExt}`, newThumbPath);
          newThumbUrl = `/uploads/${sanitizedEmail}/3D_Modals/${newBase}${thumbExt}`;
        }

        dbModel.name = cleanNewName;
        dbModel.url = relativeUrl;
        dbModel.thumbnailUrl = newThumbUrl;
        await dbModel.save();
    } else if (!interactionModel) {
        return res.status(404).json({ message: "Model not found" });
    }

    res.status(200).json({
      message: "Model renamed successfully",
      newName: cleanNewName,
      url: finalUrl
    });
  } catch (error) {
    console.error("Rename Error:", error);
    res.status(500).json({ message: "Server error during rename" });
  }
});

// @route   POST /api/3d-models/rename-label
// @desc    Update only the display name (fileName) in the DB without renaming any files.
// @access  Public
router.post("/rename-label", async (req, res) => {
  try {
    const { emailId, modelId, newName } = req.body;
    if (!emailId || !modelId || !newName) {
      return res.status(400).json({ message: "Missing required fields" });
    }

    const interactionModel = await InteractionThreedModel.findOne({ v_id: modelId, userEmail: emailId });
    if (!interactionModel) {
      return res.status(404).json({ message: "Model record not found" });
    }

    interactionModel.displayName = newName.trim();
    await interactionModel.save();

    res.status(200).json({
      message: "Model label updated in DB",
      displayName: interactionModel.displayName
    });
  } catch (error) {
    console.error("Rename Label Error:", error);
    res.status(500).json({ message: "Server error during label rename" });
  }
});

// @route   GET /api/3d-models/get-session
// @desc    Get the saved 3D editor state from Supabase Storage
// @access  Public
router.get("/get-session", async (req, res) => {
  try {
    const { emailId } = req.query;
    if (!emailId) return res.status(400).json({ message: "Email is required" });

    const sanitizedEmail = emailId.replace(/[@.]/g, "_");
    const sessionPath = `${sanitizedEmail}/3D_Modals/session.json`;
    let buffer = await downloadFileFromSupabase(sessionPath);
    if (!buffer) {
      // Fallback
      buffer = await downloadFileFromSupabase(`${sanitizedEmail}/3D_Models/session.json`);
    }

    if (buffer) {
      const state = JSON.parse(buffer.toString("utf-8"));
      res.status(200).json({ state });
    } else {
      res.status(404).json({ message: "No saved session found" });
    }
  } catch (error) {
    console.error("Error fetching 3D session:", error);
    res.status(500).json({ message: "Server error" });
  }
});

// @route   DELETE /api/3d-models/delete-model/:emailId/:modelId
// @desc    Delete a model record and its files from Supabase Storage
// @access  Public
router.delete("/delete-model/:emailId/:modelId", async (req, res) => {
  try {
    const { emailId, modelId } = req.params;

    const model = await ThreedModel.findOne({ modelId, userEmail: emailId });
    if (!model) {
      return res.status(404).json({ message: "Model record not found" });
    }

    const { userEmail, name: fileName } = model;
    const sanitizedEmail = userEmail.replace(/[@.]/g, "_");

    // Delete model file from Supabase Storage
    const destinationPath = `${sanitizedEmail}/3D_Modals/${fileName}`;
    await deleteFileFromSupabase(destinationPath);
    await deleteFileFromSupabase(`${sanitizedEmail}/3D_Models/${fileName}`);
    if (model.url) {
      await deleteFileFromSupabase(model.url);
    }
    if (model.thumbnailUrl) {
      await deleteFileFromSupabase(model.thumbnailUrl);
    }

    // Delete Database Record
    await ThreedModel.deleteOne({ modelId });

    res.status(200).json({ message: "Model deleted successfully from DB and Supabase" });
  } catch (error) {
    console.error("Delete Error:", error);
    res.status(500).json({ message: "Server error during deletion" });
  }
});

// @route   POST /api/3d-models/save-hotspots
// @desc    Explicitly update hotspots for a 3D model
// @access  Public
router.post("/save-hotspots", async (req, res) => {
  try {
    const { modelId, hotspots } = req.body;
    if (!modelId) {
      return res.status(400).json({ message: "modelId is required" });
    }
    const cleanHotspots = Array.isArray(hotspots) ? hotspots : [];
    let updated = await ThreedModel.findOneAndUpdate(
      { modelId },
      { $set: { hotspots: cleanHotspots } },
      { new: true }
    );
    if (!updated) {
      updated = await InteractionThreedModel.findOneAndUpdate(
        { v_id: modelId },
        { $set: { hotspots: cleanHotspots } },
        { new: true }
      );
    }
    res.json({ success: true, modelId, hotspots: cleanHotspots });
  } catch (error) {
    console.error("Error saving hotspots:", error);
    res.status(500).json({ message: "Server error saving hotspots" });
  }
});

// @route   GET /api/3d-models/get-model/:modelId
// @desc    Get a single 3D model's metadata by ID
// @access  Public
router.get("/get-model/:modelId", async (req, res) => {
  try {
    const { modelId } = req.params;
    let model = await ThreedModel.findOne({ modelId });
    
    if (!model) {
      const interactionModel = await InteractionThreedModel.findOne({ v_id: modelId });
      if (interactionModel) {
        const sanitizedEmail = interactionModel.userEmail.replace(/[@.]/g, "_");
        const absoluteUrl = `/uploads/${sanitizedEmail}/My_Flipbooks/${interactionModel.folderName}/${interactionModel.flipbookName}/assets/3D_Model/${interactionModel.fileName}`;

        model = {
          modelId: interactionModel.v_id,
          name: interactionModel.displayName || interactionModel.fileName,
          displayName: interactionModel.displayName || null,
          fileName: interactionModel.fileName,
          url: absoluteUrl,
          size: interactionModel.size,
          type: interactionModel.type,
          hotspots: Array.isArray(interactionModel.hotspots) ? interactionModel.hotspots : []
        };
      }
    }

    if (!model) {
      return res.status(404).json({ message: "Model not found" });
    }
    res.json(model);
  } catch (error) {
    console.error("Error fetching model by ID:", error);
    res.status(500).json({ message: "Server error" });
  }
});

export default router;