import mongoose from 'mongoose';
import { nanoid } from 'nanoid';

const leadSchema = new mongoose.Schema({
  leadId: {
    type: String,
    default: () => nanoid(12),
    unique: true
  },
  v_id: {
    type: String,
    required: true,
    index: true
  },
  shareId: {
    type: String,
    index: true
  },
  flipbookName: {
    type: String
  },
  userEmail: {
    type: String,
    index: true
  },
  leadData: {
    type: mongoose.Schema.Types.Mixed,
    required: true
  },
  viewerIp: {
    type: String,
    default: ''
  },
  submittedAt: {
    type: Date,
    default: Date.now
  }
}, { timestamps: true });

leadSchema.index({ v_id: 1, createdAt: -1 });
leadSchema.index({ userEmail: 1, createdAt: -1 });

const Lead = mongoose.model('Lead', leadSchema);

export default Lead;
