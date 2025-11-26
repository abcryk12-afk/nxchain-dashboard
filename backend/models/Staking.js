const mongoose = require('mongoose');

const stakingSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  package: {
    type: String,
    enum: ['Bronze', 'Silver', 'Gold'],
    required: true
  },
  amount: {
    type: Number,
    required: true,
    min: 0
  },
  roi: {
    type: Number,
    required: true
  },
  duration: {
    type: Number,
    required: true
  },
  status: {
    type: String,
    enum: ['active', 'completed', 'cancelled'],
    default: 'active'
  },
  startDate: {
    type: Date,
    default: Date.now
  },
  endDate: {
    type: Date,
    required: true
  },
  lastRewardDate: {
    type: Date,
    default: Date.now
  },
  totalRewards: {
    type: Number,
    default: 0,
    min: 0
  },
  dailyReward: {
    type: Number,
    required: true,
    min: 0
  },
  rewardsClaimed: {
    type: Number,
    default: 0,
    min: 0
  },
  transactionHash: {
    type: String,
    sparse: true
  },
  metadata: {
    type: mongoose.Schema.Types.Mixed,
    default: {}
  },
  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date,
    default: Date.now
  }
});

// Indexes for better performance
stakingSchema.index({ user: 1, status: 1 });
stakingSchema.index({ status: 1 });
stakingSchema.index({ endDate: 1 });
stakingSchema.index({ package: 1 });

// Virtual fields
stakingSchema.virtual('id').get(function() {
  return this._id.toHexString();
});

stakingSchema.virtual('isActive').get(function() {
  return this.status === 'active' && this.endDate > new Date();
});

stakingSchema.virtual('isExpired').get(function() {
  return this.endDate <= new Date();
});

stakingSchema.virtual('pendingRewards').get(function() {
  return this.totalRewards - this.rewardsClaimed;
});

stakingSchema.virtual('daysRemaining').get(function() {
  const now = new Date();
  const diffTime = this.endDate - now;
  return Math.max(0, Math.ceil(diffTime / (1000 * 60 * 60 * 24)));
});

// Pre-save middleware
stakingSchema.pre('save', function(next) {
  this.updatedAt = Date.now();
  
  // Auto-complete expired stakes
  if (this.isExpired && this.status === 'active') {
    this.status = 'completed';
  }
  
  next();
});

// Static methods
stakingSchema.statics.findByUser = function(userId, options = {}) {
  const query = { user: userId };
  if (options.status) query.status = options.status;
  if (options.package) query.package = options.package;
  
  return this.find(query)
    .sort({ createdAt: -1 })
    .limit(options.limit || 50);
};

stakingSchema.statics.findActive = function(userId) {
  return this.find({ 
    user: userId, 
    status: 'active',
    endDate: { $gt: new Date() }
  }).sort({ createdAt: -1 });
};

stakingSchema.statics.findExpired = function() {
  return this.find({
    status: 'active',
    endDate: { $lte: new Date() }
  });
};

stakingSchema.statics.getStats = function(userId) {
  return this.aggregate([
    { $match: { user: mongoose.Types.ObjectId(userId) } },
    {
      $group: {
        _id: '$package',
        totalAmount: { $sum: '$amount' },
        totalRewards: { $sum: '$totalRewards' },
        activeCount: {
          $sum: {
            $cond: [
              { $and: [{ $eq: ['$status', 'active'] }, { $gt: ['$endDate', new Date()] }] },
              1,
              0
            ]
          }
        },
        completedCount: {
          $sum: {
            $cond: [{ $eq: ['$status', 'completed'] }, 1, 0]
          }
        }
      }
    }
  ]);
};

stakingSchema.statics.calculateDailyReward = function(amount, roi, duration) {
  const totalReward = (amount * roi) / 100;
  return totalReward / duration;
};

// Instance methods
stakingSchema.methods.calculateRewards = function() {
  const now = new Date();
  const daysPassed = Math.floor((now - this.lastRewardDate) / (1000 * 60 * 60 * 24));
  const newRewards = daysPassed * this.dailyReward;
  
  this.totalRewards += newRewards;
  this.lastRewardDate = now;
  
  return this.save();
};

stakingSchema.methods.claimRewards = function(amount) {
  if (amount > this.pendingRewards) {
    throw new Error('Insufficient rewards to claim');
  }
  
  this.rewardsClaimed += amount;
  return this.save();
};

stakingSchema.methods.complete = function() {
  this.status = 'completed';
  return this.save();
};

stakingSchema.methods.cancel = function() {
  if (this.status !== 'active') {
    throw new Error('Can only cancel active stakes');
  }
  
  this.status = 'cancelled';
  return this.save();
};

// Ensure virtuals are serialized
stakingSchema.set('toJSON', {
  virtuals: true,
  transform: function(doc, ret) {
    delete ret._id;
    delete ret.__v;
    return ret;
  }
});

module.exports = mongoose.model('Staking', stakingSchema);
