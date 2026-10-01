import mongoose from 'mongoose';

const FlipbookAssetSchema = new mongoose.Schema({
  flipbook_v_id: {
    type: String,
    index: true
  },
  file_v_id: {
    type: String,
    required: true,
    unique: true
  },
  assetType: {
    type: String, // 'image', 'video', 'gif', 'icon'
    required: true
  },
  fileName: {
    type: String,
    required: true
  },
  originalName: {
    type: String
  },
  userEmail: {
    type: String,
    index: true
  },
  isGallery: {
    type: Boolean,
    default: false
  },
  page_v_id: {
    type: String,
    required: true
  },
  flipbookName: {
    type: String,
    required: true,
    index: true  // For efficient queries when renaming
  },
  folderName: {
    type: String,
    required: true,
    index: true  // For efficient queries
  },
  url: {
    type: String,
    required: true
  },
  size: {
    type: Number
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
});

const FlipbookAsset = mongoose.model('FlipbookAsset', FlipbookAssetSchema);

export default FlipbookAsset;
