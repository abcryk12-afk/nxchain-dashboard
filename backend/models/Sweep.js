const mongoose = require('mongoose');

const sweepSchema = new mongoose.Schema({
  // User reference
  userId: { type: String, required: true },
  
  // Transaction details
  txHash: { type: String, required: true, unique: true, index: true },
  fromAddress: { type: String, required: true },
  toAddress: { type: String, required: true },
  
  // Amount and token info
  amount: { type: Number, required: true },
  tokenType: { type: String, required: true, enum: ['BNB', 'BEP20'] },
  tokenContract: { type: String, default: null }, // For BEP20 tokens
  tokenSymbol: { type: String, default: null },
  
  // USD equivalent
  usdValue: { type: Number, default: 0 },
  priceAtTime: { type: Number, default: 0 },
  
  // Gas information
  gasUsed: { type: Number, required: true },
  gasPrice: { type: Number, required: true },
  gasCost: { type: Number, required: true }, // In BNB
  gasCostUSD: { type: Number, default: 0 },
  
  // Related deposits (this sweep may cover multiple deposits)
  relatedDeposits: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Deposit' }],
  
  // Status tracking
  status: { 
    type: String, 
    required: true, 
    enum: ['pending', 'processing', 'completed', 'failed'],
    default: 'pending',
    index: true
  },
  
  // Block information
  blockNumber: { type: Number, default: 0 },
  blockTimestamp: { type: Date, default: null },
  confirmations: { type: Number, default: 0 },
  
  // Processing info
  processingStartedAt: { type: Date, default: null },
  processingCompletedAt: { type: Date, default: null },
  processingAttempts: { type: Number, default: 0 },
  lastProcessingError: { type: String, default: null },
  
  // Sweep efficiency metrics
  sweepEfficiency: { type: Number, default: 0 }, // Amount / (Amount + GasCost)
  profitMargin: { type: Number, default: 0 }, // USDValue - GasCostUSD
  
  // Admin info
  adminNotes: { type: String, default: null },
  flagged: { type: Boolean, default: false },
  flagReason: { type: String, default: null },
  
  // Timestamps
  createdAt: { type: Date, default: Date.now, index: true },
  updatedAt: { type: Date, default: Date.now }
}, {
  timestamps: true
});

// Indexes for performance
sweepSchema.index({ userId: 1, createdAt: -1 });
sweepSchema.index({ tokenType: 1, status: 1 });
sweepSchema.index({ status: 1, createdAt: -1 });
sweepSchema.index({ tokenContract: 1, createdAt: -1 });
sweepSchema.index({ createdAt: -1 });

// Virtual fields
sweepSchema.virtual('isCompleted').get(function() {
  return this.status === 'completed';
});

sweepSchema.virtual('isFailed').get(function() {
  return this.status === 'failed';
});

sweepSchema.virtual('ageInMinutes').get(function() {
  return Math.floor((Date.now() - this.createdAt) / (1000 * 60));
});

sweepSchema.virtual('valueDisplay').get(function() {
  if (this.tokenType === 'BNB') {
    return `${this.amount.toFixed(6)} BNB`;
  } else {
    return `${this.amount.toFixed(2)} ${this.tokenSymbol || 'TOKEN'}`;
  }
});

sweepSchema.virtual('gasCostDisplay').get(function() {
  return `${this.gasCost.toFixed(6)} BNB`;
});

// Static methods
sweepSchema.statics.findByUser = function(userId, options = {}) {
  const query = { userId };
  
  if (options.tokenType) {
    query.tokenType = options.tokenType;
  }
  
  if (options.status) {
    query.status = options.status;
  }
  
  return this.find(query)
    .sort({ createdAt: -1 })
    .limit(options.limit || 50);
};

sweepSchema.statics.findFailedSweeps = function() {
  return this.find({
    status: 'failed',
    createdAt: { $gte: new Date(Date.now() - 24 * 60 * 60 * 1000) } // Last 24 hours
  }).sort({ createdAt: -1 });
};

sweepSchema.statics.getStats = async function(userId) {
  const stats = await this.aggregate([
    { $match: { userId: userId } },
    {
      $group: {
        _id: '$tokenType',
        totalSweeps: { $sum: '$amount' },
        sweepCount: { $sum: 1 },
        totalGasCost: { $sum: '$gasCost' },
        totalUSD: { $sum: '$usdValue' },
        avgGasCost: { $avg: '$gasCost' },
        lastSweep: { $max: '$createdAt' },
        completedSweeps: {
          $sum: { $cond: [{ $eq: ['$status', 'completed'] }, 1, 0] }
        },
        failedSweeps: {
          $sum: { $cond: [{ $eq: ['$status', 'failed'] }, 1, 0] }
        }
      }
    }
  ]);
  
  return stats.reduce((acc, stat) => {
    acc[stat._id] = stat;
    return acc;
  }, {});
};

sweepSchema.statics.getSystemStats = async function() {
  const stats = await this.aggregate([
    {
      $group: {
        _id: null,
        totalSweeps: { $sum: '$amount' },
        sweepCount: { $sum: 1 },
        totalGasCost: { $sum: '$gasCost' },
        totalUSD: { $sum: '$usdValue' },
        completedSweeps: {
          $sum: { $cond: [{ $eq: ['$status', 'completed'] }, 1, 0] }
        },
        failedSweeps: {
          $sum: { $cond: [{ $eq: ['$status', 'failed'] }, 1, 0] }
        },
        avgGasCost: { $avg: '$gasCost' },
        lastSweep: { $max: '$createdAt' }
      }
    }
  ]);
  
  return stats[0] || {
    totalSweeps: 0,
    sweepCount: 0,
    totalGasCost: 0,
    totalUSD: 0,
    completedSweeps: 0,
    failedSweeps: 0,
    avgGasCost: 0,
    lastSweep: null
  };
};

// Instance methods
sweepSchema.methods.markAsCompleted = function(blockNumber, confirmations) {
  this.status = 'completed';
  this.blockNumber = blockNumber;
  this.confirmations = confirmations;
  this.processingCompletedAt = new Date();
  
  // Calculate efficiency metrics
  if (this.amount > 0) {
    this.sweepEfficiency = this.amount / (this.amount + this.gasCost);
  }
  
  return this.save();
};

sweepSchema.methods.markAsFailed = function(error) {
  this.status = 'failed';
  this.lastProcessingError = error;
  this.processingCompletedAt = new Date();
  return this.save();
};

sweepSchema.methods.addProcessingAttempt = function(error = null) {
  this.processingAttempts += 1;
  if (error) {
    this.lastProcessingError = error;
  }
  if (!this.processingStartedAt) {
    this.processingStartedAt = new Date();
  }
  return this.save();
};

sweepSchema.methods.linkDeposits = async function(depositIds) {
  this.relatedDeposits = depositIds;
  
  // Update deposits to mark them as swept
  await mongoose.model('Deposit').updateMany(
    { _id: { $in: depositIds } },
    { 
      swept: true,
      sweptAt: new Date(),
      sweepTxHash: this.txHash
    }
  );
  
  return this.save();
};

sweepSchema.methods.calculateUSDValues = function(bnbPrice, tokenPrices = {}) {
  // Calculate gas cost in USD
  this.gasCostUSD = this.gasCost * bnbPrice;
  
  // Calculate USD value of swept amount
  if (this.tokenType === 'BNB') {
    this.usdValue = this.amount * bnbPrice;
  } else if (this.tokenSymbol && tokenPrices[this.tokenSymbol]) {
    this.usdValue = this.amount * tokenPrices[this.tokenSymbol];
  }
  
  // Calculate profit margin
  this.profitMargin = this.usdValue - this.gasCostUSD;
  
  return this.save();
};

sweepSchema.methods.flagSweep = function(reason) {
  this.flagged = true;
  this.flagReason = reason;
  return this.save();
};

// Pre-save middleware
sweepSchema.pre('save', function(next) {
  if (this.isModified('status') && this.status === 'completed' && !this.processingCompletedAt) {
    this.processingCompletedAt = new Date();
  }
  
  next();
});

// Transform methods
sweepSchema.methods.toJSON = function() {
  const sweep = this.toObject();
  return sweep;
};

sweepSchema.methods.toAdminJSON = function() {
  const sweep = this.toObject();
  // Include all fields for admin
  return sweep;
};

module.exports = mongoose.model('Sweep', sweepSchema);
