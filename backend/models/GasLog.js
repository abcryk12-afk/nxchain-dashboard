const mongoose = require('mongoose');

const gasLogSchema = new mongoose.Schema({
  // Wallet information
  walletAddress: { type: String, required: true, index: true },
  userId: { type: String, required: true },
  
  // Transaction details
  amount: { type: Number, required: true },
  gasType: { type: String, required: true, enum: ['BNB'], default: 'BNB' },
  
  // Type of gas supply
  supplyType: { type: String, required: true, enum: ['AUTO', 'MANUAL'], index: true },
  
  // Transaction hash and status
  txHash: { type: String, required: true, unique: true },
  status: { 
    type: String, 
    required: true, 
    enum: ['PENDING', 'CONFIRMED', 'FAILED'],
    default: 'PENDING',
    index: true
  },
  
  // Block information
  blockNumber: { type: Number, default: 0 },
  confirmations: { type: Number, default: 0 },
  blockTimestamp: { type: Date, default: null },
  
  // Admin information (for manual supplies)
  adminId: { type: String, default: null },
  adminName: { type: String, default: null },
  adminIpAddress: { type: String, default: null },
  
  // Gas information
  gasUsed: { type: Number, default: 0 },
  gasPrice: { type: Number, default: 0 },
  gasCost: { type: Number, default: 0 },
  
  // Wallet balance before and after
  balanceBefore: { type: Number, required: true },
  balanceAfter: { type: Number, required: true },
  
  // Reason/trigger for gas supply
  reason: { type: String, default: null },
  triggerType: { 
    type: String, 
    enum: ['CRITICAL_BALANCE', 'SCHEDULED', 'MANUAL_REQUEST', 'AUTO_RETRY'],
    default: null
  },
  
  // Processing information
  processingStartedAt: { type: Date, default: null },
  processingCompletedAt: { type: Date, default: null },
  processingAttempts: { type: Number, default: 0 },
  lastProcessingError: { type: String, default: null },
  
  // Timestamps
  createdAt: { type: Date, default: Date.now, index: true },
  updatedAt: { type: Date, default: Date.now }
}, {
  timestamps: true
});

// Indexes for performance
gasLogSchema.index({ walletAddress: 1, createdAt: -1 });
gasLogSchema.index({ supplyType: 1, status: 1 });
gasLogSchema.index({ status: 1, createdAt: -1 });
gasLogSchema.index({ adminId: 1, createdAt: -1 });
gasLogSchema.index({ triggerType: 1, createdAt: -1 });

// Virtual fields
gasLogSchema.virtual('isConfirmed').get(function() {
  return this.status === 'CONFIRMED' && this.confirmations >= 6;
});

gasLogSchema.virtual('isFailed').get(function() {
  return this.status === 'FAILED';
});

gasLogSchema.virtual('ageInMinutes').get(function() {
  return Math.floor((Date.now() - this.createdAt) / (1000 * 60));
});

gasLogSchema.virtual('amountDisplay').get(function() {
  return `${this.amount.toFixed(6)} ${this.gasType}`;
});

gasLogSchema.virtual('balanceChange').get(function() {
  return this.balanceAfter - this.balanceBefore;
});

// Static methods
gasLogSchema.statics.findByWallet = function(walletAddress, options = {}) {
  const query = { walletAddress };
  
  if (options.supplyType) {
    query.supplyType = options.supplyType;
  }
  
  if (options.status) {
    query.status = options.status;
  }
  
  return this.find(query)
    .sort({ createdAt: -1 })
    .limit(options.limit || 50);
};

gasLogSchema.statics.findByAdmin = function(adminId, options = {}) {
  const query = { adminId };
  
  if (options.status) {
    query.status = options.status;
  }
  
  return this.find(query)
    .sort({ createdAt: -1 })
    .limit(options.limit || 50);
};

gasLogSchema.statics.getStats = async function(walletAddress) {
  const stats = await this.aggregate([
    { $match: { walletAddress: walletAddress } },
    {
      $group: {
        _id: '$supplyType',
        totalAmount: { $sum: '$amount' },
        count: { $sum: 1 },
        totalGasCost: { $sum: '$gasCost' },
        avgGasCost: { $avg: '$gasCost' },
        lastSupply: { $max: '$createdAt' },
        successfulSupplies: {
          $sum: { $cond: [{ $eq: ['$status', 'CONFIRMED'] }, 1, 0] }
        },
        failedSupplies: {
          $sum: { $cond: [{ $eq: ['$status', 'FAILED'] }, 1, 0] }
        }
      }
    }
  ]);
  
  return stats.reduce((acc, stat) => {
    acc[stat._id] = stat;
    return acc;
  }, {});
};

gasLogSchema.statics.getSystemStats = async function() {
  const stats = await this.aggregate([
    {
      $group: {
        _id: null,
        totalGasSupplied: { $sum: '$amount' },
        totalSupplies: { $sum: 1 },
        totalGasCost: { $sum: '$gasCost' },
        autoSupplies: {
          $sum: { $cond: [{ $eq: ['$supplyType', 'AUTO'] }, 1, 0] }
        },
        manualSupplies: {
          $sum: { $cond: [{ $eq: ['$supplyType', 'MANUAL'] }, 1, 0] }
        },
        successfulSupplies: {
          $sum: { $cond: [{ $eq: ['$status', 'CONFIRMED'] }, 1, 0] }
        },
        failedSupplies: {
          $sum: { $cond: [{ $eq: ['$status', 'FAILED'] }, 1, 0] }
        },
        avgGasCost: { $avg: '$gasCost' },
        lastSupply: { $max: '$createdAt' }
      }
    }
  ]);
  
  return stats[0] || {
    totalGasSupplied: 0,
    totalSupplies: 0,
    totalGasCost: 0,
    autoSupplies: 0,
    manualSupplies: 0,
    successfulSupplies: 0,
    failedSupplies: 0,
    avgGasCost: 0,
    lastSupply: null
  };
};

gasLogSchema.statics.findPendingSupplies = function() {
  return this.find({
    status: 'PENDING',
    createdAt: { $gte: new Date(Date.now() - 60 * 60 * 1000) } // Last hour
  }).sort({ createdAt: 1 });
};

gasLogSchema.statics.findFailedSupplies = function() {
  return this.find({
    status: 'FAILED',
    createdAt: { $gte: new Date(Date.now() - 24 * 60 * 60 * 1000) } // Last 24 hours
  }).sort({ createdAt: -1 });
};

// Instance methods
gasLogSchema.methods.markAsConfirmed = function(blockNumber, confirmations) {
  this.status = 'CONFIRMED';
  this.blockNumber = blockNumber;
  this.confirmations = confirmations;
  this.processingCompletedAt = new Date();
  return this.save();
};

gasLogSchema.methods.markAsFailed = function(error) {
  this.status = 'FAILED';
  this.lastProcessingError = error;
  this.processingCompletedAt = new Date();
  return this.save();
};

gasLogSchema.methods.addProcessingAttempt = function(error = null) {
  this.processingAttempts += 1;
  if (error) {
    this.lastProcessingError = error;
  }
  if (!this.processingStartedAt) {
    this.processingStartedAt = new Date();
  }
  return this.save();
};

gasLogSchema.methods.setAdminDetails = function(adminId, adminName, ipAddress) {
  this.adminId = adminId;
  this.adminName = adminName;
  this.adminIpAddress = ipAddress;
  return this.save();
};

// Pre-save middleware
gasLogSchema.pre('save', function(next) {
  if (this.isModified('status') && this.status === 'CONFIRMED' && !this.processingCompletedAt) {
    this.processingCompletedAt = new Date();
  }
  
  next();
});

// Transform methods
gasLogSchema.methods.toJSON = function() {
  const gasLog = this.toObject();
  return gasLog;
};

gasLogSchema.methods.toAdminJSON = function() {
  const gasLog = this.toObject();
  // Include all fields for admin
  return gasLog;
};

module.exports = mongoose.model('GasLog', gasLogSchema);
