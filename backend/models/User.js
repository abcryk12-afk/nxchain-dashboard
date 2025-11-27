const mongoose = require('mongoose');
const { hashPassword, verifyPassword } = require('../utils/encryption');

const userSchema = new mongoose.Schema({
  // Basic user info
  userId: { type: String, required: true, unique: true },
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  salt: { type: String }, // Made optional - pre-save hook will generate it
  
  // Profile info
  firstName: { type: String, default: '' },
  lastName: { type: String, default: '' },
  phone: { type: String, default: '' },
  country: { type: String, default: '' },
  
  // Wallet info
  address: { type: String, required: true, unique: true },
  publicKey: { type: String, required: true },
  privateKeyEncrypted: { type: String, required: true },
  derivationPath: { type: String, required: true },
  
  // Balance info
  balance: { type: Number, default: 0 }, // Internal platform balance (USD equivalent)
  onChainBalance: { type: Number, default: 0 }, // On-chain wallet balance
  
  // Referral info
  referralCode: { type: String, required: true, unique: true },
  referredBy: { type: String, default: null },
  
  // Earnings
  totalEarnings: { type: Number, default: 0 },
  referralEarnings: { type: Number, default: 0 },
  withdrawableBalance: { type: Number, default: 0 },
  pendingEarnings: { type: Number, default: 0 },
  
  // Status
  isVerified: { type: Boolean, default: false },
  isFrozen: { type: Boolean, default: false },
  isActive: { type: Boolean, default: true },
  kycStatus: { type: String, enum: ['none', 'pending', 'verified', 'rejected'], default: 'none' },
  
  // Security
  twoFactorEnabled: { type: Boolean, default: false },
  twoFactorSecret: { type: String, default: null },
  lastLogin: { type: Date, default: null },
  loginAttempts: { type: Number, default: 0 },
  lockUntil: { type: Date, default: null },
  
  // Stats
  totalDeposits: { type: Number, default: 0 },
  totalWithdrawals: { type: Number, default: 0 },
  depositCount: { type: Number, default: 0 },
  withdrawalCount: { type: Number, default: 0 },
  
  // Admin settings
  isAdmin: { type: Boolean, default: false },
  isActive: { type: Boolean, default: true },
  
  // Timestamps
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
}, {
  timestamps: true
});

// Indexes (only for non-unique fields)
userSchema.index({ referredBy: 1 });
userSchema.index({ createdAt: -1 });

// Virtual fields
userSchema.virtual('fullName').get(function() {
  return `${this.firstName} ${this.lastName}`.trim();
});

userSchema.virtual('totalReferrals', {
  ref: 'User',
  localField: 'referralCode',
  foreignField: 'referredBy',
  count: true
});

// Methods
userSchema.methods.comparePassword = async function(candidatePassword) {
  try {
    return verifyPassword(candidatePassword, this.salt, this.password);
  } catch (error) {
    throw error;
  }
};

userSchema.methods.incrementLoginAttempts = function() {
  // If we have a previous lock that has expired, restart at 1
  if (this.lockUntil && this.lockUntil < Date.now()) {
    return this.updateOne({
      $unset: { lockUntil: 1 },
      $set: { loginAttempts: 1 }
    });
  }
  
  const updates = { $inc: { loginAttempts: 1 } };
  if (this.loginAttempts + 1 >= 5 && !this.isLocked) {
    // Lock if we've reached max attempts and not already locked
    updates.$set = { lockUntil: Date.now() + 2 * 60 * 60 * 1000 }; // 2 hours
  }
  
  return this.updateOne(updates);
};

userSchema.methods.decrementLoginAttempts = function() {
  return this.updateOne({
    $unset: { loginAttempts: 1, lockUntil: 1 }
  });
};

// Virtual for checking if account is locked
userSchema.virtual('isLocked').get(function() {
  return !!(this.lockUntil && this.lockUntil > Date.now());
});

// Pre-save middleware for password hashing
userSchema.pre('save', async function(next) {
  if (!this.isModified('password')) return next();
  
  try {
    const { salt, hash } = hashPassword(this.password);
    this.salt = salt;
    this.password = hash;
    next();
  } catch (error) {
    next(error);
  }
});

// Static methods
userSchema.statics.generateUserId = function() {
  const timestamp = Date.now().toString(36);
  const random = Math.random().toString(36).substr(2, 5);
  return `USR-${timestamp}-${random}`.toUpperCase();
};

userSchema.statics.generateReferralCode = function() {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  let result = '';
  for (let i = 0; i < 8; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return result;
};

// Transform method for JSON output
userSchema.methods.toJSON = function() {
  const user = this.toObject();
  delete user.password;
  delete user.salt;
  delete user.privateKeyEncrypted;
  delete user.twoFactorSecret;
  return user;
};

// Safe transform for admin (includes sensitive data)
userSchema.methods.toAdminJSON = function() {
  const user = this.toObject();
  delete user.password;
  delete user.salt;
  delete user.twoFactorSecret;
  return user;
};

module.exports = mongoose.model('User', userSchema);
