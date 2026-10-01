import fs from "fs";
import path from "path";
import os from "os";
import { execFile, exec } from "child_process";
import { promisify } from "util";
import { fileURLToPath } from "url";
import { createRequire } from "module";

const require = createRequire(import.meta.url);
const execFileAsync = promisify(execFile);
const execAsync = promisify(exec);

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Dynamically load the 'inkscape' npm package (will be available once user runs npm i)
let InkscapePackage = null;
try {
  InkscapePackage = require("inkscape");
  console.log("[Inkscape] Successfully loaded 'inkscape' npm package.");
} catch (e) {
  // Not yet installed (user will run npm i later)
}

// Dynamically load 'pdf-lib' (for backend PDF page splitting)
let PDFLib = null;
try {
  PDFLib = require("pdf-lib");
  console.log("[PDF-Lib] Successfully loaded 'pdf-lib' npm package.");
} catch (e) {
  // Not yet installed (user will run npm i later)
}

let cachedInkscapePath = null;

/**
 * Locates the Inkscape binary using only INKSCAPE_PATH configured in .env,
 * and ensures its directory is added to process.env.PATH.
 */
export const getInkscapePath = () => {
  const envPath = process.env.INKSCAPE_PATH;
  if (!envPath) {
    return null;
  }

  if (cachedInkscapePath && fs.existsSync(cachedInkscapePath)) {
    return cachedInkscapePath;
  }

  if (fs.existsSync(envPath)) {
    cachedInkscapePath = envPath;
    const binDir = path.dirname(envPath);
    if (process.env.PATH && !process.env.PATH.includes(binDir)) {
      process.env.PATH = `${binDir}${path.delimiter}${process.env.PATH}`;
    }
    return envPath;
  }

  return envPath;
};

// Initialize PATH right away
getInkscapePath();

/**
 * Checks Inkscape version and returns availability status.
 */
export const checkInkscapeVersion = async () => {
  const binaryPath = getInkscapePath();
  const pkgAvailable = !!InkscapePackage;

  if (!binaryPath) {
    return {
      available: false,
      hasNodePackage: pkgAvailable,
      error: "INKSCAPE_PATH is not configured in .env"
    };
  }

  if (!fs.existsSync(binaryPath)) {
    return {
      available: false,
      hasNodePackage: pkgAvailable,
      path: binaryPath,
      error: `Inkscape executable not found at INKSCAPE_PATH: ${binaryPath}`
    };
  }

  try {
    const { stdout } = await execFileAsync(binaryPath, ["--version"]);
    const versionMatch = stdout.match(/Inkscape\s+([0-9.]+)/i);
    return {
      available: true,
      hasNodePackage: pkgAvailable,
      version: versionMatch ? versionMatch[1] : stdout.trim().split("\n")[0],
      path: binaryPath
    };
  } catch (err) {
    return {
      available: false,
      hasNodePackage: pkgAvailable,
      path: binaryPath,
      error: err.message || `Failed to execute Inkscape at ${binaryPath}`
    };
  }
};

/**
 * Parses SVG dimension strings (e.g., '210mm', '595.28pt', '800px', '210') into millimeters.
 */
export const parseDimensionToMm = (val, defaultVal = 210) => {
  if (!val) return defaultVal;
  const str = String(val).trim();
  const num = parseFloat(str);
  if (isNaN(num)) return defaultVal;

  if (str.endsWith("mm")) return num;
  if (str.endsWith("cm")) return num * 10;
  if (str.endsWith("in")) return num * 25.4;
  if (str.endsWith("pt")) return num * (25.4 / 72);
  if (str.endsWith("px")) return num * (25.4 / 96);
  return num;
};

/**
 * Scopes IDs in SVG content (clip-path, masks, gradients, filters, paths)
 * to avoid cross-page ID collisions in multi-page flipbooks.
 */
export const scopeSvgIds = (svgString, pageNumber) => {
  const prefix = `p${pageNumber}_`;
  const idMap = new Map();

  // Find all id="..." declarations
  const idDeclRegex = /\bid=(["'])([^"']+)\1/g;
  let match;
  while ((match = idDeclRegex.exec(svgString)) !== null) {
    const origId = match[2];
    if (!origId.startsWith(prefix) && !idMap.has(origId)) {
      idMap.set(origId, `${prefix}${origId}`);
    }
  }

  if (idMap.size === 0) return svgString;

  // 1. Replace id="..." declarations
  let scopedSvg = svgString.replace(/\bid=(["'])([^"']+)\1/g, (m, q, id) => {
    return idMap.has(id) ? `id=${q}${idMap.get(id)}${q}` : m;
  });

  // 2. Replace url(#...) references across styles, clip-path, mask, fill, stroke, filter
  // Handles url(#id), url('#id'), url("#id"), url(&quot;#id&quot;), url( #id )
  scopedSvg = scopedSvg.replace(/url\(\s*(['"]|&quot;|&#39;)?\s*#([^'")&\s]+)\s*\1?\s*\)/gi, (m, quote, refId) => {
    if (idMap.has(refId)) {
      const q = quote || "";
      return `url(${q}#${idMap.get(refId)}${q})`;
    }
    return m;
  });

  // 3. Replace href="#..." and xlink:href="#..." references (used by <use>, <linearGradient>, etc.)
  scopedSvg = scopedSvg.replace(/\b(?:xlink:)?href=(["']|&quot;)#([^"'\s&]+)(["']|&quot;)/gi, (m, q1, refId, q2) => {
    if (idMap.has(refId)) {
      return `href=${q1}#${idMap.get(refId)}${q2}`;
    }
    return m;
  });

  return scopedSvg;
};

/**
 * Converts a raw Inkscape SVG output into a standard Flipbook page SVG string.
 * Flattens structure into <g data-name="Page N" data-type="frame"> and
 * <g data-name="PDF Background" data-type="pdf-vector-layer" data-locked="true">.
 * Extracts <defs> and <style> to the root level to prevent WebKit/Blink double-transform clipping.
 */
export const formatInkscapeSvgForFlipbook = (rawSvg, pageNumber = 1, pageName = null) => {
  const resolvedPageName = pageName || `Page ${pageNumber}`;

  // Extract viewBox and dimensions
  const viewBoxMatch = rawSvg.match(/viewBox=["']([^"']+)["']/i);
  const widthMatch = rawSvg.match(/width=["']([^"']+)["']/i);
  const heightMatch = rawSvg.match(/height=["']([^"']+)["']/i);

  let widthMm = 210;
  let heightMm = 297;
  let vbMinX = 0;
  let vbMinY = 0;
  let vbWidth = null;
  let vbHeight = null;

  if (viewBoxMatch) {
    const parts = viewBoxMatch[1].trim().split(/[\s,]+/).map(Number);
    if (parts.length === 4 && !parts.some(isNaN)) {
      vbMinX = parts[0];
      vbMinY = parts[1];
      vbWidth = parts[2];
      vbHeight = parts[3];
    }
  }

  if (widthMatch && heightMatch) {
    widthMm = parseDimensionToMm(widthMatch[1], 210);
    heightMm = parseDimensionToMm(heightMatch[1], 297);
  } else if (vbWidth && vbHeight) {
    // If width/height attributes missing, treat viewBox units as pt (standard PDF user units)
    widthMm = vbWidth * (25.4 / 72);
    heightMm = vbHeight * (25.4 / 72);
  }

  widthMm = Math.round(widthMm * 100) / 100;
  heightMm = Math.round(heightMm * 100) / 100;

  // Extract inner SVG content (strip outer <svg ...> and </svg> and editor metadata)
  let innerContent = rawSvg
    .replace(/<\?xml[^>]*\?>/gi, "")
    .replace(/<!DOCTYPE[^>]*>/gi, "")
    .replace(/<sodipodi:namedview[\s\S]*?<\/sodipodi:namedview>/gi, "")
    .replace(/<metadata[\s\S]*?<\/metadata>/gi, "")
    .replace(/<svg\b[^>]*>/i, "")
    .replace(/<\/svg\s*>/i, "")
    .trim();

  // Scope IDs to prevent interference across pages
  innerContent = scopeSvgIds(innerContent, pageNumber);

  // Extract <defs>...</defs> and <style>...</style> so they reside at root <svg> level
  // This prevents WebKit/Blink double-transform bug on <clipPath> inside scaled <g>
  let extractedDefs = "";
  const defsRegex = /<defs\b[^>]*>([\s\S]*?)<\/defs>/gi;
  innerContent = innerContent.replace(defsRegex, (match, contents) => {
    extractedDefs += contents + "\n";
    return "";
  });

  let extractedStyles = "";
  const styleRegex = /<style\b[^>]*>([\s\S]*?)<\/style>/gi;
  innerContent = innerContent.replace(styleRegex, (match, contents) => {
    extractedStyles += contents + "\n";
    return "";
  });

  // Compute transform if viewBox differs from mm dimensions
  let contentWrapper = innerContent;
  if (vbWidth && vbHeight && (Math.abs(vbWidth - widthMm) > 0.5 || Math.abs(vbHeight - heightMm) > 0.5 || vbMinX !== 0 || vbMinY !== 0)) {
    const scaleX = widthMm / vbWidth;
    const scaleY = heightMm / vbHeight;
    const transX = -vbMinX * scaleX;
    const transY = -vbMinY * scaleY;
    contentWrapper = `<g transform="translate(${transX.toFixed(4)}, ${transY.toFixed(4)}) scale(${scaleX.toFixed(6)}, ${scaleY.toFixed(6)})">${innerContent}</g>`;
  }

  const rootId = `g-frame-p${pageNumber}-${Math.random().toString(36).substr(2, 7)}`;
  const bgLayerId = `g-bg-p${pageNumber}-${Math.random().toString(36).substr(2, 7)}`;
  const rectId = `rect-bg-p${pageNumber}-${Math.random().toString(36).substr(2, 7)}`;
  const shieldId = `shield-p${pageNumber}-${Math.random().toString(36).substr(2, 7)}`;

  return `<svg xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" xmlns:svg="http://www.w3.org/2000/svg" xmlns:inkscape="http://www.inkscape.org/namespaces/inkscape" xmlns:sodipodi="http://sodipodi.sourceforge.net/DTD/sodipodi-0.dtd" viewBox="0 0 ${widthMm} ${heightMm}" width="100%" height="100%" style="overflow: visible" shape-rendering="geometricPrecision">
  <defs>
    ${extractedDefs}
    ${extractedStyles ? `<style>${extractedStyles}</style>` : ''}
  </defs>
  <g id="${rootId}" data-name="${resolvedPageName}" data-type="frame">
    <rect id="${rectId}" x="0" y="0" width="${widthMm}" height="${heightMm}" fill="#ffffff" data-name="Overlay" data-type="background" data-locked="true" shape-rendering="crispEdges" />
    <g id="${bgLayerId}" data-name="PDF Background" data-type="pdf-vector-layer" data-locked="true">
      ${contentWrapper}
    </g>
    <rect id="${shieldId}" data-name="Document Shield" data-type="shield" x="0" y="0" width="${widthMm}" height="${heightMm}" fill="none" opacity="0" pointer-events="all" style="pointer-events: all;" />
  </g>
</svg>`;
};

/**
 * Converts a single-page PDF file into a pure vector SVG using the 'inkscape' node package
 * (or direct binary invocation if the package is not yet installed).
 * Uses --export-text-to-path to convert all text glyphs into vector bezier outlines (<path d="..." />).
 */
export const convertSinglePdfPageWithInkscape = async (pdfPath, outSvgPath) => {
  const binaryPath = getInkscapePath();
  if (!binaryPath || !fs.existsSync(binaryPath)) {
    throw new Error(`Inkscape executable not found at INKSCAPE_PATH: "${binaryPath || ''}". Please verify INKSCAPE_PATH in .env`);
  }

  // Export arguments:
  // --export-type=svg: Standard W3C SVG output (preserves all clip-paths, masks, and gradients)
  // --export-text-to-path: flattens text into bezier paths (like Adobe Illustrator Create Outlines)
  // --pdf-poppler: use Poppler PDF engine for 100% path accuracy, preserving all vector curves & clips
  // --export-area-page: exports the complete page bounding box
  const exportArgs = [
    `--export-filename=${outSvgPath}`,
    "--export-type=svg",
    "--export-text-to-path",
    "--pdf-poppler",
    "--export-area-page"
  ];

  if (fs.existsSync(outSvgPath)) {
    try { fs.unlinkSync(outSvgPath); } catch (e) {}
  }

  // 1. If 'inkscape' npm package is installed and user passed buffers / files
  if (InkscapePackage) {
    try {
      console.log(`[Inkscape Package] Converting single page using 'inkscape' node package...`);
      const streamArgs = [
        "--export-text-to-path",
        "--export-area-page"
      ];

      await new Promise((resolve, reject) => {
        const converter = new InkscapePackage(streamArgs, {
          inputFormat: "pdf",
          outputFormat: "svg"
        });
        const inputStream = fs.createReadStream(pdfPath);
        const outputStream = fs.createWriteStream(outSvgPath);

        converter.on("error", (err) => reject(err));
        inputStream.on("error", (err) => reject(err));
        outputStream.on("error", (err) => reject(err));
        outputStream.on("finish", () => resolve());

        inputStream.pipe(converter).pipe(outputStream);
      });

      if (fs.existsSync(outSvgPath) && fs.statSync(outSvgPath).size > 100) {
        return outSvgPath;
      }
    } catch (pkgErr) {
      console.warn("[Inkscape Package] Stream conversion error, falling back to CLI execution:", pkgErr.message);
    }
  }

  // 2. Direct binary invocation (Inkscape CLI)
  console.log(`[Inkscape CLI] Converting: ${path.basename(pdfPath)} -> ${path.basename(outSvgPath)}`);
  
  try {
    await execFileAsync(binaryPath, [pdfPath, ...exportArgs], {
      windowsHide: true,
      timeout: 90000,
      maxBuffer: 50 * 1024 * 1024
    });
  } catch (popplerErr) {
    // If --pdf-poppler flag is not supported by this specific Inkscape build, retry without it
    console.warn(`[Inkscape CLI] Flag --pdf-poppler failed (${popplerErr.message.split('\n')[0]}), retrying standard import...`);
    const fallbackArgs = [
      `--export-filename=${outSvgPath}`,
      "--export-type=svg",
      "--export-text-to-path",
      "--export-area-page"
    ];
    await execFileAsync(binaryPath, [pdfPath, ...fallbackArgs], {
      windowsHide: true,
      timeout: 90000,
      maxBuffer: 50 * 1024 * 1024
    });
  }

  if (!fs.existsSync(outSvgPath) || fs.statSync(outSvgPath).size === 0) {
    throw new Error(`Inkscape completed but output file is empty: ${outSvgPath}`);
  }

  return outSvgPath;
};

/**
 * Splits a multi-page PDF into an array of single-page PDF file paths.
 * Uses pdf-lib if available, or returns [pdfPath] if it's already a single-page PDF.
 */
export const splitPdfFileOnBackend = async (pdfPath, tempDir, maxPages = Infinity) => {
  if (!PDFLib) {
    return [pdfPath];
  }

  try {
    const pdfBytes = fs.readFileSync(pdfPath);
    const pdfDoc = await PDFLib.PDFDocument.load(pdfBytes);
    const totalPages = pdfDoc.getPageCount();

    if (totalPages <= 1) {
      return [pdfPath];
    }

    const pagesToExtract = Math.min(totalPages, maxPages);
    const singlePdfPaths = [];

    for (let i = 0; i < pagesToExtract; i++) {
      const singleDoc = await PDFLib.PDFDocument.create();
      const [copiedPage] = await singleDoc.copyPages(pdfDoc, [i]);
      singleDoc.addPage(copiedPage);

      const singlePdfBytes = await singleDoc.save();
      const singlePagePath = path.join(tempDir, `split_page_${i + 1}.pdf`);
      fs.writeFileSync(singlePagePath, singlePdfBytes);
      singlePdfPaths.push(singlePagePath);
    }

    return singlePdfPaths;
  } catch (err) {
    console.warn("[PDF Split Backend] Could not split PDF using pdf-lib:", err.message);
    return [pdfPath];
  }
};

/**
 * Main conversion entry point:
 * Converts single or multi-page PDF(s) to Flipbook vector SVG pages.
 *
 * Uses:
 * 1. Single-command batch execution for Inkscape (boots process once for all pages, 10x faster).
 * 2. Parallel concurrency pool fallback if batch misses any pages.
 *
 * @param {string|Array<string>} pdfPaths - Path or array of paths to PDF file(s).
 * @param {object} options - Options { maxPages, concurrency }.
 * @returns {Promise<{ pages: Array, width: number, height: number, isUniform: boolean, totalPages: number }>}
 */
export const convertPdfWithInkscape = async (pdfPaths, options = {}) => {
  const rawPaths = Array.isArray(pdfPaths) ? pdfPaths : [pdfPaths];
  const maxPages = options.maxPages || Infinity;

  const tempDir = path.join(__dirname, "../temp_uploads/pdf_uploads", `inkscape_${Date.now()}_${Math.random().toString(36).substr(2, 6)}`);
  if (!fs.existsSync(tempDir)) {
    fs.mkdirSync(tempDir, { recursive: true });
  }

  const generatedTempFiles = [];

  try {
    // 1. Expand multi-page PDFs into single-page PDF paths
    let singlePagePdfPaths = [];
    for (const p of rawPaths) {
      const splitPaths = await splitPdfFileOnBackend(p, tempDir, maxPages);
      if (splitPaths.length > 1 || splitPaths[0] !== p) {
        generatedTempFiles.push(...splitPaths);
      }
      singlePagePdfPaths.push(...splitPaths);
      if (singlePagePdfPaths.length >= maxPages) break;
    }

    singlePagePdfPaths = singlePagePdfPaths.slice(0, maxPages);

    const binaryPath = getInkscapePath();
    const outSvgMap = new Map(); // pageIndex -> outSvgPath

    singlePagePdfPaths.forEach((_, idx) => {
      const pageNum = idx + 1;
      const expectedSvg = path.join(tempDir, `page_${pageNum}.svg`);
      outSvgMap.set(idx, expectedSvg);
      generatedTempFiles.push(expectedSvg);
    });

    // 2. Fast Strategy A: Chunked Inkscape Batch Execution
    // Processes pages in manageable chunks of up to 8 pages per batch process
    // instead of dumping the entire file at once. This avoids OS CLI buffer limits and RAM exhaustion.
    const BATCH_CHUNK_SIZE = 8;
    let batchSucceeded = false;

    if (binaryPath && fs.existsSync(binaryPath) && singlePagePdfPaths.length > 0) {
      try {
        const totalChunks = Math.ceil(singlePagePdfPaths.length / BATCH_CHUNK_SIZE);
        console.log(`[Inkscape Batch] Converting ${singlePagePdfPaths.length} pages in ${totalChunks} chunked batch(es)...`);

        for (let chunkIdx = 0; chunkIdx < totalChunks; chunkIdx++) {
          const chunkPages = singlePagePdfPaths.slice(chunkIdx * BATCH_CHUNK_SIZE, (chunkIdx + 1) * BATCH_CHUNK_SIZE);
          console.log(`[Inkscape Batch] Processing batch ${chunkIdx + 1}/${totalChunks} (${chunkPages.length} pages)...`);

          const batchArgs = [
            "--export-type=svg",
            "--export-text-to-path",
            "--pdf-poppler",
            "--export-area-page",
            ...chunkPages
          ];

          try {
            await execFileAsync(binaryPath, batchArgs, {
              windowsHide: true,
              timeout: 90000,
              maxBuffer: 100 * 1024 * 1024
            });
          } catch (popplerBatchErr) {
            console.warn(`[Inkscape Batch] Batch chunk ${chunkIdx + 1} with --pdf-poppler failed, retrying standard batch...`);
            const fallbackBatchArgs = [
              "--export-type=svg",
              "--export-text-to-path",
              "--export-area-page",
              ...chunkPages
            ];
            await execFileAsync(binaryPath, fallbackBatchArgs, {
              windowsHide: true,
              timeout: 90000,
              maxBuffer: 100 * 1024 * 1024
            });
          }
        }

        // Verify if all outputs were generated (Inkscape replaces .pdf extension with .svg)
        const allGenerated = singlePagePdfPaths.every((p, idx) => {
          const directSvg = p.replace(/\.pdf$/i, ".svg");
          const targetSvg = outSvgMap.get(idx);
          if (fs.existsSync(directSvg) && fs.statSync(directSvg).size > 100) {
            if (directSvg !== targetSvg && !fs.existsSync(targetSvg)) {
              fs.copyFileSync(directSvg, targetSvg);
              generatedTempFiles.push(directSvg);
            }
            return true;
          }
          return fs.existsSync(targetSvg) && fs.statSync(targetSvg).size > 100;
        });

        if (allGenerated) {
          console.log(`[Inkscape Batch] All ${singlePagePdfPaths.length} pages converted successfully in chunked batches!`);
          batchSucceeded = true;
        } else {
          console.warn("[Inkscape Batch] Some pages missing in batch output, completing with parallel pool...");
        }
      } catch (batchErr) {
        console.warn("[Inkscape Batch] Batch process error, falling back to parallel conversion:", batchErr.message);
      }
    }

    // 3. Strategy B: Parallel Concurrency Pool (Fallback)
    // If batch mode missed any pages, converts them concurrently using multiple workers
    if (!batchSucceeded) {
      const concurrency = Math.min(os.cpus()?.length || 4, 4);
      console.log(`[Inkscape Parallel] Converting pages using worker pool (concurrency: ${concurrency})...`);

      const missingIndices = singlePagePdfPaths
        .map((_, idx) => idx)
        .filter((idx) => {
          const expectedSvg = outSvgMap.get(idx);
          return !fs.existsSync(expectedSvg) || fs.statSync(expectedSvg).size < 100;
        });

      let activeIdx = 0;
      const workers = Array.from({ length: Math.min(concurrency, missingIndices.length) }, async () => {
        while (activeIdx < missingIndices.length) {
          const currentIdx = missingIndices[activeIdx++];
          const singlePdf = singlePagePdfPaths[currentIdx];
          const outSvgPath = outSvgMap.get(currentIdx);
          try {
            await convertSinglePdfPageWithInkscape(singlePdf, outSvgPath);
          } catch (pageErr) {
            console.error(`[Inkscape Parallel] Error converting page ${currentIdx + 1}:`, pageErr.message);
          }
        }
      });

      await Promise.all(workers);
    }

    // 4. Read and format all generated SVGs for flipbook
    const pages = [];
    for (let i = 0; i < singlePagePdfPaths.length; i++) {
      const pageNumber = i + 1;
      const pageName = `Page ${pageNumber}`;
      const outSvgPath = outSvgMap.get(i);

      if (!fs.existsSync(outSvgPath) || fs.statSync(outSvgPath).size === 0) {
        console.warn(`[Inkscape] Missing SVG output for page ${pageNumber}`);
        continue;
      }

      const rawSvg = fs.readFileSync(outSvgPath, "utf8");
      const formattedSvg = formatInkscapeSvgForFlipbook(rawSvg, pageNumber, pageName);

      // Extract width and height from formatted SVG
      const vbMatch = formattedSvg.match(/viewBox=["']0 0 ([0-9.]+) ([0-9.]+)["']/i);
      const width = vbMatch ? parseFloat(vbMatch[1]) : 210;
      const height = vbMatch ? parseFloat(vbMatch[2]) : 297;

      pages.push({
        pageNumber,
        pageName,
        content: formattedSvg,
        width,
        height,
        isVector: true
      });
    }

    if (pages.length === 0) {
      throw new Error("No pages could be converted by Inkscape.");
    }

    const firstW = pages[0].width;
    const firstH = pages[0].height;
    const isUniform = pages.every(
      (p) => Math.abs(p.width - firstW) < 1 && Math.abs(p.height - firstH) < 1
    );

    return {
      pages,
      width: firstW,
      height: firstH,
      isUniform,
      totalPages: pages.length
    };
  } finally {
    // Cleanup temporary files and directory
    for (const f of generatedTempFiles) {
      if (fs.existsSync(f)) {
        try { fs.unlinkSync(f); } catch (e) {}
      }
    }
    if (fs.existsSync(tempDir)) {
      try { fs.rmSync(tempDir, { recursive: true, force: true }); } catch (e) {}
    }
  }
};

/**
 * Exports one or more SVG pages into a high-fidelity vector PDF using Inkscape.
 * Uses --export-text-to-path to outline all text into vector bezier curves,
 * ensuring Adobe Illustrator opens the PDF with 100% vector fidelity and zero font errors.
 * If multiple pages are provided, merges them using pdf-lib.
 *
 * @param {Array<{ svgString: string, pageNumber?: number, width?: number, height?: number }>} pages
 * @param {Object} options
 * @returns {Promise<Buffer>}
 */
export const exportSvgsToVectorPdf = async (pages, options = {}) => {
  const binaryPath = getInkscapePath();
  if (!binaryPath || !fs.existsSync(binaryPath)) {
    throw new Error(`Inkscape executable not found at: "${binaryPath || ''}". Please verify INKSCAPE_PATH in .env`);
  }

  if (!pages || !Array.isArray(pages) || pages.length === 0) {
    throw new Error("No SVG pages provided for PDF export");
  }

  const randomId = Math.random().toString(36).substring(2, 9) + Date.now();
  const tempDir = path.join(os.tmpdir(), `vector_export_${randomId}`);
  fs.mkdirSync(tempDir, { recursive: true });

  const generatedFiles = [];
  const singlePdfPaths = [];

  try {
    const pageTasks = [];

    for (let i = 0; i < pages.length; i++) {
      const page = pages[i];
      let svg = page.svgString || page.content || page.html || "";
      if (!svg || typeof svg !== "string") {
        console.warn(`[Vector PDF Export] Page ${i + 1} has empty SVG content, skipping.`);
        continue;
      }

      // 1. Sanitize SVG for Inkscape vector export
      // Remove editor-only overlay artifacts (Document Shield, Free Frame, custom controls, selection outlines)
      svg = svg.replace(/<rect\b[^>]*?(?:data-name=["']Document Shield["']|data-type=["']shield["']|id=["']shield-[^"']*["'])[^>]*\/?>/gis, "");
      svg = svg.replace(/<rect\b[^>]*?(?:data-name=["']Document Shield["']|data-type=["']shield["']|id=["']shield-[^"']*["'])[^>]*>[\s\S]*?<\/rect>/gis, "");
      svg = svg.replace(/<g\b[^>]*?(?:data-name=["']Document Shield["']|data-type=["']shield["'])[^>]*>[\s\S]*?<\/g>/gis, "");

      // Free Frame and custom controls
      svg = svg.replace(/<rect\b[^>]*?(?:data-name=["']Free Frame["']|data-type=["']free-frame["'])[^>]*\/?>/gis, "");
      svg = svg.replace(/<rect\b[^>]*?(?:data-name=["']Free Frame["']|data-type=["']free-frame["'])[^>]*>[\s\S]*?<\/rect>/gis, "");
      svg = svg.replace(/<g\b[^>]*?(?:data-name=["']Free Frame["']|data-type=["']free-frame["'])[^>]*>[\s\S]*?<\/g>/gis, "");
      svg = svg.replace(/<(?:rect|circle|path|line)\b[^>]*?id=["']custom-ctrl-[^"']*["'][^>]*\/?>/gis, "");
      svg = svg.replace(/<g\b[^>]*?id=["']custom-ctrl-[^"']*["'][^>]*>[\s\S]*?<\/g>/gis, "");

      svg = svg.replace(/<sodipodi:namedview[^>]*>.*?<\/sodipodi:namedview>/gis, "");
      svg = svg.replace(/<sodipodi:namedview[^>]*\/>/gi, "");

      // SVG specifications do not allow 'transparent' as a valid color value for fill/stroke.
      // Inkscape / Cairo falls back to initial SVG fill: #000000 (opaque black)!
      svg = svg.replace(/\bfill=["']transparent["']/gi, 'fill="none"');
      svg = svg.replace(/\bstroke=["']transparent["']/gi, 'stroke="none"');
      svg = svg.replace(/fill:\s*transparent\b/gi, 'fill: none');
      svg = svg.replace(/stroke:\s*transparent\b/gi, 'stroke: none');

      // Ensure every page has a solid base background if none exists.
      // MUST be inserted right after <svg ...> to stay at the very back (z-index 0),
      // never after </defs> which could be at the bottom and cover the page content!
      if (!svg.includes('data-name="Overlay"') && !svg.includes('data-type="background"')) {
        svg = svg.replace(/(<svg[^>]*>)/i, `$1\n  <rect width="100%" height="100%" fill="#ffffff" data-name="Overlay" data-type="background" />`);
      }

      // If SVG contains any residual foreignObject, convert to standard SVG text/tspan
      if (svg.includes("<foreignObject") || svg.includes("<foreignobject")) {
        svg = svg.replace(/<foreignObject([^>]*?)>(.*?)<\/foreignObject>/gis, (_match, foAttrs, foInner) => {
          const xMatch = foAttrs.match(/\bx\s*=\s*["']([^"']+)["']/i);
          const yMatch = foAttrs.match(/\by\s*=\s*["']([^"']+)["']/i);
          const wMatch = foAttrs.match(/\bwidth\s*=\s*["']([^"']+)["']/i);
          const x = xMatch ? parseFloat(xMatch[1]) : 0;
          const y = yMatch ? parseFloat(yMatch[1]) : 0;
          const w = wMatch ? parseFloat(wMatch[1]) : 100;

          // Try to extract styling from inner div
          const fsMatch = foInner.match(/font-size:\s*([0-9.]+)(?:px|pt)?/i);
          const fontSize = fsMatch ? parseFloat(fsMatch[1]) : 14;
          const ffMatch = foInner.match(/font-family:\s*([^;"]+)/i);
          const fontFamily = ffMatch ? ffMatch[1].trim() : 'Poppins, sans-serif';
          const colorMatch = foInner.match(/(?:^|[;\s])color:\s*([^;"]+)/i);
          const fill = colorMatch ? colorMatch[1].trim() : '#000000';
          const alignMatch = foInner.match(/text-align:\s*([a-zA-Z]+)/i);
          const textAlign = alignMatch ? alignMatch[1].toLowerCase() : 'left';

          const textAnchor = textAlign === 'center' ? 'middle' : (textAlign === 'right' ? 'end' : 'start');
          const anchorX = textAlign === 'center' ? (x + w / 2) : (textAlign === 'right' ? (x + w) : x);

          // Extract text lines
          const cleanText = foInner.replace(/<br\s*\/?>/gi, '\n').replace(/<[^>]+>/g, '');
          const lines = cleanText.split('\n').map(l => l.trim()).filter(Boolean);
          if (lines.length === 0) return '';

          const lineHeight = fontSize * 1.25;
          const baselineOffset = fontSize * 0.85;

          const tspans = lines.map((line, lineIdx) =>
            `<tspan x="${anchorX.toFixed(2)}" y="${(y + baselineOffset + lineIdx * lineHeight).toFixed(2)}">${line.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')}</tspan>`
          ).join('');

          return `<text x="${anchorX.toFixed(2)}" y="${(y + baselineOffset).toFixed(2)}" font-family="${fontFamily}" font-size="${fontSize}" fill="${fill}" text-anchor="${textAnchor}">${tspans}</text>`;
        });
      }

      // Normalize viewBox casing and attributes
      svg = svg.replace(/\bviewbox\s*=/gi, "viewBox=");
      svg = svg.replace(/\bpreserveaspectratio\s*=/gi, "preserveAspectRatio=");

      // Normalize viewBox and physical dimensions
      const vbMatch = svg.match(/viewBox\s*=\s*["']([^"']+)["']/i);
      let nativeW = 0;
      let nativeH = 0;
      let vbMinX = 0;
      let vbMinY = 0;
      if (vbMatch) {
        const parts = vbMatch[1].trim().split(/[\s,]+/);
        if (parts.length >= 4) {
          vbMinX = parseFloat(parts[0]) || 0;
          vbMinY = parseFloat(parts[1]) || 0;
          nativeW = parseFloat(parts[2]);
          nativeH = parseFloat(parts[3]);
        }
      }

      // If dimensions in root <svg> are missing or in huge raster pixels, normalize
      if (nativeW > 0 && nativeH > 0) {
        svg = svg.replace(/<svg\b([^>]*?)>/i, (_m, attrs) => {
          const cleaned = attrs
            .replace(/\s+width\s*=\s*["'][^"']*["']/gi, "")
            .replace(/\s+height\s*=\s*["'][^"']*["']/gi, "")
            .replace(/\s+viewBox\s*=\s*["'][^"']*["']/gi, "")
            .replace(/\s+viewbox\s*=\s*["'][^"']*["']/gi, "");
          // If native dimensions look like mm (e.g. 210x297), keep as mm; otherwise px (96 DPI)
          const unit = (nativeW <= 500 && nativeH <= 500) ? "mm" : "px";
          return `<svg${cleaned} viewBox="${vbMinX} ${vbMinY} ${nativeW} ${nativeH}" width="${nativeW}${unit}" height="${nativeH}${unit}">`;
        });
      }

      // Ensure SVG is pure <svg>...</svg> and strip any accidental HTML/parsererror wrappers
      const svgStartIndex = svg.indexOf('<svg');
      const svgEndIndex = svg.lastIndexOf('</svg>');
      if (svgStartIndex !== -1 && svgEndIndex !== -1 && svgEndIndex > svgStartIndex) {
        svg = svg.substring(svgStartIndex, svgEndIndex + 6);
      }

      const hotspotMatches = svg.match(/<g\b[^>]*(?:data-is-hotspot|data-type=["']hotspot["']|id=["']hotspot-[^"']*["'])[^>]*>[\s\S]*?<\/g>/gi);
      console.log(`[Vector PDF Export] Page ${i + 1} Hotspot XML:`, hotspotMatches ? hotspotMatches[0].substring(0, 300) : "NO HOTSPOT FOUND");

      const svgPath = path.join(tempDir, `page_${i + 1}.svg`);
      const pdfPath = path.join(tempDir, `page_${i + 1}.pdf`);
      fs.writeFileSync(svgPath, svg, "utf8");
      generatedFiles.push(svgPath, pdfPath);

      pageTasks.push({
        index: i,
        pageNum: i + 1,
        svgPath,
        pdfPath
      });
    }

    if (pageTasks.length === 0) {
      throw new Error("No pages could be converted to vector PDF.");
    }

    // 2. Export pages using Inkscape CLI in parallel worker pool
    // --export-type=pdf: Pure vector PDF output
    // --export-text-to-path: Converts all font text to vector bezier paths (<path d="...">)
    // --export-area-page: Preserves exact physical page margins
    const concurrency = Math.min(os.cpus()?.length || 4, 4);
    console.log(`[Vector PDF Export] Converting ${pageTasks.length} page(s) via Inkscape pool (concurrency: ${concurrency})...`);

    let nextTaskIdx = 0;
    const workers = Array.from({ length: Math.min(concurrency, pageTasks.length) }, async (_, workerId) => {
      while (nextTaskIdx < pageTasks.length) {
        const task = pageTasks[nextTaskIdx++];
        const args = [
          task.svgPath,
          `--export-filename=${task.pdfPath}`,
          "--export-type=pdf",
          "--export-text-to-path",
          "--export-area-page"
        ];

        console.log(`[Vector PDF Export] [Worker ${workerId + 1}] Processing page ${task.pageNum}/${pageTasks.length}...`);
        try {
          const { stdout, stderr } = await execFileAsync(binaryPath, args, {
            windowsHide: true,
            timeout: 90000,
            maxBuffer: 50 * 1024 * 1024
          });
          if (stderr && !stderr.includes('Warning:') && !stderr.includes('font-family')) {
            console.warn(`[Vector PDF Export] Page ${task.pageNum} Inkscape stderr:`, stderr.trim());
          }
        } catch (execErr) {
          console.error(`[Vector PDF Export] Page ${task.pageNum} Inkscape CLI failed:`, execErr.message);
          if (execErr.stdout) console.error(`[Vector PDF Export] Page ${task.pageNum} stdout:`, execErr.stdout);
          if (execErr.stderr) console.error(`[Vector PDF Export] Page ${task.pageNum} stderr:`, execErr.stderr);
          throw new Error(`Inkscape failed to produce PDF for page ${task.pageNum}: ${execErr.stderr || execErr.message}`);
        }

        if (!fs.existsSync(task.pdfPath) || fs.statSync(task.pdfPath).size === 0) {
          let sample = "";
          try {
            sample = fs.readFileSync(task.svgPath, "utf8").substring(0, 300);
          } catch (_) {}
          console.error(`[Vector PDF Export] Page ${task.pageNum} produced 0 bytes. SVG start:`, sample);
          throw new Error(`Inkscape failed to produce PDF for page ${task.pageNum}`);
        }
      }
    });

    await Promise.all(workers);

    for (const task of pageTasks) {
      singlePdfPaths.push(task.pdfPath);
    }

    // 3. Single page -> return directly
    if (singlePdfPaths.length === 1) {
      console.log(`[Vector PDF Export] Single page export complete (${fs.statSync(singlePdfPaths[0]).size} bytes).`);
      return fs.readFileSync(singlePdfPaths[0]);
    }

    // 4. Multi-page -> merge using pdf-lib
    console.log(`[Vector PDF Export] Merging ${singlePdfPaths.length} vector PDF pages via pdf-lib...`);
    const pdfLibModule = PDFLib || require("pdf-lib");
    const PDFDoc = pdfLibModule.PDFDocument || pdfLibModule;
    const mergedDoc = await PDFDoc.create();

    for (const singlePdfPath of singlePdfPaths) {
      const pageBytes = fs.readFileSync(singlePdfPath);
      const srcDoc = await PDFDoc.load(pageBytes, { ignoreEncryption: true });
      const copiedPages = await mergedDoc.copyPages(srcDoc, srcDoc.getPageIndices());
      copiedPages.forEach((p) => mergedDoc.addPage(p));
    }

    const mergedBytes = await mergedDoc.save({ useObjectStreams: false });
    console.log(`[Vector PDF Export] Multi-page merge complete (${mergedBytes.length} bytes).`);
    return Buffer.from(mergedBytes);
  } finally {
    // Cleanup temporary files
    for (const f of generatedFiles) {
      if (fs.existsSync(f)) {
        try { fs.unlinkSync(f); } catch (e) {}
      }
    }
    if (fs.existsSync(tempDir)) {
      try { fs.rmSync(tempDir, { recursive: true, force: true }); } catch (e) {}
    }
  }
};

