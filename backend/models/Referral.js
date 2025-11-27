const mongoose = require('mongoose');

const referralSchema = new mongoose.Schema({
  referrer: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  referred: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  referralCode: {
    type: String,
    required: true
  },
  status: {
    type: String,
    enum: ['pending', 'active', 'completed'],
    default: 'pending'
  },
  rewardAmount: {
    type: Number,
    default: 0,
    min: 0
  },
  rewardPercentage: {
    type: Number,
    default: 5,
    min: 0,
    max: 100
  },
  totalEarnings: {
    type: Number,
    default: 0,
    min: 0
  },
  level: {
    type: Number,
    default: 1,
    min: 1,
    max: 5
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
  },
  activatedAt: {
    type: Date,
    required: false
  }
});

// Indexes for better performance
referralSchema.index({ referrer: 1, status: 1 });
referralSchema.index({ referred: 1 });
referralSchema.index({ level: 1 });
referralSchema.index({ createdAt: -1 });

// Virtual fields
referralSchema.virtual('id').get(function() {
  return this._id.toHexString();
});

referralSchema.virtual('isActive').get(function() {
  return this.status === 'active';
});

referralSchema.virtual('isPending').get(function() {
  return this.status === 'pending';
});

referralSchema.virtual('isCompleted').get(function() {
  return this.status === 'completed';
});

// Pre-save middleware
referralSchema.pre('save', function(next) {
  try {
    console.log('🔥 REFERRAL PRE-SAVE HOOK CALLED');
    this.updatedAt = Date.now();
    
    if (this.isModified('status') && this.status === 'active' && !this.activatedAt) {
      this.activatedAt = Date.now();
    }
    
    console.log('🔥 REFERRAL PRE-SAVE HOOK - CALLING NEXT()');
    next();
  } catch (error) {
    console.error('🔥 REFERRAL PRE-SAVE HOOK ERROR:', error);
    next(error);
  }
});

// Static methods
referralSchema.statics.findByReferrer = function(referrerId, options = {}) {
  const query = { referrer: referrerId };
  if (options.status) query.status = options.status;
  if (options.level) query.level = options.level;
  
  return this.find(query)
    .populate('referred', 'username email createdAt')
    .sort({ createdAt: -1 })
    .limit(options.limit || 50);
};

referralSchema.statics.findByReferred = function(referredId) {
  return this.findOne({ referred: referredId })
    .populate('referrer', 'username email');
};

referralSchema.statics.findByReferralCode = function(referralCode) {
  return this.findOne({ referralCode })
    .populate('referrer referred');
};

referralSchema.statics.getReferralStats = function(referrerId) {
  return this.aggregate([
    { $match: { referrer: mongoose.Types.ObjectId(referrerId) } },
    {
      $group: {
        _id: '$status',
        count: { $sum: 1 },
        totalEarnings: { $sum: '$totalEarnings' },
        totalRewards: { $sum: '$rewardAmount' }
      }
    }
  ]);
};

referralSchema.statics.getLevelStats = function(referrerId) {
  return this.aggregate([
    { $match: { referrer: mongoose.Types.ObjectId(referrerId) } },
    {
      $group: {
        _id: '$level',
        count: { $sum: 1 },
        totalEarnings: { $sum: '$totalEarnings' }
      }
    }
  ]);
};

referralSchema.statics.getTotalEarnings = function(referrerId) {
  return this.aggregate([
    { $match: { referrer: mongoose.Types.ObjectId(referrerId) } },
    {
      $group: {
        _id: null,
        totalEarnings: { $sum: '$totalEarnings' },
        totalRewards: { $sum: '$rewardAmount' },
        activeReferrals: {
          $sum: {
            $cond: [{ $eq: ['$status', 'active'] }, 1, 0]
          }
        }
      }
    }
  ]);
};

// Instance methods
referralSchema.methods.activate = function() {
  this.status = 'active';
  this.activatedAt = Date.now();
  return this.save();
};

referralSchema.methods.complete = function() {
  this.status = 'completed';
  return this.save();
};

referralSchema.methods.addEarnings = function(amount) {
  this.totalEarnings += amount;
  this.rewardAmount += amount;
  return this.save();
};

referralSchema.methods.calculateReward = function(depositAmount) {
  const reward = (depositAmount * this.rewardPercentage) / 100;
  this.rewardAmount = reward;
  return this.save();
};

referralSchema.methods.getReferralChain = function(maxLevel = 5) {
  return this.constructor
    .find({ referrer: this.referred })
    .populate('referred')
    .then(referrals => {
      const chain = [];
      
      const buildChain = (referral, level = 1) => {
        if (level > maxLevel) return;
        
        chain.push({
          level: level,
          referral: referral,
          earnings: referral.totalEarnings,
          status: referral.status
        });
        
        return this.constructor
          .find({ referrer: referral.referred })
          .populate('referred')
          .then(nextReferrals => {
            return Promise.all(
              nextReferrals.map(r => buildChain(r, level + 1))
            );
          });
      };
      
      return buildChain(this);
    });
};

// Ensure virtuals are serialized
referralSchema.set('toJSON', {
  virtuals: true,
  transform: function(doc, ret) {
    delete ret._id;
    delete ret.__v;
    return ret;
  }
});

module.exports = mongoose.model('Referral', referralSchema);
