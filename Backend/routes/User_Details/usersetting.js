import express from 'express';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import UserSettings from '../../models/UserSettings.js';
import Flipbook from '../../models/Flipbook.js';
import FlipbookAsset from '../../models/FlipbookAsset.js';
import ThreedModel from '../../models/ThreedModel.js';
import Texture from '../../models/Texture.js';
import { getUserStorageSizeFromSupabase, getFolderSizeFromSupabase } from '../../config/supabase.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const router = express.Router();

const getDirSize = (dirPath) => {
  let size = 0;
  try {
    if (!fs.existsSync(dirPath)) return 0;
    const files = fs.readdirSync(dirPath);
    for (const file of files) {
      const filePath = path.join(dirPath, file);
      const stats = fs.statSync(filePath);
      if (stats.isDirectory()) {
        size += getDirSize(filePath);
      } else {
        size += stats.size;
      }
    }
  } catch (e) {
    return 0;
  }
  return size;
};

export const calculateActiveUserStorage = async (emailId) => {
  try {
    if (!emailId) return 0;
    const sanitizedEmail = emailId.replace(/[@.]/g, "_");
    const uploadsDir = path.join(__dirname, "../../uploads");

    // 1. Fetch physical folder sizes for all active flipbooks
    const userDbBooks = await Flipbook.find({ userEmail: emailId });
    const processedVIds = new Set();
    const uniqueBooks = [];

    for (const doc of userDbBooks) {
      if (!doc.v_id || processedVIds.has(doc.v_id)) continue;
      processedVIds.add(doc.v_id);
      uniqueBooks.push(doc);
    }

    const bookSizes = await Promise.all(uniqueBooks.map(async (doc) => {
      const realFolders = Array.isArray(doc.folderName)
        ? doc.folderName.filter((f) => f !== "Recent Book" && f !== "Recent book")
        : [doc.folderName];
      const folder = realFolders[0] || "My_Flipbooks";

      // 1. Check local disk folder size
      const bookPath = path.join(uploadsDir, sanitizedEmail, "My_Flipbooks", folder, doc.flipbookName);
      const diskSize = getDirSize(bookPath);
      if (diskSize > 0) return diskSize;

      // 2. Query physical size directly from Supabase Storage
      const supabasePath = `${sanitizedEmail}/My_Flipbooks/${folder}/${doc.flipbookName}`;
      const supabaseSize = await getFolderSizeFromSupabase(supabasePath);
      if (supabaseSize > 0) return supabaseSize;

      // 3. Fallback to pages/assets if files not found in standard path
      let pagesSum = 0;
      if (doc.pages && doc.pages.length > 0) {
        pagesSum = doc.pages.reduce((acc, p) => acc + (p.size || 0), 0);
      }
      return pagesSum || doc.fileSize || 0;
    }));

    const totalFlipbooksSize = bookSizes.reduce((sum, s) => sum + (s || 0), 0);

    // 2. Physical size of active 3D Models
    let totalModelsSize = 0;
    try {
      const userModels = await ThreedModel.find({ userEmail: emailId });
      for (const m of userModels) {
        if (typeof m.size === 'number') {
          totalModelsSize += m.size;
        } else if (typeof m.size === 'string') {
          const num = parseFloat(m.size) || 0;
          if (m.size.toUpperCase().includes('GB')) totalModelsSize += num * 1024 * 1024 * 1024;
          else if (m.size.toUpperCase().includes('MB')) totalModelsSize += num * 1024 * 1024;
          else if (m.size.toUpperCase().includes('KB')) totalModelsSize += num * 1024;
          else totalModelsSize += num;
        }
      }
    } catch (e) {}

    // 3. Physical size of active Textures
    let totalTexturesSize = 0;
    try {
      const userTextures = await Texture.find({ userEmail: emailId });
      if (Array.isArray(userTextures)) {
        for (const t of userTextures) {
          if (typeof t.size === 'number') totalTexturesSize += t.size;
        }
      }
    } catch (e) {}

    return totalFlipbooksSize + totalModelsSize + totalTexturesSize;
  } catch (err) {
    console.error("Error calculating active user storage:", err);
    return 0;
  }
};

// @route   GET /api/usersetting/get-settings
// @desc    Get user settings by email
// @access  Public
router.get('/get-settings', async (req, res) => {
  try {
    const { emailId } = req.query;
    if (!emailId) {
        return res.status(400).json({ message: 'Email ID is required' });
    }

    let settings = await UserSettings.findOne({ emailId });
    if (!settings) {
        // If settings don't exist, create default
        settings = new UserSettings({
          emailId,
          editorSettings: {
            isAutoSaveEnabled: true,
            isTrimViewEnabled: false,
            isRulerEnabled: true
          }
        });
        await settings.save();
    }

    // Calculate Storage Usage from active resources in account
    const usedStorage = await calculateActiveUserStorage(emailId);

    // Return settings with storage info
    res.json({
        ...settings._doc,
        usedStorage,
        maxStorage: settings.maxStorage || 300 * 1024 * 1024
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   POST /api/usersetting/update-autosave
// @desc    Update auto-save preference
// @access  Public
router.post('/update-autosave', async (req, res) => {
  try {
    const { emailId, isAutoSaveEnabled } = req.body;
    
    if (!emailId) {
        return res.status(400).json({ message: 'Email ID is required' });
    }

    const settings = await UserSettings.findOneAndUpdate(
      { emailId },
      { $set: { 'editorSettings.isAutoSaveEnabled': isAutoSaveEnabled } },
      { returnDocument: 'after', upsert: true }
    );

    res.json({ 
      message: 'Settings updated', 
      isAutoSaveEnabled: settings.editorSettings?.isAutoSaveEnabled ?? isAutoSaveEnabled,
      editorSettings: settings.editorSettings
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   POST /api/usersetting/update-editor-settings
// @desc    Update all editor settings (isAutoSaveEnabled, isTrimViewEnabled, isRulerEnabled)
// @access  Public
router.post('/update-editor-settings', async (req, res) => {
  try {
    const { emailId, editorSettings } = req.body;
    
    if (!emailId) {
        return res.status(400).json({ message: 'Email ID is required' });
    }

    const updateObj = {};
    if (editorSettings) {
      if (editorSettings.isAutoSaveEnabled !== undefined) updateObj['editorSettings.isAutoSaveEnabled'] = editorSettings.isAutoSaveEnabled;
      if (editorSettings.isTrimViewEnabled !== undefined) updateObj['editorSettings.isTrimViewEnabled'] = editorSettings.isTrimViewEnabled;
      if (editorSettings.isRulerEnabled !== undefined) updateObj['editorSettings.isRulerEnabled'] = editorSettings.isRulerEnabled;
    }

    const settings = await UserSettings.findOneAndUpdate(
      { emailId },
      { $set: updateObj },
      { returnDocument: 'after', upsert: true }
    );

    res.json({ message: 'Editor settings updated', editorSettings: settings.editorSettings });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
});

export default router;
