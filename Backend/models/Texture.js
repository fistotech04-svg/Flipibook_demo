import mongoose from "mongoose";

const textureSchema = new mongoose.Schema({
  userEmail: {
    type: String,
    required: true,
    index: true
  },
  materialName: {
    type: String,
    required: true
  },
  materialCategory: {
    type: String,
    ref: "TextureCategory",
    required: true
  },
  maps: {
    preview: { type: String, default: null },
    base: { type: String, required: true },
    metallic: { type: String, required: true },
    roughness: { type: String, required: true },
    normal: { type: String, required: true },
    ao: { type: String, default: null },
    displacement: { type: String, default: null },
    opacity: { type: String, default: null },
    emissive: { type: String, default: null }
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
});

const Texture = mongoose.model("Texture", textureSchema);

export default Texture;
