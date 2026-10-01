import mongoose from 'mongoose';

const activityItemSchema = new mongoose.Schema(
  {
    type: {
      type: String,
      required: true,
      enum: ['create', 'edit_flip', 'delete_flip', 'create_profile', 'edit', 'publish', 'unpublish', 'send']
    },
    title: {
      type: String,
      required: true,
      trim: true
    },
    desc: {
      type: String,
      default: '',
      trim: true
    },
    entityId: {
      type: String,
      default: ''
    },
    entityName: {
      type: String,
      default: ''
    },
    metadata: {
      type: mongoose.Schema.Types.Mixed,
      default: {}
    },
    createdAt: {
      type: Date,
      default: Date.now
    }
  },
  {
    _id: true
  }
);

const userActivitySchema = new mongoose.Schema(
  {
    userEmail: {
      type: String,
      required: true,
      unique: true,
      trim: true,
      lowercase: true,
      index: true
    },
    activities: {
      type: [activityItemSchema],
      default: []
    }
  },
  {
    timestamps: true
  }
);

const Activity = mongoose.model('Activity', userActivitySchema);

export default Activity;
