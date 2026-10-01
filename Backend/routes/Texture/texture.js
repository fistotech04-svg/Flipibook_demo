import express from "express";
import multer from "multer";
import path from "path";
import fs from "fs";
import { fileURLToPath } from "url";
import { addTexture, getUserTextures, updateTexture, deleteTexture } from "../../controllers/Texture/textureController.js";
import { getCategories, addCategory, deleteCategory, renameCategory, clearTexturesInCategory } from "../../controllers/Texture/textureCategoryController.js";
import { uploadFileToSupabase } from "../../config/supabase.js";


const router = express.Router();
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Configure dynamic storage for textures in temp_uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const tempDir = path.join(__dirname, "../../temp_uploads/textures");
    if (!fs.existsSync(tempDir)) {
      fs.mkdirSync(tempDir, { recursive: true });
    }
    cb(null, tempDir);
  },
  filename: (req, file, cb) => {
    const { materialName } = req.body;
    const sanitizedMaterialName = materialName ? materialName.replace(/[^a-z0-9]/gi, '_').toLowerCase() : 'texture';
    const ext = path.extname(file.originalname);
    const uniqueName = `${sanitizedMaterialName}_${file.fieldname}_${Date.now()}${ext}`;
    cb(null, uniqueName);
  }
});

const upload = multer({ 
  storage,
  limits: { fileSize: 100 * 1024 * 1024 } // 100MB per map for direct upload (if used)
});

// Configure multer for CHUNKED uploads
const chunkStorage = multer.diskStorage({
  destination: (req, file, cb) => {
    const { uploadId } = req.body;
    if (!uploadId) return cb(new Error("uploadId is required"));
    
    const tempDir = path.join(__dirname, "../../temp_uploads/textures", uploadId);
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

const textureUploadFields = [
  { name: 'preview', maxCount: 1 },
  { name: 'base', maxCount: 1 },
  { name: 'metallic', maxCount: 1 },
  { name: 'roughness', maxCount: 1 },
  { name: 'normal', maxCount: 1 },
  { name: 'ao', maxCount: 1 },
  { name: 'displacement', maxCount: 1 },
  { name: 'opacity', maxCount: 1 },
  { name: 'emissive', maxCount: 1 }
];

// @route   POST /api/textures/add
// Keep this for metadata and small/direct uploads if needed, or update to handle paths
router.post("/add", upload.fields(textureUploadFields), addTexture);

// @route   POST /api/textures/upload-chunk
router.post("/upload-chunk", uploadChunk.single("chunk"), async (req, res) => {
  try {
    const { uploadId, chunkIndex, totalChunks, fileName, userEmail, materialName, fieldName } = req.body;

    if (!uploadId || !userEmail || !fileName || !materialName) {
      return res.status(400).json({ message: "Missing required chunk metadata" });
    }

    const curIndex = parseInt(chunkIndex);
    const total = parseInt(totalChunks);

    // If it's the last chunk, start merging inside tempDir
    if (curIndex === total - 1) {
      const tempDir = path.join(__dirname, "../../temp_uploads/textures", uploadId);
      const sanitizedEmail = userEmail.replace(/[@.]/g, "_");
      const sanitizedMaterialName = materialName.replace(/[^a-z0-9]/gi, '_').toLowerCase();

      const ext = path.extname(fileName);
      const uniqueFileName = `${sanitizedMaterialName}_${fieldName}${ext}`;
      const finalPath = path.join(tempDir, uniqueFileName);

      try {
          // Reset file if it exists
          if (fs.existsSync(finalPath)) fs.unlinkSync(finalPath);

          for (let i = 0; i < total; i++) {
              const chunkPath = path.join(tempDir, `chunk_${i}`);
              
              // Wait for chunk to be available on disk (in case of network/OS lag)
              let retry = 0;
              while (!fs.existsSync(chunkPath) && retry < 30) {
                  await new Promise(r => setTimeout(r, 100));
                  retry++;
              }

              if (fs.existsSync(chunkPath)) {
                  const chunkData = fs.readFileSync(chunkPath);
                  fs.appendFileSync(finalPath, chunkData);
                  fs.unlinkSync(chunkPath);
              } else {
                  throw new Error(`Chunk ${i} not found after retries`);
              }
          }
          
          // Upload merged file from tempDir to Supabase Storage
          const destinationPath = `${sanitizedEmail}/Texture/${sanitizedMaterialName}/${uniqueFileName}`;
          const supabaseUrl = await uploadFileToSupabase(finalPath, destinationPath);
          const mapUrl = supabaseUrl || `/uploads/${sanitizedEmail}/Texture/${sanitizedMaterialName}/${uniqueFileName}`;

          // Cleanup temp dir completely
          if (fs.existsSync(tempDir)) fs.rmSync(tempDir, { recursive: true, force: true });

          res.status(200).json({
              message: "Chunk merged successfully",
              url: mapUrl,
              fieldName
          });

      } catch (err) {
          console.error("Merging Error:", err);
          res.status(500).json({ message: "Error during chunk merging" });
      }
    } else {
      res.status(200).json({ message: `Chunk ${curIndex} accepted` });
    }
  } catch (error) {
    console.error("Texture Chunk Upload Error:", error);
    res.status(500).json({ message: "Server error during chunk upload" });
  }
});

// @route   GET /api/textures/get
router.get("/get", getUserTextures);

// @route   PUT /api/textures/update/:id
router.put("/update/:id", updateTexture);

// @route   DELETE /api/textures/delete/:id
router.delete("/delete/:id", deleteTexture);

// --- Category Routes ---
// @route   GET /api/textures/categories/get
router.get("/categories/get", getCategories);

// @route   POST /api/textures/categories/add
router.post("/categories/add", addCategory);

// @route   PUT /api/textures/categories/rename/:id
router.put("/categories/rename/:id", renameCategory);

// @route   POST /api/textures/categories/clear/:id
router.post("/categories/clear/:id", clearTexturesInCategory);

// @route   DELETE /api/textures/categories/delete/:id
router.delete("/categories/delete/:id", deleteCategory);

export default router;
