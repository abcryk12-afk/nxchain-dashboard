const mongoose = require('mongoose');

const depositSchema = new mongoose.Schema({
  // User reference
  userId: { type: String, required: true },
  
  // Transaction details
  txHash: { type: String, required: true, unique: true, index: true },
  from: { type: String, required: true },
  to: { type: String, required: true },
  
  // Amount and token info
  amount: { type: Number, required: true },
  tokenType: { type: String, required: true, enum: ['BNB', 'BEP20'] },
  tokenContract: { type: String, default: null }, // For BEP20 tokens
  tokenSymbol: { type: String, default: null },
  tokenDecimals: { type: Number, default: 18 },
  
  // USD equivalent
  usdValue: { type: Number, default: 0 },
  priceAtTime: { type: Number, default: 0 },
  
  // Confirmation tracking
  confirmations: { type: Number, default: 0 },
  blockNumber: { type: Number, default: 0 },
  blockTimestamp: { type: Date, default: null },
  
  // Status tracking
  status: { 
    type: String, 
    required: true, 
    enum: ['pending', 'confirmed', 'failed', 'reverted'],
    default: 'pending',
    index: true
  },
  
  // Sweep tracking
  swept: { type: Boolean, default: false, index: true },
  sweptAt: { type: Date, default: null },
  sweepTxHash: { type: String, default: null },
  
  // Gas info (for BNB deposits)
  gasUsed: { type: Number, default: 0 },
  gasPrice: { type: Number, default: 0 },
  gasCost: { type: Number, default: 0 },
  
  // Processing info
  processingStartedAt: { type: Date, default: null },
  processingCompletedAt: { type: Date, default: null },
  processingAttempts: { type: Number, default: 0 },
  lastProcessingError: { type: String, default: null },
  
  // Admin notes
  adminNotes: { type: String, default: null },
  flagged: { type: Boolean, default: false },
  flagReason: { type: String, default: null },
  
  // Timestamps
  createdAt: { type: Date, default: Date.now, index: true },
  confirmedAt: { type: Date, default: null },
  updatedAt: { type: Date, default: Date.now }
}, {
  timestamps: true
});

// Indexes for performance
depositSchema.index({ userId: 1, createdAt: -1 });
depositSchema.index({ tokenType: 1, status: 1 });
depositSchema.index({ swept: 1, createdAt: -1 });
depositSchema.index({ tokenContract: 1, createdAt: -1 });
depositSchema.index({ status: 1, createdAt: -1 });

// Virtual fields
depositSchema.virtual('isConfirmed').get(function() {
  return this.status === 'confirmed' && this.confirmations >= 6;
});

depositSchema.virtual('needsSweep').get(function() {
  return this.isConfirmed && !this.swept;
});

depositSchema.virtual('ageInMinutes').get(function() {
  return Math.floor((Date.now() - this.createdAt) / (1000 * 60));
});

depositSchema.virtual('valueDisplay').get(function() {
  if (this.tokenType === 'BNB') {
    return `${this.amount.toFixed(6)} BNB`;
  } else {
    return `${this.amount.toFixed(2)} ${this.tokenSymbol || 'TOKEN'}`;
  }
});

// Static methods
depositSchema.statics.findByUser = function(userId, options = {}) {
  const query = { userId };
  
  if (options.tokenType) {
    query.tokenType = options.tokenType;
  }
  
  if (options.status) {
    query.status = options.status;
  }
  
  if (options.swept !== undefined) {
    query.swept = options.swept;
  }
  
  return this.find(query)
    .sort({ createdAt: -1 })
    .limit(options.limit || 50);
};

depositSchema.statics.findPendingSweeps = function() {
  return this.find({
    status: 'confirmed',
    swept: false,
    createdAt: { $gte: new Date(Date.now() - 24 * 60 * 60 * 1000) } // Last 24 hours
  }).sort({ createdAt: 1 });
};

depositSchema.statics.getStats = async function(userId) {
  const stats = await this.aggregate([
    { $match: { userId: userId } },
    {
      $group: {
        _id: '$tokenType',
        totalDeposits: { $sum: '$amount' },
        depositCount: { $sum: 1 },
        totalUSD: { $sum: '$usdValue' },
        avgDeposit: { $avg: '$amount' },
        lastDeposit: { $max: '$createdAt' }
      }
    }
  ]);
  
  return stats.reduce((acc, stat) => {
    acc[stat._id] = stat;
    return acc;
  }, {});
};

// Instance methods
depositSchema.methods.markAsConfirmed = function(confirmations, blockNumber) {
  this.status = 'confirmed';
  this.confirmations = confirmations;
  this.blockNumber = blockNumber;
  this.confirmedAt = new Date();
  return this.save();
};

depositSchema.methods.markAsSwept = function(sweepTxHash) {
  this.swept = true;
  this.sweptAt = new Date();
  this.sweepTxHash = sweepTxHash;
  return this.save();
};

depositSchema.methods.addProcessingAttempt = function(error = null) {
  this.processingAttempts += 1;
  if (error) {
    this.lastProcessingError = error;
  }
  if (!this.processingStartedAt) {
    this.processingStartedAt = new Date();
  }
  return this.save();
};

depositSchema.methods.flagDeposit = function(reason) {
  this.flagged = true;
  this.flagReason = reason;
  return this.save();
};

// Pre-save middleware
depositSchema.pre('save', function(next) {
  if (this.isModified('status') && this.status === 'confirmed' && !this.confirmedAt) {
    this.confirmedAt = new Date();
  }
  
  if (this.isModified('swept') && this.swept && !this.sweptAt) {
    this.sweptAt = new Date();
  }
  
  next();
});

// Transform methods
depositSchema.methods.toJSON = function() {
  const deposit = this.toObject();
  return deposit;
};

depositSchema.methods.toAdminJSON = function() {
  const deposit = this.toObject();
  // Include all fields for admin
  return deposit;
};

module.exports = mongoose.model('Deposit', depositSchema);
