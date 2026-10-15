import multer from 'multer';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';
import {
  convertCadFileToGlb,
  convertCadFileToObj,
  isCadFormat
} from '../utils/openCascadeConverter.js';
import { convertWithAssimp } from '../utils/assimpConverter.js';
import { scheduleTempCleanup } from '../utils/tempCleaner.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Use exact same temp_uploads folder inside Backend/Converter
const TEMP_3D_DIR = path.join(__dirname, 'temp_uploads');
if (!fs.existsSync(TEMP_3D_DIR)) {
  fs.mkdirSync(TEMP_3D_DIR, { recursive: true });
}

// Multer disk storage for 3D files
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, TEMP_3D_DIR);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = `${Date.now()}_${Math.random().toString(36).substring(7)}`;
    const ext = path.extname(file.originalname) || '.glb';
    cb(null, `raw_${uniqueSuffix}${ext}`);
  },
});

export const uploadThreeDMiddleware = multer({
  storage,
  limits: {
    fileSize: 500 * 1024 * 1024, // 500 MB limit
  },
}).single('file');

/**
 * Handle 3D Model Preview Request
 * Converts any CAD/3D model to a temporary GLB so the frontend Three.js viewer can display it
 * POST /api/converter/preview-3d
 */
export const previewThreeDController = async (req, res) => {
  if (!req.file) {
    return res.status(400).json({ error: 'No 3D file provided' });
  }

  const inputPath = req.file.path;
  const originalName = req.file.originalname || 'model.glb';
  const originalExt = path.extname(originalName).toLowerCase();
  const baseName = path.basename(originalName, originalExt).replace(/[^a-zA-Z0-9_-]/g, '_');

  const uniqueId = `${Date.now()}_${Math.random().toString(36).substring(7)}`;
  const previewGlbName = `preview_${baseName}_${uniqueId}.glb`;
  const previewGlbPath = path.join(TEMP_3D_DIR, previewGlbName);

  try {
    if (originalExt === '.glb') {
      // Already GLB: Copy directly to preview file
      fs.copyFileSync(inputPath, previewGlbPath);
    } else if (isCadFormat(originalName)) {
      // CAD models (STEP, STP, STL, IGES, IGS) via OpenCASCADE
      console.log(`[3D Converter Preview] Converting CAD with OpenCASCADE: ${originalName} -> ${previewGlbName}`);
      await convertCadFileToGlb(inputPath, previewGlbPath);
    } else {
      // Mesh formats (OBJ, FBX, 3DS, etc.) via Assimp
      console.log(`[3D Converter Preview] Converting mesh with Assimp: ${originalName} -> ${previewGlbName}`);
      await convertWithAssimp(inputPath, previewGlbPath);
    }

    if (!fs.existsSync(previewGlbPath) || fs.statSync(previewGlbPath).size === 0) {
      throw new Error('Failed to generate preview GLB: output file is empty.');
    }

    // Schedule automatic cleanup after 15 minutes
    scheduleTempCleanup(previewGlbPath, 15 * 60 * 1000);
    scheduleTempCleanup(inputPath, 15 * 60 * 1000);

    const stats = fs.statSync(previewGlbPath);
    const sizeInMB = (stats.size / (1024 * 1024)).toFixed(2);

    return res.status(200).json({
      success: true,
      previewUrl: `/api/converter/preview-file/${previewGlbName}`,
      fileName: previewGlbName,
      sizeInMB,
      originalName,
      originalExt
    });
  } catch (err) {
    console.error('[3D Converter Preview Error]:', err);
    try { if (fs.existsSync(inputPath)) fs.unlinkSync(inputPath); } catch (_) {}
    try { if (fs.existsSync(previewGlbPath)) fs.unlinkSync(previewGlbPath); } catch (_) {}
    return res.status(500).json({ error: `3D preview conversion failed: ${err.message}` });
  }
};

/**
 * Handle Convert 3D Model Request
 * Converts to either GLB or OBJ and streams the converted file back to the client
 * POST /api/converter/convert-3d
 */
export const convertThreeDController = async (req, res) => {
  if (!req.file) {
    return res.status(400).json({ error: 'No 3D file provided' });
  }

  const inputPath = req.file.path;
  const originalName = req.file.originalname || 'model';
  const originalExt = path.extname(originalName).toLowerCase();
  const baseName = path.basename(originalName, originalExt).replace(/[^a-zA-Z0-9_-]/g, '_');

  const targetFormat = (req.body.format || 'GLB').toUpperCase().trim();
  const targetExt = targetFormat === 'OBJ' ? '.obj' : '.glb';

  const uniqueId = `${Date.now()}_${Math.random().toString(36).substring(7)}`;
  const outputFileName = `${baseName}_converted_${uniqueId}${targetExt}`;
  const outputPath = path.join(TEMP_3D_DIR, outputFileName);

  try {
    if (targetFormat === 'OBJ') {
      // TARGET: OBJ
      if (originalExt === '.obj') {
        fs.copyFileSync(inputPath, outputPath);
      } else if (originalExt === '.stl') {
        // Fast direct STL -> OBJ via native Assimp (completes in ~1 second even for 200MB)
        console.log(`[3D Converter] Fast direct STL to OBJ with Assimp: ${originalName}`);
        await convertWithAssimp(inputPath, outputPath);
      } else if (isCadFormat(originalName)) {
        // OpenCASCADE direct CAD-to-OBJ for STEP/STP/IGES
        console.log(`[3D Converter] Converting CAD to OBJ with OpenCASCADE: ${originalName}`);
        await convertCadFileToObj(inputPath, outputPath);
      } else {
        // Other mesh formats (FBX, 3DS, DAE, etc.) via Assimp directly to OBJ
        console.log(`[3D Converter] Converting mesh to OBJ with Assimp: ${originalName}`);
        await convertWithAssimp(inputPath, outputPath);
      }
    } else {
      // TARGET: GLB
      if (originalExt === '.glb') {
        fs.copyFileSync(inputPath, outputPath);
      } else if (originalExt === '.stl') {
        // Fast direct STL -> GLB via native C++ Assimp
        console.log(`[3D Converter] Fast direct STL to GLB with Assimp: ${originalName}`);
        await convertWithAssimp(inputPath, outputPath);
      } else if (isCadFormat(originalName)) {
        console.log(`[3D Converter] Converting CAD to GLB with OpenCASCADE: ${originalName}`);
        await convertCadFileToGlb(inputPath, outputPath);
      } else {
        console.log(`[3D Converter] Converting mesh to GLB with Assimp: ${originalName}`);
        await convertWithAssimp(inputPath, outputPath);
      }
    }

    if (!fs.existsSync(outputPath) || fs.statSync(outputPath).size === 0) {
      throw new Error(`Output file ${targetExt} was not generated or is empty.`);
    }

    // Set download headers
    const contentType = targetFormat === 'OBJ' ? 'text/plain' : 'model/gltf-binary';
    res.setHeader('Content-Type', contentType);
    res.setHeader('Content-Disposition', `attachment; filename="${baseName}${targetExt}"`);

    const fileStream = fs.createReadStream(outputPath);
    fileStream.pipe(res);

    fileStream.on('close', () => {
      scheduleTempCleanup(outputPath, 5 * 60 * 1000);
      scheduleTempCleanup(inputPath, 5 * 60 * 1000);
    });

    fileStream.on('error', (streamErr) => {
      console.error('[3D Converter Stream Error]:', streamErr);
      try { if (fs.existsSync(outputPath)) fs.unlinkSync(outputPath); } catch (_) {}
      try { if (fs.existsSync(inputPath)) fs.unlinkSync(inputPath); } catch (_) {}
    });

  } catch (err) {
    console.error('[3D Converter Conversion Error]:', err);
    try { if (fs.existsSync(outputPath)) fs.unlinkSync(outputPath); } catch (_) {}
    try { if (fs.existsSync(inputPath)) fs.unlinkSync(inputPath); } catch (_) {}
    return res.status(500).json({ error: `Conversion failed: ${err.message}` });
  }
};

/**
 * Serve temporary preview file
 * GET /api/converter/preview-file/:filename
 */
export const servePreviewFileController = (req, res) => {
  const { filename } = req.params;
  const safeFilename = path.basename(filename);
  const filePath = path.join(TEMP_3D_DIR, safeFilename);

  if (!fs.existsSync(filePath)) {
    return res.status(404).json({ error: 'Preview file not found or expired' });
  }

  res.setHeader('Content-Type', 'model/gltf-binary');
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Cache-Control', 'public, max-age=3600');
  return res.sendFile(filePath);
};
