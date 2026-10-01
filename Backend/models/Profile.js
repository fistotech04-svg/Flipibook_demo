import mongoose from 'mongoose';

const profileSchema = new mongoose.Schema({
  emailId: {
    type: String,
    required: true,
    unique: true,
    trim: true,
    lowercase: true
  },
  name: {
    type: String,
    default: ''
  },
  picture: {
    type: String,
    default: null
  },
  avatarBgColor: {
    type: String,
    default: '#E8D4C8'
  },
  bannerBg: {
    type: {
      type: String,
      default: 'gradient'
    },
    value: {
      type: String,
      default: 'linear-gradient(to bottom right, #c1e8d7, #85d8c3, #60bba3)'
    }
  },
  about: {
    type: String,
    default: ''
  },
  mobile: {
    type: String,
    default: ''
  },
  company_logo_url: {
    type: String,
    default: ''
  },
  companyLogo: {
    type: String,
    default: ''
  },
  companyName: {
    type: String,
    default: ''
  },
  industryType: {
    type: String,
    default: ''
  },
  companyEmail: {
    type: String,
    default: ''
  },
  website: {
    type: String,
    default: ''
  },
  services: {
    type: [String],
    default: []
  },
  address1: {
    type: String,
    default: ''
  },
  address2: {
    type: String,
    default: ''
  },
  city: {
    type: String,
    default: ''
  },
  pincode: {
    type: String,
    default: ''
  },
  state: {
    type: String,
    default: ''
  },
  country: {
    type: String,
    default: 'INDIA'
  },
  socials: {
    website: {
      type: String,
      default: ''
    },
    instagram: {
      type: String,
      default: ''
    },
    linkedin: {
      type: String,
      default: ''
    },
    facebook: {
      type: String,
      default: ''
    },
    whatsapp: {
      type: String,
      default: ''
    }
  },
  followers: {
    type: [String],
    default: []
  },
  following: {
    type: [String],
    default: []
  },
  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date,
    default: Date.now
  },
  myShelf: {
    shelfCount: {
      type: Number,
      default: 1
    },
    folders: [
      {
        _id:false,
        folderName: {
          type: String,
          default: ""
        },
        shelf_design: {
          type: Number,
          default: 1
        },
        books: [
          {
            _id:false,
            row: {
              type: Number,
              default: 1
            },
            order: {
              type: Number,
              default: 1
            },
            v_id: {
              type: String,
              required: true
            }
          }]
      }]
  }
});

// Update the updatedAt field before saving
profileSchema.pre('save', function () {
  this.updatedAt = Date.now();
});

// Enforce order of properties in myShelf when converting to JSON
profileSchema.set('toJSON', {
  transform: (doc, ret) => {
    if (ret.myShelf) {
      // Create a new object with the desired order
      const orderedMyShelf = {
        shelfCount: ret.myShelf.shelfCount,
        folders: ret.myShelf.folders
      };
      ret.myShelf = orderedMyShelf;
    }
    return ret;
  }
});

const Profile = mongoose.model('Profile', profileSchema, 'Profiles');

export default Profile;
