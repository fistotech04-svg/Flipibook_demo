import mongoose from "mongoose";
import { nanoid } from "nanoid";

const threedModelSchema = new mongoose.Schema({
  modelId: {
    type: String,
    default: () => nanoid(20),
    unique: true,
    index: true
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
  url: {
    type: String,
    required: true
  },
  thumbnailUrl: {
    type: String,
    default: null
  },
  size: {
    type: String,
    required: true
  },
  type: {
    type: String,
    required: true
  },
  displayName: {
    type: String,
    default: null
  },
  hotspots: {
    type: Array,
    default: []
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
});

// Avoid model recompilation error
const ThreedModel = mongoose.models.ThreedModel || mongoose.model("ThreedModel", threedModelSchema);

export default ThreedModel;
