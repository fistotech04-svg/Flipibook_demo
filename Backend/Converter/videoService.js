import ffmpeg from 'fluent-ffmpeg';
import ffmpegStatic from 'ffmpeg-static';
import path from 'path';
import fs from 'fs';

// Configure ffmpeg static binary path
if (ffmpegStatic) {
  ffmpeg.setFfmpegPath(ffmpegStatic);
}

/**
 * Maps human-readable UI resolution strings to ffmpeg scale filters
 */
const RESOLUTION_MAP = {
  '4K (3840x2160)': '3840:2160',
  '1080p (1920x1080)': '1920:1080',
  '720p (1280x720)': '1280:720',
  '480p (854x480)': '854:480',
  '360p (640x360)': '640:360',
};

/**
 * Maps human-readable UI frame rate strings to numeric values
 */
const FPS_MAP = {
  '60 fps': 60,
  '30 fps': 30,
  '24 fps': 24,
  '15 fps': 15,
};

/**
 * Maps video codecs
 */
const CODEC_MAP = {
  'H.264 (Recommended)': 'libx264',
  'H.265 (HEVC)': 'libx265',
  'VP9': 'libvpx-vp9',
  'VP8': 'libvpx',
  'MPEG-4': 'mpeg4',
};

/**
 * Maps quality presets to CRF (Constant Rate Factor) values for x264/x265
 */
const CRF_MAP = {
  'High (Better Quality)': 20,
  'Medium (Balanced)': 24,
  'Low (Smaller Size)': 29,
};

/**
 * Process video conversion / compression
 */
export const processVideoConversion = ({
  inputPath,
  outputFormat = 'mp4',
  resolution = 'Original (Keep Same)',
  frameRate = 'Original (Keep Same)',
  videoCodec = 'H.264 (Recommended)',
  quality = 'High (Better Quality)',
}) => {
  return new Promise((resolve, reject) => {
    const ext = outputFormat.toLowerCase().replace('.', '');
    const outputFilename = `converted_${Date.now()}_${Math.random().toString(36).substring(7)}.${ext}`;
    const outputPath = path.join(path.dirname(inputPath), outputFilename);

    let command = ffmpeg(inputPath);

    // Apply Output Format
    command.toFormat(ext);

    // Apply Codec
    const codec = CODEC_MAP[videoCodec];
    if (codec) {
      try {
        command.videoCodec(codec);
      } catch (err) {
        console.warn('Could not set custom codec, using default:', err);
      }
    }

    // Use ultrafast/veryfast preset and multi-threading for maximum compression speed
    const outputOptions = [
      '-preset veryfast',
      '-threads 0',
      '-c:a copy', // Don't re-encode audio if possible, drastically speeds up conversion
    ];

    // Apply Resolution
    const scale = RESOLUTION_MAP[resolution];
    if (scale) {
      outputOptions.push(`-vf scale=${scale}:force_original_aspect_ratio=decrease,pad=${scale}:(ow-iw)/2:(oh-ih)/2`);
    }

    // Apply Quality / CRF (for libx264/libx265)
    const crf = CRF_MAP[quality];
    if (crf !== undefined && (!codec || codec === 'libx264' || codec === 'libx265')) {
      outputOptions.push(`-crf ${crf}`);
    }

    // Faststart for streaming/mp4
    if (ext === 'mp4') {
      outputOptions.push('-movflags +faststart');
    }

    command.outputOptions(outputOptions);

    // Apply FPS
    const fps = FPS_MAP[frameRate];
    if (fps) {
      command.fps(fps);
    }

    command
      .on('end', () => {
        resolve({
          outputPath,
          outputFilename,
          cleanup: () => {
            fs.unlink(inputPath, () => {});
            fs.unlink(outputPath, () => {});
          },
        });
      })
      .on('error', (err) => {
        // Cleanup input file on error
        fs.unlink(inputPath, () => {});
        fs.unlink(outputPath, () => {});
        reject(err);
      })
      .save(outputPath);
  });
};
