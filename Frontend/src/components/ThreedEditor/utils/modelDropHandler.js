import JSZip from "jszip";

export const SUPPORTED_MODEL_EXTENSIONS = [
  "glb",
  "gltf",
  "obj",
  "fbx",
  "stl",
  "step",
  "stp",
  "3ds",
  "lwo",
  "low",
  "iges",
  "igs"
];

export const SUPPORTED_ARCHIVE_EXTENSIONS = [
  "zip",
  "rar",
  "7z",
  "tar",
  "gz",
  "tgz",
  "bz2"
];

export const SUPPORTED_TEXTURE_EXTENSIONS = [
  "png",
  "jpg",
  "jpeg",
  "webp",
  "tga",
  "bmp",
  "dds",
  "svg",
  "hdr",
  "exr",
  "tif",
  "tiff",
  "mtl",
  "bin"
];

/**
 * Traverses HTML5 DataTransfer items to recursively extract all files and directory paths
 * 
 * @param {DataTransfer} dataTransfer - The drag & drop data transfer event object
 * @returns {Promise<Array<{ file: File, path: string }>>}
 */
export const extractFilesFromDataTransfer = async (dataTransfer) => {
  const fileEntries = [];
  const items = dataTransfer?.items;

  if (items && items.length > 0 && typeof items[0].webkitGetAsEntry === "function") {
    const traverseEntry = async (entry, currentPath = "") => {
      if (!entry) return;

      if (entry.isFile) {
        const file = await new Promise((resolve, reject) => {
          entry.file(resolve, reject);
        });
        const relativePath = currentPath ? `${currentPath}/${file.name}` : file.name;
        fileEntries.push({ file, path: relativePath });
      } else if (entry.isDirectory) {
        const dirReader = entry.createReader();
        const nextPath = currentPath ? `${currentPath}/${entry.name}` : entry.name;

        const readAllEntries = async () => {
          let batch = [];
          let currentBatch = await new Promise((resolve, reject) => {
            dirReader.readEntries(resolve, reject);
          });
          while (currentBatch && currentBatch.length > 0) {
            batch = batch.concat(currentBatch);
            currentBatch = await new Promise((resolve, reject) => {
              dirReader.readEntries(resolve, reject);
            });
          }
          return batch;
        };

        const children = await readAllEntries();
        for (const child of children) {
          await traverseEntry(child, nextPath);
        }
      }
    };

    for (let i = 0; i < items.length; i++) {
      const entry = items[i].webkitGetAsEntry();
      if (entry) {
        await traverseEntry(entry);
      }
    }
  } else if (dataTransfer?.files && dataTransfer.files.length > 0) {
    for (let i = 0; i < dataTransfer.files.length; i++) {
      const file = dataTransfer.files[i];
      const relativePath = file.webkitRelativePath || file.name;
      fileEntries.push({ file, path: relativePath });
    }
  }

  return fileEntries;
};

/**
 * Finds the primary 3D model file from an array of files
 */
export const findPrimary3DModelFile = (fileEntries) => {
  if (!fileEntries || fileEntries.length === 0) return null;

  const priorityOrder = [
    "gltf",
    "obj",
    "fbx",
    "glb",
    "3ds",
    "lwo",
    "low",
    "stl",
    "step",
    "stp",
    "iges",
    "igs"
  ];

  for (const prioExt of priorityOrder) {
    const found = fileEntries.find((entry) => {
      const ext = entry.file.name.split(".").pop().toLowerCase();
      // Skip hidden / Mac OS metadata
      const isHidden = entry.path.startsWith("__MACOSX/") || entry.file.name.startsWith(".");
      return ext === prioExt && !isHidden;
    });
    if (found) return found;
  }

  return null;
};

/**
 * Packages an array of files with relative paths into a ZIP File
 * 
 * @param {Array<{ file: File, path: string }>} fileEntries 
 * @param {string} zipName - Name of the generated zip file
 * @param {Function} [onProgress] - Optional progress callback
 * @returns {Promise<File>}
 */
export const packageFilesToZip = async (fileEntries, zipName = "model_package.zip", onProgress) => {
  const zip = new JSZip();

  // 1. Sanitize all paths: convert Windows backslashes to forward slashes and strip leading slashes
  const sanitized = fileEntries.map(({ file, path }) => ({
    file,
    path: (path || file.name).replace(/\\/g, "/").replace(/^\/+/, "")
  }));

  // 2. If all files share a common top-level root folder prefix (e.g. "Dragon/model.obj", "Dragon/textures/..."),
  // strip that top folder name so the primary model and relative texture folders sit directly at archive root
  let commonPrefix = "";
  const firstSlashIdxs = sanitized.map(e => e.path.indexOf("/"));
  if (sanitized.length > 1 && firstSlashIdxs.every(idx => idx > 0)) {
    const candidatePrefix = sanitized[0].path.substring(0, firstSlashIdxs[0] + 1);
    if (sanitized.every(e => e.path.startsWith(candidatePrefix))) {
      commonPrefix = candidatePrefix;
    }
  }

  sanitized.forEach(({ file, path }) => {
    const cleanPath = commonPrefix ? path.substring(commonPrefix.length) : path;
    zip.file(cleanPath, file);
  });

  const zipBlob = await zip.generateAsync(
    {
      type: "blob",
      compression: "DEFLATE",
      compressionOptions: { level: 6 }
    },
    (metadata) => {
      if (typeof onProgress === "function") {
        onProgress(Math.round(metadata.percent));
      }
    }
  );

  return new File([zipBlob], zipName, { type: "application/zip" });
};

/**
 * Core processor for dropped items (single 3D file, folder with textures, or ZIP archive).
 * 
 * @param {DataTransfer|FileList|File|Array<File>} source - Drag & Drop dataTransfer or file list or single file
 * @param {Object} [options] - Configuration options
 * @param {Function} [options.onProgressText] - Progress status updater
 * @returns {Promise<{ file: File, name: string, isZip: boolean, isFolder: boolean, primaryExt: string }>}
 */
export const process3DDropEvent = async (source, options = {}) => {
  const { onProgressText } = options;

  let fileEntries = [];

  if (source instanceof DataTransfer) {
    if (onProgressText) onProgressText("Scanning dropped folder and files...");
    fileEntries = await extractFilesFromDataTransfer(source);
  } else if (source instanceof FileList) {
    for (let i = 0; i < source.length; i++) {
      const file = source[i];
      fileEntries.push({ file, path: file.webkitRelativePath || file.name });
    }
  } else if (source instanceof File) {
    fileEntries.push({ file: source, path: source.name });
  } else if (Array.isArray(source)) {
    fileEntries = source.map((item) => {
      if (item instanceof File) return { file: item, path: item.name };
      return item;
    });
  }

  if (fileEntries.length === 0) {
    throw new Error("No files detected in the dropped item.");
  }

  // Case 1: Single file dropped
  if (fileEntries.length === 1) {
    const single = fileEntries[0].file;
    const ext = single.name.split(".").pop().toLowerCase();
    const baseName = single.name.replace(/\.[^/.]+$/, "");

    if (SUPPORTED_ARCHIVE_EXTENSIONS.includes(ext)) {
      return {
        file: single,
        name: baseName,
        isZip: true,
        isFolder: false,
        primaryExt: ext
      };
    }

    if (SUPPORTED_MODEL_EXTENSIONS.includes(ext)) {
      return {
        file: single,
        name: baseName,
        isZip: false,
        isFolder: false,
        primaryExt: ext
      };
    }

    throw new Error(
      `File format ".${ext}" is not supported. Please drop a 3D model (${SUPPORTED_MODEL_EXTENSIONS.join(", ").toUpperCase()}), a folder with textures, or an archive (.ZIP, .RAR, .7Z, .TAR, .GZ).`
    );
  }

  // Case 2: Folder or multi-file set dropped (e.g. model.obj + model.mtl + textures/ or gltf + bin + images)
  const primaryModel = findPrimary3DModelFile(fileEntries);
  if (!primaryModel) {
    throw new Error(
      `No supported 3D model file (${SUPPORTED_MODEL_EXTENSIONS.join(", ").toUpperCase()}) found in the dropped folder.`
    );
  }

  const primaryExt = primaryModel.file.name.split(".").pop().toLowerCase();
  const primaryBaseName = primaryModel.file.name.replace(/\.[^/.]+$/, "");

  if (onProgressText) onProgressText(`Packaging folder with ${fileEntries.length} files & external textures...`);
  const zipFile = await packageFilesToZip(
    fileEntries,
    `${primaryBaseName}.zip`,
    (percent) => {
      if (onProgressText) onProgressText(`Packaging folder (${percent}%)...`);
    }
  );

  return {
    file: zipFile,
    name: primaryBaseName,
    isZip: true,
    isFolder: true,
    primaryExt: primaryExt
  };
};
