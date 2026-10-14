import express from 'express';
import { uploadVideoMiddleware, convertVideoController } from './videoController.js';

const router = express.Router();

/**
 * Route: POST /api/converter/convert-video
 * Uploads video with settings and streams converted file back
 */
router.post('/convert-video', uploadVideoMiddleware, convertVideoController);

export default router;
