import fs from "fs";
import path from "path";
import { execFile } from "child_process";
import { convertCadFileToGlb, isCadFormat, CAD_EXTENSIONS } from "./openCascadeConverter.js";
import { convertArchiveToGlb, convertZipToGlb } from "./zipConverter.js";

/**
 * Supported 3D formats for Assimp and OpenCASCADE conversion
 */
export const SUPPORTED_3D_EXTENSIONS = [
  ".glb",
  ".gltf",
  ".obj",
  ".fbx",
  ".stl",
  ".step",
  ".stp",
  ".3ds",
  ".lwo",
  ".low",
  ".iges",
  ".igs"
];

let cachedAssimpPath = null;

/**
 * Get the path to the Assimp executable using only ASSIMP_PATH configured in .env
 */
export const getAssimpPath = () => {
  const envPath = process.env.ASSIMP_PATH;

  if (!envPath) {
    throw new Error("ASSIMP_PATH is not configured in .env");
  }

  if (cachedAssimpPath && fs.existsSync(cachedAssimpPath)) {
    return cachedAssimpPath;
  }

  if (fs.existsSync(envPath)) {
    cachedAssimpPath = envPath;
    return envPath;
  }

  throw new Error(`Assimp executable not found at ASSIMP_PATH: "${envPath}". Please check .env`);
};

/**
 * Supported compressed archive extensions containing 3D models and textures
 */
export const SUPPORTED_ARCHIVE_EXTENSIONS = [
  ".zip",
  ".rar",
  ".7z",
  ".tar",
  ".gz",
  ".tgz",
  ".bz2",
  ".tbz2"
];

/**
 * Checks if a file is a supported compressed archive
 * @param {string} filename 
 * @returns {boolean}
 */
export const isArchiveFormat = (filename) => {
  if (!filename) return false;
  const lower = filename.toLowerCase();
  return SUPPORTED_ARCHIVE_EXTENSIONS.some((ext) => lower.endsWith(ext));
};

/**
 * Checks if a file extension is a supported 3D format or archive folder package
 * @param {string} filename 
 * @returns {boolean}
 */
export const is3DFormat = (filename) => {
  if (!filename) return false;
  const ext = path.extname(filename).toLowerCase();
  return SUPPORTED_3D_EXTENSIONS.includes(ext) || isArchiveFormat(filename);
};

/**
 * Checks if a file is a ZIP or other compressed archive
 * @param {string} filename 
 * @returns {boolean}
 */
export const isZipFormat = (filename) => {
  return isArchiveFormat(filename);
};

/**
 * Checks if a file is already a GLB file
 * @param {string} filename 
 * @returns {boolean}
 */
export const isGlbFormat = (filename) => {
  if (!filename) return false;
  const ext = path.extname(filename).toLowerCase();
  return ext === ".glb";
};

/**
 * Convert input 3D model file (or ZIP folder package) to GLB
 * 
 * @param {string} inputPath - Absolute path to input 3D file or .zip archive
 * @param {string} outputPath - Absolute path to output .glb file
 * @param {Object} [options] - Additional options
 * @returns {Promise<{ success: boolean, outputPath: string, message?: string }>}
 */
export const convertWithAssimp = (inputPath, outputPath, options = {}) => {
  return new Promise(async (resolve, reject) => {
    try {
      if (!fs.existsSync(inputPath)) {
        return reject(new Error(`Input file does not exist: ${inputPath}`));
      }

      // Ensure output directory exists
      const outputDir = path.dirname(outputPath);
      if (!fs.existsSync(outputDir)) {
        fs.mkdirSync(outputDir, { recursive: true });
      }

      // If output is already .glb and input is the same, no conversion needed
      if (inputPath.toLowerCase() === outputPath.toLowerCase()) {
        return resolve({ success: true, outputPath });
      }

      // 0. If the input is a compressed archive containing a model folder / textures (.zip, .rar, .7z, etc.)
      if (isArchiveFormat(inputPath)) {
        console.log(`[Archive Converter] Processing archive with external textures: ${path.basename(inputPath)}`);
        const archiveRes = await convertArchiveToGlb(inputPath, outputPath, options);
        return resolve(archiveRes);
      }

      // 1. Models specified to use OpenCASCADE: STL, STP, STEP, IGS, IGES
      if (isCadFormat(inputPath)) {
        const inputExt = path.extname(inputPath).toLowerCase();
        try {
          console.log(`[OpenCASCADE] Converting ${inputExt.toUpperCase()} file with OpenCASCADE: ${path.basename(inputPath)}...`);
          const cadRes = await convertCadFileToGlb(inputPath, outputPath, options);
          if (fs.existsSync(outputPath) && fs.statSync(outputPath).size > 0) {
            return resolve(cadRes);
          }
          throw new Error("OpenCASCADE completed but output GLB was not created or empty.");
        } catch (cadErr) {
          console.error(`[OpenCASCADE] Conversion failed for ${path.basename(inputPath)}:`, cadErr);
          if (inputExt === ".iges" || inputExt === ".igs") {
            return reject(new Error(`IGES OpenCASCADE conversion error: ${cadErr.message}. For complex IGES models, in-browser occt-import-js can also be used.`));
          }
          return reject(new Error(`OpenCASCADE conversion failed for ${inputExt.toUpperCase()} file: ${cadErr.message}`));
        }
      }

      // 2. All other model formats (.obj, .fbx, .3ds, .lwo, .low, .gltf, etc.): use Assimp
      const inputExt = path.extname(inputPath).toLowerCase();
      console.log(`[Assimp] Converting ${inputExt ? inputExt.toUpperCase() : "3D"} file with Assimp: ${path.basename(inputPath)}...`);
      const assimpBin = getAssimpPath();
      
      // Prioritize embedding textures into GLB binary (glTF 2.0 with -embtex), followed by standard fallbacks
      const flagStrategies = [
        ["export", inputPath, outputPath, "glb2", "-embtex", "-tri"],
        ["export", inputPath, outputPath, "glb2", "-embtex"],
        ["export", inputPath, outputPath, "glb", "-embtex", "-tri"],
        ["export", inputPath, outputPath, "glb", "-embtex"],
        ["export", inputPath, outputPath, "-embtex", "-tri"],
        ["export", inputPath, outputPath, "-embtex"],
        ["export", inputPath, outputPath, "glb2", "-tri"],
        ["export", inputPath, outputPath, "glb2"],
        ["export", inputPath, outputPath, "-tri"],
        ["export", inputPath, outputPath]
      ];

      const runAttempt = (args) => {
        return new Promise((resolveAttempt, rejectAttempt) => {
          console.log(`[Assimp] Executing conversion: "${assimpBin}" ${args.join(" ")}`);
          execFile(
            assimpBin,
            args,
            {
              cwd: path.dirname(inputPath), // Essential for Assimp to find and embed textures
              timeout: options.timeout || 1200000, // 20 minutes timeout for heavy models
              maxBuffer: 100 * 1024 * 1024 // 100MB buffer for large polygon models
            },
            (error, stdout, stderr) => {
              if (stdout && stdout.trim()) {
                console.log(`[Assimp stdout]: ${stdout.trim().slice(-500)}`);
              }
              if (stderr && stderr.trim()) {
                console.warn(`[Assimp stderr]: ${stderr.trim().slice(-500)}`);
              }

              if (fs.existsSync(outputPath) && fs.statSync(outputPath).size > 0) {
                console.log(`[Assimp] Successfully converted to GLB (glTF 2.0): ${outputPath} (${(fs.statSync(outputPath).size / (1024 * 1024)).toFixed(2)} MB)`);
                return resolveAttempt({ success: true, outputPath });
              }

              if (error) {
                return rejectAttempt(new Error(`Assimp conversion failed: ${error.message}${stderr ? `\nStderr: ${stderr}` : ""}`));
              }

              rejectAttempt(new Error(`Assimp completed but output GLB was not created or empty.`));
            }
          );
        });
      };

      // Try strategies sequentially until one creates a valid GLB
      (async () => {
        let lastErr = null;
        for (const args of flagStrategies) {
          try {
            const res = await runAttempt(args);
            return resolve(res);
          } catch (err) {
            lastErr = err;
            console.warn(`[Assimp] Strategy [${args.slice(3).join(" ")}] failed, trying fallback...`);
          }
        }
        reject(lastErr || new Error("Assimp conversion failed on all format attempts."));
      })();
    } catch (err) {
      console.error(`[Assimp Exception]:`, err);
      reject(err);
    }
  });
};

export {
  convertCadFileToGlb,
  isCadFormat,
  CAD_EXTENSIONS
};

export default {
  SUPPORTED_3D_EXTENSIONS,
  CAD_EXTENSIONS,
  getAssimpPath,
  is3DFormat,
  isCadFormat,
  isGlbFormat,
  convertWithAssimp,
  convertCadFileToGlb
};


