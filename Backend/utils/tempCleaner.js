import fs from "fs";
import path from "path";
import { supabase, SUPABASE_BUCKET, deleteFileFromSupabase } from "../config/supabase.js";

const ONE_HOUR_MS = 60 * 60 * 1000; // 1 hour (3600000 ms)
const TEN_MINUTES_MS = 10 * 60 * 1000; // 10 minutes

/**
 * Schedule a file or directory for deletion after delay (default: 10 minutes)
 * @param {string} targetPath - Path to local file or directory to delete
 * @param {number} [delayMs=600000] - Delay in milliseconds before deletion
 */
export const scheduleTempCleanup = (targetPath, delayMs = TEN_MINUTES_MS) => {
  if (!targetPath) return;

  setTimeout(() => {
    try {
      if (fs.existsSync(targetPath)) {
        const stats = fs.statSync(targetPath);
        if (stats.isDirectory()) {
          fs.rmSync(targetPath, { recursive: true, force: true });
          console.log(`[Temp Cleaner] Auto-removed temporary directory: ${targetPath}`);
        } else {
          fs.unlinkSync(targetPath);
          console.log(`[Temp Cleaner] Auto-removed temporary file: ${targetPath}`);
        }
      }
    } catch (err) {
      console.warn(`[Temp Cleaner] Could not remove temp path: ${targetPath}`, err.message);
    }
  }, delayMs);
};

/**
 * Schedule deletion of a converted file from Supabase Storage after 1 hour (60 minutes)
 * @param {string} supabaseDestinationPath - Path in Supabase bucket e.g. "sanitized_email/3D_Converter/model.glb"
 * @param {number} [delayMs=3600000] - Delay before deletion (default: 1 hour)
 */
export const scheduleSupabaseCleanup = (supabaseDestinationPath, delayMs = ONE_HOUR_MS) => {
  if (!supabaseDestinationPath) return;

  setTimeout(async () => {
    try {
      console.log(`[Supabase Cleaner] Auto-removing converted file after 1 hour: ${supabaseDestinationPath}`);
      await deleteFileFromSupabase(supabaseDestinationPath);
    } catch (err) {
      console.warn(`[Supabase Cleaner] Error auto-removing ${supabaseDestinationPath}:`, err.message);
    }
  }, delayMs);
};

/**
 * Periodically scan Supabase Storage for all user 3D_Converter folders and remove files older than 1 hour
 * @param {number} [maxAgeMs=3600000] - Max age in ms (default: 1 hour)
 */
export const cleanStaleSupabaseConverterFiles = async (maxAgeMs = ONE_HOUR_MS) => {
  try {
    if (!supabase) return;

    // List top-level folders (user directories)
    const { data: rootItems, error: rootErr } = await supabase.storage
      .from(SUPABASE_BUCKET)
      .list("", { limit: 1000 });

    if (rootErr || !rootItems) return;

    const now = Date.now();
    for (const rootItem of rootItems) {
      // Check for 3D_Converter subfolder
      const userConverterPath = `${rootItem.name}/3D_Converter`;
      const { data: converterFiles, error: filesErr } = await supabase.storage
        .from(SUPABASE_BUCKET)
        .list(userConverterPath, { limit: 1000 });

      if (filesErr || !converterFiles) continue;

      const filesToDelete = [];
      for (const file of converterFiles) {
        if (!file.name || file.name === ".keep") continue;
        const fileAge = now - new Date(file.created_at || file.updated_at || 0).getTime();
        if (fileAge > maxAgeMs) {
          filesToDelete.push(`${userConverterPath}/${file.name}`);
        }
      }

      if (filesToDelete.length > 0) {
        console.log(`[Supabase Cleaner] Purging ${filesToDelete.length} expired converted files (>1 hr) in ${userConverterPath}`);
        await supabase.storage.from(SUPABASE_BUCKET).remove(filesToDelete);
      }
    }
  } catch (err) {
    console.warn("[Supabase Cleaner] Error scanning 3D_Converter folders:", err.message);
  }
};

/**
 * Periodically purge any stale local temp files older than maxAge from a folder
 * @param {string} dirPath - Directory to scan
 * @param {number} [maxAgeMs=600000] - Maximum age before purge (default: 10 minutes)
 */
export const cleanStaleTempFiles = (dirPath, maxAgeMs = TEN_MINUTES_MS) => {
  if (!fs.existsSync(dirPath)) return;

  try {
    const now = Date.now();
    const items = fs.readdirSync(dirPath);

    for (const item of items) {
      const fullPath = path.join(dirPath, item);
      try {
        const stats = fs.statSync(fullPath);
        if (now - stats.mtimeMs > maxAgeMs) {
          if (stats.isDirectory()) {
            fs.rmSync(fullPath, { recursive: true, force: true });
            console.log(`[Temp Cleaner] Purged expired temp folder: ${item}`);
          } else {
            fs.unlinkSync(fullPath);
            console.log(`[Temp Cleaner] Purged expired temp file: ${item}`);
          }
        }
      } catch (e) {}
    }
  } catch (err) {
    console.warn(`[Temp Cleaner] Error scanning temp directory: ${dirPath}`, err.message);
  }
};

/**
 * Start recurring background cleaner (sweeps local temp files and Supabase 3D_Converter files)
 * @param {string} baseTempDir - Root temp uploads directory to monitor
 */
export const startBackgroundTempCleaner = (baseTempDir) => {
  if (baseTempDir) {
    if (!fs.existsSync(baseTempDir)) {
      try {
        fs.mkdirSync(baseTempDir, { recursive: true });
      } catch (e) {}
    }

    // Initial local purge
    cleanStaleTempFiles(baseTempDir);
    const convertedModelsDir = path.join(baseTempDir, "converted_models");
    if (fs.existsSync(convertedModelsDir)) {
      cleanStaleTempFiles(convertedModelsDir);
    }

    // Recurring local temp sweep every 5 minutes
    setInterval(() => {
      cleanStaleTempFiles(baseTempDir);
      if (fs.existsSync(convertedModelsDir)) {
        cleanStaleTempFiles(convertedModelsDir);
      }
    }, 5 * 60 * 1000);
  }

  // Initial Supabase 3D_Converter sweep
  cleanStaleSupabaseConverterFiles();

  // Recurring Supabase 3D_Converter sweep every 15 minutes (removes files older than 1 hour)
  setInterval(() => {
    cleanStaleSupabaseConverterFiles();
  }, 15 * 60 * 1000);
};

export default {
  scheduleTempCleanup,
  scheduleSupabaseCleanup,
  cleanStaleTempFiles,
  cleanStaleSupabaseConverterFiles,
  startBackgroundTempCleaner
};

