import fs from "fs";
import path from "path";
import { createRequire } from "module";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const require = createRequire(import.meta.url);

let occInstance = null;
let occInitPromise = null;
let opencascadeFactory = null;

/**
 * Dynamically loads the OpenCASCADE WebAssembly factory function in Node.js.
 * 
 * opencascade.js (v1.1.x) ships with an Emscripten-compiled bundle containing `export default opencascade;`,
 * but its package.json does not declare `"type": "module"`. In Node.js ESM mode, importing it directly
 * causes Node's CommonJS loader to fail with:
 *   "SyntaxError: Unexpected token 'export'"
 * 
 * Loading and transforming the factory function at runtime avoids modifying node_modules
 * and correctly provides CommonJS globals (require, __dirname, __filename) needed by Emscripten in Node.
 */
const loadOpenCascadeFactory = () => {
  if (opencascadeFactory) return opencascadeFactory;

  const wasmJsPath = require.resolve("opencascade.js/dist/opencascade.wasm.js");
  if (!fs.existsSync(wasmJsPath)) {
    throw new Error(`OpenCASCADE JS runtime not found at ${wasmJsPath}`);
  }

  let code = fs.readFileSync(wasmJsPath, "utf8");
  // Replace the ESM export statement with module.exports assignment for Node execution
  code = code.replace(/export\s+default\s+opencascade\s*;?/g, "module.exports = opencascade;");

  const scriptDir = path.dirname(wasmJsPath);
  const moduleObj = { exports: {} };
  const wrapper = new Function(
    "module",
    "exports",
    "require",
    "__dirname",
    "__filename",
    code
  );

  wrapper(moduleObj, moduleObj.exports, require, scriptDir, wasmJsPath);

  if (typeof moduleObj.exports !== "function") {
    throw new Error("Failed to initialize OpenCASCADE: factory export is not a function.");
  }

  opencascadeFactory = moduleObj.exports;
  return opencascadeFactory;
};

/**
 * Supported CAD formats for OpenCASCADE conversion
 * Specifically: STL, STP, STEP, IGS, IGES
 */
export const CAD_EXTENSIONS = [
  ".stl",
  ".step",
  ".stp",
  ".iges",
  ".igs"
];

/**
 * Check if filename has a CAD extension
 * @param {string} filename 
 * @returns {boolean}
 */
export const isCadFormat = (filename) => {
  if (!filename) return false;
  const ext = path.extname(filename).toLowerCase();
  return CAD_EXTENSIONS.includes(ext);
};

/**
 * Parses binary or ASCII STL file data into mesh buffers (positions, normals, indices)
 * @param {Buffer|Uint8Array} buffer 
 * @returns {{ positions: Float32Array, normals: Float32Array, indices: Uint16Array|Uint32Array, vertexCount: number, indexCount: number }}
 */
export const parseStlBuffer = (buffer) => {
  const buf = Buffer.isBuffer(buffer) ? buffer : Buffer.from(buffer);

  let isBinary = false;
  if (buf.length >= 84) {
    const numTriangles = buf.readUInt32LE(80);
    const expectedSize = 84 + numTriangles * 50;
    if (expectedSize === buf.length) {
      isBinary = true;
    } else {
      const checkLen = Math.min(512, buf.length);
      let nullCount = 0;
      for (let i = 0; i < checkLen; i++) {
        if (buf[i] === 0) nullCount++;
      }
      if (nullCount > 0) isBinary = true;
    }
  }

  const positions = [];
  const normals = [];
  const indices = [];
  let vertexIndex = 0;

  if (isBinary) {
    const numTriangles = buf.readUInt32LE(80);
    let offset = 84;
    for (let i = 0; i < numTriangles && offset + 50 <= buf.length; i++) {
      const nx = buf.readFloatLE(offset);
      const ny = buf.readFloatLE(offset + 4);
      const nz = buf.readFloatLE(offset + 8);
      offset += 12;

      for (let v = 0; v < 3; v++) {
        const vx = buf.readFloatLE(offset);
        const vy = buf.readFloatLE(offset + 4);
        const vz = buf.readFloatLE(offset + 8);
        offset += 12;

        positions.push(vx, vy, vz);
        normals.push(nx, ny, nz);
        indices.push(vertexIndex++);
      }

      offset += 2; // attribute byte count
    }
  } else {
    // ASCII STL
    const text = buf.toString("utf8");
    const lines = text.split(/\r?\n/);
    let curNx = 0, curNy = 0, curNz = 1;
    for (const rawLine of lines) {
      const line = rawLine.trim();
      if (line.startsWith("facet normal")) {
        const parts = line.split(/\s+/);
        if (parts.length >= 5) {
          curNx = parseFloat(parts[2]) || 0;
          curNy = parseFloat(parts[3]) || 0;
          curNz = parseFloat(parts[4]) || 1;
        }
      } else if (line.startsWith("vertex")) {
        const parts = line.split(/\s+/);
        if (parts.length >= 4) {
          const vx = parseFloat(parts[1]) || 0;
          const vy = parseFloat(parts[2]) || 0;
          const vz = parseFloat(parts[3]) || 0;
          positions.push(vx, vy, vz);
          normals.push(curNx, curNy, curNz);
          indices.push(vertexIndex++);
        }
      }
    }
  }

  if (positions.length === 0) {
    throw new Error("Invalid or empty STL model file.");
  }

  const vertexCount = positions.length / 3;
  const indexCount = indices.length;

  return {
    positions: new Float32Array(positions),
    normals: new Float32Array(normals),
    indices: vertexCount > 65535 ? new Uint32Array(indices) : new Uint16Array(indices),
    vertexCount,
    indexCount
  };
};

/**
 * Initialize OpenCascade WebAssembly instance in Node.js
 * @returns {Promise<Object>} OpenCascade instance
 */
export const getOpenCascade = async () => {
  if (occInstance) return occInstance;
  if (occInitPromise) return occInitPromise;

  occInitPromise = (async () => {
    const opencascade = loadOpenCascadeFactory();
    let wasmPath;
    try {
      wasmPath = require.resolve("opencascade.js/dist/opencascade.wasm.wasm");
    } catch {
      const wasmJsPath = require.resolve("opencascade.js/dist/opencascade.wasm.js");
      wasmPath = path.join(path.dirname(wasmJsPath), "opencascade.wasm.wasm");
    }
    let wasmBinary = null;
    if (fs.existsSync(wasmPath)) {
      wasmBinary = fs.readFileSync(wasmPath);
    }

    const occ = await opencascade({
      wasmBinary: wasmBinary || undefined,
      locateFile: (p) => {
        if (p.endsWith(".wasm")) {
          return wasmPath;
        }
        return p;
      }
    });

    occInstance = occ;
    return occ;
  })();

  return occInitPromise;
};

/**
 * Reads a CAD shape from an in-memory buffer (STEP, STP, IGES, IGS, STL, or BREP)
 * @param {Object} occ - OpenCascade instance
 * @param {Buffer|Uint8Array} fileBuffer - CAD file data
 * @param {string} ext - File extension (e.g. '.step', '.stp', '.iges', '.igs', '.stl', '.brep')
 * @returns {Object} TopoDS_Shape
 */
export const readCadShape = (occ, fileBuffer, ext) => {
  const normalizedExt = (ext || "").toLowerCase().replace(/^\./, "");
  const tempVFilename = `cad_input_${Date.now()}_${Math.random().toString(36).substring(7)}.${normalizedExt}`;
  const vPath = `/${tempVFilename}`;

  // Write file buffer into Emscripten virtual filesystem
  occ.FS.createDataFile("/", tempVFilename, fileBuffer, true, true, true);

  let shape = null;

  try {
    if (normalizedExt === "step" || normalizedExt === "stp") {
      const ReaderClass = occ.STEPControl_Reader_1 || occ.STEPControl_Reader;
      const reader = new ReaderClass();
      const status = (reader.ReadFile_1 || reader.ReadFile).call(reader, vPath);
      reader.TransferRoots();
      shape = reader.OneShape();
    } else if (normalizedExt === "iges" || normalizedExt === "igs") {
      const ReaderClass = occ.IGESControl_Reader_1 || occ.IGESControl_Reader;
      if (typeof ReaderClass === "function") {
        const reader = new ReaderClass();
        const status = (reader.ReadFile_1 || reader.ReadFile).call(reader, vPath);
        reader.TransferRoots();
        shape = reader.OneShape();
      } else {
        throw new Error("IGESControl_Reader is not available in backend OpenCascade WASM build.");
      }
    } else if (normalizedExt === "stl") {
      shape = new occ.TopoDS_Shape();
      let readSuccess = false;
      const StlReader = occ.StlAPI_Reader_1 || occ.StlAPI_Reader;
      if (typeof StlReader === "function") {
        try {
          const reader = new StlReader();
          if (typeof reader.Read_1 === "function") {
            readSuccess = reader.Read_1(shape, vPath);
          } else if (typeof reader.Read === "function") {
            readSuccess = reader.Read(shape, vPath);
          }
        } catch (stlErr) {
          console.warn("[OpenCASCADE] StlAPI_Reader notice:", stlErr.message);
        }
      }

      if (!readSuccess || !shape || (typeof shape.IsNull === "function" && shape.IsNull())) {
        try {
          const RWStlClass = occ.RWStl;
          const readFn = RWStlClass?.ReadFile_1 || RWStlClass?.ReadFile;
          if (typeof readFn === "function") {
            const StrClass = occ.TCollection_AsciiString_2 || occ.TCollection_AsciiString_1 || occ.TCollection_AsciiString;
            const aPath = StrClass ? new StrClass(vPath) : vPath;
            const polyTri = readFn(aPath);
            if (polyTri && (typeof polyTri.IsNull !== "function" || !polyTri.IsNull())) {
              const builder = new occ.BRep_Builder();
              const face = new occ.TopoDS_Face();
              if (typeof builder.MakeFace_1 === "function") {
                builder.MakeFace_1(face);
              } else if (typeof builder.MakeFace === "function") {
                builder.MakeFace(face);
              }
              const triVal = typeof polyTri.get === "function" ? polyTri.get() : polyTri;
              if (typeof builder.UpdateFace_1 === "function") {
                builder.UpdateFace_1(face, triVal);
              } else if (typeof builder.UpdateFace === "function") {
                builder.UpdateFace(face, triVal);
              }
              shape = face;
              readSuccess = true;
            }
          }
        } catch (rwErr) {
          console.warn("[OpenCASCADE] RWStl notice:", rwErr.message);
        }
      }
    } else if (normalizedExt === "brep" || normalizedExt === "brp") {
      shape = new occ.TopoDS_Shape();
      const builder = new occ.BRep_Builder();
      if (typeof occ.BRepTools?.Read_2 === "function") {
        occ.BRepTools.Read_2(shape, vPath, builder);
      } else if (typeof occ.BRepTools?.Read_1 === "function") {
        occ.BRepTools.Read_1(shape, vPath, builder);
      } else {
        throw new Error("BRepTools.Read is not available in OpenCascade.js");
      }
    } else {
      throw new Error(`Unsupported CAD format: .${normalizedExt}`);
    }

    if (!shape || (typeof shape.IsNull === "function" && shape.IsNull())) {
      throw new Error(`Failed to read CAD shape from .${normalizedExt} file.`);
    }

    return shape;
  } finally {
    try {
      occ.FS.unlink(vPath);
    } catch (e) {}
  }
};

/**
 * Meshes a TopoDS_Shape and extracts positions, normals, and triangle indices
 * @param {Object} occ - OpenCascade instance
 * @param {Object} shape - TopoDS_Shape
 * @param {Object} [options] - Meshing options
 * @returns {{ positions: Float32Array, normals: Float32Array, indices: Uint16Array|Uint32Array, vertexCount: number, indexCount: number }}
 */
export const extractMeshFromShape = (occ, shape, options = {}) => {
  const linearDeflection = options.linearDeflection || 0.1;
  const angularDeflection = options.angularDeflection || 0.5;

  // Triangulate shape with deflection if not already triangulated
  try {
    const MeshClass = occ.BRepMesh_IncrementalMesh_2 || occ.BRepMesh_IncrementalMesh;
    if (typeof MeshClass === "function") {
      new MeshClass(
        shape,
        linearDeflection,
        false,
        angularDeflection,
        true
      );
    }
  } catch (meshErr) {
    console.warn("[OpenCASCADE] Incremental mesh notice:", meshErr.message);
  }

  const positions = [];
  const indices = [];
  let vertexOffset = 0;

  const faceExplorer = new occ.TopExp_Explorer_2(
    shape,
    occ.TopAbs_ShapeEnum.TopAbs_FACE,
    occ.TopAbs_ShapeEnum.TopAbs_SHAPE
  );
  const location = new occ.TopLoc_Location_1();

  while (faceExplorer.More()) {
    const face = occ.TopoDS.Face_1(faceExplorer.Current());
    const facing = occ.BRep_Tool.Triangulation(face, location);

    if (facing && !facing.IsNull()) {
      const triangulation = facing.get();
      const nbNodes = triangulation.NbNodes();
      const nbTriangles = triangulation.NbTriangles();
      const trsf = location.Transformation();
      const isReversed = face.Orientation_1() === occ.TopAbs_Orientation.TopAbs_REVERSED;

      // Extract vertex positions transformed to world coordinate space
      for (let i = 1; i <= nbNodes; i++) {
        const pnt = triangulation.Node(i).Transformed(trsf);
        positions.push(pnt.X(), pnt.Y(), pnt.Z());
      }

      // Extract triangle indices
      for (let i = 1; i <= nbTriangles; i++) {
        const tri = triangulation.Triangle(i);
        const n1 = tri.Value(1) - 1 + vertexOffset;
        const n2 = tri.Value(2) - 1 + vertexOffset;
        const n3 = tri.Value(3) - 1 + vertexOffset;

        if (isReversed) {
          indices.push(n1, n3, n2);
        } else {
          indices.push(n1, n2, n3);
        }
      }

      vertexOffset += nbNodes;
    }
    faceExplorer.Next();
  }

  if (positions.length === 0 || indices.length === 0) {
    throw new Error("No mesh geometry or triangular faces generated from CAD model.");
  }

  // Calculate smooth normals for surface shading
  const normals = new Float32Array(positions.length);
  for (let i = 0; i < indices.length; i += 3) {
    const i1 = indices[i] * 3;
    const i2 = indices[i + 1] * 3;
    const i3 = indices[i + 2] * 3;

    const v1x = positions[i1], v1y = positions[i1 + 1], v1z = positions[i1 + 2];
    const v2x = positions[i2], v2y = positions[i2 + 1], v2z = positions[i2 + 2];
    const v3x = positions[i3], v3y = positions[i3 + 1], v3z = positions[i3 + 2];

    const ax = v2x - v1x, ay = v2y - v1y, az = v2z - v1z;
    const bx = v3x - v1x, by = v3y - v1y, bz = v3z - v1z;

    const nx = ay * bz - az * by;
    const ny = az * bx - ax * bz;
    const nz = ax * by - ay * bx;

    normals[i1] += nx; normals[i1 + 1] += ny; normals[i1 + 2] += nz;
    normals[i2] += nx; normals[i2 + 1] += ny; normals[i2 + 2] += nz;
    normals[i3] += nx; normals[i3 + 1] += ny; normals[i3 + 2] += nz;
  }

  for (let i = 0; i < normals.length; i += 3) {
    const nx = normals[i];
    const ny = normals[i + 1];
    const nz = normals[i + 2];
    const len = Math.hypot(nx, ny, nz);
    if (len > 0.000001) {
      normals[i] = nx / len;
      normals[i + 1] = ny / len;
      normals[i + 2] = nz / len;
    } else {
      normals[i + 1] = 1.0;
    }
  }

  const vertexCount = positions.length / 3;
  const indexCount = indices.length;

  return {
    positions: new Float32Array(positions),
    normals,
    indices: vertexCount > 65535 ? new Uint32Array(indices) : new Uint16Array(indices),
    vertexCount,
    indexCount
  };
};

/**
 * Builds a binary glTF (.glb) buffer from extracted mesh data
 * @param {Object} meshData 
 * @param {Object} [options] 
 * @returns {Buffer} GLB binary buffer
 */
export const buildGlbBuffer = (meshData, options = {}) => {
  const { positions, normals, indices, vertexCount, indexCount } = meshData;
  const modelName = options.name || "CAD_Model";

  // Calculate bounding box min/max
  let minX = Infinity, minY = Infinity, minZ = Infinity;
  let maxX = -Infinity, maxY = -Infinity, maxZ = -Infinity;

  for (let i = 0; i < positions.length; i += 3) {
    const x = positions[i], y = positions[i + 1], z = positions[i + 2];
    if (x < minX) minX = x; if (x > maxX) maxX = x;
    if (y < minY) minY = y; if (y > maxY) maxY = y;
    if (z < minZ) minZ = z; if (z > maxZ) maxZ = z;
  }

  const isUint32 = indices instanceof Uint32Array;
  const indexComponentType = isUint32 ? 5125 : 5123; // 5125: UNSIGNED_INT, 5123: UNSIGNED_SHORT

  const posByteLength = positions.byteLength;
  const normByteLength = normals.byteLength;
  const indexByteLength = indices.byteLength;

  const pad4 = (val) => Math.ceil(val / 4) * 4;

  const posOffset = 0;
  const posAlignedLength = pad4(posByteLength);

  const normOffset = posOffset + posAlignedLength;
  const normAlignedLength = pad4(normByteLength);

  const indexOffset = normOffset + normAlignedLength;
  const indexAlignedLength = pad4(indexByteLength);

  const totalBinLength = indexOffset + indexAlignedLength;

  // Build binary chunk buffer
  const binBuffer = Buffer.alloc(totalBinLength);
  Buffer.from(positions.buffer, positions.byteOffset, posByteLength).copy(binBuffer, posOffset);
  Buffer.from(normals.buffer, normals.byteOffset, normByteLength).copy(binBuffer, normOffset);
  Buffer.from(indices.buffer, indices.byteOffset, indexByteLength).copy(binBuffer, indexOffset);

  // Build glTF 2.0 manifest
  const gltfJson = {
    asset: {
      version: "2.0",
      generator: "Fisto OpenCASCADE CAD to GLB Converter"
    },
    scene: 0,
    scenes: [
      {
        name: "Scene",
        nodes: [0]
      }
    ],
    nodes: [
      {
        name: modelName,
        mesh: 0
      }
    ],
    meshes: [
      {
        name: `${modelName}_Mesh`,
        primitives: [
          {
            attributes: {
              POSITION: 0,
              NORMAL: 1
            },
            indices: 2,
            material: 0,
            mode: 4 // TRIANGLES
          }
        ]
      }
    ],
    materials: [
      {
        name: "CAD_Default_Material",
        pbrMetallicRoughness: {
          baseColorFactor: [0.75, 0.75, 0.78, 1.0],
          metallicFactor: 0.1,
          roughnessFactor: 0.5
        },
        doubleSided: true
      }
    ],
    accessors: [
      {
        bufferView: 0,
        byteOffset: 0,
        componentType: 5126, // FLOAT
        count: vertexCount,
        type: "VEC3",
        min: [minX, minY, minZ],
        max: [maxX, maxY, maxZ]
      },
      {
        bufferView: 1,
        byteOffset: 0,
        componentType: 5126, // FLOAT
        count: vertexCount,
        type: "VEC3"
      },
      {
        bufferView: 2,
        byteOffset: 0,
        componentType: indexComponentType,
        count: indexCount,
        type: "SCALAR"
      }
    ],
    bufferViews: [
      {
        buffer: 0,
        byteOffset: posOffset,
        byteLength: posByteLength,
        target: 34962 // ARRAY_BUFFER
      },
      {
        buffer: 0,
        byteOffset: normOffset,
        byteLength: normByteLength,
        target: 34962 // ARRAY_BUFFER
      },
      {
        buffer: 0,
        byteOffset: indexOffset,
        byteLength: indexByteLength,
        target: 34963 // ELEMENT_ARRAY_BUFFER
      }
    ],
    buffers: [
      {
        byteLength: totalBinLength
      }
    ]
  };

  const jsonString = JSON.stringify(gltfJson);
  const jsonBuffer = Buffer.from(jsonString, "utf8");
  const jsonAlignedLength = pad4(jsonBuffer.length);
  const jsonPadding = jsonAlignedLength - jsonBuffer.length;

  const totalGlbLength = 12 + 8 + jsonAlignedLength + 8 + totalBinLength;
  const glb = Buffer.alloc(totalGlbLength);

  let offset = 0;

  // 1. GLB Header (12 bytes)
  glb.writeUInt32LE(0x46546C67, offset);      // 'glTF' magic
  glb.writeUInt32LE(2, offset + 4);              // version 2
  glb.writeUInt32LE(totalGlbLength, offset + 8); // total file length
  offset += 12;

  // 2. JSON Chunk (8 bytes + aligned json)
  glb.writeUInt32LE(jsonAlignedLength, offset);
  glb.writeUInt32LE(0x4E4F534A, offset + 4);     // 'JSON' chunk type
  offset += 8;
  jsonBuffer.copy(glb, offset);
  offset += jsonBuffer.length;
  for (let i = 0; i < jsonPadding; i++) {
    glb.writeUInt8(0x20, offset++);              // Space padded
  }

  // 3. BIN Chunk (8 bytes + binBuffer)
  glb.writeUInt32LE(totalBinLength, offset);
  glb.writeUInt32LE(0x004E4942, offset + 4);     // 'BIN\0' chunk type
  offset += 8;
  binBuffer.copy(glb, offset);

  return glb;
};

/**
 * Converts a CAD file buffer (STEP, STP, IGES, IGS, STL, or BREP) directly to a GLB Buffer
 * @param {Buffer|Uint8Array} fileBuffer 
 * @param {string} ext - Extension like '.stl', '.step', '.stp', '.iges', '.igs', '.brep'
 * @param {Object} [options]
 * @returns {Promise<Buffer>} GLB Buffer
 */
export const convertCadBufferToGlb = async (fileBuffer, ext, options = {}) => {
  const normalizedExt = (ext || "").toLowerCase().replace(/^\./, "");

  if (normalizedExt === "stl") {
    // OpenCASCADE STL conversion: try native OpenCASCADE reader first, or parse mesh directly
    try {
      const occ = await getOpenCascade();
      const shape = readCadShape(occ, fileBuffer, ext);
      if (shape && (typeof shape.IsNull !== "function" || !shape.IsNull())) {
        const meshData = extractMeshFromShape(occ, shape, options);
        return buildGlbBuffer(meshData, options);
      }
    } catch (occErr) {
      console.warn("[OpenCASCADE] Native shape meshing notice for STL, using direct mesh extraction:", occErr.message);
    }
    const meshData = parseStlBuffer(fileBuffer);
    return buildGlbBuffer(meshData, options);
  }

  const occ = await getOpenCascade();
  const shape = readCadShape(occ, fileBuffer, ext);
  const meshData = extractMeshFromShape(occ, shape, options);
  const glbBuffer = buildGlbBuffer(meshData, options);
  return glbBuffer;
};

/**
 * Converts a CAD file (STL, STEP, STP, IGES, IGS, BREP) on disk to a .glb file using OpenCASCADE
 * @param {string} inputPath - Path to input CAD file
 * @param {string} outputPath - Path to output .glb file
 * @param {Object} [options]
 * @returns {Promise<{ success: boolean, outputPath: string, sizeInMB: string }>}
 */
export const convertCadFileToGlb = async (inputPath, outputPath, options = {}) => {
  if (!fs.existsSync(inputPath)) {
    throw new Error(`Input CAD file does not exist: ${inputPath}`);
  }

  const outputDir = path.dirname(outputPath);
  if (!fs.existsSync(outputDir)) {
    fs.mkdirSync(outputDir, { recursive: true });
  }

  const ext = path.extname(inputPath).toLowerCase();
  const fileBuffer = fs.readFileSync(inputPath);
  const baseName = path.basename(inputPath, ext);

  console.log(`[OpenCASCADE] Converting ${inputPath} (${(fileBuffer.length / (1024 * 1024)).toFixed(2)} MB) to GLB...`);
  const glbBuffer = await convertCadBufferToGlb(fileBuffer, ext, {
    name: baseName,
    ...options
  });

  fs.writeFileSync(outputPath, glbBuffer);
  console.log(`[OpenCASCADE] Successfully converted ${ext.toUpperCase()} to GLB: ${outputPath} (${(glbBuffer.length / (1024 * 1024)).toFixed(2)} MB)`);

  return {
    success: true,
    outputPath,
    sizeInMB: (glbBuffer.length / (1024 * 1024)).toFixed(2)
  };
};

export default {
  CAD_EXTENSIONS,
  isCadFormat,
  parseStlBuffer,
  getOpenCascade,
  readCadShape,
  extractMeshFromShape,
  buildGlbBuffer,
  convertCadBufferToGlb,
  convertCadFileToGlb
};

