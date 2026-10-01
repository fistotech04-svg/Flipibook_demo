import express from 'express';
import Profile from '../../models/Profile.js';
import User from '../../models/auth.js';
import Flipbook from '../../models/Flipbook.js';
import { uploadBufferToSupabase, deleteFileFromSupabase, ensureUserFoldersInSupabase } from '../../config/supabase.js';
import { logActivity } from '../../utils/activityLogger.js';
import multer from 'multer';
import path from 'path';
const router = express.Router();

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 50 * 1024 * 1024 } // 50MB
});

/**
 * Helper to delete a previous Supabase avatar, banner, or company logo asset.
 */
const deletePreviousProfileAssetIfSupabase = async (assetUrlOrCss, sanitizedEmail) => {
  try {
    if (!assetUrlOrCss || typeof assetUrlOrCss !== 'string') return;
    const cleanUrl = assetUrlOrCss.replace(/^url\(['"]?/, '').replace(/['"]?\)$/, '').trim();
    if (!cleanUrl || cleanUrl.startsWith('data:') || cleanUrl === 'color_only') return;

    if (
      cleanUrl.includes('/Profile/') ||
      cleanUrl.includes(`/${sanitizedEmail}/Profile/`) ||
      cleanUrl.includes('Profile/avatar_') ||
      cleanUrl.includes('Profile/banner_') ||
      cleanUrl.includes('/Company_logo/') ||
      cleanUrl.includes(`/${sanitizedEmail}/Company_logo/`) ||
      cleanUrl.includes('Company_logo/logo_')
    ) {
      console.log(`[Profile] Deleting old asset from Supabase: ${cleanUrl}`);
      await deleteFileFromSupabase(cleanUrl);
    }
  } catch (err) {
    console.warn(`[Profile] Error deleting previous asset from Supabase:`, err);
  }
};

/**
 * Helper to save an uploaded file buffer or base64 data to Supabase Storage in the Profile or Company_logo folder.
 */
const saveProfileAsset = async (sanitizedEmail, fileOrBase64, prefix = 'avatar', folder = 'Profile') => {
  try {
    if (!fileOrBase64 || !sanitizedEmail) return null;

    // 1. Handle Multer file object
    if (fileOrBase64.buffer && Buffer.isBuffer(fileOrBase64.buffer)) {
      const ext = (path.extname(fileOrBase64.originalname || '').replace('.', '') || 'png').toLowerCase();
      const fileName = `${prefix}_${Date.now()}.${ext}`;
      const destinationPath = `${sanitizedEmail}/${folder}/${fileName}`;
      const contentType = fileOrBase64.mimetype || 'image/png';
      const supabaseUrl = await uploadBufferToSupabase(fileOrBase64.buffer, destinationPath, contentType);
      return supabaseUrl || `/uploads/${sanitizedEmail}/${folder}/${fileName}`;
    }

    // 2. Handle Base64 string
    if (typeof fileOrBase64 === 'string' && fileOrBase64.startsWith('data:')) {
      const match = fileOrBase64.match(/^data:([^;]+);base64,(.+)$/);
      if (match) {
        const contentType = match[1];
        const buffer = Buffer.from(match[2], 'base64');
        let ext = 'png';
        if (contentType.includes('jpeg') || contentType.includes('jpg')) ext = 'jpg';
        else if (contentType.includes('webp')) ext = 'webp';
        else if (contentType.includes('svg')) ext = 'svg';
        else if (contentType.includes('gif')) ext = 'gif';

        const fileName = `${prefix}_${Date.now()}.${ext}`;
        const destinationPath = `${sanitizedEmail}/${folder}/${fileName}`;
        const supabaseUrl = await uploadBufferToSupabase(buffer, destinationPath, contentType);
        return supabaseUrl || `/uploads/${sanitizedEmail}/${folder}/${fileName}`;
      }
    }

    // 3. Regular string URL or preset path
    return fileOrBase64;
  } catch (err) {
    console.error(`[Profile] Error saving ${prefix} asset to Supabase ${folder} folder:`, err);
    return typeof fileOrBase64 === 'string' ? fileOrBase64 : null;
  }
};

// @route   GET /api/profile
// @desc    Get user profile by emailId or email
// @access  Public / Authenticated
router.get('/', async (req, res) => {
  try {
    const { emailId } = req.query;
    if (!emailId) return res.status(400).json({ success: false, message: 'emailId is required' });
    
    const normalizedEmail = emailId.trim().toLowerCase();
    let profile = await Profile.findOne({ emailId: normalizedEmail });
    if (!profile) {
      const defaultName = normalizedEmail.split('@')[0];
      const formattedName = defaultName.charAt(0).toUpperCase() + defaultName.slice(1);
      profile = new Profile({ 
        emailId: normalizedEmail,
        name: formattedName
      });
      await profile.save();
    }
    res.json({
      success: true,
      profile: profile,
      ...profile.toObject()
    });
  } catch (error) {
    console.error('Error fetching profile:', error);
    res.status(500).json({ success: false, message: 'Internal Server Error' });
  }
});

// GET /api/profile/my-shelf-books
router.get('/my-shelf-books', async (req, res) => {
  try {
    const { emailId } = req.query;
    if (!emailId) return res.status(400).json({ message: 'emailId is required' });
    
    const profile = await Profile.findOne({ emailId: emailId.trim().toLowerCase() });
    if (!profile) {
      return res.json({ books: [], myShelf: { folders: [] } });
    }
    
    let bookIds = [];
    if (profile.myShelf && profile.myShelf.folders) {
      profile.myShelf.folders.forEach(f => {
        if (f.books) {
          f.books.forEach(b => {
            const id = typeof b === 'string' ? b : b.v_id;
            if (id) bookIds.push(id);
          });
        }
      });
    }

    const allBooks = await Flipbook.find({ v_id: { $in: bookIds } }).lean();
    // Only show books on the shelf that are actually published, UNLESS they are owned by the current user
    const userEmailNorm = emailId.trim().toLowerCase();
    const books = allBooks.filter(b => (b.isPublished === true || b.isPublished === 'true') || (b.userEmail && b.userEmail.toLowerCase() === userEmailNorm));
    
    const userEmails = [...new Set(books.map(b => b.userEmail?.toLowerCase()).filter(Boolean))];
    const profiles = await Profile.find({ emailId: { $in: userEmails } }).lean();
    const profileMap = {};
    profiles.forEach(p => { profileMap[p.emailId.toLowerCase()] = p; });

    const booksWithFlag = books.map(book => {
      const p = profileMap[book.userEmail?.toLowerCase()] || {};
      const authorName = p.name || (book.userEmail ? book.userEmail.split('@')[0] : 'Creator');
      const city = p.city || p.state || (p.country && p.country !== 'INDIA' ? p.country : '') || 'Coimbatore';
      const authorPicture = p.picture || null;
      const authorBgColor = p.avatarBgColor || '#E8D4C8';
      
      return {
        ...book,
        isAddedToShelf: true,
        authorName,
        city,
        authorPicture,
        authorBgColor
      };
    });

    res.json({
      books: booksWithFlag,
      myShelf: profile.myShelf || { folders: [] }
    });
  } catch (error) {
    console.error('Error fetching my-shelf-books:', error);
    res.status(500).json({ message: 'Internal Server Error' });
  }
});

// POST /api/profile/avatar
// @desc    Upload or update user profile avatar in Supabase Storage
router.post('/avatar', upload.single('avatar'), async (req, res) => {
  try {
    const emailId = req.body?.emailId;
    if (!emailId) {
      return res.status(400).json({ success: false, message: 'emailId is required' });
    }

    const normalizedEmail = emailId.trim().toLowerCase();
    const sanitizedEmail = normalizedEmail.replace(/[@.]/g, '_');

    let existingProfile = await Profile.findOne({ emailId: normalizedEmail });
    if (!existingProfile) {
      existingProfile = new Profile({ emailId: normalizedEmail });
    }

    let finalPictureUrl = existingProfile.picture;
    let targetColor = req.body.avatarBgColor !== undefined ? req.body.avatarBgColor : existingProfile.avatarBgColor;

    // Case 1: Multer file uploaded
    if (req.file) {
      if (existingProfile.picture) {
        await deletePreviousProfileAssetIfSupabase(existingProfile.picture, sanitizedEmail);
      }
      const savedUrl = await saveProfileAsset(sanitizedEmail, req.file, 'avatar', 'Profile');
      finalPictureUrl = savedUrl;
    }
    // Case 2: Base64 string in req.body.picture
    else if (req.body.picture && typeof req.body.picture === 'string' && req.body.picture.startsWith('data:')) {
      if (existingProfile.picture && existingProfile.picture !== req.body.picture) {
        await deletePreviousProfileAssetIfSupabase(existingProfile.picture, sanitizedEmail);
      }
      const savedUrl = await saveProfileAsset(sanitizedEmail, req.body.picture, 'avatar', 'Profile');
      finalPictureUrl = savedUrl;
    }
    // Case 3: Explicit null or empty string (deleting avatar)
    else if (req.body.picture === null || req.body.picture === '') {
      if (existingProfile.picture) {
        await deletePreviousProfileAssetIfSupabase(existingProfile.picture, sanitizedEmail);
      }
      finalPictureUrl = null;
    }
    // Case 4: Preset URL, 'color_only', or existing URL
    else if (req.body.picture !== undefined) {
      if (existingProfile.picture && existingProfile.picture !== req.body.picture) {
        await deletePreviousProfileAssetIfSupabase(existingProfile.picture, sanitizedEmail);
      }
      finalPictureUrl = req.body.picture;
    }

    existingProfile.picture = finalPictureUrl;
    if (targetColor !== undefined) {
      existingProfile.avatarBgColor = targetColor;
    }
    existingProfile.updatedAt = new Date();
    await existingProfile.save();

    // Log activity
    logActivity({
      userEmail: normalizedEmail,
      type: 'edit',
      title: 'You updated your profile picture',
      desc: 'Profile picture updated successfully.',
      entityId: existingProfile._id?.toString()
    });

    return res.status(200).json({
      success: true,
      message: 'Avatar updated successfully',
      picture: existingProfile.picture,
      avatarBgColor: existingProfile.avatarBgColor,
      profile: existingProfile
    });
  } catch (error) {
    console.error('Error updating avatar in Supabase/MongoDB:', error);
    res.status(500).json({ success: false, message: 'Internal Server Error' });
  }
});

// POST /api/profile/banner
// @desc    Upload or update user profile banner in Supabase Storage
router.post('/banner', upload.single('banner'), async (req, res) => {
  try {
    const emailId = req.body?.emailId;
    if (!emailId) {
      return res.status(400).json({ success: false, message: 'emailId is required' });
    }

    const normalizedEmail = emailId.trim().toLowerCase();
    const sanitizedEmail = normalizedEmail.replace(/[@.]/g, '_');

    let existingProfile = await Profile.findOne({ emailId: normalizedEmail });
    if (!existingProfile) {
      existingProfile = new Profile({ emailId: normalizedEmail });
    }

    let finalBannerBg = existingProfile.bannerBg || { type: 'gradient', value: 'linear-gradient(to bottom right, #c1e8d7, #85d8c3, #60bba3)' };

    // Case 1: Multer file uploaded
    if (req.file) {
      if (existingProfile?.bannerBg?.value) {
        await deletePreviousProfileAssetIfSupabase(existingProfile.bannerBg.value, sanitizedEmail);
      }
      const savedUrl = await saveProfileAsset(sanitizedEmail, req.file, 'banner', 'Profile');
      finalBannerBg = {
        type: 'media',
        value: `url(${savedUrl})`
      };
    }
    // Case 2: bannerBg in body
    else if (req.body.bannerBg !== undefined) {
      let bBg = req.body.bannerBg;
      if (typeof bBg === 'string') {
        try { bBg = JSON.parse(bBg); } catch (e) {}
      }
      if (bBg && typeof bBg === 'object' && bBg.value && typeof bBg.value === 'string' && bBg.value.includes('data:')) {
        if (existingProfile?.bannerBg?.value && existingProfile.bannerBg.value !== bBg.value) {
          await deletePreviousProfileAssetIfSupabase(existingProfile.bannerBg.value, sanitizedEmail);
        }
        const rawBase64 = bBg.value.replace(/^url\(['"]?/, '').replace(/['"]?\)$/, '');
        const savedUrl = await saveProfileAsset(sanitizedEmail, rawBase64, 'banner', 'Profile');
        bBg.value = `url(${savedUrl})`;
        finalBannerBg = bBg;
      } else {
        if (existingProfile?.bannerBg?.value && bBg?.value && existingProfile.bannerBg.value !== bBg.value) {
          await deletePreviousProfileAssetIfSupabase(existingProfile.bannerBg.value, sanitizedEmail);
        }
        finalBannerBg = bBg;
      }
    }

    existingProfile.bannerBg = finalBannerBg;
    existingProfile.updatedAt = new Date();
    await existingProfile.save();

    return res.status(200).json({
      success: true,
      message: 'Banner updated successfully',
      bannerBg: existingProfile.bannerBg,
      profile: existingProfile
    });
  } catch (error) {
    console.error('Error updating banner in Supabase/MongoDB:', error);
    res.status(500).json({ success: false, message: 'Internal Server Error' });
  }
});

// POST /api/profile and POST /api/profile/save
// @desc    Create or update full user profile
const saveProfileHandler = async (req, res) => {
  try {
    const { emailId } = req.body;
    if (!emailId) return res.status(400).json({ success: false, message: 'emailId is required' });
    
    const normalizedEmail = emailId.trim().toLowerCase();
    const sanitizedEmail = normalizedEmail.replace(/[@.]/g, '_');
    
    let existingProfile = await Profile.findOne({ emailId: normalizedEmail });
    let updateFields = { ...req.body };
    delete updateFields._id;
    
    // Convert and save banner to Profile folder in Supabase if base64, and delete old file if replaced
    if (req.body.bannerBg !== undefined) {
      let bBg = req.body.bannerBg;
      if (typeof bBg === 'string') {
        try { bBg = JSON.parse(bBg); } catch (e) {}
      }
      if (bBg && typeof bBg === 'object' && bBg.value && typeof bBg.value === 'string' && bBg.value.includes('data:')) {
        if (existingProfile?.bannerBg?.value && existingProfile.bannerBg.value !== bBg.value) {
          await deletePreviousProfileAssetIfSupabase(existingProfile.bannerBg.value, sanitizedEmail);
        }
        const rawBase64 = bBg.value.replace(/^url\(['"]?/, '').replace(/['"]?\)$/, '');
        const savedUrl = await saveProfileAsset(sanitizedEmail, rawBase64, 'banner', 'Profile');
        bBg.value = `url(${savedUrl})`;
      } else if (existingProfile?.bannerBg?.value && bBg?.value && existingProfile.bannerBg.value !== bBg.value) {
        await deletePreviousProfileAssetIfSupabase(existingProfile.bannerBg.value, sanitizedEmail);
      }
      updateFields.bannerBg = bBg;
    }

    // Convert and save company logo to Company_logo folder in Supabase if base64, and delete old file if replaced
    if (req.body.company_logo_url !== undefined || req.body.companyLogo !== undefined) {
      const rawLogo = req.body.company_logo_url !== undefined ? req.body.company_logo_url : req.body.companyLogo;
      const oldLogo = existingProfile?.company_logo_url || existingProfile?.companyLogo;

      if (typeof rawLogo === 'string' && rawLogo.startsWith('data:')) {
        if (oldLogo && oldLogo !== rawLogo) {
          await deletePreviousProfileAssetIfSupabase(oldLogo, sanitizedEmail);
        }
        const savedLogo = await saveProfileAsset(sanitizedEmail, rawLogo, 'logo', 'Company_logo');
        updateFields.company_logo_url = savedLogo;
        updateFields.companyLogo = savedLogo;
      } else {
        if (oldLogo && oldLogo !== rawLogo) {
          await deletePreviousProfileAssetIfSupabase(oldLogo, sanitizedEmail);
        }
        updateFields.company_logo_url = rawLogo || '';
        updateFields.companyLogo = rawLogo || '';
      }
    }

    // Convert and save avatar picture to Profile folder in Supabase if base64
    if (req.body.picture !== undefined) {
      const rawPicture = req.body.picture;
      const oldPicture = existingProfile?.picture;
      if (typeof rawPicture === 'string' && rawPicture.startsWith('data:')) {
        if (oldPicture && oldPicture !== rawPicture) {
          await deletePreviousProfileAssetIfSupabase(oldPicture, sanitizedEmail);
        }
        const savedAvatar = await saveProfileAsset(sanitizedEmail, rawPicture, 'avatar', 'Profile');
        updateFields.picture = savedAvatar;
      } else if (rawPicture === null || rawPicture === '') {
        if (oldPicture) {
          await deletePreviousProfileAssetIfSupabase(oldPicture, sanitizedEmail);
        }
        updateFields.picture = null;
      }
    }

    updateFields.updatedAt = new Date();

    const updatedProfile = await Profile.findOneAndUpdate(
      { emailId: normalizedEmail },
      { $set: updateFields },
      { returnDocument: 'after', upsert: true, setDefaultsOnInsert: true }
    );

    // Log user activity
    logActivity({
      userEmail: normalizedEmail,
      type: existingProfile ? 'edit' : 'create_profile',
      title: existingProfile ? 'You updated your profile' : 'You created your profile',
      desc: existingProfile ? 'Profile information updated successfully.' : 'Profile created successfully.',
      entityId: updatedProfile?._id?.toString()
    });

    return res.status(200).json({
      success: true,
      message: 'Profile saved successfully',
      profile: updatedProfile
    });
  } catch (error) {
    console.error('Error saving profile:', error);
    res.status(500).json({ success: false, message: 'Internal Server Error' });
  }
};

router.post('/', saveProfileHandler);
router.post('/save', saveProfileHandler);

const normalizeFolderName = (name) => {
  if (!name) return 'My Flipbooks';
  const trimmed = name.trim();
  if (trimmed.toLowerCase() === 'my flipbooks' || trimmed.toLowerCase() === 'my_flipbooks') {
    return 'My Flipbooks';
  }
  return trimmed;
};

const normalizeAndMergeFolders = (profile) => {
  if (!profile.myShelf) profile.myShelf = {};
  if (!profile.myShelf.folders) profile.myShelf.folders = [];

  const folderMap = new Map();
  let changed = false;

  profile.myShelf.folders.forEach(folder => {
    const normName = normalizeFolderName(folder.folderName);
    if (folder.folderName !== normName) {
      folder.folderName = normName;
      changed = true;
    }

    if (folderMap.has(normName)) {
      changed = true;
      const existing = folderMap.get(normName);
      const existingVIds = new Set((existing.books || []).map(b => (typeof b === 'string' ? b : b.v_id)));
      
      if (folder.books) {
        folder.books.forEach(b => {
          const vId = typeof b === 'string' ? b : b.v_id;
          if (!existingVIds.has(vId)) {
            existing.books.push(b);
            existingVIds.add(vId);
          }
        });
      }
    } else {
      if (!folder.books) folder.books = [];
      folderMap.set(normName, folder);
    }
  });

  if (changed || profile.myShelf.folders.length !== folderMap.size) {
    profile.myShelf.folders = Array.from(folderMap.values());
    changed = true;
  }

  const newShelfCount = profile.myShelf.folders.length || 1;
  if (profile.myShelf.shelfCount !== newShelfCount) {
    profile.myShelf.shelfCount = newShelfCount;
    changed = true;
  }
  
  return changed;
};

// POST /api/profile/add-to-shelf
router.post('/add-to-shelf', async (req, res) => {
  try {
    const { emailId, bookId, folderName } = req.body;
    if (!emailId || !bookId) {
      return res.status(400).json({ success: false, message: 'Missing emailId or bookId' });
    }

    let profile = await Profile.findOne({ emailId: emailId.trim().toLowerCase() });
    if (!profile) {
      profile = new Profile({ emailId: emailId.trim().toLowerCase() });
    }

    const wasMerged = normalizeAndMergeFolders(profile);
    
    let targetFolder = normalizeFolderName(folderName);
    let folder = profile.myShelf.folders.find(f => f.folderName === targetFolder);
    
    if (!folder) {
      profile.myShelf.folders.push({ folderName: targetFolder, shelf_design: 1, books: [] });
      folder = profile.myShelf.folders.find(f => f.folderName === targetFolder);
    }

    if (!folder.books) folder.books = [];
    
    const bookExists = folder.books.some(b => {
      const id = typeof b === 'string' ? b : b.v_id;
      return id === bookId;
    });
    
    if (bookExists) {
      if (wasMerged) {
        profile.updatedAt = new Date();
        profile.markModified('myShelf.folders');
        profile.markModified('myShelf');
        await profile.save();
      }
      return res.json({ success: false, message: 'Book is already on your shelf' });
    }
    
    const currentCount = folder.books.length;
    folder.books.push({
      v_id: bookId,
      row: Math.floor(currentCount / 6),
      order: currentCount % 6
    });
    
    profile.updatedAt = new Date();
    profile.markModified('myShelf.folders');
    profile.markModified('myShelf');
    await profile.save();

    res.json({ success: true, message: 'Book added to shelf' });
  } catch (error) {
    console.error('Error in add-to-shelf:', error);
    res.status(500).json({ success: false, message: 'Internal Server Error' });
  }
});

// POST /api/profile/update-shelf-order
router.post('/update-shelf-order', async (req, res) => {
  try {
    const { emailId, folderName, bookIds } = req.body;
    if (!emailId || !bookIds || !Array.isArray(bookIds)) {
      return res.status(400).json({ success: false, message: 'Missing emailId or bookIds array' });
    }

    let profile = await Profile.findOne({ emailId: emailId.trim().toLowerCase() });
    if (!profile || !profile.myShelf || !profile.myShelf.folders) {
      return res.status(404).json({ success: false, message: 'Profile or shelf not found' });
    }

    normalizeAndMergeFolders(profile);

    let targetFolder = normalizeFolderName(folderName);
    let folder = profile.myShelf.folders.find(f => f.folderName === targetFolder);
    if (!folder) {
      profile.myShelf.folders.push({ folderName: targetFolder, shelf_design: 1, books: [] });
      folder = profile.myShelf.folders.find(f => f.folderName === targetFolder);
    }

    folder.books = bookIds.map((v_id, index) => ({
      v_id,
      row: Math.floor(index / 6),
      order: index % 6
    }));

    profile.updatedAt = new Date();
    profile.markModified('myShelf.folders');
    profile.markModified('myShelf');
    await profile.save();

    res.json({ success: true, message: 'Shelf order updated' });
  } catch (error) {
    console.error('Error updating shelf order:', error);
    res.status(500).json({ success: false, message: 'Internal Server Error' });
  }
});

// POST /api/profile/remove-from-shelf
router.post('/remove-from-shelf', async (req, res) => {
  try {
    const { emailId, bookId } = req.body;
    if (!emailId || !bookId) {
      return res.status(400).json({ success: false, message: 'Missing emailId or bookId' });
    }

    let profile = await Profile.findOne({ emailId: emailId.trim().toLowerCase() });
    if (!profile || !profile.myShelf || !profile.myShelf.folders) {
      return res.status(404).json({ success: false, message: 'Profile or shelf not found' });
    }

    let removed = normalizeAndMergeFolders(profile);

    // Remove book from all folders
    profile.myShelf.folders.forEach(folder => {
      if (folder.books) {
        const initLength = folder.books.length;
        folder.books = folder.books.filter(b => {
          const id = typeof b === 'string' ? b : b.v_id;
          return id !== bookId;
        });
        if (folder.books.length < initLength) {
          removed = true;
          // Recalculate row and order for the remaining books in this folder
          folder.books = folder.books.map((b, index) => {
            if (typeof b === 'string') {
               return { v_id: b, row: Math.floor(index / 6), order: index % 6 };
            }
            b.row = Math.floor(index / 6);
            b.order = index % 6;
            return b;
          });
        }
      }
    });

    if (removed) {
      profile.updatedAt = new Date();
      profile.markModified('myShelf.folders');
      profile.markModified('myShelf');
      await profile.save();
    }

    res.json({ success: true, message: 'Book removed from shelf' });
  } catch (error) {
    console.error('Error removing from shelf:', error);
    res.status(500).json({ success: false, message: 'Internal Server Error' });
  }
});

// POST /api/profile/update-shelf-design
router.post('/update-shelf-design', async (req, res) => {
  try {
    const { emailId, folderName, shelf_design } = req.body;
    if (!emailId || shelf_design === undefined) {
      return res.status(400).json({ success: false, message: 'Missing emailId or shelf_design' });
    }

    let profile = await Profile.findOne({ emailId: emailId.trim().toLowerCase() });
    if (!profile || !profile.myShelf || !profile.myShelf.folders) {
      return res.status(404).json({ success: false, message: 'Profile or shelf not found' });
    }

    normalizeAndMergeFolders(profile);

    let targetFolder = normalizeFolderName(folderName);
    let folder = profile.myShelf.folders.find(f => f.folderName === targetFolder);
    if (!folder) {
      return res.status(404).json({ success: false, message: 'Folder not found' });
    }

    folder.shelf_design = shelf_design;
    
    profile.updatedAt = new Date();
    profile.markModified('myShelf.folders');
    profile.markModified('myShelf');
    await profile.save();

    res.json({ success: true, message: 'Shelf design updated' });
  } catch (error) {
    console.error('Error updating shelf design:', error);
    res.status(500).json({ success: false, message: 'Internal Server Error' });
  }
});

export default router;