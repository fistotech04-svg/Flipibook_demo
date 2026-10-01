import mongoose from 'mongoose';

const folderItemSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true
    }
  },
  {
    _id: true, // Default Mongo ObjectId: auto-generates _id
    toJSON: { virtuals: true },
    toObject: { virtuals: true }
  }
);

// Add virtual `id` mapping to default MongoDB `_id` string
folderItemSchema.virtual('id').get(function () {
  return this._id ? this._id.toString() : null;
});

const userFolderSchema = new mongoose.Schema(
  {
    emailId: {
      type: String,
      required: true,
      unique: true,
      trim: true,
      lowercase: true,
      index: true
    },
    // Ordered list of folder subdocuments with native Mongo _id
    folders: {
      type: [folderItemSchema],
      default: []
    }
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true }
  }
);

const UserFolder = mongoose.model('UserFolder', userFolderSchema, 'UserFolders');

export default UserFolder;
