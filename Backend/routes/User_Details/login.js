import express from 'express';
import User from '../../models/auth.js';
import Profile from '../../models/Profile.js';
import OtpVerification from '../../models/OtpVerification.js';
import bcrypt from 'bcryptjs';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { OAuth2Client } from 'google-auth-library';
import nodemailer from 'nodemailer';
import { ensureUserFoldersInSupabase, uploadBufferToSupabase } from '../../config/supabase.js';

const router = express.Router();

// Helper to get Gmail Transporter (ensures env vars are loaded)
const getTransporter = () => {
  const user = (process.env.EMAIL_USER || '').trim();
  const pass = (process.env.EMAIL_APP_PASSWORD || '').replace(/\s+/g, '');
  return nodemailer.createTransport({
    service: 'gmail',
    auth: {
      user: user,
      pass: pass,
    },
  });
};

const getGoogleClient = () => new OAuth2Client(process.env.GOOGLE_CLIENT_ID);

// Get the directory name for ES modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Helper to ensure user folders exist in Supabase
const ensureUserFolders = (sanitizedEmail) => {
  try {
    // Create folder structure in Supabase Storage (non-blocking)
    ensureUserFoldersInSupabase(sanitizedEmail).catch(err => {
      console.warn("[Supabase] Async folder creation warning:", err);
    });

    return true;
  } catch (folderError) {
    console.error('Error ensuring user folder in Supabase:', folderError);
    return false;
  }
};

/**
 * Helper to download Google profile image and store in user's Supabase Storage Profile folder using native fetch.
 */
const saveGooglePictureToSupabase = async (sanitizedEmail, googlePictureUrl) => {
  try {
    if (!googlePictureUrl || !sanitizedEmail) return null;
    const response = await fetch(googlePictureUrl);
    if (!response.ok) return googlePictureUrl;
    const arrayBuffer = await response.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);
    const contentType = response.headers.get('content-type') || 'image/png';
    const destinationPath = `${sanitizedEmail}/Profile/avatar_google.png`;
    const supabaseUrl = await uploadBufferToSupabase(buffer, destinationPath, contentType);
    return supabaseUrl || googlePictureUrl;
  } catch (err) {
    console.warn('[Google Picture] Error uploading Google picture to Supabase, fallback to URL:', err.message);
    return googlePictureUrl;
  }
};

// @route   POST /api/auth/google-login
// @desc    Login or Signup with Google
// @access  Public
router.post('/google-login', async (req, res) => {
  try {
    const { token, isAccessToken, email: manualEmail, name: manualName, picture: manualPicture, sub: manualSub } = req.body;
    
    let email, googleId, picture, name;

    if (isAccessToken) {
      // Data already fetched from Google on frontend
      email = manualEmail;
      googleId = manualSub;
      picture = manualPicture;
      name = manualName;
    } else {
      if (!token) {
        return res.status(400).json({ message: 'Token is required' });
      }
      // Verify Google Token (ID Token)
      const ticket = await getGoogleClient().verifyIdToken({
        idToken: token,
        audience: process.env.GOOGLE_CLIENT_ID,
      });

      const payload = ticket.getPayload();
      email = payload.email;
      googleId = payload.sub;
      picture = payload.picture;
      name = payload.name;
    }

    if (!email) {
      return res.status(400).json({ message: 'Failed to retrieve email from Google' });
    }

    const sanitizedEmail = email.replace(/[@.]/g, '_');

    // Check if user exists
    let user = await User.findOne({ emailId: email });
    let isNewUser = false;

    if (!user) {
      isNewUser = true;
      // If user does not exist, create a new user with Google ID
      user = new User({
        emailId: email,
        password: googleId, // Password hashed by pre-save hook
        userFolder: sanitizedEmail
      });

      await user.save();
    }

    // Handle Profile picture upload to Supabase if picture is available
    let finalPictureUrl = picture || null;
    if (picture) {
      const supabaseAvatarUrl = await saveGooglePictureToSupabase(sanitizedEmail, picture);
      if (supabaseAvatarUrl) {
        finalPictureUrl = supabaseAvatarUrl;
      }
    }

    // Fetch or create profile for Google user
    const normalizedEmail = email.trim().toLowerCase();
    const safeRegex = new RegExp(`^${normalizedEmail.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}$`, 'i');
    let profile = await Profile.findOne({ emailId: safeRegex });

    if (!profile) {
      const defaultName = (name && typeof name === 'string' && name.trim()) ? name.trim() : normalizedEmail.split('@')[0];
      const formattedName = defaultName.charAt(0).toUpperCase() + defaultName.slice(1);

      profile = new Profile({
        emailId: normalizedEmail,
        name: formattedName,
        picture: finalPictureUrl,
        avatarBgColor: '#E8D4C8'
      });
      await profile.save();
    } else {
      // If profile exists but had no picture, update with Google picture
      if (!profile.picture && finalPictureUrl) {
        profile.picture = finalPictureUrl;
        await profile.save();
      }
    }

    // Ensure folders exist for both new and returning Google users
    ensureUserFolders(user.userFolder || sanitizedEmail);

    res.status(200).json({ 
      message: 'Google login successful', 
      user: {
        emailId: user.emailId,
        userFolder: user.userFolder,
        createdAt: user.createdAt,
        picture: profile?.picture || finalPictureUrl || picture || null,
        name: profile?.name || name || user.emailId.split('@')[0],
        avatarBgColor: profile?.avatarBgColor || '#E8D4C8'
      }
    });
  } catch (error) {
    console.error('Google Login Error:', error);
    res.status(500).json({ message: 'Google authentication failed', error: error.message });
  }
});

// @route   POST /api/auth/send-signup-otp
// @desc    Send OTP to verify user's email before creating an account
// @access  Public
router.post('/send-signup-otp', async (req, res) => {
  try {
    const { emailId, name } = req.body;
    if (!emailId) {
      return res.status(400).json({ message: 'Email ID is required' });
    }

    const normalizedEmail = emailId.trim().toLowerCase();
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(normalizedEmail)) {
      return res.status(400).json({ message: 'Please provide a valid email address' });
    }

    // Check if user already exists
    const existingUser = await User.findOne({ emailId: normalizedEmail });
    if (existingUser) {
      return res.status(400).json({ message: 'An account with this email already exists. Please sign in.' });
    }

    // Generate 6-digit OTP
    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    const userName = (name && typeof name === 'string' && name.trim()) ? name.trim() : normalizedEmail.split('@')[0];

    // Send OTP via Nodemailer (Gmail App Password)
    try {
      const transporter = getTransporter();
      await transporter.sendMail({
        from: `Fisto <${process.env.EMAIL_USER}>`,
        to: normalizedEmail,
        subject: 'Your Fisto Account Verification Code',
        html: `
          <!DOCTYPE html>
          <html>
          <body style="margin: 0; padding: 0; background-color: #f4f7f6; font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;">
            <div style="max-width: 600px; margin: 40px auto; background-color: #ffffff; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 15px rgba(0,0,0,0.05); border: 1px solid #eaeaea;">
              <div style="background: linear-gradient(135deg, #4c5add, #3f4bc0); padding: 30px 20px; text-align: center;">
                <h1 style="color: #ffffff; margin: 0; font-size: 28px; font-weight: 600; letter-spacing: 2px;">FIST-O</h1>
              </div>
              <div style="padding: 40px 30px;">
                <h2 style="color: #333333; font-size: 22px; font-weight: 600; margin-top: 0; text-align: center;">Email Verification Code</h2>
                <p style="color: #555555; font-size: 16px; line-height: 1.6;">Hello <strong style="color: #333;">${userName}</strong>,</p>
                <p style="color: #555555; font-size: 16px; line-height: 1.6;">Thank you for signing up with Fisto. Please use the verification code below to verify your email address and activate your account.</p>
                
                <div style="background-color: #f8f9fe; border: 2px dashed #4c5add; border-radius: 8px; padding: 24px; text-align: center; margin: 30px 0;">
                  <span style="display: block; font-size: 36px; font-weight: 700; color: #4c5add; letter-spacing: 8px; margin-left: 8px;">${otp}</span>
                </div>

                <p style="color: #777777; font-size: 14px; line-height: 1.6; margin-bottom: 0;">
                  This code is valid for 10 minutes. If you did not initiate this registration, you can safely ignore this email.
                </p>
              </div>
              <div style="background-color: #f9f9f9; padding: 20px; text-align: center; border-top: 1px solid #eaeaea;">
                <p style="color: #999999; font-size: 12px; margin: 0;">&copy; ${new Date().getFullYear()} Fisto Tech. All rights reserved.</p>
              </div>
            </div>
          </body>
          </html>
        `
      });

      // Encrypt OTP before saving
      const salt = await bcrypt.genSalt(10);
      const hashedOtp = await bcrypt.hash(otp, salt);

      // Clean up previous OTPs for this email and insert new one
      await OtpVerification.deleteMany({ emailId: normalizedEmail });
      await OtpVerification.create({
        emailId: normalizedEmail,
        otp: hashedOtp,
        createdAt: new Date()
      });

      return res.status(200).json({ success: true, message: 'Verification OTP sent to your email' });
    } catch (emailError) {
      console.error('Email Sending Error:', emailError);
      return res.status(500).json({ message: 'Failed to send OTP email. Please verify your email address or try again.' });
    }
  } catch (error) {
    console.error('Send Signup OTP Error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// @route   POST /api/auth/signup
// @desc    Register a new user after verifying OTP
// @access  Public
router.post('/signup', async (req, res) => {
  try {
    const { emailId, password, name, otp } = req.body;

    if (!emailId || !password) {
      return res.status(400).json({ message: 'Email and password are required' });
    }

    if (!otp) {
      return res.status(400).json({ message: 'Verification OTP is required to complete registration' });
    }

    const normalizedEmail = emailId.trim().toLowerCase();

    // Check if user already exists
    const existingUser = await User.findOne({ emailId: normalizedEmail });
    if (existingUser) {
      return res.status(400).json({ message: 'User already exists with this email' });
    }

    // Verify OTP against OtpVerification records
    const otpRecord = await OtpVerification.findOne({ emailId: normalizedEmail }).sort({ createdAt: -1 });
    if (!otpRecord) {
      return res.status(400).json({ message: 'OTP expired or not found. Please request a new code.' });
    }

    const isMatch = await bcrypt.compare(String(otp).trim(), otpRecord.otp);
    if (!isMatch) {
      return res.status(400).json({ message: 'Invalid verification code. Please check and try again.' });
    }

    // Sanitize email for use as folder name (replace @ and . with _)
    const sanitizedEmail = normalizedEmail.replace(/[@.]/g, '_');

    // Create new user (Password is hashed automatically by pre-save hook in User model)
    const newUser = new User({
      emailId: normalizedEmail,
      password,
      userFolder: sanitizedEmail
    });

    // Create user-specific folder for storing files
    ensureUserFolders(sanitizedEmail);

    // Save user to database
    await newUser.save();

    // Clean up OTP record
    await OtpVerification.deleteMany({ emailId: normalizedEmail });

    // Automatically create profile with basic details (email and name only)
    const safeRegex = new RegExp(`^${normalizedEmail.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}$`, 'i');
    let profile = await Profile.findOne({ emailId: safeRegex });

    if (!profile) {
      const defaultName = (name && typeof name === 'string' && name.trim()) ? name.trim() : normalizedEmail.split('@')[0];
      const formattedName = defaultName.charAt(0).toUpperCase() + defaultName.slice(1);

      profile = new Profile({
        emailId: normalizedEmail,
        name: formattedName,
        picture: null,
        avatarBgColor: '#E8D4C8'
      });
      await profile.save();
    }

    res.status(201).json({ 
      message: 'User registered successfully', 
      user: {
        emailId: newUser.emailId,
        name: profile?.name || newUser.emailId.split('@')[0],
        picture: profile?.picture || null,
        avatarBgColor: profile?.avatarBgColor || '#E8D4C8',
        userFolder: sanitizedEmail,
        createdAt: newUser.createdAt
      }
    });
  } catch (error) {
    console.error('Signup Error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// @route   POST /api/auth/login
// @desc    Login user
// @access  Public
router.post('/login', async (req, res) => {
  try {
    const { emailId, password } = req.body;

    // Check if user exists
    const user = await User.findOne({ emailId });
    if (!user) {
      return res.status(400).json({ message: 'Invalid credentials' });
    }

    // Check password (using bcrypt comparison)
    const isMatch = await user.comparePassword(password);
    if (!isMatch) {
      return res.status(400).json({ message: 'Invalid credentials' });
    }

    // Ensure folders exist on Supabase and local storage on login
    const sanitizedEmail = user.emailId.replace(/[@.]/g, '_');
    ensureUserFolders(user.userFolder || sanitizedEmail);

    const normalizedEmail = user.emailId.trim().toLowerCase();
    const safeRegex = new RegExp(`^${normalizedEmail.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}$`, 'i');
    const profile = await Profile.findOne({ emailId: safeRegex });

    res.status(200).json({ 
      message: 'Login successful', 
      user: {
        emailId: user.emailId,
        userFolder: user.userFolder,
        createdAt: user.createdAt,
        picture: profile?.picture || null,
        name: profile?.name || user.emailId.split('@')[0],
        avatarBgColor: profile?.avatarBgColor || '#E8D4C8'
      }
    });
  } catch (error) {
    console.error('Login Error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// @route   POST /api/auth/check-user
// @desc    Check if a user exists by email and send OTP
// @access  Public
router.post('/check-user', async (req, res) => {
  try {
    const { emailId } = req.body;
    const user = await User.findOne({ emailId });
    
    if (!user) {
      return res.status(404).json({ exists: false, message: 'User not found' });
    }

    // Generate 6-digit OTP
    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    
    // Personalize email name
    const userName = user.emailId.split('@')[0];

    // Send OTP via Nodemailer (Gmail App Password)
    try {
      const transporter = getTransporter();
      await transporter.sendMail({
        from: `Fisto <${process.env.EMAIL_USER}>`,
        to: emailId,
        subject: 'Your Password Reset OTP',
        html: `
          <!DOCTYPE html>
          <html>
          <body style="margin: 0; padding: 0; background-color: #f4f7f6; font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;">
            <div style="max-width: 600px; margin: 40px auto; background-color: #ffffff; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 15px rgba(0,0,0,0.05); border: 1px solid #eaeaea;">
              <div style="background: linear-gradient(135deg, #4c5add, #3f4bc0); padding: 30px 20px; text-align: center;">
                <h1 style="color: #ffffff; margin: 0; font-size: 28px; font-weight: 600; letter-spacing: 2px;">FIST-O</h1>
              </div>
              <div style="padding: 40px 30px;">
                <h2 style="color: #333333; font-size: 22px; font-weight: 600; margin-top: 0; text-align: center;">Password Reset Request</h2>
                <p style="color: #555555; font-size: 16px; line-height: 1.6;">Hello <strong style="color: #333;">${userName}</strong>,</p>
                <p style="color: #555555; font-size: 16px; line-height: 1.6;">We received a request to reset your Fisto account password. Please use the verification code below to complete the process.</p>
                
                <div style="background-color: #f8f9fe; border: 2px dashed #4c5add; border-radius: 8px; padding: 24px; text-align: center; margin: 30px 0;">
                  <span style="display: block; font-size: 36px; font-weight: 700; color: #4c5add; letter-spacing: 8px; margin-left: 8px;">${otp}</span>
                </div>

                <p style="color: #777777; font-size: 14px; line-height: 1.6; margin-bottom: 0;">
                  This code is valid for a limited time. If you did not request a password reset, you can safely ignore this email.
                </p>
              </div>
              <div style="background-color: #f9f9f9; padding: 20px; text-align: center; border-top: 1px solid #eaeaea;">
                <p style="color: #999999; font-size: 12px; margin: 0;">&copy; ${new Date().getFullYear()} Fisto Tech. All rights reserved.</p>
              </div>
            </div>
          </body>
          </html>
        `
      });

      // Encrypt OTP before saving to database
      const salt = await bcrypt.genSalt(10);
      user.otp = await bcrypt.hash(otp, salt);
      await user.save();
      
      return res.status(200).json({ exists: true, message: 'OTP sent successfully' });
    } catch (emailError) {
      console.error('Email Sending Error:', emailError);
      return res.status(500).json({ message: 'Failed to send OTP. Please check your Gmail API credentials.' });
    }
  } catch (error) {
    console.error('Check User Error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   POST /api/auth/verify-otp
// @desc    Verify the OTP provided by the user
// @access  Public
router.post('/verify-otp', async (req, res) => {
  try {
    const { emailId, otp } = req.body;
    const user = await User.findOne({ emailId });

    if (!user || !user.otp) {
      return res.status(400).json({ message: 'Invalid OTP or session expired' });
    }

    const isMatch = await bcrypt.compare(otp, user.otp);
    if (!isMatch) {
      return res.status(400).json({ message: 'Invalid OTP' });
    }

    res.status(200).json({ message: 'OTP verified' });
  } catch (error) {
    console.error('Verify OTP Error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   POST /api/auth/reset-password
// @desc    Reset password after OTP verification
// @access  Public
router.post('/reset-password', async (req, res) => {
  try {
    const { emailId, otp, newPassword } = req.body;
    const user = await User.findOne({ emailId });

    if (!user || !user.otp) {
      return res.status(400).json({ message: 'Invalid OTP or session expired' });
    }

    const isMatch = await bcrypt.compare(otp, user.otp);
    if (!isMatch) {
      return res.status(400).json({ message: 'Invalid OTP' });
    }

    // Update password (pre-save hook will hash it)
    user.password = newPassword;
    user.otp = null; // Clear OTP
    await user.save();

    res.status(200).json({ message: 'Password reset successful' });
  } catch (error) {
    console.error('Reset Password Error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   POST /api/auth/clear-otp
// @desc    Clear OTP for a user
// @access  Public
router.post('/clear-otp', async (req, res) => {
  try {
    const { emailId } = req.body;
    await User.findOneAndUpdate({ emailId }, { otp: null });
    res.status(200).json({ message: 'OTP cleared' });
  } catch (error) {
    console.error('Clear OTP Error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   GET /api/auth/users
// @desc    Get all users (Simple get function as requested)
// @access  Public
router.get('/users', async (req, res) => {
  try {
    const users = await User.find();
    res.json(users);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
});

export default router;
