import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';

const userSchema = new mongoose.Schema({
  emailId: {
    type: String,
    required: true,
    unique: true
  },
  password: {
    type: String,
    required: true
  },
  userFolder: {
    type: String,
    default: ''
  },
  createdAt: {
    type: Date,
    default: Date.now
  },
  otp: {
    type: String,
    default: null
  }
});

// Hash password before saving
userSchema.pre('save', async function() {
  console.log('Pre-save hook triggered for:', this.emailId);
  if (!this.isModified('password')) {
    console.log('Password not modified, skipping hash');
    return;
  }
  try {
    console.log('Hashing password...');
    const salt = await bcrypt.genSalt(10);
    this.password = await bcrypt.hash(this.password, salt);
    console.log('Password hashed successfully');
  } catch (err) {
    console.error('Bcrypt error:', err);
    throw err;
  }
});

// Method to compare passwords
userSchema.methods.comparePassword = async function(candidatePassword) {
  return await bcrypt.compare(candidatePassword, this.password);
};

const User = mongoose.model('User', userSchema, 'UserDetails');

export default User;

