import multer from 'multer';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';
import { processVideoConversion } from './videoService.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const TEMP_DIR = path.join(__dirname, 'temp_uploads');
if (!fs.existsSync(TEMP_DIR)) {
  fs.mkdirSync(TEMP_DIR, { recursive: true });
}

// Configure multer storage
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, TEMP_DIR);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = `${Date.now()}_${Math.random().toString(36).substring(7)}`;
    const ext = path.extname(file.originalname) || '.mp4';
    cb(null, `upload_${uniqueSuffix}${ext}`);
  },
});

export const uploadVideoMiddleware = multer({
  storage,
  limits: {
    fileSize: 150 * 1024 * 1024, // 150 MB safety limit
  },
}).single('video');

/**
 * Handle Convert Video Request
 * POST /api/converter/convert-video
 */
export const convertVideoController = async (req, res) => {
  if (!req.file) {
    return res.status(400).json({ error: 'No video file provided' });
  }

  const inputPath = req.file.path;
  const originalName = req.file.originalname || 'video';
  const baseName = path.parse(originalName).name;

  const {
    format = 'mp4',
    resolution = 'Original (Keep Same)',
    frameRate = 'Original (Keep Same)',
    videoCodec = 'H.264 (Recommended)',
    quality = 'High (Better Quality)',
  } = req.body;

  try {
    const { outputPath, outputFilename, cleanup } = await processVideoConversion({
      inputPath,
      outputFormat: format,
      resolution,
      frameRate,
      videoCodec,
      quality,
    });

    const downloadFileName = `${baseName}_converted.${format.toLowerCase()}`;

    // Send file for download and trigger cleanup after stream completes
    res.download(outputPath, downloadFileName, (err) => {
      if (err) {
        console.error('Error sending converted video:', err);
      }
      // Clean up temporary files on disk
      cleanup();
    });
  } catch (error) {
    console.error('Video conversion error:', error);
    // Ensure input file is removed if it still exists
    fs.unlink(inputPath, () => {});
    return res.status(500).json({
      error: 'Failed to convert video. Please check file format and settings.',
      details: error.message,
    });
  }
};
