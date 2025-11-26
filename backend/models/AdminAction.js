const mongoose = require('mongoose');

const adminActionSchema = new mongoose.Schema({
  // Admin information
  adminId: { type: String, required: true, index: true },
  adminName: { type: String, required: true },
  adminEmail: { type: String, required: true },
  adminRole: { type: String, required: true },
  
  // Action details
  actionType: { 
    type: String, 
    required: true, 
    enum: [
      'FREEZE_USER', 'UNFREEZE_USER', 'DELETE_USER', 'RESET_PASSWORD',
      'WITHDRAWAL_APPROVE', 'WITHDRAWAL_REJECT', 'BALANCE_CHANGE',
      'PRIVATE_KEY_VIEWED', 'GAS_SENT', 'MANUAL_SWEEP', 'SYSTEM_CONFIG',
      'REGISTRATION_VERIFY', 'REGISTRATION_DELETE', 'REFERRAL_UPDATE',
      'SUPPORT_TICKET_CLOSE', 'SUPPORT_TICKET_RESPOND', 'KYC_APPROVE',
      'KYC_REJECT', 'ROLE_CHANGE', 'PERMISSION_CHANGE'
    ],
    index: true
  },
  
  // Target information
  targetType: { 
    type: String, 
    required: true, 
    enum: ['USER', 'WALLET', 'TRANSACTION', 'SYSTEM', 'TICKET', 'ROLE'],
    index: true
  },
  targetId: { type: String, required: true, index: true },
  targetName: { type: String, default: null }, // Human-readable target name
  
  // Action details
  description: { type: String, required: true },
  details: { type: mongoose.Schema.Types.Mixed, default: {} }, // Additional action data
  
  // Security information
  ipAddress: { type: String, required: true },
  userAgent: { type: String, default: null },
  sessionId: { type: String, default: null },
  
  // Status and outcome
  status: { 
    type: String, 
    required: true, 
    enum: ['SUCCESS', 'FAILED', 'PARTIAL'],
    default: 'SUCCESS',
    index: true
  },
  outcome: { type: String, default: null },
  errorMessage: { type: String, default: null },
  
  // Sensitive action tracking
  isSensitive: { type: Boolean, default: false, index: true },
  requiresApproval: { type: Boolean, default: false },
  approvedBy: { type: String, default: null },
  approvedAt: { type: Date, default: null },
  
  // Risk assessment
  riskLevel: { 
    type: String, 
    enum: ['LOW', 'MEDIUM', 'HIGH', 'CRITICAL'],
    default: 'LOW',
    index: true
  },
  
  // Related entities
  relatedActions: [{ type: mongoose.Schema.Types.ObjectId, ref: 'AdminAction' }],
  parentAction: { type: mongoose.Schema.Types.ObjectId, ref: 'AdminAction' },
  
  // Timestamps
  createdAt: { type: Date, default: Date.now, index: true },
  updatedAt: { type: Date, default: Date.now }
}, {
  timestamps: true
});

// Indexes for performance
adminActionSchema.index({ adminId: 1, createdAt: -1 });
adminActionSchema.index({ actionType: 1, createdAt: -1 });
adminActionSchema.index({ targetType: 1, targetId: 1, createdAt: -1 });
adminActionSchema.index({ isSensitive: 1, createdAt: -1 });
adminActionSchema.index({ riskLevel: 1, createdAt: -1 });
adminActionSchema.index({ status: 1, createdAt: -1 });
adminActionSchema.index({ ipAddress: 1, createdAt: -1 });

// Virtual fields
adminActionSchema.virtual('ageInHours').get(function() {
  return Math.floor((Date.now() - this.createdAt) / (1000 * 60 * 60));
});

adminActionSchema.virtual('actionTypeDisplay').get(function() {
  return this.actionType.replace(/_/g, ' ').toLowerCase().replace(/\b\w/g, l => l.toUpperCase());
});

adminActionSchema.virtual('targetDisplay').get(function() {
  return this.targetName || `${this.targetType}:${this.targetId}`;
});

// Static methods
adminActionSchema.statics.findByAdmin = function(adminId, options = {}) {
  const query = { adminId };
  
  if (options.actionType) {
    query.actionType = options.actionType;
  }
  
  if (options.targetType) {
    query.targetType = options.targetType;
  }
  
  if (options.isSensitive !== undefined) {
    query.isSensitive = options.isSensitive;
  }
  
  if (options.riskLevel) {
    query.riskLevel = options.riskLevel;
  }
  
  return this.find(query)
    .sort({ createdAt: -1 })
    .limit(options.limit || 50);
};

adminActionSchema.statics.findByTarget = function(targetType, targetId, options = {}) {
  const query = { targetType, targetId };
  
  return this.find(query)
    .sort({ createdAt: -1 })
    .limit(options.limit || 50);
};

adminActionSchema.statics.findSensitiveActions = function(options = {}) {
  const query = { isSensitive: true };
  
  if (options.timeRange) {
    query.createdAt = {
      $gte: new Date(Date.now() - options.timeRange * 60 * 60 * 1000)
    };
  }
  
  return this.find(query)
    .sort({ createdAt: -1 })
    .limit(options.limit || 100);
};

adminActionSchema.statics.findByRiskLevel = function(riskLevel, options = {}) {
  const query = { riskLevel };
  
  return this.find(query)
    .sort({ createdAt: -1 })
    .limit(options.limit || 50);
};

adminActionSchema.statics.getActionStats = async function(adminId, timeRange = 24) {
  const timeAgo = new Date(Date.now() - timeRange * 60 * 60 * 1000);
  
  const stats = await this.aggregate([
    { $match: { adminId: adminId, createdAt: { $gte: timeAgo } } },
    {
      $group: {
        _id: '$actionType',
        count: { $sum: 1 },
        successCount: {
          $sum: { $cond: [{ $eq: ['$status', 'SUCCESS'] }, 1, 0] }
        },
        failedCount: {
          $sum: { $cond: [{ $eq: ['$status', 'FAILED'] }, 1, 0] }
        },
        sensitiveCount: {
          $sum: { $cond: ['$isSensitive', 1, 0] }
        },
        lastAction: { $max: '$createdAt' }
      }
    }
  ]);
  
  return stats.reduce((acc, stat) => {
    acc[stat._id] = stat;
    return acc;
  }, {});
};

adminActionSchema.statics.getSystemStats = async function(timeRange = 24) {
  const timeAgo = new Date(Date.now() - timeRange * 60 * 60 * 1000);
  
  const stats = await this.aggregate([
    { $match: { createdAt: { $gte: timeAgo } } },
    {
      $group: {
        _id: null,
        totalActions: { $sum: 1 },
        successActions: {
          $sum: { $cond: [{ $eq: ['$status', 'SUCCESS'] }, 1, 0] }
        },
        failedActions: {
          $sum: { $cond: [{ $eq: ['$status', 'FAILED'] }, 1, 0] }
        },
        sensitiveActions: {
          $sum: { $cond: ['$isSensitive', 1, 0] }
        },
        highRiskActions: {
          $sum: { $cond: [{ $eq: ['$riskLevel', 'HIGH'] }, 1, 0] }
        },
        criticalRiskActions: {
          $sum: { $cond: [{ $eq: ['$riskLevel', 'CRITICAL'] }, 1, 0] }
        },
        uniqueAdmins: { $addToSet: '$adminId' },
        uniqueTargets: { $addToSet: '$targetId' }
      }
    }
  ]);
  
  const result = stats[0] || {
    totalActions: 0,
    successActions: 0,
    failedActions: 0,
    sensitiveActions: 0,
    highRiskActions: 0,
    criticalRiskActions: 0,
    uniqueAdmins: [],
    uniqueTargets: []
  };
  
  result.uniqueAdminCount = result.uniqueAdmins.length;
  result.uniqueTargetCount = result.uniqueTargets.length;
  delete result.uniqueAdmins;
  delete result.uniqueTargets;
  
  return result;
};

adminActionSchema.statics.findSuspiciousActivity = function() {
  const timeAgo = new Date(Date.now() - 60 * 60 * 1000); // Last hour
  
  return this.find({
    $or: [
      { status: 'FAILED', createdAt: { $gte: timeAgo } },
      { riskLevel: 'CRITICAL', createdAt: { $gte: timeAgo } },
      { isSensitive: true, createdAt: { $gte: timeAgo } }
    ]
  }).sort({ createdAt: -1 });
};

// Instance methods
adminActionSchema.methods.markAsFailed = function(errorMessage) {
  this.status = 'FAILED';
  this.errorMessage = errorMessage;
  return this.save();
};

adminActionSchema.methods.setApproval = function(approvedBy, approvedAt) {
  this.approvedBy = approvedBy;
  this.approvedAt = approvedAt || new Date();
  return this.save();
};

adminActionSchema.methods.addRelatedAction = function(relatedActionId) {
  this.relatedActions.push(relatedActionId);
  return this.save();
};

adminActionSchema.methods.assessRisk = function() {
  // Auto-assess risk based on action type and details
  const highRiskActions = [
    'DELETE_USER', 'PRIVATE_KEY_VIEWED', 'SYSTEM_CONFIG', 'ROLE_CHANGE'
  ];
  
  const criticalRiskActions = [
    'BALANCE_CHANGE', 'WITHDRAWAL_APPROVE', 'PERMISSION_CHANGE'
  ];
  
  if (criticalRiskActions.includes(this.actionType)) {
    this.riskLevel = 'CRITICAL';
    this.isSensitive = true;
  } else if (highRiskActions.includes(this.actionType)) {
    this.riskLevel = 'HIGH';
    this.isSensitive = true;
  } else if (this.actionType.includes('FREEZE') || this.actionType.includes('APPROVE')) {
    this.riskLevel = 'MEDIUM';
  } else {
    this.riskLevel = 'LOW';
  }
  
  return this.save();
};

// Pre-save middleware
adminActionSchema.pre('save', function(next) {
  // Auto-assess risk if not set
  if (this.isNew && !this.riskLevel) {
    this.assessRisk();
  }
  
  next();
});

// Transform methods
adminActionSchema.methods.toJSON = function() {
  const action = this.toObject();
  // Remove sensitive fields for non-admin views
  if (!this.isSensitive) {
    delete action.details;
    delete action.errorMessage;
  }
  return action;
};

adminActionSchema.methods.toAdminJSON = function() {
  const action = this.toObject();
  // Include all fields for admin
  return action;
};

module.exports = mongoose.model('AdminAction', adminActionSchema);
