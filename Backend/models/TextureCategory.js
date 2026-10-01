import mongoose from "mongoose";
import { nanoid } from "nanoid";

const textureCategorySchema = new mongoose.Schema({
  _id: {
    type: String,
    default: () => nanoid(10)
  },
  userEmail: {
    type: String,
    required: true,
    index: true
  },
  name: {
    type: String,
    required: true
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
});

// Ensure unique category names per user
textureCategorySchema.index({ userEmail: 1, name: 1 }, { unique: true });

const TextureCategory = mongoose.model("TextureCategory", textureCategorySchema);

export default TextureCategory;
