import multer from 'multer';
import sharp from 'sharp';
import path from 'path';

// Use memory storage for images so processing is ultra-fast without disk writes
const storage = multer.memoryStorage();

export const uploadImageMiddleware = multer({
  storage,
  limits: {
    fileSize: 50 * 1024 * 1024, // 50 MB max image size
  },
}).single('file');

/**
 * Handle Convert Image Request
 * POST /api/converter/convert-image
 */
export const convertImageController = async (req, res) => {
  try {
    if (!req.file || !req.file.buffer) {
      return res.status(400).json({ error: 'No image file uploaded.' });
    }

    const {
      format = 'webp',
      quality = 'High (85% - Recommended)',
      resolution = 'Original (100% Size)',
    } = req.body;

    const targetFormat = (format || 'webp').toLowerCase().trim();
    const originalName = req.file.originalname || 'image';
    const baseName = path.parse(originalName).name;

    // Parse quality setting to an integer (1 - 100)
    let q = 85;
    if (typeof quality === 'string') {
      if (quality.includes('Original') || quality.includes('100%')) {
        q = 95; // Capped at 95 to prevent bloat while maintaining maximum clarity
      } else if (quality.includes('High') || quality.includes('85%')) {
        q = 85;
      } else if (quality.includes('Medium') || quality.includes('70%')) {
        q = 70;
      } else if (quality.includes('Low') || quality.includes('50%')) {
        q = 50;
      } else {
        const parsed = parseInt(quality, 10);
        if (!isNaN(parsed) && parsed > 0 && parsed <= 100) {
          q = parsed;
        }
      }
    } else if (typeof quality === 'number') {
      q = Math.min(Math.max(quality, 10), 100);
    }

    // Initialize sharp pipeline with input buffer
    let pipeline = sharp(req.file.buffer);

    // Get metadata to handle resolution scaling if requested
    const metadata = await pipeline.metadata();
    let targetWidth = metadata.width;
    let targetHeight = metadata.height;

    if (resolution && typeof resolution === 'string') {
      if (resolution.includes('50%') && targetWidth && targetHeight) {
        pipeline = pipeline.resize(Math.round(targetWidth * 0.5), Math.round(targetHeight * 0.5));
      } else if (resolution.includes('75%') && targetWidth && targetHeight) {
        pipeline = pipeline.resize(Math.round(targetWidth * 0.75), Math.round(targetHeight * 0.75));
      } else if ((resolution.includes('Web Fit') || resolution.includes('Optimized')) && targetWidth && targetHeight) {
        if (targetWidth > 1920 || targetHeight > 1080) {
          pipeline = pipeline.resize({ width: 1920, height: 1080, fit: 'inside', withoutEnlargement: true });
        }
      }
    }

    // Apply format-specific optimizations
    let mimeType = 'image/jpeg';
    let outputExt = 'jpg';

    switch (targetFormat) {
      case 'png':
        mimeType = 'image/png';
        outputExt = 'png';
        // Palette quantization gives real file compression just like TinyPNG
        pipeline = pipeline.png({
          quality: q,
          palette: true,
          compressionLevel: 9,
          adaptiveFiltering: true,
        });
        break;

      case 'webp':
        mimeType = 'image/webp';
        outputExt = 'webp';
        pipeline = pipeline.webp({
          quality: q,
          effort: 5,
        });
        break;

      case 'avif':
        mimeType = 'image/avif';
        outputExt = 'avif';
        pipeline = pipeline.avif({
          quality: q,
          effort: 4,
        });
        break;

      case 'tiff':
      case 'tif':
        mimeType = 'image/tiff';
        outputExt = 'tiff';
        // Flatten with white background if transparency exists
        pipeline = pipeline
          .flatten({ background: '#ffffff' })
          .tiff({
            quality: q,
            compression: 'lzw',
          });
        break;

      case 'jpg':
      case 'jpeg':
      default:
        mimeType = 'image/jpeg';
        outputExt = 'jpg';
        // Flatten with clean white background so transparent PNGs don't get black borders
        pipeline = pipeline
          .flatten({ background: '#ffffff' })
          .jpeg({
            quality: q,
            mozjpeg: true, // Modern high-efficiency mozjpeg encoder
          });
        break;
    }

    // Generate output buffer
    const outputBuffer = await pipeline.toBuffer();
    const outputFilename = `${baseName}.${outputExt}`;

    // Send converted image buffer directly with headers
    res.set({
      'Content-Type': mimeType,
      'Content-Length': outputBuffer.length,
      'Content-Disposition': `attachment; filename="${outputFilename}"`,
      'X-Converted-Size': outputBuffer.length,
    });

    return res.send(outputBuffer);
  } catch (error) {
    console.error('[Image Conversion Error]:', error);
    return res.status(500).json({
      error: 'Failed to convert image.',
      details: error.message,
    });
  }
};
