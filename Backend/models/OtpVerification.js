import mongoose from 'mongoose';

const otpVerificationSchema = new mongoose.Schema({
  emailId: {
    type: String,
    required: true,
    index: true,
  },
  otp: {
    type: String,
    required: true,
  },
  createdAt: {
    type: Date,
    default: Date.now,
    expires: 600, // Document automatically expires and is removed after 10 minutes
  },
});

const OtpVerification = mongoose.model('OtpVerification', otpVerificationSchema, 'OtpVerifications');

export default OtpVerification;
