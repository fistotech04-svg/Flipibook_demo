import express from "express";
import Flipbook from "../../models/Flipbook.js";
import Profile from "../../models/Profile.js";
import User from "../../models/auth.js";
import InteractionThreedModel from "../../models/InteractionThreedModel.js";

const router = express.Router();

/**
 * @route   GET /api/explore/published
 * @desc    Get all published flipbooks across all users with author details
 * @access  Public
 */
router.get("/published", async (req, res) => {
    try {
        // Fetch all flipbooks where isPublished is true
        const books = await Flipbook.find({ isPublished: true })
            .sort({ createdAt: -1 })
            .lean();

        // Extract distinct user emails
        const userEmails = [...new Set(books.map(b => b.userEmail).filter(Boolean))];

        // Fetch corresponding profiles, users, and 3D models to enrich author information and 3D status
        const safeRegexList = userEmails.map(e => new RegExp(`^${e.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}$`, 'i'));
        const [profiles, users, interaction3DModels] = await Promise.all([
            Profile.find({ emailId: { $in: safeRegexList } }).lean(),
            User.find({ emailId: { $in: safeRegexList } }).lean(),
            InteractionThreedModel.find({}).lean()
        ]);

        const threedFlipbookVIds = new Set(interaction3DModels.map(m => m.flipbook_v_id).filter(Boolean));
        const threedFlipbookNames = new Set(interaction3DModels.map(m => `${(m.userEmail || '').toLowerCase()}:::${(m.flipbookName || '').toLowerCase()}`));

        const profileMap = {};
        profiles.forEach(p => {
            if (p.emailId) profileMap[p.emailId.toLowerCase()] = p;
        });
        users.forEach(u => {
            if (u.emailId) {
                const key = u.emailId.toLowerCase();
                if (!profileMap[key]) {
                    profileMap[key] = u;
                } else if (!profileMap[key].name && u.name) {
                    profileMap[key].name = u.name;
                }
            }
        });

        const enrichedBooks = books.map(book => {
            const p = profileMap[book.userEmail?.toLowerCase()] || {};
            const authorName = p.name || (book.userEmail ? book.userEmail.split('@')[0] : 'Creator');
            const city = p.city || p.state || (p.country && p.country !== 'INDIA' ? p.country : '') || 'Coimbatore';
            const authorPicture = p.picture || null;
            const authorBgColor = p.avatarBgColor || '#E8D4C8';

            const has3D = Boolean(
                (book.v_id && threedFlipbookVIds.has(book.v_id)) ||
                (book.userEmail && book.flipbookName && threedFlipbookNames.has(`${book.userEmail.toLowerCase()}:::${book.flipbookName.toLowerCase()}`)) ||
                book.has3D ||
                book.is3D ||
                book.has3DModels ||
                (book.Customized_Settings?.InteractionThreedModel && Object.keys(book.Customized_Settings.InteractionThreedModel).length > 0)
            );

            return {
                ...book,
                has3D,
                is3D: has3D,
                authorName,
                city,
                authorPicture,
                authorBgColor
            };
        });

        return res.status(200).json({
            success: true,
            count: enrichedBooks.length,
            books: enrichedBooks
        });
    } catch (error) {
        console.error("[Explore API Error]: Failed to fetch published flipbooks", error);
        return res.status(500).json({
            success: false,
            message: "Server error while fetching published flipbooks",
            error: error.message
        });
    }
});

/**
 * @route   GET /api/explore/creator
 * @desc    Get a specific creator's profile info and all their published flipbooks
 * @access  Public
 */
router.get("/creator", async (req, res) => {
    try {
        let rawEmail = req.query.emailId || req.query.email;
        const shareId = req.query.shareId;
        const v_id = req.query.v_id || req.query.vId;

        // If email is not directly provided, resolve creator email via flipbook shareId or v_id from DB
        if (!rawEmail && (shareId || v_id)) {
            const query = [];
            if (shareId) {
                query.push({ "Customized_Settings.Visibility.shareId": shareId });
                query.push({ "Visibility.shareId": shareId });
                query.push({ "share.shareId": shareId });
                query.push({ v_id: shareId });
            }
            if (v_id) {
                query.push({ v_id: v_id });
            }
            const foundBook = await Flipbook.findOne({ $or: query }).lean();
            if (foundBook && foundBook.userEmail) {
                rawEmail = foundBook.userEmail;
            }
        }

        if (!rawEmail) {
            return res.status(400).json({ success: false, message: "emailId, shareId, or v_id query parameter is required" });
        }

        const normalizedEmail = rawEmail.trim().toLowerCase();
        const safeRegex = new RegExp(`^${normalizedEmail.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}$`, 'i');

        const currentEmailParam = (req.query.currentEmail || req.query.followerEmail || req.query.userEmail || '').trim().toLowerCase();
        const isOwner = Boolean(currentEmailParam && currentEmailParam === normalizedEmail);

        // Fetch user profile
        const profile = await Profile.findOne({ emailId: safeRegex }).lean();

        let shelfVIds = [];
        if (profile && profile.myShelf && profile.myShelf.folders) {
            profile.myShelf.folders.forEach(f => {
                if (f.books && Array.isArray(f.books)) {
                    f.books.forEach(b => {
                        const v_id = typeof b === 'string' ? b : b.v_id;
                        if (v_id) shelfVIds.push(v_id);
                    });
                }
            });
        }

        // For owner viewing own profile, retrieve all books (including drafts/unpublished); for others, retrieve only published books
        const booksQuery = isOwner 
            ? { userEmail: safeRegex } 
            : { userEmail: safeRegex, isPublished: true };

        const shelfBooksQuery = isOwner
            ? { v_id: { $in: shelfVIds } }
            : { v_id: { $in: shelfVIds }, isPublished: true };

        // Fetch user auth, creator flipbooks, shelf flipbooks, and 3D models in parallel
        const [user, creatorBooks, shelfBooks, creator3DModels] = await Promise.all([
            User.findOne({ emailId: safeRegex }).lean(),
            Flipbook.find(booksQuery).sort({ createdAt: -1 }).lean(),
            shelfVIds.length > 0 ? Flipbook.find(shelfBooksQuery).lean() : Promise.resolve([]),
            InteractionThreedModel.find({ userEmail: safeRegex }).lean()
        ]);

        const allBooksMap = new Map();
        creatorBooks.forEach(b => { 
            if (b.v_id && (isOwner || b.isPublished === true || b.isPublished === 'true')) {
                allBooksMap.set(b.v_id, b); 
            }
        });
        shelfBooks.forEach(b => { 
            if (b.v_id && (isOwner || b.isPublished === true || b.isPublished === 'true')) {
                allBooksMap.set(b.v_id, b); 
            }
        });
        const allBooks = Array.from(allBooksMap.values());

        const creatorThreedVIds = new Set(creator3DModels.map(m => m.flipbook_v_id).filter(Boolean));
        const creatorThreedNames = new Set(creator3DModels.map(m => (m.flipbookName || '').toLowerCase()));

        // Extract distinct user emails for all books
        const bookUserEmails = [...new Set(allBooks.map(b => b.userEmail).filter(Boolean))];
        const safeRegexListBook = bookUserEmails.map(e => new RegExp(`^${e.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}$`, 'i'));
        
        // Fetch corresponding profiles for author enrichment
        const bookProfiles = await Profile.find({ emailId: { $in: safeRegexListBook } }).lean();
        
        const bookProfileMap = {};
        bookProfiles.forEach(p => {
            if (p.emailId) bookProfileMap[p.emailId.toLowerCase()] = p;
        });

        const enrichedPublishedBooks = allBooks.map(book => {
            const has3D = Boolean(
                (book.v_id && creatorThreedVIds.has(book.v_id)) ||
                (book.flipbookName && creatorThreedNames.has(book.flipbookName.toLowerCase())) ||
                book.has3D ||
                book.is3D ||
                book.has3DModels ||
                (book.Customized_Settings?.InteractionThreedModel && Object.keys(book.Customized_Settings.InteractionThreedModel).length > 0)
            );
            
            const p = bookProfileMap[book.userEmail?.toLowerCase()] || {};
            const authorName = p.name || (book.userEmail ? book.userEmail.split('@')[0] : 'Creator');
            const city = p.city || p.state || (p.country && p.country !== 'INDIA' ? p.country : '') || 'Coimbatore';
            const authorPicture = p.picture || null;
            const authorBgColor = p.avatarBgColor || '#E8D4C8';

            return {
                ...book,
                has3D,
                is3D: has3D,
                authorName,
                city,
                authorPicture,
                authorBgColor
            };
        });

        let isFollowingCreator = false;
        if (currentEmailParam && Array.isArray(profile?.followers)) {
            isFollowingCreator = profile.followers.some(f => f.toLowerCase() === currentEmailParam);
        }

        const mergedProfile = {
            name: profile?.name || user?.name || normalizedEmail.split('@')[0],
            email: normalizedEmail,
            emailId: normalizedEmail,
            picture: profile?.picture || user?.picture || null,
            avatarBgColor: profile?.avatarBgColor || '#E8D4C8',
            bannerBg: profile?.bannerBg || { type: 'gradient', value: 'linear-gradient(120deg, #9fe6cb 0%, #72ceaf 50%, #9fe6cb 100%)' },
            about: profile?.about || '',
            mobile: profile?.mobile || '',
            companyName: profile?.companyName || '',
            industryType: profile?.industryType || '',
            companyEmail: profile?.companyEmail || '',
            website: profile?.website || '',
            services: profile?.services || [],
            address1: profile?.address1 || '',
            address2: profile?.address2 || '',
            city: profile?.city || '',
            pincode: profile?.pincode || '',
            state: profile?.state || '',
            country: profile?.country || 'INDIA',
            socials: profile?.socials || {},
            followers: profile?.followers || [],
            following: profile?.following || [],
            isFollowing: isFollowingCreator,
            myShelf: profile?.myShelf || { shelfCount: 1, folders: [{ folderName: 'My Flipbooks', shelf_design: 1, books: [] }] }
        };

        return res.status(200).json({
            success: true,
            profile: mergedProfile,
            books: enrichedPublishedBooks || []
        });
    } catch (error) {
        console.error("[Explore Creator API Error]:", error);
        return res.status(500).json({
            success: false,
            message: "Server error while fetching creator profile",
            error: error.message
        });
    }
});

/**
 * @route   GET /api/explore/top-creators
 * @desc    Get top creators with their profile info and public flipbooks count
 * @access  Public
 */
router.get("/top-creators", async (req, res) => {
    try {
        const currentEmail = (req.query.currentEmail || req.query.emailId || req.query.email || req.query.excludeEmail || '').trim().toLowerCase();

        // Aggregate published flipbooks count per user
        const counts = await Flipbook.aggregate([
            { $match: { isPublished: true } },
            { $group: { _id: { $toLower: "$userEmail" }, totalBooks: { $sum: 1 } } },
            { $sort: { totalBooks: -1 } }
        ]);

        const countMap = {};
        counts.forEach(c => {
            if (c._id) countMap[c._id] = c.totalBooks;
        });

        // Also fetch all profiles and registered users
        const [profiles, users] = await Promise.all([
            Profile.find({}).lean(),
            User.find({}).lean()
        ]);

        const creatorMap = {};

        // Merge profiles
        profiles.forEach(p => {
            if (!p.emailId) return;
            const emailKey = p.emailId.trim().toLowerCase();
            const followersArr = p.followers || [];
            creatorMap[emailKey] = {
                emailId: emailKey,
                email: emailKey,
                name: p.name || emailKey.split('@')[0],
                picture: p.picture || null,
                avatarBgColor: p.avatarBgColor || '#E8D4C8',
                bannerBg: p.bannerBg || { type: 'gradient', value: 'linear-gradient(120deg, #9fe6cb 0%, #72ceaf 50%, #9fe6cb 100%)' },
                about: p.about || '“Bring your content to life with a real, interactive experience”',
                industryType: p.industryType || p.companyName || 'Product Designer',
                companyName: p.companyName || '',
                city: p.city || '',
                state: p.state || '',
                country: p.country || 'INDIA',
                totalBooks: countMap[emailKey] || 0,
                followers: followersArr,
                followersCount: followersArr.length,
                following: p.following || [],
                isFollowing: currentEmail ? followersArr.some(f => f.toLowerCase() === currentEmail) : false
            };
        });

        // Merge users without profiles or with total books
        users.forEach(u => {
            if (!u.emailId) return;
            const emailKey = u.emailId.trim().toLowerCase();
            if (!creatorMap[emailKey]) {
                creatorMap[emailKey] = {
                    emailId: emailKey,
                    email: emailKey,
                    name: u.name || emailKey.split('@')[0],
                    picture: u.picture || null,
                    avatarBgColor: '#E8D4C8',
                    bannerBg: { type: 'gradient', value: 'linear-gradient(120deg, #9fe6cb 0%, #72ceaf 50%, #9fe6cb 100%)' },
                    about: '“Bring your content to life with a real, interactive experience”',
                    industryType: 'Product Designer',
                    companyName: '',
                    city: '',
                    state: '',
                    country: 'INDIA',
                    totalBooks: countMap[emailKey] || 0,
                    followers: [],
                    followersCount: 0,
                    following: [],
                    isFollowing: false
                };
            } else if (!creatorMap[emailKey].name && u.name) {
                creatorMap[emailKey].name = u.name;
            }
        });

        let creatorsList = Object.values(creatorMap);

        // Exclude current logged-in user's own profile if provided
        const excludeEmail = (req.query.excludeEmail || req.query.currentEmail || req.query.emailId || req.query.email || '').trim().toLowerCase();
        if (excludeEmail) {
            creatorsList = creatorsList.filter(c => c.emailId.toLowerCase() !== excludeEmail);
        }

        // Sort: creators with published books first (highest totalBooks), then highest followers
        creatorsList.sort((a, b) => {
            if (b.totalBooks !== a.totalBooks) return b.totalBooks - a.totalBooks;
            return b.followersCount - a.followersCount;
        });

        return res.status(200).json({
            success: true,
            count: creatorsList.length,
            creators: creatorsList
        });
    } catch (error) {
        console.error("[Top Creators API Error]:", error);
        return res.status(500).json({
            success: false,
            message: "Server error while fetching top creators",
            error: error.message
        });
    }
});

/**
 * @route   POST /api/explore/toggle-follow
 * @desc    Follow or Unfollow a creator
 * @access  Public (Requires email)
 */
router.post("/toggle-follow", async (req, res) => {
    try {
        const { currentEmail, targetEmail } = req.body;

        if (!currentEmail || !targetEmail) {
            return res.status(400).json({
                success: false,
                message: "Both currentEmail and targetEmail are required."
            });
        }

        const normalizedCurrent = currentEmail.trim().toLowerCase();
        const normalizedTarget = targetEmail.trim().toLowerCase();

        if (normalizedCurrent === normalizedTarget) {
            return res.status(400).json({
                success: false,
                message: "You cannot follow your own profile."
            });
        }

        const safeTargetRegex = new RegExp(`^${normalizedTarget.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}$`, 'i');
        const safeCurrentRegex = new RegExp(`^${normalizedCurrent.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}$`, 'i');

        // Find or create Target Profile
        let targetProfile = await Profile.findOne({ emailId: safeTargetRegex });
        if (!targetProfile) {
            const user = await User.findOne({ emailId: safeTargetRegex });
            targetProfile = new Profile({
                emailId: normalizedTarget,
                name: user?.name || normalizedTarget.split('@')[0],
                picture: user?.picture || null,
                avatarBgColor: '#E8D4C8'
            });
        }

        // Find or create Follower (Current) Profile
        let currentProfile = await Profile.findOne({ emailId: safeCurrentRegex });
        if (!currentProfile) {
            const user = await User.findOne({ emailId: safeCurrentRegex });
            currentProfile = new Profile({
                emailId: normalizedCurrent,
                name: user?.name || normalizedCurrent.split('@')[0],
                picture: user?.picture || null,
                avatarBgColor: '#E8D4C8'
            });
        }

        if (!Array.isArray(targetProfile.followers)) targetProfile.followers = [];
        if (!Array.isArray(currentProfile.following)) currentProfile.following = [];

        const isCurrentlyFollowing = targetProfile.followers.some(
            email => email && email.toLowerCase() === normalizedCurrent
        );

        let isFollowing = false;

        if (isCurrentlyFollowing) {
            // UNFOLLOW
            targetProfile.followers = targetProfile.followers.filter(
                email => email && email.toLowerCase() !== normalizedCurrent
            );
            currentProfile.following = currentProfile.following.filter(
                email => email && email.toLowerCase() !== normalizedTarget
            );
            isFollowing = false;
        } else {
            // FOLLOW
            targetProfile.followers.push(normalizedCurrent);
            currentProfile.following.push(normalizedTarget);
            isFollowing = true;
        }

        await Promise.all([
            targetProfile.save(),
            currentProfile.save()
        ]);

        return res.status(200).json({
            success: true,
            isFollowing,
            followersCount: targetProfile.followers.length,
            followingCount: currentProfile.following.length,
            followers: targetProfile.followers,
            following: currentProfile.following,
            message: isFollowing ? "Followed successfully" : "Unfollowed successfully"
        });
    } catch (error) {
        console.error("[Toggle Follow API Error]:", error);
        return res.status(500).json({
            success: false,
            message: "Server error while toggling follow status",
            error: error.message
        });
    }
});

export default router;
