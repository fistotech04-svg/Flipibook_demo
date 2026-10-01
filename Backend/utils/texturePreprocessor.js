import fs from "fs";
import path from "path";
import zlib from "zlib";

// CRC32 table for PNG chunk checksums
const crcTable = new Uint32Array(256);
for (let n = 0; n < 256; n++) {
  let c = n;
  for (let k = 0; k < 8; k++) {
    c = (c & 1) ? (0xedb88320 ^ (c >>> 1)) : (c >>> 1);
  }
  crcTable[n] = c >>> 0;
}

function calcCrc32(buf) {
  let c = 0xffffffff;
  for (let i = 0; i < buf.length; i++) {
    c = crcTable[(c ^ buf[i]) & 0xff] ^ (c >>> 8);
  }
  return (c ^ 0xffffffff) >>> 0;
}

/**
 * Decodes uncompressed and RLE TrueColor / Grayscale TGA images
 */
function decodeTGA(buffer) {
  if (!buffer || buffer.length < 18) return null;
  const idLen = buffer[0];
  const colorMapType = buffer[1];
  const imageType = buffer[2];
  const width = buffer.readUInt16LE(12);
  const height = buffer.readUInt16LE(14);
  const bpp = buffer[16];
  const descriptor = buffer[17];

  // Types: 2 = uncompressed truecolor, 10 = RLE truecolor, 3 = uncompressed grayscale, 11 = RLE grayscale
  if (![2, 10, 3, 11].includes(imageType)) return null;
  if (![8, 24, 32].includes(bpp)) return null;
  if (width <= 0 || height <= 0 || width > 16384 || height > 16384) return null;

  const bytesPerPixel = bpp / 8;
  let offset = 18 + idLen;
  if (colorMapType === 1) {
    const colorMapLen = buffer.readUInt16LE(5);
    const colorMapBpp = buffer[7];
    offset += colorMapLen * Math.ceil(colorMapBpp / 8);
  }

  const numPixels = width * height;
  const rgba = Buffer.alloc(numPixels * 4);
  let pixelIndex = 0;

  if (imageType === 2 || imageType === 3) {
    while (pixelIndex < numPixels && offset + bytesPerPixel <= buffer.length) {
      if (bytesPerPixel === 4) {
        rgba[pixelIndex * 4] = buffer[offset + 2];     // R
        rgba[pixelIndex * 4 + 1] = buffer[offset + 1]; // G
        rgba[pixelIndex * 4 + 2] = buffer[offset];     // B
        rgba[pixelIndex * 4 + 3] = buffer[offset + 3]; // A
      } else if (bytesPerPixel === 3) {
        rgba[pixelIndex * 4] = buffer[offset + 2];     // R
        rgba[pixelIndex * 4 + 1] = buffer[offset + 1]; // G
        rgba[pixelIndex * 4 + 2] = buffer[offset];     // B
        rgba[pixelIndex * 4 + 3] = 255;                // A
      } else if (bytesPerPixel === 1) {
        const v = buffer[offset];
        rgba[pixelIndex * 4] = v;
        rgba[pixelIndex * 4 + 1] = v;
        rgba[pixelIndex * 4 + 2] = v;
        rgba[pixelIndex * 4 + 3] = 255;
      }
      offset += bytesPerPixel;
      pixelIndex++;
    }
  } else if (imageType === 10 || imageType === 11) {
    while (pixelIndex < numPixels && offset < buffer.length) {
      const packetHeader = buffer[offset++];
      const count = (packetHeader & 0x7f) + 1;
      const isRLE = (packetHeader & 0x80) !== 0;

      if (isRLE) {
        let r, g, b, a = 255;
        if (bytesPerPixel === 4) {
          b = buffer[offset++]; g = buffer[offset++]; r = buffer[offset++]; a = buffer[offset++];
        } else if (bytesPerPixel === 3) {
          b = buffer[offset++]; g = buffer[offset++]; r = buffer[offset++];
        } else {
          r = g = b = buffer[offset++];
        }
        for (let i = 0; i < count && pixelIndex < numPixels; i++, pixelIndex++) {
          rgba[pixelIndex * 4] = r;
          rgba[pixelIndex * 4 + 1] = g;
          rgba[pixelIndex * 4 + 2] = b;
          rgba[pixelIndex * 4 + 3] = a;
        }
      } else {
        for (let i = 0; i < count && pixelIndex < numPixels && offset + bytesPerPixel <= buffer.length; i++, pixelIndex++) {
          if (bytesPerPixel === 4) {
            rgba[pixelIndex * 4] = buffer[offset + 2];
            rgba[pixelIndex * 4 + 1] = buffer[offset + 1];
            rgba[pixelIndex * 4 + 2] = buffer[offset];
            rgba[pixelIndex * 4 + 3] = buffer[offset + 3];
          } else if (bytesPerPixel === 3) {
            rgba[pixelIndex * 4] = buffer[offset + 2];
            rgba[pixelIndex * 4 + 1] = buffer[offset + 1];
            rgba[pixelIndex * 4 + 2] = buffer[offset];
            rgba[pixelIndex * 4 + 3] = 255;
          } else {
            const v = buffer[offset];
            rgba[pixelIndex * 4] = v;
            rgba[pixelIndex * 4 + 1] = v;
            rgba[pixelIndex * 4 + 2] = v;
            rgba[pixelIndex * 4 + 3] = 255;
          }
          offset += bytesPerPixel;
        }
      }
    }
  }

  // TGA origin: bit 5 of descriptor is 0 -> bottom-left origin (flip to top-left)
  const isTopOrigin = (descriptor & 0x20) !== 0;
  if (!isTopOrigin) {
    const rowBytes = width * 4;
    const halfH = Math.floor(height / 2);
    const tempRow = Buffer.alloc(rowBytes);
    for (let y = 0; y < halfH; y++) {
      const topOffset = y * rowBytes;
      const bottomOffset = (height - 1 - y) * rowBytes;
      rgba.copy(tempRow, 0, topOffset, topOffset + rowBytes);
      rgba.copy(rgba, topOffset, bottomOffset, bottomOffset + rowBytes);
      tempRow.copy(rgba, bottomOffset, 0, rowBytes);
    }
  }

  return { width, height, rgba };
}

/**
 * Decodes standard Windows 24-bit and 32-bit BMP images
 */
function decodeBMP(buffer) {
  if (!buffer || buffer.length < 54 || buffer.toString("ascii", 0, 2) !== "BM") return null;
  const dataOffset = buffer.readUInt32LE(10);
  const width = buffer.readInt32LE(18);
  let height = buffer.readInt32LE(22);
  const bpp = buffer.readUInt16LE(28);
  const compression = buffer.readUInt32LE(30);

  if (![24, 32].includes(bpp) || (compression !== 0 && compression !== 3)) return null;
  const isBottomUp = height > 0;
  height = Math.abs(height);
  if (width <= 0 || height <= 0 || width > 16384 || height > 16384) return null;

  const bytesPerPixel = bpp / 8;
  const rowSize = Math.floor((bpp * width + 31) / 32) * 4;
  const rgba = Buffer.alloc(width * height * 4);

  for (let y = 0; y < height; y++) {
    const srcY = isBottomUp ? (height - 1 - y) : y;
    const srcRowStart = dataOffset + srcY * rowSize;
    const dstRowStart = y * width * 4;

    for (let x = 0; x < width; x++) {
      const pSrc = srcRowStart + x * bytesPerPixel;
      const pDst = dstRowStart + x * 4;
      if (pSrc + bytesPerPixel <= buffer.length) {
        rgba[pDst] = buffer[pSrc + 2];     // R
        rgba[pDst + 1] = buffer[pSrc + 1]; // G
        rgba[pDst + 2] = buffer[pSrc];     // B
        rgba[pDst + 3] = bytesPerPixel === 4 ? buffer[pSrc + 3] : 255;
      }
    }
  }

  return { width, height, rgba };
}

/**
 * Encodes RGBA raw pixel buffer into standard PNG format
 */
function encodePNG(width, height, rgbaBuffer) {
  const scanlineLength = width * 4;
  const rawData = Buffer.alloc(height * (scanlineLength + 1));
  for (let y = 0; y < height; y++) {
    const rawOffset = y * (scanlineLength + 1);
    rawData[rawOffset] = 0; // Filter type: None
    rgbaBuffer.copy(rawData, rawOffset + 1, y * scanlineLength, (y + 1) * scanlineLength);
  }

  const compressedData = zlib.deflateSync(rawData, { level: 6 });
  const signature = Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]);

  const ihdrData = Buffer.alloc(13);
  ihdrData.writeUInt32BE(width, 0);
  ihdrData.writeUInt32BE(height, 4);
  ihdrData[8] = 8; // Bit depth: 8
  ihdrData[9] = 6; // Color type: RGBA (6)
  ihdrData[10] = 0;
  ihdrData[11] = 0;
  ihdrData[12] = 0;

  const makeChunk = (type, data) => {
    const typeBuf = Buffer.from(type, "ascii");
    const lenBuf = Buffer.alloc(4);
    lenBuf.writeUInt32BE(data.length, 0);

    const crcPayload = Buffer.concat([typeBuf, data]);
    const crc = calcCrc32(crcPayload);
    const crcBuf = Buffer.alloc(4);
    crcBuf.writeUInt32BE(crc, 0);

    return Buffer.concat([lenBuf, crcPayload, crcBuf]);
  };

  const ihdrChunk = makeChunk("IHDR", ihdrData);
  const idatChunk = makeChunk("IDAT", compressedData);
  const iendChunk = makeChunk("IEND", Buffer.alloc(0));

  return Buffer.concat([signature, ihdrChunk, idatChunk, iendChunk]);
}

/**
 * Converts a TGA or BMP image to PNG format
 */
export function convertImageToPng(sourceFilePath) {
  try {
    const ext = path.extname(sourceFilePath).toLowerCase();
    if (ext !== ".tga" && ext !== ".bmp") return null;

    const buffer = fs.readFileSync(sourceFilePath);
    let decoded = null;
    if (ext === ".tga") decoded = decodeTGA(buffer);
    else if (ext === ".bmp") decoded = decodeBMP(buffer);

    if (!decoded) return null;

    const pngBuffer = encodePNG(decoded.width, decoded.height, decoded.rgba);
    const targetPngPath = sourceFilePath.replace(/\.(tga|bmp)$/i, ".png");
    fs.writeFileSync(targetPngPath, pngBuffer);
    console.log(`[TexturePreprocessor] Converted ${ext.toUpperCase()} to PNG: ${path.basename(sourceFilePath)} -> ${path.basename(targetPngPath)} (${decoded.width}x${decoded.height})`);
    return targetPngPath;
  } catch (err) {
    console.warn(`[TexturePreprocessor] Image conversion notice for ${path.basename(sourceFilePath)}:`, err.message);
    return null;
  }
}

export const TEXTURE_EXTENSIONS = [
  ".png", ".jpg", ".jpeg", ".webp", ".tga", ".bmp", ".dds", ".hdr", ".exr", ".tif", ".tiff"
];

/**
 * Prepares and consolidates all textures and material files for a 3D model:
 * 1. Finds all texture images in the unpacked archive.
 * 2. Transcodes TGA/BMP images to PNG.
 * 3. Consolidates texture files directly into the primary model's directory and standard subdirectories.
 * 4. Sanitizes .mtl and .obj files to resolve absolute paths, backslashes, and case mismatches.
 * 5. Sanitizes ASCII FBX texture references.
 * 
 * @param {string} tempUnpackDir - Directory where the archive was extracted
 * @param {string} primaryModelFilePath - Absolute path to the identified 3D model
 */
export function prepareTexturesForModel(tempUnpackDir, primaryModelFilePath) {
  try {
    if (!fs.existsSync(tempUnpackDir) || !fs.existsSync(primaryModelFilePath)) return;

    const modelDir = path.dirname(primaryModelFilePath);
    const allFiles = [];

    const scanAll = (dir) => {
      const items = fs.readdirSync(dir, { withFileTypes: true });
      for (const item of items) {
        const full = path.join(dir, item.name);
        if (item.isDirectory()) {
          if (!item.name.startsWith("__MACOSX") && item.name !== ".git") {
            scanAll(full);
          }
        } else if (item.isFile()) {
          allFiles.push(full);
        }
      }
    };
    scanAll(tempUnpackDir);

    // 1. Convert any TGA or BMP images to PNG
    for (const filePath of allFiles) {
      const ext = path.extname(filePath).toLowerCase();
      if (ext === ".tga" || ext === ".bmp") {
        const pngPath = convertImageToPng(filePath);
        if (pngPath && !allFiles.includes(pngPath)) {
          allFiles.push(pngPath);
        }
      }
    }

    // 2. Collect all texture image files
    const textureFiles = allFiles.filter(f => {
      const ext = path.extname(f).toLowerCase();
      return TEXTURE_EXTENSIONS.includes(ext);
    });

    console.log(`[TexturePreprocessor] Discovered ${textureFiles.length} texture files in archive.`);

    // 3. Build lookup maps: lowercased filename -> source file path
    const textureMap = new Map(); // lowercase basename -> fullPath
    for (const tf of textureFiles) {
      const base = path.basename(tf);
      textureMap.set(base.toLowerCase(), tf);
      // Also register without extension
      const nameOnly = path.basename(tf, path.extname(tf)).toLowerCase();
      if (!textureMap.has(nameOnly)) textureMap.set(nameOnly, tf);
    }

    // 4. Standard texture subdirectories to mirror inside modelDir
    const subDirsToCreate = [
      "", // modelDir itself
      "textures",
      "Textures",
      "maps",
      "Maps",
      "images",
      "Images",
      "assets",
      "Assets",
      "tex",
      "Tex"
    ];

    for (const sub of subDirsToCreate) {
      const dirPath = sub ? path.join(modelDir, sub) : modelDir;
      if (!fs.existsSync(dirPath)) {
        fs.mkdirSync(dirPath, { recursive: true });
      }
    }

    // 5. Copy all texture files into modelDir and its texture subdirectories
    for (const tf of textureFiles) {
      const baseName = path.basename(tf);
      const lowerBaseName = baseName.toLowerCase();

      // Copy directly into modelDir
      const destInModelDir = path.join(modelDir, baseName);
      if (!fs.existsSync(destInModelDir)) {
        try { fs.copyFileSync(tf, destInModelDir); } catch (e) {}
      }

      // If basename has uppercase, also write a lowercase copy
      if (baseName !== lowerBaseName) {
        const lowerDest = path.join(modelDir, lowerBaseName);
        if (!fs.existsSync(lowerDest)) {
          try { fs.copyFileSync(tf, lowerDest); } catch (e) {}
        }
      }

      // Mirror into standard subdirectories (textures/, maps/, images/)
      for (const sub of ["textures", "Textures", "maps", "images"]) {
        const subDest = path.join(modelDir, sub, baseName);
        if (!fs.existsSync(subDest)) {
          try { fs.copyFileSync(tf, subDest); } catch (e) {}
        }
        if (baseName !== lowerBaseName) {
          const lowerSubDest = path.join(modelDir, sub, lowerBaseName);
          if (!fs.existsSync(lowerSubDest)) {
            try { fs.copyFileSync(tf, lowerSubDest); } catch (e) {}
          }
        }
      }

      // Also preserve any relative folder structure from the archive root
      const relFromUnpack = path.relative(tempUnpackDir, tf);
      const relDest = path.join(modelDir, relFromUnpack);
      const relParent = path.dirname(relDest);
      if (!fs.existsSync(relParent)) {
        fs.mkdirSync(relParent, { recursive: true });
      }
      if (!fs.existsSync(relDest)) {
        try { fs.copyFileSync(tf, relDest); } catch (e) {}
      }
    }

    // 6. Handle OBJ & MTL sanitization
    const mtlFiles = allFiles.filter(f => path.extname(f).toLowerCase() === ".mtl");
    const objFiles = allFiles.filter(f => path.extname(f).toLowerCase() === ".obj");

    // Copy any .mtl files into modelDir if not already there
    for (const mtlPath of mtlFiles) {
      const mtlBase = path.basename(mtlPath);
      const destMtl = path.join(modelDir, mtlBase);
      if (mtlPath !== destMtl && !fs.existsSync(destMtl)) {
        try { fs.copyFileSync(mtlPath, destMtl); } catch (e) {}
      }
    }

    // Sanitize all .mtl files in modelDir
    const modelMtls = fs.readdirSync(modelDir)
      .filter(f => path.extname(f).toLowerCase() === ".mtl")
      .map(f => path.join(modelDir, f));

    for (const mtlPath of modelMtls) {
      try {
        let content = fs.readFileSync(mtlPath, "utf8");
        const lines = content.split(/\r?\n/);
        let modified = false;

        const newLines = lines.map(line => {
          const trimmed = line.trim();
          // Check for texture map directives in Wavefront MTL format
          const match = trimmed.match(/^(map_Kd|map_Bump|bump|map_Ks|map_Ka|map_d|map_Ke|map_refl|refl|disp|norm|decal)\s+(.*)$/i);
          if (!match) return line;

          const directive = match[1];
          let rest = match[2].trim();

          // Separate optional flags (e.g. -bm 1.0, -s 1 1 1, -o 0 0 0) from the texture path
          const tokens = rest.split(/\s+/);
          let options = [];
          let rawPath = "";

          for (let i = 0; i < tokens.length; i++) {
            const token = tokens[i];
            if (token.startsWith("-")) {
              options.push(token);
              // Option parameter consumption
              if (["-bm", "-clamp", "-type"].includes(token.toLowerCase()) && i + 1 < tokens.length) {
                options.push(tokens[++i]);
              } else if (["-s", "-o", "-t"].includes(token.toLowerCase())) {
                while (i + 1 < tokens.length && !tokens[i + 1].startsWith("-") && options.length < 8) {
                  options.push(tokens[++i]);
                }
              }
            } else {
              rawPath = tokens.slice(i).join(" ");
              break;
            }
          }

          if (!rawPath) rawPath = tokens[tokens.length - 1];

          // Clean rawPath: strip quotes, Windows backslashes, drive letters
          let cleanTex = rawPath.replace(/^["']+|["']+$/g, "").replace(/\\/g, "/");
          const baseTex = path.basename(cleanTex);
          const lowerBase = baseTex.toLowerCase();

          // Check if we have a match in discovered textures
          let matchedFile = null;
          if (textureMap.has(lowerBase)) {
            matchedFile = path.basename(textureMap.get(lowerBase));
          } else {
            // Check if PNG version exists for TGA/BMP reference
            const baseWithoutExt = path.basename(baseTex, path.extname(baseTex)).toLowerCase();
            const pngKey = `${baseWithoutExt}.png`;
            if (textureMap.has(pngKey)) {
              matchedFile = path.basename(textureMap.get(pngKey));
            }
          }

          const finalTexName = matchedFile || baseTex;
          modified = true;

          const optionsStr = options.length > 0 ? options.join(" ") + " " : "";
          // Rebuild line with clean local relative filename
          return `${directive} ${optionsStr}${finalTexName}`;
        });

        if (modified) {
          fs.writeFileSync(mtlPath, newLines.join("\n"), "utf8");
          console.log(`[TexturePreprocessor] Sanitized texture paths in MTL: ${path.basename(mtlPath)}`);
        }
      } catch (mtlErr) {
        console.warn(`[TexturePreprocessor] MTL notice for ${path.basename(mtlPath)}:`, mtlErr.message);
      }
    }

    // Sanitize .obj files: ensure mtllib lines point directly to basename of MTL
    for (const objPath of objFiles) {
      try {
        let content = fs.readFileSync(objPath, "utf8");
        const lines = content.split(/\r?\n/);
        let modified = false;

        const newLines = lines.map(line => {
          const trimmed = line.trim();
          if (trimmed.startsWith("mtllib ")) {
            const rawMtl = trimmed.substring(7).trim().replace(/^["']+|["']+$/g, "").replace(/\\/g, "/");
            const baseMtl = path.basename(rawMtl);
            if (rawMtl !== baseMtl) {
              modified = true;
              return `mtllib ${baseMtl}`;
            }
          }
          return line;
        });

        if (modified) {
          fs.writeFileSync(objPath, newLines.join("\n"), "utf8");
          console.log(`[TexturePreprocessor] Sanitized mtllib in OBJ: ${path.basename(objPath)}`);
        }
      } catch (objErr) {
        console.warn(`[TexturePreprocessor] OBJ notice for ${path.basename(objPath)}:`, objErr.message);
      }
    }

    // 7. Sanitize ASCII FBX files if primary model is FBX
    const modelExt = path.extname(primaryModelFilePath).toLowerCase();
    if (modelExt === ".fbx") {
      try {
        const buffer = fs.readFileSync(primaryModelFilePath);
        const header = buffer.toString("ascii", 0, 64);
        const isAsciiFbx = header.includes("Kaydara FBX Header") || header.includes("FBX Header") || header.startsWith(";");

        if (isAsciiFbx) {
          let text = buffer.toString("utf8");
          let modified = false;

          // Replace absolute Windows texture paths in FBX ASCII:
          // e.g. RelativeFilename: "C:\path\to\tex.png" or FileName: "..."
          text = text.replace(/(FileName|RelativeFilename):\s*"([^"]+)"/gi, (match, prop, texPath) => {
            const clean = texPath.replace(/\\/g, "/");
            const base = path.basename(clean);
            const lowerBase = base.toLowerCase();
            let matched = base;
            if (textureMap.has(lowerBase)) {
              matched = path.basename(textureMap.get(lowerBase));
            } else {
              const nameNoExt = path.basename(base, path.extname(base)).toLowerCase();
              if (textureMap.has(`${nameNoExt}.png`)) {
                matched = path.basename(textureMap.get(`${nameNoExt}.png`));
              }
            }
            modified = true;
            return `${prop}: "${matched}"`;
          });

          if (modified) {
            fs.writeFileSync(primaryModelFilePath, text, "utf8");
            console.log(`[TexturePreprocessor] Sanitized texture paths in ASCII FBX: ${path.basename(primaryModelFilePath)}`);
          }
        }
      } catch (fbxErr) {
        console.warn(`[TexturePreprocessor] FBX notice for ${path.basename(primaryModelFilePath)}:`, fbxErr.message);
      }
    }

    console.log(`[TexturePreprocessor] Model and textures successfully mapped and prepared in ${modelDir}`);
  } catch (err) {
    console.error("[TexturePreprocessor] Error during texture preparation:", err);
  }
}
