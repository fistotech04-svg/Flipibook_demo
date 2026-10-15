import express from 'express';
import { uploadVideoMiddleware, convertVideoController } from './videoController.js';
import { uploadImageMiddleware, convertImageController } from './imageController.js';
import {
  uploadThreeDMiddleware,
  previewThreeDController,
  convertThreeDController,
  servePreviewFileController
} from './threeDController.js';

const router = express.Router();

/**
 * Route: POST /api/converter/convert-video
 * Uploads video with settings and streams converted file back
 */
router.post('/convert-video', uploadVideoMiddleware, convertVideoController);

/**
 * Route: POST /api/converter/convert-image
 * Uploads image with settings and returns optimized converted image buffer
 */
router.post('/convert-image', uploadImageMiddleware, convertImageController);

/**
 * Route: POST /api/converter/preview-3d
 * Uploads CAD/3D model (.step, .stp, .iges, .igs, .stl, .obj, .glb) and returns temporary GLB for 3D viewer
 */
router.post('/preview-3d', uploadThreeDMiddleware, previewThreeDController);

/**
 * Route: POST /api/converter/convert-3d
 * Converts CAD/3D model to GLB or OBJ and streams the converted file back
 */
router.post('/convert-3d', uploadThreeDMiddleware, convertThreeDController);

/**
 * Route: GET /api/converter/preview-file/:filename
 * Serves temporary preview GLB for the 3D canvas viewer
 */
router.get('/preview-file/:filename', servePreviewFileController);

export default router;


