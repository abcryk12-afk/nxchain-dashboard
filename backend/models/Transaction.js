const mongoose = require('mongoose');

const transactionSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  type: {
    type: String,
    enum: ['deposit', 'withdrawal', 'staking', 'reward'],
    required: true
  },
  amount: {
    type: Number,
    required: true,
    min: 0
  },
  status: {
    type: String,
    enum: ['pending', 'confirmed', 'rejected', 'approved'],
    default: 'pending'
  },
  currency: {
    type: String,
    enum: ['USDT', 'BNB', 'USD'],
    default: 'USDT'
  },
  transactionHash: {
    type: String,
    sparse: true
  },
  walletAddress: {
    type: String,
    required: false
  },
  description: {
    type: String,
    required: false
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
  processedAt: {
    type: Date,
    required: false
  }
});

// Indexes for better performance
transactionSchema.index({ user: 1, createdAt: -1 });
transactionSchema.index({ status: 1 });
transactionSchema.index({ type: 1 });

// Virtual fields
transactionSchema.virtual('id').get(function() {
  return this._id.toHexString();
});

transactionSchema.virtual('isPending').get(function() {
  return this.status === 'pending';
});

transactionSchema.virtual('isConfirmed').get(function() {
  return this.status === 'confirmed' || this.status === 'approved';
});

// Pre-save middleware
transactionSchema.pre('save', function(next) {
  this.updatedAt = Date.now();
  if (this.isModified('status') && (this.status === 'confirmed' || this.status === 'approved')) {
    this.processedAt = Date.now();
  }
  next();
});

// Static methods
transactionSchema.statics.findByUser = function(userId, options = {}) {
  const query = { user: userId };
  if (options.type) query.type = options.type;
  if (options.status) query.status = options.status;
  
  return this.find(query)
    .sort({ createdAt: -1 })
    .limit(options.limit || 50);
};

transactionSchema.statics.findPending = function() {
  return this.find({ status: 'pending' })
    .sort({ createdAt: -1 });
};

transactionSchema.statics.getStats = function(userId) {
  return this.aggregate([
    { $match: { user: mongoose.Types.ObjectId(userId) } },
    {
      $group: {
        _id: '$type',
        totalAmount: { $sum: '$amount' },
        count: { $sum: 1 },
        pending: {
          $sum: {
            $cond: [{ $eq: ['$status', 'pending'] }, 1, 0]
          }
        }
      }
    }
  ]);
};

// Instance methods
transactionSchema.methods.approve = function() {
  this.status = 'approved';
  this.processedAt = Date.now();
  return this.save();
};

transactionSchema.methods.reject = function(reason) {
  this.status = 'rejected';
  this.processedAt = Date.now();
  if (reason) {
    this.description = reason;
  }
  return this.save();
};

transactionSchema.methods.confirm = function() {
  this.status = 'confirmed';
  this.processedAt = Date.now();
  return this.save();
};

// Ensure virtuals are serialized
transactionSchema.set('toJSON', {
  virtuals: true,
  transform: function(doc, ret) {
    delete ret._id;
    delete ret.__v;
    return ret;
  }
});

module.exports = mongoose.model('Transaction', transactionSchema);
