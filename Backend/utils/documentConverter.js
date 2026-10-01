import fs from "fs";
import path from "path";
import os from "os";
import { execFile, exec } from "child_process";
import { promisify } from "util";
import { fileURLToPath, pathToFileURL } from "url";
import { createRequire } from "module";
import { nanoid } from "nanoid";
import { uploadBufferToSupabase, downloadFileFromSupabase, deleteFolderFromSupabase } from "../config/supabase.js";

const require = createRequire(import.meta.url);
const execFileAsync = promisify(execFile);
const execAsync = promisify(exec);

// The Supabase folder used for temporary conversion staging (uploaded, processed, then deleted)
const SUPABASE_TEMP_FOLDER = "Temp_data";

/**
 * Returns a real Windows temp directory path that:
 *  - Has NO 8.3 short names (e.g. PRAVEE~1) — LibreOffice fails to load files from 8.3 paths.
 *  - Has NO spaces — LibreOffice sometimes fails with paths containing spaces.
 *
 * Priority order:
 *  1. USERPROFILE/AppData/Local/Temp  (always full long name: C:\Users\Praveenkumar\...)
 *  2. LOCALAPPDATA/Temp               (same, via different env var)
 *  3. SystemDrive:\lo_temp            (absolute fallback with no user-name in path)
 *  4. os.tmpdir()                     (last resort)
 */
const getRealTempDir = () => {
  if (process.platform !== "win32") return os.tmpdir();

  const candidates = [
    process.env.USERPROFILE  ? path.join(process.env.USERPROFILE, "AppData", "Local", "Temp") : null,
    process.env.LOCALAPPDATA ? path.join(process.env.LOCALAPPDATA, "Temp") : null,
    process.env.SystemDrive  ? path.join(process.env.SystemDrive + "\\", "lo_temp") : null,
    "C:\\lo_temp"
  ].filter(Boolean);

  for (const candidate of candidates) {
    // Reject if it still contains a tilde (8.3 short name indicator)
    if (candidate.includes("~")) continue;
    try {
      fs.mkdirSync(candidate, { recursive: true });
      return candidate;
    } catch (e) { /* try next */ }
  }

  return os.tmpdir(); // absolute last resort
};

/**
 * Build a file:/// URI from a local filesystem path WITHOUT URL-encoding
 * special characters like ~ which would break LibreOffice's profile loader.
 */
const toFileUri = (localPath) => {
  return "file:///" + localPath.replace(/\\/g, "/").replace(/^\//, "");
};

/**
 * Build a file:/// URI for a directory from a local filesystem path.
 * In LibreOffice UNO URL specification, directory URLs MUST end with a slash '/'.
 */
const toDirUri = (localPath) => {
  let uri = "file:///" + localPath.replace(/\\/g, "/").replace(/^\//, "");
  if (!uri.endsWith("/")) uri += "/";
  return uri;
};

/**
 * Returns a sanitized environment for running LibreOffice headlessly.
 * Strips conflicting Python environment variables (e.g. system Python / Anaconda / VS Code)
 * that cause LibreOffice's internal Python to crash with:
 * "Could not find platform independent libraries <prefix>"
 */
const getCleanLibreOfficeEnv = (binaryPath) => {
  const cleanEnv = { ...process.env };
  delete cleanEnv.PYTHONHOME;
  delete cleanEnv.PYTHONPATH;
  delete cleanEnv.PYTHONSTARTUP;
  delete cleanEnv.PYTHONEXECUTABLE;
  delete cleanEnv.PYTHONIOENCODING;
  delete cleanEnv.PYTHONUTF8;

  const binDir = path.dirname(binaryPath);
  cleanEnv.PATH = `${binDir}${path.delimiter}${cleanEnv.PATH || ""}`;
  return cleanEnv;
};

/**
 * Standard execution options for LibreOffice child processes.
 * Setting cwd to path.dirname(binaryPath) (C:\Program Files\LibreOffice\program)
 * ensures that relative path lookups for python-core and DLLs succeed.
 */
const getExecOptions = (binaryPath, timeout = 45000) => ({
  cwd: path.dirname(binaryPath),
  env: getCleanLibreOfficeEnv(binaryPath),
  windowsHide: true,
  timeout,
  maxBuffer: 50 * 1024 * 1024
});

/**
 * Find the most-recently-modified PDF file in a directory.
 * Returns null if no PDF files exist.
 */
const findNewestPdf = (dir) => {
  try {
    const pdfs = fs.readdirSync(dir)
      .filter(f => f.toLowerCase().endsWith(".pdf"))
      .map(f => ({ name: f, mtime: fs.statSync(path.join(dir, f)).mtimeMs }))
      .sort((a, b) => b.mtime - a.mtime);
    return pdfs.length > 0 ? path.join(dir, pdfs[0].name) : null;
  } catch (e) { return null; }
};

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Optional dynamic import for @matbee/libreoffice-converter (WASM fallback)
let WasmLibreConverter = null;
try {
  WasmLibreConverter = require("@matbee/libreoffice-converter");
  console.log("[Document Converter] Loaded @matbee/libreoffice-converter WASM package.");
} catch (e) {
  // Not installed
}

let cachedLibreOfficePath = null;

const CANDIDATE_SOFFICE_PATHS = [
  process.env.LIBREOFFICE_PATH,
  "C:\\Program Files\\LibreOffice\\program\\soffice.exe",
  "C:\\Program Files\\LibreOffice\\program\\soffice.com",
  "/usr/bin/soffice",
  "/usr/local/bin/soffice",
  "/usr/bin/libreoffice",
  "soffice.exe",
  "soffice.com",
  "soffice",
  "libreoffice"
].filter(Boolean);

/**
 * Resolves the path to the LibreOffice / soffice binary using LIBREOFFICE_PATH configured in .env,
 * and ensures its directory is added to process.env.PATH.
 */
export const getLibreOfficePath = () => {
  if (cachedLibreOfficePath && fs.existsSync(cachedLibreOfficePath)) {
    return cachedLibreOfficePath;
  }

  const envPath = process.env.LIBREOFFICE_PATH;
  if (envPath && fs.existsSync(envPath)) {
    cachedLibreOfficePath = envPath;
    const binDir = path.dirname(envPath);
    if (process.env.PATH && !process.env.PATH.includes(binDir)) {
      process.env.PATH = `${binDir}${path.delimiter}${process.env.PATH}`;
    }
    return envPath;
  }

  for (const candidate of CANDIDATE_SOFFICE_PATHS) {
    try {
      if (fs.existsSync(candidate)) {
        cachedLibreOfficePath = candidate;
        const binDir = path.dirname(candidate);
        if (process.env.PATH && !process.env.PATH.includes(binDir)) {
          process.env.PATH = `${binDir}${path.delimiter}${process.env.PATH}`;
        }
        return candidate;
      }
    } catch (e) {}
  }

  const fallback = process.platform === "win32" ? "C:\\Program Files\\LibreOffice\\program\\soffice.exe" : "soffice";
  cachedLibreOfficePath = fallback;
  return fallback;
};

/**
 * Checks if LibreOffice is available and returns version info headlessly and silently.
 */
export const checkLibreOfficeStatus = async () => {
  const binaryPath = getLibreOfficePath();

  try {
    const { stdout } = await execFileAsync(binaryPath, ["--headless", "--invisible", "--nologo", "--version"], getExecOptions(binaryPath, 10000));
    return {
      available: true,
      hasWasm: !!WasmLibreConverter,
      version: stdout.trim().split("\n")[0],
      path: binaryPath
    };
  } catch (err) {
    try {
      const fallbackCmd = process.platform === "win32"
        ? "soffice.com --headless --invisible --nologo --version"
        : "soffice --headless --invisible --nologo --version";
      const { stdout } = await execAsync(fallbackCmd, {
        cwd: path.dirname(binaryPath),
        env: getCleanLibreOfficeEnv(binaryPath),
        windowsHide: true,
        timeout: 8000
      });
      return {
        available: true,
        hasWasm: !!WasmLibreConverter,
        version: stdout.trim().split("\n")[0],
        path: process.platform === "win32" ? "soffice.com" : "soffice"
      };
    } catch (e) {
      return {
        available: !!WasmLibreConverter,
        hasWasm: !!WasmLibreConverter,
        path: binaryPath,
        error: "LibreOffice executable (soffice) not found on system."
      };
    }
  }
};

/**
 * Supported office document extensions
 */
export const SUPPORTED_OFFICE_EXTENSIONS = [
  ".doc",
  ".docx",
  ".ppt",
  ".pptx",
  ".odt",
  ".odp",
  ".rtf",
  ".txt"
];

export const isOfficeDocument = (filename) => {
  if (!filename) return false;
  const ext = path.extname(filename).toLowerCase();
  return SUPPORTED_OFFICE_EXTENSIONS.includes(ext);
};

/**
 * Converts a Word (.doc, .docx) or PowerPoint (.ppt, .pptx) file into a PDF.
 *
 * Flow:
/**
 * Converts a Word (.doc, .docx) or PowerPoint (.ppt, .pptx) file into a PDF.
 *
 * Flow:
 *  1. Upload input file → Supabase Temp_data/<jobId>/ and get the public URL.
 *  2. Strategy A (preferred): Pass the Supabase PUBLIC URL directly to LibreOffice.
 *     LibreOffice natively supports HTTP/HTTPS input URLs — this avoids ALL local
 *     file path issues (spaces, 8.3 short names, ~1 in Windows TEMP paths).
 *  3. Strategy B (fallback): Copy input to a clean local path via USERPROFILE dir,
 *     then run LibreOffice against that local file.
 *  4. WASM converter as last-resort fallback.
 *  5. Cleanup: remove local work dir + Supabase Temp_data/<jobId>/.
/**
 * Sequential FIFO Queue for LibreOffice conversions.
 * Ensures only 1 LibreOffice process runs at a time to prevent:
 *  - Windows .lock file collision in user profile
 *  - Multi-process memory and CPU starvation
 *  - Headless crashes when multiple PPT/DOC files are uploaded
 */
class OfficeConversionQueue {
  constructor() {
    this.queue = [];
    this.isProcessing = false;
  }

  enqueue(task, label = "Document") {
    return new Promise((resolve, reject) => {
      this.queue.push({ task, resolve, reject, label, enqueuedAt: Date.now() });
      console.log(`[Document Queue] Enqueued "${label}". Pending tasks in queue: ${this.queue.length}`);
      this.processNext();
    });
  }

  async processNext() {
    if (this.isProcessing || this.queue.length === 0) return;
    this.isProcessing = true;

    const { task, resolve, reject, label, enqueuedAt } = this.queue.shift();
    const waitTime = Date.now() - enqueuedAt;
    console.log(`[Document Queue] Starting "${label}" (waited ${waitTime}ms in queue, ${this.queue.length} remaining)...`);

    try {
      const result = await task();
      resolve(result);
    } catch (err) {
      reject(err);
    } finally {
      this.isProcessing = false;
      // Brief pause to allow OS file handles, locks, and child processes to clean up
      setTimeout(() => this.processNext(), 100);
    }
  }

  get length() {
    return this.queue.length;
  }
}

export const officeQueue = new OfficeConversionQueue();

/**
 * Converts a Word (.doc, .docx) or PowerPoint (.ppt, .pptx) file into a PDF.
 * Automatically queued via officeQueue to prevent concurrent LibreOffice crashes.
 *
 * @param {string} inputDocPath - Path to input document.
 * @param {string} outputPdfPath - Desired output path for the converted PDF.
 * @returns {Promise<string>} - Resolves with outputPdfPath on success.
 */
export const convertOfficeToPdf = (inputDocPath, outputPdfPath) => {
  const label = path.basename(inputDocPath);
  return officeQueue.enqueue(() => executeOfficeConversion(inputDocPath, outputPdfPath), label);
};

/**
 * Convert PowerPoint or Word document to PDF using LibreOffice with isolated profile.
 * Exactly implements the user's tested function:
 * - Creates a temporary profileDir using fs.promises.mkdtemp(path.join(os.tmpdir(), 'lo-profile-'))
 * - Passes -env:UserInstallation=file:///${profileDir.replace(/\\/g, '/')} as the first argument
 * - Uses --headless, --nologo, --nodefault, --nofirststartwizard, --norestore, --convert-to, filter, --outdir, outputDir, inputFile
 * - Runs 'C:\\Program Files\\LibreOffice\\program\\soffice.exe'
 * - Cleans up profileDir in finally block
 *
 * @param {string} inputFile - Path to input presentation or document file.
 * @param {string} outputDir - Directory where converted PDF should be generated.
 * @param {string} [filter] - Optional filter name (e.g. 'pdf:impress_pdf_Export' or 'pdf:writer_pdf_Export').
 * @returns {Promise<string>} - Path to the created PDF file.
 */
export async function convertPptxToPdf(inputFile, outputDir, filter = null) {
  const profileDir = await fs.promises.mkdtemp(
    path.join(os.tmpdir(), 'lo-profile-')
  );

  const ext = path.extname(inputFile).toLowerCase();
  const isPresentation = [".ppt", ".pptx", ".odp"].includes(ext);
  const isWordDoc = [".doc", ".docx", ".odt", ".rtf", ".txt"].includes(ext);
  const targetFilter = filter || (isPresentation ? "pdf:impress_pdf_Export" : (isWordDoc ? "pdf:writer_pdf_Export" : "pdf"));

  const args = [
    `-env:UserInstallation=file:///${profileDir.replace(/\\/g, '/')}`,
    '--headless',
    '--nologo',
    '--nodefault',
    '--nofirststartwizard',
    '--norestore',
    '--convert-to',
    targetFilter,
    '--outdir',
    outputDir,
    inputFile
  ];

  const binaryPath = (process.platform === "win32" && fs.existsSync("C:\\Program Files\\LibreOffice\\program\\soffice.exe"))
    ? "C:\\Program Files\\LibreOffice\\program\\soffice.exe"
    : getLibreOfficePath();

  try {
    console.log(`[Document Converter] Running convertPptxToPdf on ${path.basename(inputFile)} with filter ${targetFilter}`);
    await execFileAsync(
      binaryPath,
      args,
      {
        cwd: path.dirname(binaryPath),
        env: getCleanLibreOfficeEnv(binaryPath),
        windowsHide: true,
        timeout: 120000,
        maxBuffer: 10 * 1024 * 1024
      }
    );
  } catch (err) {
    const errText = `${err.stderr || ''} ${err.stdout || ''} ${err.message || ''}`.toLowerCase();
    const displayFileName = path.basename(inputFile);

    // If LibreOffice reports corruption, unreadable source, or failed to open, throw immediately
    if (
      errText.includes("source file could not be loaded") ||
      errText.includes("cannot be read") ||
      errText.includes("corrupt") ||
      errText.includes("damaged") ||
      errText.includes("password") ||
      errText.includes("format error") ||
      errText.includes("general error") ||
      errText.includes("input/output error") ||
      errText.includes("read error") ||
      errText.includes("could not be opened")
    ) {
      throw new Error(`Your file "${displayFileName}" is corrupted, unreadable, or password-protected. Please check the file in PowerPoint/Word and try again.`);
    }

    // If explicit filter fails, retry with generic 'pdf' filter
    if (targetFilter !== "pdf") {
      console.warn(`[Document Converter] Filter ${targetFilter} failed, retrying with generic 'pdf': ${err.message.split("\n")[0]}`);
      const fallbackArgs = [
        `-env:UserInstallation=file:///${profileDir.replace(/\\/g, '/')}`,
        '--headless',
        '--nologo',
        '--nodefault',
        '--nofirststartwizard',
        '--norestore',
        '--convert-to',
        'pdf',
        '--outdir',
        outputDir,
        inputFile
      ];
      try {
        await execFileAsync(
          binaryPath,
          fallbackArgs,
          {
            cwd: path.dirname(binaryPath),
            env: getCleanLibreOfficeEnv(binaryPath),
            windowsHide: true,
            timeout: 120000,
            maxBuffer: 10 * 1024 * 1024
          }
        );
      } catch (fallbackErr) {
        const fallbackText = `${fallbackErr.stderr || ''} ${fallbackErr.stdout || ''} ${fallbackErr.message || ''}`.toLowerCase();
        if (
          fallbackText.includes("source file could not be loaded") ||
          fallbackText.includes("cannot be read") ||
          fallbackText.includes("corrupt") ||
          fallbackText.includes("damaged") ||
          fallbackText.includes("password") ||
          fallbackText.includes("format error") ||
          fallbackText.includes("general error") ||
          fallbackText.includes("input/output error") ||
          fallbackText.includes("read error") ||
          fallbackText.includes("could not be opened") ||
          fallbackText.includes("command failed")
        ) {
          throw new Error(`Your file "${displayFileName}" is corrupted, unreadable, or password-protected. Please check the file in PowerPoint/Word and try again.`);
        }
        throw fallbackErr;
      }
    } else {
      throw err;
    }
  } finally {
    await fs.promises.rm(profileDir, {
      recursive: true,
      force: true
    }).catch(() => {});
  }

  const pdfName =
    path.basename(inputFile, path.extname(inputFile)) + '.pdf';

  let pdfPath = path.join(outputDir, pdfName);

  if (!fs.existsSync(pdfPath)) {
    const fallbackPdf = findNewestPdf(outputDir);
    if (fallbackPdf && fs.existsSync(fallbackPdf) && fs.statSync(fallbackPdf).size > 0) {
      pdfPath = fallbackPdf;
    } else {
      throw new Error(
        `LibreOffice completed but PDF was not created: ${pdfPath}`
      );
    }
  }

  return pdfPath;
}

const executeOfficeConversion = async (inputDocPath, outputPdfPath) => {
  if (!fs.existsSync(inputDocPath)) {
    throw new Error(`Input document not found: ${inputDocPath}`);
  }

  const inputFileName = path.basename(inputDocPath);
  const jobId = nanoid(10);
  console.log(`[Document Converter] [${jobId}] Converting ${inputFileName} → PDF`);

  const realTempDir = getRealTempDir();
  const localWorkDir = path.join(realTempDir, "lo_work", jobId);
  fs.mkdirSync(localWorkDir, { recursive: true });

  const ext = path.extname(inputFileName).toLowerCase();
  const safeInputFileName = `doc_${jobId}${ext}`;
  const localInputPath = path.join(localWorkDir, safeInputFileName);
  fs.copyFileSync(inputDocPath, localInputPath);

  try {
    const generatedPdfPath = await convertPptxToPdf(localInputPath, localWorkDir);

    const finalOutputDir = path.dirname(outputPdfPath);
    if (!fs.existsSync(finalOutputDir)) fs.mkdirSync(finalOutputDir, { recursive: true });

    fs.copyFileSync(generatedPdfPath, outputPdfPath);

    if (!fs.existsSync(outputPdfPath) || fs.statSync(outputPdfPath).size === 0) {
      throw new Error(`LibreOffice conversion failed: generated PDF at ${outputPdfPath} is missing or empty`);
    }

    console.log(`[Document Converter] [${jobId}] Conversion successful: ${outputPdfPath}`);
    return outputPdfPath;
  } catch (convErr) {
    console.error(`[Document Converter] [${jobId}] Conversion error:`, convErr.message);

    const fullErrStr = `${convErr.message || ''} ${convErr.stderr || ''} ${convErr.stdout || ''}`.toLowerCase();
    if (
      fullErrStr.includes("corrupt") ||
      fullErrStr.includes("cannot be read") ||
      fullErrStr.includes("source file could not be loaded") ||
      fullErrStr.includes("damaged") ||
      fullErrStr.includes("password") ||
      fullErrStr.includes("format error") ||
      fullErrStr.includes("could not be opened") ||
      fullErrStr.includes("input/output error") ||
      fullErrStr.includes("read error") ||
      fullErrStr.includes("command failed")
    ) {
      throw new Error(`Your file "${inputFileName}" is corrupted, unreadable, or password-protected. Please check the file in PowerPoint/Word and try again.`);
    }

    // WASM converter fallback if available
    if (WasmLibreConverter && typeof WasmLibreConverter.createWorkerConverter === "function") {
      try {
        console.log(`[Document Converter] [${jobId}] Strategy fallback: WASM converter`);
        const inputBuffer = fs.readFileSync(inputDocPath);
        const converter = await WasmLibreConverter.createWorkerConverter();
        const pdfResult = await converter.convert(inputBuffer, { outputFormat: "pdf" });
        const finalOutputDir = path.dirname(outputPdfPath);
        if (!fs.existsSync(finalOutputDir)) fs.mkdirSync(finalOutputDir, { recursive: true });
        fs.writeFileSync(outputPdfPath, pdfResult.data);
        await converter.destroy();
        if (fs.existsSync(outputPdfPath) && fs.statSync(outputPdfPath).size > 0) {
          console.log(`[Document Converter] [${jobId}] WASM conversion succeeded`);
          return outputPdfPath;
        }
      } catch (wasmErr) {
        console.warn(`[Document Converter] [${jobId}] WASM fallback failed:`, wasmErr.message);
      }
    }

    throw convErr;
  } finally {
    try { fs.rmSync(localWorkDir, { recursive: true, force: true }); } catch (e) {}
  }
};

