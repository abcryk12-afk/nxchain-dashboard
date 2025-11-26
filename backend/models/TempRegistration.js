const mongoose = require('mongoose');

const tempRegistrationSchema = new mongoose.Schema({
  // User info
  email: { type: String, required: true, unique: true, index: true },
  
  // Verification
  verificationCode: { type: String, required: true },
  codeExpiresAt: { type: Date, required: true, index: true },
  attempts: { type: Number, default: 0, max: 5 },
  
  // Registration data
  registrationData: {
    password: { type: String, required: true },
    firstName: { type: String, default: '' },
    lastName: { type: String, default: '' },
    phone: { type: String, default: '' },
    country: { type: String, default: '' },
    referralCode: { type: String, default: null }
  },
  
  // Security
  ipAddress: { type: String, required: true },
  userAgent: { type: String, default: null },
  fingerprint: { type: String, default: null },
  
  // Status
  status: { 
    type: String, 
    required: true, 
    enum: ['pending', 'verified', 'expired', 'failed'],
    default: 'pending',
    index: true
  },
  
  // Email tracking
  emailSentAt: { type: Date, default: null },
  emailSentCount: { type: Number, default: 0 },
  lastEmailSentAt: { type: Date, default: null },
  
  // Resend tracking
  resendCount: { type: Number, default: 0, max: 3 },
  lastResendAt: { type: Date, default: null },
  
  // Admin notes
  adminNotes: { type: String, default: null },
  flagged: { type: Boolean, default: false },
  flagReason: { type: String, default: null },
  
  // Timestamps
  createdAt: { type: Date, default: Date.now, index: true },
  updatedAt: { type: Date, default: Date.now },
  verifiedAt: { type: Date, default: null },
  expiredAt: { type: Date, default: null }
}, {
  timestamps: true
});

// Indexes for performance
tempRegistrationSchema.index({ codeExpiresAt: 1 });
tempRegistrationSchema.index({ status: 1, createdAt: -1 });
tempRegistrationSchema.index({ ipAddress: 1 });
tempRegistrationSchema.index({ createdAt: -1 });

// Virtual fields
tempRegistrationSchema.virtual('isExpired').get(function() {
  return Date.now() > this.codeExpiresAt.getTime();
});

tempRegistrationSchema.virtual('isPending').get(function() {
  return this.status === 'pending' && !this.isExpired;
});

tempRegistrationSchema.virtual('timeRemaining').get(function() {
  if (this.isExpired) return 0;
  return Math.max(0, Math.floor((this.codeExpiresAt.getTime() - Date.now()) / 1000));
});

tempRegistrationSchema.virtual('timeRemainingDisplay').get(function() {
  const seconds = this.timeRemaining;
  if (seconds === 0) return 'Expired';
  
  const minutes = Math.floor(seconds / 60);
  const remainingSeconds = seconds % 60;
  
  if (minutes > 0) {
    return `${minutes}m ${remainingSeconds}s`;
  } else {
    return `${seconds}s`;
  }
});

tempRegistrationSchema.virtual('canResend').get(function() {
  return this.resendCount < 3 && 
         (!this.lastResendAt || Date.now() - this.lastResendAt.getTime() > 60000); // 1 minute cooldown
});

// Static methods
tempRegistrationSchema.statics.createTempRegistration = async function(email, registrationData, ipAddress, userAgent = null) {
  const { generateVerificationCode } = require('../utils/encryption');
  
  // Check if email already exists in temp registrations
  const existing = await this.findOne({ email });
  if (existing && existing.isPending) {
    throw new Error('Verification already in progress for this email');
  }
  
  // Check if email already exists in main users
  const User = mongoose.model('User');
  const existingUser = await User.findOne({ email });
  if (existingUser) {
    throw new Error('Email already registered');
  }
  
  const verificationCode = generateVerificationCode(6);
  const codeExpiresAt = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes
  
  const tempReg = new this({
    email,
    verificationCode,
    codeExpiresAt,
    registrationData,
    ipAddress,
    userAgent
  });
  
  return tempReg.save();
};

tempRegistrationSchema.statics.findByEmail = function(email) {
  return this.findOne({ email }).sort({ createdAt: -1 });
};

tempRegistrationSchema.statics.findByVerificationCode = function(email, code) {
  return this.findOne({
    email,
    verificationCode: code,
    status: 'pending'
  });
};

tempRegistrationSchema.statics.findExpired = function() {
  return this.find({
    status: 'pending',
    codeExpiresAt: { $lt: new Date() }
  });
};

tempRegistrationSchema.statics.getPendingCount = function() {
  return this.countDocuments({
    status: 'pending',
    codeExpiresAt: { $gt: new Date() }
  });
};

tempRegistrationSchema.statics.getStats = async function() {
  const stats = await this.aggregate([
    {
      $group: {
        _id: '$status',
        count: { $sum: 1 },
        avgTimeToVerify: {
          $avg: {
            $cond: [
              { $ne: ['$verifiedAt', null] },
              { $subtract: ['$verifiedAt', '$createdAt'] },
              null
            ]
          }
        }
      }
    }
  ]);
  
  return stats.reduce((acc, stat) => {
    acc[stat._id] = stat;
    return acc;
  }, {});
};

// Instance methods
tempRegistrationSchema.methods.verifyCode = function(code) {
  if (this.isExpired) {
    throw new Error('Verification code has expired');
  }
  
  if (this.attempts >= 5) {
    throw new Error('Too many verification attempts');
  }
  
  if (this.verificationCode !== code) {
    this.attempts += 1;
    this.save();
    throw new Error('Invalid verification code');
  }
  
  this.status = 'verified';
  this.verifiedAt = new Date();
  return this.save();
};

tempRegistrationSchema.methods.expire = function() {
  this.status = 'expired';
  this.expiredAt = new Date();
  return this.save();
};

tempRegistrationSchema.methods.fail = function(reason) {
  this.status = 'failed';
  this.adminNotes = reason;
  return this.save();
};

tempRegistrationSchema.methods.resendCode = async function() {
  if (!this.canResend) {
    throw new Error('Cannot resend verification code');
  }
  
  const { generateVerificationCode } = require('../utils/encryption');
  
  this.verificationCode = generateVerificationCode(6);
  this.codeExpiresAt = new Date(Date.now() + 10 * 60 * 1000); // Reset to 10 minutes
  this.resendCount += 1;
  this.lastResendAt = new Date();
  this.emailSentCount += 1;
  this.lastEmailSentAt = new Date();
  this.attempts = 0; // Reset attempts on resend
  
  return this.save();
};

tempRegistrationSchema.methods.markEmailSent = function() {
  this.emailSentAt = new Date();
  this.emailSentCount += 1;
  this.lastEmailSentAt = new Date();
  return this.save();
};

tempRegistrationSchema.methods.flagRegistration = function(reason) {
  this.flagged = true;
  this.flagReason = reason;
  return this.save();
};

// Pre-save middleware
tempRegistrationSchema.pre('save', function(next) {
  // Auto-expire if past expiration time
  if (this.isModified('codeExpiresAt') && this.isExpired && this.status === 'pending') {
    this.status = 'expired';
    this.expiredAt = new Date();
  }
  
  next();
});

// Static cleanup method
tempRegistrationSchema.statics.cleanupExpired = async function() {
  const result = await this.updateMany(
    {
      status: 'pending',
      codeExpiresAt: { $lt: new Date() }
    },
    {
      $set: {
        status: 'expired',
        expiredAt: new Date()
      }
    }
  );
  
  console.log(`Cleaned up ${result.modifiedCount} expired registrations`);
  return result.modifiedCount;
};

// Transform methods
tempRegistrationSchema.methods.toJSON = function() {
  const tempReg = this.toObject();
  delete tempReg.verificationCode; // Don't expose verification code
  delete tempReg.registrationData.password; // Don't expose password
  return tempReg;
};

tempRegistrationSchema.methods.toAdminJSON = function() {
  const tempReg = this.toObject();
  // Include verification code for admin
  return tempReg;
};

module.exports = mongoose.model('TempRegistration', tempRegistrationSchema);
