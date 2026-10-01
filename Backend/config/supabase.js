import { createClient } from "@supabase/supabase-js";
import fs from "fs";
import path from "path";
import dotenv from "dotenv";

dotenv.config();

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SECRET_KEY || process.env.SUPABASE_KEY || process.env.SUPABASE_PUBLISHABLE_KEY;
export const SUPABASE_BUCKET = process.env.SUPABASE_BUCKET || "uploads";

if (!supabaseUrl || !supabaseKey) {
  console.warn("[Supabase] SUPABASE_URL or keys missing in environment variables.");
}

const WebSocketTransport = typeof WebSocket !== "undefined" 
  ? WebSocket 
  : (globalThis.WebSocket || class DummyWebSocket {
      constructor() {
        throw new Error("Realtime WebSocket is not supported in Node.js < 22 without --experimental-websocket or a ws polyfill.");
      }
    });

export const supabase = createClient(
  supabaseUrl || "https://placeholder.supabase.co",
  supabaseKey || "placeholder",
  {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
    },
    realtime: {
      transport: WebSocketTransport,
    },
  }
);
export const SUPABASE_URL = supabaseUrl || "";

/**
 * Rewrite all /uploads/... and relative ./assets/... references in HTML content to Supabase CDN public URLs.
 * So the browser loads assets directly from Supabase instead of going through the backend proxy.
 */
export const rewriteUploadsToSupabase = (html, baseUrlPrefix = "") => {
  if (!html || !supabaseUrl || typeof html !== 'string') return html;

  // If already a full Supabase URL, clean up any double prefixes and return
  if (html.includes('/storage/v1/object/public/')) {
    if (html.indexOf('/storage/v1/object/public/') !== html.lastIndexOf('/storage/v1/object/public/')) {
      const idx = html.lastIndexOf('/storage/v1/object/public/');
      const pathPart = html.substring(idx + '/storage/v1/object/public/'.length);
      const domain = html.split('/storage/v1/object/')[0];
      return `${domain}/storage/v1/object/public/${pathPart.startsWith('uploads/') ? pathPart : 'uploads/' + pathPart}`;
    }
    return html;
  }

  const cdnBase = `${supabaseUrl}/storage/v1/object/public/${SUPABASE_BUCKET}/`;

  // Split on data: URI boundaries to NEVER corrupt base64 content (e.g. data:image/jpeg;base64,...).
  // Even-indexed segments are normal HTML; odd-indexed are data: URIs — leave those untouched.
  const DATA_URI_RE = /(data:[^;]+;base64,[A-Za-z0-9+/=\s]+)/g;
  const parts = html.split(DATA_URI_RE);

  for (let i = 0; i < parts.length; i++) {
    if (i % 2 !== 0) continue; // skip data: URI segments

    let seg = parts[i];
    seg = seg
      .replace(/(?<!\/storage\/v1\/object\/public\/uploads)(?<!\/storage\/v1\/object\/public)(['"\s(^])(\/uploads\/)/g, (match, prefix, _) => `${prefix}${cdnBase}`)
      .replace(/(href|src|url)=([""]?)(\/uploads\/)/g, (match, attr, quote, _) => `${attr}=${quote}${cdnBase}`);

    if (baseUrlPrefix) {
      const cleanPrefix = baseUrlPrefix.replace(/\\/g, "/").replace(/^\/+/, "").replace(/\/+$/, "");
      seg = seg
        .replace(/(href|src|url)=([""]?)(\.\/assets\/|assets\/)/g, (match, attr, quote, _) => `${attr}=${quote}${cdnBase}${cleanPrefix}/assets/`)
        .replace(/(['"\s(])(\.\/assets\/|assets\/)/g, (match, prefix, _) => `${prefix}${cdnBase}${cleanPrefix}/assets/`)
        .replace(/(href|src|url)=([""]?)(\.\/customized_assets\/|customized_assets\/)/g, (match, attr, quote, _) => `${attr}=${quote}${cdnBase}${cleanPrefix}/customized_assets/`)
        .replace(/(['"\s(])(\.\/customized_assets\/|customized_assets\/)/g, (match, prefix, _) => `${prefix}${cdnBase}${cleanPrefix}/customized_assets/`);
    }

    parts[i] = seg;
  }

  return parts.join('');
};



const mimeTypes = {
  ".glb": "model/gltf-binary",
  ".gltf": "model/gltf+json",
  ".obj": "text/plain",
  ".stl": "model/stl",
  ".png": "image/png",
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
  ".webp": "image/webp",
  ".json": "application/json",
  ".pdf": "application/pdf",
  ".hdr": "image/vnd.radiance",
  ".mp3": "audio/mpeg",
  ".wav": "audio/wav",
  ".ogg": "audio/ogg",
  ".m4a": "audio/mp4",
  ".aac": "audio/aac",
  ".mp4": "video/mp4",
  ".webm": "video/webm"
};

/**
 * Upload a local file on disk to Supabase Storage.
 * Returns public URL on success, or null on failure.
 */
export const uploadFileToSupabase = async (localFilePath, destinationPath) => {
  try {
    if (!supabaseUrl || !supabaseKey) {
      console.warn("[Supabase] Credentials not configured.");
      return null;
    }

    if (!fs.existsSync(localFilePath)) {
      console.error(`[Supabase] File does not exist on disk: ${localFilePath}`);
      return null;
    }

    const fileData = fs.readFileSync(localFilePath);
    const ext = path.extname(destinationPath).toLowerCase();
    let contentType = mimeTypes[ext] || "application/octet-stream";
    if (destinationPath.includes('/assets/audio/') && (ext === '.webm' || ext === '.weba')) {
      contentType = 'audio/webm';
    }

    const cleanDestination = destinationPath.replace(/\\/g, "/").replace(/^\/+/, "");

    const { data, error } = await supabase.storage
      .from(SUPABASE_BUCKET)
      .upload(cleanDestination, fileData, {
        contentType,
        upsert: true
      });

    if (error) {
      console.error("[Supabase Upload Error]:", error.message || error);
      return null;
    }

    const { data: publicUrlData } = supabase.storage
      .from(SUPABASE_BUCKET)
      .getPublicUrl(cleanDestination);

    console.log(`[Supabase] Uploaded successfully: ${publicUrlData.publicUrl}`);
    return publicUrlData.publicUrl;
  } catch (err) {
    console.error("[Supabase] Failed to upload file:", err);
    return null;
  }
};

/**
 * Upload a binary Buffer to Supabase Storage.
 * Returns public URL on success, or null on failure.
 */
export const uploadBufferToSupabase = async (buffer, destinationPath, contentType = "application/octet-stream") => {
  try {
    if (!supabaseUrl || !supabaseKey) return null;

    const cleanDestination = destinationPath.replace(/\\/g, "/").replace(/^\/+/, "");

    const { data, error } = await supabase.storage
      .from(SUPABASE_BUCKET)
      .upload(cleanDestination, buffer, {
        contentType,
        upsert: true
      });

    if (error) {
      console.error("[Supabase Buffer Upload Error]:", error.message || error);
      return null;
    }

    const { data: publicUrlData } = supabase.storage
      .from(SUPABASE_BUCKET)
      .getPublicUrl(cleanDestination);

    return publicUrlData.publicUrl;
  } catch (err) {
    console.error("[Supabase] Failed to upload buffer:", err);
    return null;
  }
};

/**
 * Delete a file from Supabase Storage bucket.
 */
export const deleteFileFromSupabase = async (destinationPath) => {
  try {
    if (!supabaseUrl || !supabaseKey || !destinationPath) return;
    if (typeof destinationPath === 'string' && destinationPath.startsWith('data:')) return;

    let key = destinationPath;
    if (key.includes(`/storage/v1/object/public/${SUPABASE_BUCKET}/`)) {
      key = key.split(`/storage/v1/object/public/${SUPABASE_BUCKET}/`)[1];
    } else if (key.includes("/uploads/")) {
      key = key.substring(key.indexOf("/uploads/") + "/uploads/".length);
    } else if (key.startsWith("uploads/")) {
      key = key.substring("uploads/".length);
    }

    let cleanDestination = key.replace(/\\/g, "/").replace(/^\/+/, "");
    if (cleanDestination.startsWith("uploads/")) {
      cleanDestination = cleanDestination.substring("uploads/".length);
    }

    let decodedDestination = cleanDestination;
    try {
      decodedDestination = decodeURIComponent(cleanDestination);
    } catch(e) {}

    const keysToRemove = [...new Set([cleanDestination, decodedDestination])].filter(Boolean);

    const { data, error } = await supabase.storage
      .from(SUPABASE_BUCKET)
      .remove(keysToRemove);

    if (error) {
      console.warn("[Supabase Delete Warning]:", error.message || error);
    } else {
      console.log(`[Supabase] Successfully deleted object(s) from bucket "${SUPABASE_BUCKET}":`, keysToRemove);
    }
  } catch (err) {
    console.warn("[Supabase] Delete operation failed:", err);
  }
};


/**
 * Recursively list all files under a folder prefix in Supabase Storage and remove them.
 */
export const deleteFolderFromSupabase = async (folderPrefix) => {
  try {
    if (!supabaseUrl || !supabaseKey || !folderPrefix) return;

    let prefix = folderPrefix;
    if (prefix.includes(`/storage/v1/object/public/${SUPABASE_BUCKET}/`)) {
      prefix = prefix.split(`/storage/v1/object/public/${SUPABASE_BUCKET}/`)[1];
    } else if (prefix.includes("/uploads/")) {
      prefix = prefix.substring(prefix.indexOf("/uploads/") + "/uploads/".length);
    } else if (prefix.startsWith("uploads/")) {
      prefix = prefix.substring("uploads/".length);
    }

    let cleanPrefix = prefix.replace(/\\/g, "/").replace(/^\/+/, "").replace(/\/+$/, "");
    let decodedPrefix = cleanPrefix;
    try {
      decodedPrefix = decodeURIComponent(cleanPrefix);
    } catch(e) {}

    const prefixesToList = [...new Set([cleanPrefix, decodedPrefix])].filter(Boolean);

    const listAllFiles = async (dirPath) => {
      let files = [];
      const { data, error } = await supabase.storage
        .from(SUPABASE_BUCKET)
        .list(dirPath, { limit: 1000 });

      if (error || !data) return files;

      for (const item of data) {
        const itemPath = `${dirPath}/${item.name}`;
        if (!item.id && (!item.metadata || Object.keys(item.metadata).length === 0)) {
          const subFiles = await listAllFiles(itemPath);
          files = files.concat(subFiles);
        } else {
          files.push(itemPath);
        }
      }
      return files;
    };

    let allFileKeys = [];
    for (const p of prefixesToList) {
      const keys = await listAllFiles(p);
      allFileKeys = allFileKeys.concat(keys);
    }

    allFileKeys = [...new Set(allFileKeys)];

    if (allFileKeys.length > 0) {
      const { data, error: removeError } = await supabase.storage
        .from(SUPABASE_BUCKET)
        .remove(allFileKeys);

      if (removeError) {
        console.warn("[Supabase Folder Delete Warning]:", removeError.message || removeError);
      } else {
        console.log(`[Supabase] Successfully deleted ${allFileKeys.length} files from folder prefix "${cleanPrefix}":`, allFileKeys);
      }
    } else {
      console.log(`[Supabase] No files found under folder prefix "${cleanPrefix}" to delete.`);
    }
  } catch (err) {
    console.warn("[Supabase] Delete folder operation failed:", err);
  }
};



/**
 * Ensure user folders exist in Supabase Storage by creating placeholder files.
 */
export const ensureUserFoldersInSupabase = async (sanitizedEmail) => {
  try {
    if (!supabaseUrl || !supabaseKey || !sanitizedEmail) return;

    const foldersToCreate = [
      "My_Flipbooks",
      "My_Flipbooks/My_Flipbooks",
      "Images",
      "Videos",
      "gifs",
      "3D_Modals",
      "3D_Models",
      "3D_Screenshot",
      "Texture",
      "Profile",
      "Company_logo"
    ];

    const tasks = foldersToCreate.map(folder => {
      const keepFilePath = `${sanitizedEmail}/${folder}/.keep`;
      return uploadBufferToSupabase(Buffer.from(""), keepFilePath, "text/plain");
    });

    await Promise.allSettled(tasks);
    console.log(`[Supabase] Created user folder structure for: ${sanitizedEmail}`);
  } catch (err) {
    console.warn("[Supabase] Could not create user folders in Supabase:", err);
  }
};

/**
 * Ensure flipbook subfolders (assets/Image, assets/gif, assets/video, assets/3D_Model, assets/audio, assets/download, and customized_assets/Logo, customized_assets/Watermark, customized_assets/Image) exist in Supabase Storage.
 */
export const ensureFlipbookFoldersInSupabase = async (sanitizedEmail, physicalFolderName, flipbookName) => {
  try {
    if (!supabaseUrl || !supabaseKey || !sanitizedEmail || !flipbookName) return;

    const folder = physicalFolderName || "My_Flipbooks";
    const subfolders = ["Image", "gif", "video", "3D_Model", "audio", "download"];
    const customizedSubfolders = ["Logo", "Watermark", "Video", "Image", "Gallery_Image", "Audio"];

    const keepPaths = [
      `${sanitizedEmail}/My_Flipbooks/${folder}/.keep`,
      `${sanitizedEmail}/My_Flipbooks/${folder}/${flipbookName}/.keep`,
      ...subfolders.map(sub => `${sanitizedEmail}/My_Flipbooks/${folder}/${flipbookName}/assets/${sub}/.keep`),
      ...customizedSubfolders.map(sub => `${sanitizedEmail}/My_Flipbooks/${folder}/${flipbookName}/customized_assets/${sub}/.keep`)
    ];

    const tasks = keepPaths.map(keepPath =>
      uploadBufferToSupabase(Buffer.from(""), keepPath, "text/plain")
    );

    await Promise.allSettled(tasks);
    console.log(`[Supabase] Auto-created flipbook subfolders (assets & customized_assets) for: ${flipbookName}`);
  } catch (err) {
    console.warn("[Supabase] Could not create flipbook subfolders in Supabase:", err);
  }
};

/**
 * Rename/move all objects under an old prefix to a new prefix in Supabase Storage.
 */
export const renamePathInSupabase = async (oldPrefix, newPrefix) => {
  try {
    if (!supabaseUrl || !supabaseKey || !oldPrefix || !newPrefix) return;

    let cleanOld = oldPrefix.replace(/\\/g, "/").replace(/^\/+/, "").replace(/\/+$/, "");
    let cleanNew = newPrefix.replace(/\\/g, "/").replace(/^\/+/, "").replace(/\/+$/, "");

    if (cleanOld.startsWith("uploads/")) cleanOld = cleanOld.substring("uploads/".length);
    if (cleanNew.startsWith("uploads/")) cleanNew = cleanNew.substring("uploads/".length);

    if (cleanOld === cleanNew) return;

    const listAllFiles = async (dirPath) => {
      let files = [];
      const { data, error } = await supabase.storage
        .from(SUPABASE_BUCKET)
        .list(dirPath, { limit: 1000 });

      if (error || !data) return files;

      for (const item of data) {
        const itemPath = `${dirPath}/${item.name}`;
        if (!item.id && (!item.metadata || Object.keys(item.metadata).length === 0)) {
          const subFiles = await listAllFiles(itemPath);
          files = files.concat(subFiles);
        } else {
          files.push(itemPath);
        }
      }
      return files;
    };

    let decodedOld = cleanOld;
    try { decodedOld = decodeURIComponent(cleanOld); } catch(e) {}

    const prefixesToList = [...new Set([cleanOld, decodedOld])].filter(Boolean);

    let allOldKeys = [];
    for (const p of prefixesToList) {
      const keys = await listAllFiles(p);
      allOldKeys = allOldKeys.concat(keys);
    }
    allOldKeys = [...new Set(allOldKeys)];

    if (allOldKeys.length > 0) {
      for (const oldKey of allOldKeys) {
        let relativePath = oldKey;
        if (oldKey.startsWith(cleanOld)) {
          relativePath = oldKey.substring(cleanOld.length);
        } else if (oldKey.startsWith(decodedOld)) {
          relativePath = oldKey.substring(decodedOld.length);
        }
        const newKey = `${cleanNew}${relativePath}`;

        const { error: moveError } = await supabase.storage
          .from(SUPABASE_BUCKET)
          .move(oldKey, newKey);

        if (moveError) {
          console.warn(`[Supabase] Move error for ${oldKey} -> ${newKey}:`, moveError.message || moveError);
          const { error: copyError } = await supabase.storage
            .from(SUPABASE_BUCKET)
            .copy(oldKey, newKey);

          if (!copyError || copyError.message?.includes("already exists") || copyError.message?.includes("Duplicate")) {
            await supabase.storage.from(SUPABASE_BUCKET).remove([oldKey]);
          }
        }
      }
      console.log(`[Supabase] Moved/processed ${allOldKeys.length} objects from "${cleanOld}" to "${cleanNew}"`);
    }

    // Always purge old folder completely from Supabase to ensure no old files/folders remain
    await deleteFolderFromSupabase(cleanOld);
    if (decodedOld !== cleanOld) {
      await deleteFolderFromSupabase(decodedOld);
    }
  } catch (err) {
    console.warn("[Supabase] Rename operation failed:", err);
  }
};

/**
 * Copy all objects under an old prefix to a new prefix in Supabase Storage.
 */
export const copyPathInSupabase = async (oldPrefix, newPrefix) => {
  try {
    if (!supabaseUrl || !supabaseKey || !oldPrefix || !newPrefix) return;

    let cleanOld = oldPrefix.replace(/\\/g, "/").replace(/^\/+/, "").replace(/\/+$/, "");
    let cleanNew = newPrefix.replace(/\\/g, "/").replace(/^\/+/, "").replace(/\/+$/, "");

    if (cleanOld.startsWith("uploads/")) cleanOld = cleanOld.substring("uploads/".length);
    if (cleanNew.startsWith("uploads/")) cleanNew = cleanNew.substring("uploads/".length);

    const listAllFiles = async (dirPath) => {
      let files = [];
      const { data, error } = await supabase.storage
        .from(SUPABASE_BUCKET)
        .list(dirPath, { limit: 1000 });

      if (error || !data) return files;

      for (const item of data) {
        const itemPath = `${dirPath}/${item.name}`;
        if (!item.id && (!item.metadata || Object.keys(item.metadata).length === 0)) {
          const subFiles = await listAllFiles(itemPath);
          files = files.concat(subFiles);
        } else {
          files.push(itemPath);
        }
      }
      return files;
    };

    const allOldKeys = await listAllFiles(cleanOld);

    if (allOldKeys.length > 0) {
      for (const oldKey of allOldKeys) {
        const relativePath = oldKey.substring(cleanOld.length);
        const newKey = `${cleanNew}${relativePath}`;

        const { error: copyError } = await supabase.storage
          .from(SUPABASE_BUCKET)
          .copy(oldKey, newKey);

        if (copyError) {
          console.warn(`[Supabase] Copy error for ${oldKey} -> ${newKey}:`, copyError.message || copyError);
        }
      }
      console.log(`[Supabase] Copied ${allOldKeys.length} objects from "${cleanOld}" to "${cleanNew}"`);
    } else {
      const keepPath = `${cleanNew}/.keep`;
      await uploadBufferToSupabase(Buffer.from(""), keepPath, "text/plain");
    }
  } catch (err) {
    console.warn("[Supabase] Copy operation failed:", err);
  }
};

/**
 * Recursively upload a local directory to Supabase Storage.
 */
export const uploadFolderToSupabase = async (localFolderPath, supabaseFolderPrefix) => {
  try {
    if (!supabaseUrl || !supabaseKey || !localFolderPath || !supabaseFolderPrefix) return;
    if (!fs.existsSync(localFolderPath)) return;

    let cleanPrefix = supabaseFolderPrefix.replace(/\\/g, "/").replace(/^\/+/, "").replace(/\/+$/, "");
    if (cleanPrefix.startsWith("uploads/")) {
      cleanPrefix = cleanPrefix.substring("uploads/".length);
    }

    const uploadDirRecursive = async (currentLocalDir, currentSupabaseDir) => {
      const entries = fs.readdirSync(currentLocalDir, { withFileTypes: true });
      for (const entry of entries) {
        const localPath = path.join(currentLocalDir, entry.name);
        const supabasePath = `${currentSupabaseDir}/${entry.name}`;
        if (entry.isDirectory()) {
          await uploadDirRecursive(localPath, supabasePath);
        } else if (entry.isFile()) {
          await uploadFileToSupabase(localPath, supabasePath);
        }
      }
    };

    await uploadDirRecursive(localFolderPath, cleanPrefix);
    console.log(`[Supabase] Uploaded local directory to Supabase Storage: ${cleanPrefix}`);
  } catch (err) {
    console.warn("[Supabase] Upload folder operation failed:", err);
  }
};

/**
 * Get Supabase Public URL for a given destination path.
 */
export const getSupabasePublicUrl = (destinationPath) => {
  if (!destinationPath || typeof destinationPath !== 'string') return destinationPath || null;
  
  // If destinationPath is already a full Supabase URL, clean up any double prefixes and return
  if (destinationPath.includes("/storage/v1/object/public/") || destinationPath.includes(".supabase.co")) {
    if (destinationPath.indexOf("/storage/v1/object/public/") !== destinationPath.lastIndexOf("/storage/v1/object/public/")) {
      const idx = destinationPath.lastIndexOf("/storage/v1/object/public/");
      const pathPart = destinationPath.substring(idx + "/storage/v1/object/public/".length);
      const domain = destinationPath.split("/storage/v1/object/")[0];
      return `${domain}/storage/v1/object/public/${pathPart.startsWith('uploads/') ? pathPart : 'uploads/' + pathPart}`;
    }
    return destinationPath;
  }

  let key = destinationPath.replace(/\\/g, "/").replace(/^\/+/, "");
  if (key.startsWith("uploads/")) {
    key = key.substring("uploads/".length);
  }
  try {
    key = decodeURIComponent(key);
  } catch(e) {}
  const { data } = supabase.storage.from(SUPABASE_BUCKET).getPublicUrl(key);
  return data?.publicUrl || `${supabaseUrl}/storage/v1/object/public/${SUPABASE_BUCKET}/${encodeURIComponent(key)}`;
};

/**
 * Download a file's content (Buffer) from Supabase Storage.
 */
export const downloadFileFromSupabase = async (destinationPath) => {
  try {
    if (!supabaseUrl || !supabaseKey || !destinationPath) return null;

    let cleanDestination = destinationPath.replace(/\\/g, "/").replace(/^\/+/, "");
    if (cleanDestination.startsWith("uploads/")) {
      cleanDestination = cleanDestination.substring("uploads/".length);
    }
    try {
      cleanDestination = decodeURIComponent(cleanDestination);
    } catch(e) {}

    const { data, error } = await supabase.storage
      .from(SUPABASE_BUCKET)
      .download(cleanDestination);

    if (error || !data) {
      return null;
    }

    const arrayBuffer = await data.arrayBuffer();
    return Buffer.from(arrayBuffer);
  } catch (err) {
    console.warn("[Supabase] Download file failed:", err);
    return null;
  }
};

/**
 * List top-level subfolders under a user's My_Flipbooks directory in Supabase Storage.
 */
export const listFoldersFromSupabase = async (sanitizedEmail) => {
  try {
    if (!supabaseUrl || !supabaseKey || !sanitizedEmail) return [];

    const prefix = `${sanitizedEmail}/My_Flipbooks`;
    const { data, error } = await supabase.storage
      .from(SUPABASE_BUCKET)
      .list(prefix, { limit: 100 });

    if (error || !data) return [];

    const folderNames = data
      .map((item) => item.name)
      .filter(
        (name) =>
          name &&
          name !== ".keep" &&
          name !== "Recent Book" &&
          !name.endsWith(".json") &&
          !name.endsWith(".png") &&
          !name.endsWith(".jpg") &&
          !name.endsWith(".svg") &&
          !name.endsWith(".html"),
      );

    return folderNames;
  } catch (err) {
    console.warn("[Supabase] Error listing folders:", err);
    return [];
  }
};

/**
 * List all files in a specific folder path in Supabase Storage.
 */
export const listFilesInSupabaseFolder = async (folderPath) => {
  try {
    if (!supabaseUrl || !supabaseKey || !folderPath) return [];
    let cleanPath = folderPath.replace(/\\/g, "/").replace(/^\/+/, "").replace(/\/+$/, "");
    if (cleanPath.startsWith("uploads/")) {
      cleanPath = cleanPath.substring("uploads/".length);
    }

    const { data, error } = await supabase.storage
      .from(SUPABASE_BUCKET)
      .list(cleanPath, { limit: 1000 });

    if (error || !data) return [];
    return data.filter(item => item && item.name && item.name !== ".keep" && item.id);
  } catch (err) {
    console.warn("[Supabase] Error listing files in folder:", err);
    return [];
  }
};

/**
 * Recursively list all files for a user in Supabase Storage and sum their size in bytes.
 */
export const getUserStorageSizeFromSupabase = async (sanitizedEmail) => {
  try {
    if (!supabaseUrl || !supabaseKey || !sanitizedEmail) return 0;

    const listAllFiles = async (dirPath) => {
      let totalSize = 0;
      const { data, error } = await supabase.storage
        .from(SUPABASE_BUCKET)
        .list(dirPath, { limit: 1000 });

      if (error || !data) return 0;

      for (const item of data) {
        const itemPath = `${dirPath}/${item.name}`;
        if (!item.id && (!item.metadata || Object.keys(item.metadata).length === 0)) {
          totalSize += await listAllFiles(itemPath);
        } else if (item.metadata && item.metadata.size) {
          totalSize += item.metadata.size;
        }
      }
      return totalSize;
    };

    return await listAllFiles(sanitizedEmail);
  } catch (err) {
    console.warn("[Supabase] Failed to calculate user storage size:", err);
    return 0;
  }
};

/**
 * Recursively list all files in a folder path in Supabase Storage and sum their physical size in bytes.
 */
export const getFolderSizeFromSupabase = async (folderPath) => {
  try {
    if (!supabaseUrl || !supabaseKey || !folderPath) return 0;
    let cleanPath = folderPath.replace(/\\/g, "/").replace(/^\/+/, "").replace(/\/+$/, "");
    if (cleanPath.startsWith("uploads/")) {
      cleanPath = cleanPath.substring("uploads/".length);
    }
    if (cleanPath.includes(`/storage/v1/object/public/${SUPABASE_BUCKET}/`)) {
      cleanPath = cleanPath.split(`/storage/v1/object/public/${SUPABASE_BUCKET}/`)[1];
    }

    const listAllFiles = async (dirPath) => {
      let totalSize = 0;
      const { data, error } = await supabase.storage
        .from(SUPABASE_BUCKET)
        .list(dirPath, { limit: 1000 });

      if (error || !data) return 0;

      for (const item of data) {
        if (!item || item.name === ".keep") continue;
        const itemPath = `${dirPath}/${item.name}`;
        if (!item.id && (!item.metadata || Object.keys(item.metadata).length === 0)) {
          totalSize += await listAllFiles(itemPath);
        } else if (item.metadata && typeof item.metadata.size === 'number') {
          totalSize += item.metadata.size;
        }
      }
      return totalSize;
    };

    return await listAllFiles(cleanPath);
  } catch (err) {
    console.warn("[Supabase] getFolderSizeFromSupabase error:", err);
    return 0;
  }
};










