const mongoose = require('mongoose');

const systemErrorSchema = new mongoose.Schema({
  // Error classification
  errorType: { 
    type: String, 
    required: true, 
    enum: [
      'RPC_ERROR', 'TX_FAIL', 'SWEEP_FAIL', 'GAS_FAIL', 'RETRY_QUEUE_EXHAUSTED',
      'WALLET_ERROR', 'BALANCE_ERROR', 'CONNECTION_ERROR', 'VALIDATION_ERROR',
      'TIMEOUT_ERROR', 'AUTH_ERROR', 'PERMISSION_ERROR', 'DATABASE_ERROR',
      'EMAIL_ERROR', 'BLOCKCHAIN_ERROR', 'SMART_CONTRACT_ERROR'
    ],
    index: true
  },
  
  // Severity level
  severity: { 
    type: String, 
    required: true, 
    enum: ['LOW', 'MEDIUM', 'HIGH', 'CRITICAL'],
    default: 'MEDIUM',
    index: true
  },
  
  // Related entity
  entityType: { 
    type: String, 
    required: true, 
    enum: ['WALLET', 'TRANSACTION', 'USER', 'SYSTEM', 'SERVICE', 'EXTERNAL_API'],
    index: true
  },
  entityId: { type: String, required: true, index: true },
  entityName: { type: String, default: null }, // Human-readable name
  
  // Error details
  errorCode: { type: String, default: null },
  errorMessage: { type: String, required: true },
  errorDetails: { type: mongoose.Schema.Types.Mixed, default: {} },
  stackTrace: { type: String, default: null },
  
  // Context information
  context: { 
    type: mongoose.Schema.Types.Mixed, 
    default: {} 
  }, // Additional context data
  
  // Status and resolution
  status: { 
    type: String, 
    required: true, 
    enum: ['PENDING', 'IN_PROGRESS', 'RESOLVED', 'IGNORED', 'ESCALATED'],
    default: 'PENDING',
    index: true
  },
  
  // Retry information
  retryCount: { type: Number, default: 0 },
  maxRetries: { type: Number, default: 3 },
  nextRetryAt: { type: Date, default: null },
  retryStrategy: { 
    type: String, 
    enum: ['IMMEDIATE', 'EXPONENTIAL_BACKOFF', 'FIXED_DELAY', 'NO_RETRY'],
    default: 'EXPONENTIAL_BACKOFF'
  },
  
  // Resolution information
  resolution: { type: String, default: null },
  resolvedBy: { type: String, default: null }, // Admin or system that resolved it
  resolvedAt: { type: Date, default: null },
  resolutionNotes: { type: String, default: null },
  
  // Impact assessment
  impact: { 
    type: String, 
    enum: ['NONE', 'MINIMAL', 'MODERATE', 'SEVERE', 'CRITICAL'],
    default: 'MINIMAL'
  },
  affectedUsers: [{ type: String }], // User IDs affected
  affectedServices: [{ type: String }], // Services affected
  
  // Escalation
  isEscalated: { type: Boolean, default: false, index: true },
  escalatedTo: { type: String, default: null },
  escalatedAt: { type: Date, default: null },
  escalationReason: { type: String, default: null },
  
  // Monitoring and alerts
  alertSent: { type: Boolean, default: false },
  alertSentAt: { type: Date, default: null },
  alertChannels: [{ type: String }], // email, sms, slack, etc.
  
  // Related entities
  relatedErrors: [{ type: mongoose.Schema.Types.ObjectId, ref: 'SystemError' }],
  parentError: { type: mongoose.Schema.Types.ObjectId, ref: 'SystemError' },
  
  // System information
  service: { type: String, required: true }, // Service/module where error occurred
  version: { type: String, default: null },
  environment: { 
    type: String, 
    enum: ['development', 'staging', 'production'],
    default: 'production'
  },
  
  // Performance impact
  responseTime: { type: Number, default: null }, // Response time in ms
  memoryUsage: { type: Number, default: null }, // Memory usage in MB
  cpuUsage: { type: Number, default: null }, // CPU usage percentage
  
  // Timestamps
  createdAt: { type: Date, default: Date.now, index: true },
  updatedAt: { type: Date, default: Date.now },
  firstOccurredAt: { type: Date, default: Date.now },
  lastOccurredAt: { type: Date, default: Date.now }
}, {
  timestamps: true
});

// Indexes for performance
systemErrorSchema.index({ errorType: 1, createdAt: -1 });
systemErrorSchema.index({ severity: 1, status: 1, createdAt: -1 });
systemErrorSchema.index({ entityType: 1, entityId: 1, createdAt: -1 });
systemErrorSchema.index({ service: 1, createdAt: -1 });
systemErrorSchema.index({ isEscalated: 1, createdAt: -1 });
systemErrorSchema.index({ nextRetryAt: 1 });
systemErrorSchema.index({ status: 1, severity: 1 });

// Virtual fields
systemErrorSchema.virtual('ageInMinutes').get(function() {
  return Math.floor((Date.now() - this.createdAt) / (1000 * 60));
});

systemErrorSchema.virtual('isResolved').get(function() {
  return this.status === 'RESOLVED' || this.status === 'IGNORED';
});

systemErrorSchema.virtual('needsRetry').get(function() {
  return this.status === 'PENDING' && 
         this.retryCount < this.maxRetries && 
         this.retryStrategy !== 'NO_RETRY' &&
         (!this.nextRetryAt || this.nextRetryAt <= new Date());
});

systemErrorSchema.virtual('retryDelay').get(function() {
  if (!this.needsRetry) return null;
  
  switch (this.retryStrategy) {
    case 'IMMEDIATE': return 0;
    case 'FIXED_DELAY': return 60000; // 1 minute
    case 'EXPONENTIAL_BACKOFF': return Math.min(1000 * Math.pow(2, this.retryCount), 300000); // Max 5 minutes
    default: return 60000;
  }
});

systemErrorSchema.virtual('entityDisplay').get(function() {
  return this.entityName || `${this.entityType}:${this.entityId}`;
});

// Static methods
systemErrorSchema.statics.findByType = function(errorType, options = {}) {
  const query = { errorType };
  
  if (options.status) {
    query.status = options.status;
  }
  
  if (options.severity) {
    query.severity = options.severity;
  }
  
  return this.find(query)
    .sort({ createdAt: -1 })
    .limit(options.limit || 50);
};

systemErrorSchema.statics.findByEntity = function(entityType, entityId, options = {}) {
  const query = { entityType, entityId };
  
  return this.find(query)
    .sort({ createdAt: -1 })
    .limit(options.limit || 50);
};

systemErrorSchema.statics.findPendingRetries = function() {
  return this.find({
    status: 'PENDING',
    retryCount: { $lt: this.maxRetries },
    nextRetryAt: { $lte: new Date() }
  }).sort({ nextRetryAt: 1 });
};

systemErrorSchema.statics.findEscalated = function(options = {}) {
  const query = { isEscalated: true };
  
  return this.find(query)
    .sort({ escalatedAt: -1 })
    .limit(options.limit || 50);
};

systemErrorSchema.statics.findBySeverity = function(severity, options = {}) {
  const query = { severity };
  
  if (options.status) {
    query.status = options.status;
  }
  
  return this.find(query)
    .sort({ createdAt: -1 })
    .limit(options.limit || 50);
};

systemErrorSchema.statics.getErrorStats = async function(timeRange = 24) {
  const timeAgo = new Date(Date.now() - timeRange * 60 * 60 * 1000);
  
  const stats = await this.aggregate([
    { $match: { createdAt: { $gte: timeAgo } } },
    {
      $group: {
        _id: '$errorType',
        count: { $sum: 1 },
        criticalCount: {
          $sum: { $cond: [{ $eq: ['$severity', 'CRITICAL'] }, 1, 0] }
        },
        highCount: {
          $sum: { $cond: [{ $eq: ['$severity', 'HIGH'] }, 1, 0] }
        },
        resolvedCount: {
          $sum: { $cond: [{ $eq: ['$status', 'RESOLVED'] }, 1, 0] }
        },
        escalatedCount: {
          $sum: { $cond: ['$isEscalated', 1, 0] }
        },
        avgRetryCount: { $avg: '$retryCount' },
        lastError: { $max: '$createdAt' }
      }
    }
  ]);
  
  return stats.reduce((acc, stat) => {
    acc[stat._id] = stat;
    return acc;
  }, {});
};

systemErrorSchema.statics.getSystemHealth = async function() {
  const timeAgo = new Date(Date.now() - 60 * 60 * 1000); // Last hour
  
  const stats = await this.aggregate([
    { $match: { createdAt: { $gte: timeAgo } } },
    {
      $group: {
        _id: null,
        totalErrors: { $sum: 1 },
        criticalErrors: {
          $sum: { $cond: [{ $eq: ['$severity', 'CRITICAL'] }, 1, 0] }
        },
        highErrors: {
          $sum: { $cond: [{ $eq: ['$severity', 'HIGH'] }, 1, 0] }
        },
        pendingErrors: {
          $sum: { $cond: [{ $eq: ['$status', 'PENDING'] }, 1, 0] }
        },
        escalatedErrors: {
          $sum: { $cond: ['$isEscalated', 1, 0] }
        },
        resolvedErrors: {
          $sum: { $cond: [{ $eq: ['$status', 'RESOLVED'] }, 1, 0] }
        },
        uniqueServices: { $addToSet: '$service' },
        avgResponseTime: { $avg: '$responseTime' }
      }
    }
  ]);
  
  const result = stats[0] || {
    totalErrors: 0,
    criticalErrors: 0,
    highErrors: 0,
    pendingErrors: 0,
    escalatedErrors: 0,
    resolvedErrors: 0,
    uniqueServices: [],
    avgResponseTime: 0
  };
  
  result.uniqueServiceCount = result.uniqueServices.length;
  delete result.uniqueServices;
  
  // Calculate health score
  let healthScore = 100;
  if (result.criticalErrors > 0) healthScore -= 50;
  if (result.highErrors > 0) healthScore -= 25;
  if (result.pendingErrors > 10) healthScore -= 15;
  if (result.escalatedErrors > 0) healthScore -= 10;
  
  result.healthScore = Math.max(0, healthScore);
  
  return result;
};

systemErrorSchema.statics.findRecurringErrors = function(timeRange = 24, threshold = 3) {
  const timeAgo = new Date(Date.now() - timeRange * 60 * 60 * 1000);
  
  return this.aggregate([
    { $match: { createdAt: { $gte: timeAgo } } },
    {
      $group: {
        _id: { errorType: '$errorType', entityType: '$entityType', entityId: '$entityId' },
        count: { $sum: 1 },
        lastError: { $max: '$createdAt' },
        errors: { $push: '$$ROOT' }
      }
    },
    { $match: { count: { $gte: threshold } } },
    { $sort: { count: -1 } }
  ]);
};

// Instance methods
systemErrorSchema.methods.incrementRetry = function() {
  this.retryCount += 1;
  
  // Set next retry time based on strategy
  if (this.retryStrategy === 'EXPONENTIAL_BACKOFF') {
    const delay = Math.min(1000 * Math.pow(2, this.retryCount), 300000);
    this.nextRetryAt = new Date(Date.now() + delay);
  } else if (this.retryStrategy === 'FIXED_DELAY') {
    this.nextRetryAt = new Date(Date.now() + 60000); // 1 minute
  } else if (this.retryStrategy === 'IMMEDIATE') {
    this.nextRetryAt = new Date();
  }
  
  // Check if max retries reached
  if (this.retryCount >= this.maxRetries) {
    this.status = 'ESCALATED';
    this.isEscalated = true;
    this.escalatedAt = new Date();
    this.escalationReason = 'Maximum retries exceeded';
  }
  
  return this.save();
};

systemErrorSchema.methods.resolve = function(resolution, resolvedBy, notes) {
  this.status = 'RESOLVED';
  this.resolution = resolution;
  this.resolvedBy = resolvedBy;
  this.resolvedAt = new Date();
  this.resolutionNotes = notes;
  return this.save();
};

systemErrorSchema.methods.escalate = function(escalatedTo, reason) {
  this.status = 'ESCALATED';
  this.isEscalated = true;
  this.escalatedTo = escalatedTo;
  this.escalatedAt = new Date();
  this.escalationReason = reason;
  return this.save();
};

systemErrorSchema.methods.addRelatedError = function(relatedErrorId) {
  this.relatedErrors.push(relatedErrorId);
  return this.save();
};

systemErrorSchema.methods.assessImpact = function() {
  // Auto-assess impact based on error type and affected entities
  const criticalErrors = ['RPC_ERROR', 'DATABASE_ERROR', 'BLOCKCHAIN_ERROR'];
  const highImpactErrors = ['SWEEP_FAIL', 'TX_FAIL', 'GAS_FAIL'];
  
  if (criticalErrors.includes(this.errorType)) {
    this.impact = 'CRITICAL';
    this.severity = 'CRITICAL';
  } else if (highImpactErrors.includes(this.errorType)) {
    this.impact = 'SEVERE';
    this.severity = 'HIGH';
  } else if (this.affectedUsers && this.affectedUsers.length > 10) {
    this.impact = 'MODERATE';
    this.severity = 'MEDIUM';
  } else {
    this.impact = 'MINIMAL';
    this.severity = 'LOW';
  }
  
  return this.save();
};

// Pre-save middleware
systemErrorSchema.pre('save', function(next) {
  // Update last occurred time
  this.lastOccurredAt = new Date();
  
  // Auto-assess impact if not set
  if (this.isNew && !this.impact) {
    this.assessImpact();
  }
  
  next();
});

// Transform methods
systemErrorSchema.methods.toJSON = function() {
  const error = this.toObject();
  // Remove sensitive stack trace for non-admin views
  delete error.stackTrace;
  return error;
};

systemErrorSchema.methods.toAdminJSON = function() {
  const error = this.toObject();
  // Include all fields for admin
  return error;
};

module.exports = mongoose.model('SystemError', systemErrorSchema);
