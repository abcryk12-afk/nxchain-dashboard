const mongoose = require('mongoose');

const supportSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  ticketNumber: {
    type: String,
    required: true,
    unique: true
  },
  subject: {
    type: String,
    required: true,
    trim: true,
    maxlength: 200
  },
  description: {
    type: String,
    required: true,
    trim: true,
    maxlength: 2000
  },
  category: {
    type: String,
    enum: ['general', 'technical', 'withdrawal', 'deposit', 'staking', 'referral', 'account', 'security'],
    default: 'general'
  },
  priority: {
    type: String,
    enum: ['low', 'medium', 'high', 'urgent'],
    default: 'medium'
  },
  status: {
    type: String,
    enum: ['open', 'in-progress', 'pending-user', 'resolved', 'closed'],
    default: 'open'
  },
  assignedTo: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: false
  },
  messages: [{
    sender: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true
    },
    message: {
      type: String,
      required: true,
      trim: true,
      maxlength: 2000
    },
    isInternal: {
      type: Boolean,
      default: false
    },
    attachments: [{
      filename: String,
      url: String,
      size: Number,
      mimetype: String
    }],
    createdAt: {
      type: Date,
      default: Date.now
    }
  }],
  tags: [{
    type: String,
    trim: true
  }],
  metadata: {
    type: mongoose.Schema.Types.Mixed,
    default: {}
  },
  resolvedAt: {
    type: Date,
    required: false
  },
  closedAt: {
    type: Date,
    required: false
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
supportSchema.index({ user: 1, status: 1 });
supportSchema.index({ ticketNumber: 1 });
supportSchema.index({ status: 1 });
supportSchema.index({ category: 1 });
supportSchema.index({ priority: 1 });
supportSchema.index({ assignedTo: 1 });
supportSchema.index({ createdAt: -1 });

// Virtual fields
supportSchema.virtual('id').get(function() {
  return this._id.toHexString();
});

supportSchema.virtual('isOpen').get(function() {
  return this.status === 'open';
});

supportSchema.virtual('isInProgress').get(function() {
  return this.status === 'in-progress';
});

supportSchema.virtual('isPendingUser').get(function() {
  return this.status === 'pending-user';
});

supportSchema.virtual('isResolved').get(function() {
  return this.status === 'resolved';
});

supportSchema.virtual('isClosed').get(function() {
  return this.status === 'closed';
});

supportSchema.virtual('messageCount').get(function() {
  return this.messages.length;
});

supportSchema.virtual('lastMessage').get(function() {
  return this.messages[this.messages.length - 1];
});

supportSchema.virtual('responseTime').get(function() {
  if (this.messages.length < 2) return null;
  
  const firstMessage = this.messages[0];
  const firstResponse = this.messages[1];
  
  return firstResponse.createdAt - firstMessage.createdAt;
});

// Pre-save middleware
supportSchema.pre('save', function(next) {
  this.updatedAt = Date.now();
  
  // Auto-set resolvedAt and closedAt
  if (this.isModified('status')) {
    if (this.status === 'resolved' && !this.resolvedAt) {
      this.resolvedAt = Date.now();
    }
    if (this.status === 'closed' && !this.closedAt) {
      this.closedAt = Date.now();
    }
  }
  
  next();
});

// Static methods
supportSchema.statics.findByUser = function(userId, options = {}) {
  const query = { user: userId };
  if (options.status) query.status = options.status;
  if (options.category) query.category = options.category;
  
  return this.find(query)
    .populate('assignedTo', 'username email')
    .sort({ createdAt: -1 })
    .limit(options.limit || 50);
};

supportSchema.statics.findByTicketNumber = function(ticketNumber) {
  return this.findOne({ ticketNumber })
    .populate('user assignedTo')
    .populate('messages.sender', 'username email');
};

supportSchema.statics.findByStatus = function(status) {
  return this.find({ status })
    .populate('user assignedTo')
    .sort({ createdAt: -1 });
};

supportSchema.statics.findByAssignedTo = function(adminId) {
  return this.find({ assignedTo: adminId })
    .populate('user')
    .sort({ createdAt: -1 });
};

supportSchema.statics.getStats = function() {
  return this.aggregate([
    {
      $group: {
        _id: '$status',
        count: { $sum: 1 },
        avgResponseTime: { $avg: '$responseTime' }
      }
    }
  ]);
};

supportSchema.statics.getCategoryStats = function() {
  return this.aggregate([
    {
      $group: {
        _id: '$category',
        count: { $sum: 1 },
        priorityStats: {
          $push: '$priority'
        }
      }
    }
  ]);
};

supportSchema.statics.generateTicketNumber = function() {
  return this.countDocuments()
    .then(count => {
      const date = new Date();
      const year = date.getFullYear();
      const month = String(date.getMonth() + 1).padStart(2, '0');
      const day = String(date.getDate()).padStart(2, '0');
      const sequence = String(count + 1).padStart(4, '0');
      
      return `TKT-${year}${month}${day}-${sequence}`;
    });
};

// Instance methods
supportSchema.methods.addMessage = function(senderId, message, isInternal = false) {
  this.messages.push({
    sender: senderId,
    message: message,
    isInternal: isInternal
  });
  
  // Auto-update status based on message
  if (this.status === 'pending-user' && !isInternal) {
    this.status = 'in-progress';
  } else if (this.status === 'in-progress' && isInternal) {
    this.status = 'pending-user';
  }
  
  return this.save();
};

supportSchema.methods.assignTo = function(adminId) {
  this.assignedTo = adminId;
  if (this.status === 'open') {
    this.status = 'in-progress';
  }
  return this.save();
};

supportSchema.methods.resolve = function() {
  this.status = 'resolved';
  this.resolvedAt = Date.now();
  return this.save();
};

supportSchema.methods.close = function() {
  this.status = 'closed';
  this.closedAt = Date.now();
  return this.save();
};

supportSchema.methods.reopen = function() {
  this.status = 'in-progress';
  this.resolvedAt = null;
  this.closedAt = null;
  return this.save();
};

supportSchema.methods.addTag = function(tag) {
  if (!this.tags.includes(tag)) {
    this.tags.push(tag);
    return this.save();
  }
  return Promise.resolve(this);
};

supportSchema.methods.removeTag = function(tag) {
  const index = this.tags.indexOf(tag);
  if (index > -1) {
    this.tags.splice(index, 1);
    return this.save();
  }
  return Promise.resolve(this);
};

// Ensure virtuals are serialized
supportSchema.set('toJSON', {
  virtuals: true,
  transform: function(doc, ret) {
    delete ret._id;
    delete ret.__v;
    return ret;
  }
});

module.exports = mongoose.model('Support', supportSchema);
