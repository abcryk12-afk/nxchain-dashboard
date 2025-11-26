const express = require('express');
const router = express.Router();
const User = require('../models/User');
const GasLog = require('../models/GasLog');
const AdminAction = require('../models/AdminAction');
const SystemError = require('../models/SystemError');
const WalletManager = require('../blockchain/walletManager');
const { ethers } = require('ethers');

// Middleware to check if user is admin
const adminAuth = (req, res, next) => {
  const adminToken = req.headers['x-admin-token'];
  if (adminToken !== process.env.ADMIN_TOKEN) {
    return res.status(401).json({ message: 'Unauthorized' });
  }
  next();
};

// Initialize wallet manager
const walletManager = new WalletManager();

// ==================== GAS FEE MONITOR ====================
router.get('/gas-monitor', adminAuth, async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 20;
    const skip = (page - 1) * limit;
    
    const { search, status, sortBy = 'createdAt', sortOrder = 'desc' } = req.query;
    
    // Get all users with wallet balances
    const users = await User.find({ isActive: true })
      .sort({ [sortBy]: sortOrder === 'desc' ? -1 : 1 })
      .skip(skip)
      .limit(limit);
    
    // Get on-chain balances for each user
    const provider = new ethers.JsonRpcProvider(process.env.BNB_RPC_URL || 'https://bsc-dataseed1.binance.org/');
    const gasWallets = [];
    
    for (const user of users) {
      try {
        const balance = await provider.getBalance(user.address);
        const balanceBNB = parseFloat(ethers.formatEther(balance));
        
        // Determine minimum required gas (0.0003 BNB)
        const minRequiredGas = 0.0003;
        let gasStatus = 'OK';
        
        if (balanceBNB < minRequiredGas * 0.5) {
          gasStatus = 'CRITICAL';
        } else if (balanceBNB < minRequiredGas) {
          gasStatus = 'LOW';
        }
        
        gasWallets.push({
          address: user.address,
          balance: balanceBNB.toFixed(6),
          minRequiredGas: minRequiredGas.toString(),
          gasStatus,
          lastGasUpdate: new Date().toISOString(),
          userId: user.userId
        });
      } catch (error) {
        console.error(`Error checking balance for ${user.address}:`, error);
      }
    }
    
    // Filter by search term
    let filteredWallets = gasWallets;
    if (search) {
      filteredWallets = gasWallets.filter(wallet => 
        wallet.address.toLowerCase().includes(search.toLowerCase()) ||
        wallet.userId.toLowerCase().includes(search.toLowerCase())
      );
    }
    
    // Filter by status
    if (status) {
      filteredWallets = filteredWallets.filter(wallet => wallet.gasStatus === status);
    }
    
    const total = filteredWallets.length;
    const paginatedWallets = filteredWallets.slice(skip, skip + limit);
    
    res.json({
      wallets: paginatedWallets,
      pagination: {
        current: page,
        pages: Math.ceil(total / limit),
        total,
        limit
      }
    });
  } catch (error) {
    console.error('Error fetching gas monitor data:', error);
    res.status(500).json({ message: 'Failed to fetch gas monitor data' });
  }
});

// ==================== AUTO GAS TOP-UP SYSTEM ====================
router.get('/auto-gas-config', adminAuth, async (req, res) => {
  try {
    // In production, this would come from database/config
    const config = {
      autoGasSupply: true,
      threshold: '0.0003',
      retryQueue: 3,
      systemStatus: 'operational',
      lastUpdate: new Date().toISOString()
    };
    
    res.json(config);
  } catch (error) {
    console.error('Error fetching auto gas config:', error);
    res.status(500).json({ message: 'Failed to fetch auto gas config' });
  }
});

router.post('/auto-gas-config', adminAuth, async (req, res) => {
  try {
    const { autoGasSupply, threshold } = req.body;
    
    // Log admin action
    const adminAction = new AdminAction({
      adminId: req.headers['x-admin-id'] || 'unknown',
      adminName: req.headers['x-admin-name'] || 'Admin',
      adminEmail: req.headers['x-admin-email'] || 'admin@nxchain.com',
      adminRole: 'Super Admin',
      actionType: 'SYSTEM_CONFIG',
      targetType: 'SYSTEM',
      targetId: 'gas-management',
      description: `Updated auto gas configuration: supply=${autoGasSupply}, threshold=${threshold}`,
      ipAddress: req.ip,
      userAgent: req.get('User-Agent'),
      details: { autoGasSupply, threshold }
    });
    
    await adminAction.save();
    
    res.json({ message: 'Auto gas configuration updated successfully' });
  } catch (error) {
    console.error('Error updating auto gas config:', error);
    res.status(500).json({ message: 'Failed to update auto gas config' });
  }
});

// ==================== MANUAL GAS SUPPLY ====================
router.post('/manual-gas', adminAuth, async (req, res) => {
  try {
    const { walletAddress, amount } = req.body;
    
    if (!walletAddress || !amount) {
      return res.status(400).json({ message: 'Wallet address and amount are required' });
    }
    
    // Validate wallet address
    if (!ethers.isAddress(walletAddress)) {
      return res.status(400).json({ message: 'Invalid wallet address' });
    }
    
    // Validate amount
    const gasAmount = parseFloat(amount);
    if (isNaN(gasAmount) || gasAmount <= 0 || gasAmount > 0.1) {
      return res.status(400).json({ message: 'Invalid gas amount. Must be between 0 and 0.1 BNB' });
    }
    
    // Find user by wallet address
    const user = await User.findOne({ address: walletAddress.toLowerCase() });
    if (!user) {
      return res.status(404).json({ message: 'User wallet not found' });
    }
    
    // Get master wallet
    const masterWallet = walletManager.getMasterWallet();
    const provider = new ethers.JsonRpcProvider(process.env.BNB_RPC_URL || 'https://bsc-dataseed1.binance.org/');
    
    // Get current balance before
    const balanceBefore = await provider.getBalance(walletAddress);
    
    // Create and send transaction
    const wallet = new ethers.Wallet(masterWallet.privateKey, provider);
    const tx = await wallet.sendTransaction({
      to: walletAddress,
      value: ethers.parseEther(gasAmount.toString())
    });
    
    // Wait for confirmation
    const receipt = await tx.wait();
    
    // Get balance after
    const balanceAfter = await provider.getBalance(walletAddress);
    
    // Create gas log
    const gasLog = new GasLog({
      walletAddress,
      userId: user.userId,
      amount: gasAmount,
      supplyType: 'MANUAL',
      txHash: tx.hash,
      status: 'CONFIRMED',
      blockNumber: receipt.blockNumber,
      confirmations: receipt.confirmations || 1,
      adminId: req.headers['x-admin-id'] || 'unknown',
      adminName: req.headers['x-admin-name'] || 'Admin',
      adminIpAddress: req.ip,
      balanceBefore: parseFloat(ethers.formatEther(balanceBefore)),
      balanceAfter: parseFloat(ethers.formatEther(balanceAfter)),
      reason: 'Manual gas top-up by admin',
      triggerType: 'MANUAL_REQUEST',
      processingCompletedAt: new Date()
    });
    
    await gasLog.save();
    
    // Log admin action
    const adminAction = new AdminAction({
      adminId: req.headers['x-admin-id'] || 'unknown',
      adminName: req.headers['x-admin-name'] || 'Admin',
      adminEmail: req.headers['x-admin-email'] || 'admin@nxchain.com',
      adminRole: 'Super Admin',
      actionType: 'GAS_SENT',
      targetType: 'WALLET',
      targetId: walletAddress,
      targetName: user.userId,
      description: `Manual gas top-up of ${gasAmount} BNB to ${walletAddress}`,
      ipAddress: req.ip,
      userAgent: req.get('User-Agent'),
      details: { 
        amount: gasAmount, 
        txHash: tx.hash,
        blockNumber: receipt.blockNumber 
      }
    });
    
    await adminAction.save();
    
    res.json({
      message: 'Gas sent successfully',
      txHash: tx.hash,
      blockNumber: receipt.blockNumber,
      amount: gasAmount,
      gasLog: gasLog.toJSON()
    });
  } catch (error) {
    console.error('Error sending manual gas:', error);
    
    // Log error
    const systemError = new SystemError({
      errorType: 'GAS_FAIL',
      severity: 'HIGH',
      entityType: 'WALLET',
      entityId: req.body.walletAddress,
      errorMessage: error.message,
      context: { 
        amount: req.body.amount,
        adminId: req.headers['x-admin-id']
      },
      status: 'FAILED',
      service: 'gas-management'
    });
    
    await systemError.save();
    
    res.status(500).json({ message: 'Failed to send gas', error: error.message });
  }
});

// ==================== GAS HISTORY LOGS ====================
router.get('/gas-logs', adminAuth, async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 50;
    const skip = (page - 1) * limit;
    
    const { wallet, type, status, sortBy = 'createdAt', sortOrder = 'desc' } = req.query;
    
    // Build query
    let query = {};
    
    if (wallet) {
      query.walletAddress = wallet;
    }
    
    if (type) {
      query.supplyType = type;
    }
    
    if (status) {
      query.status = status;
    }
    
    // Sort options
    const sort = {};
    sort[sortBy] = sortOrder === 'desc' ? -1 : 1;
    
    const logs = await GasLog.find(query)
      .sort(sort)
      .skip(skip)
      .limit(limit)
      .populate('adminId', 'adminName');
    
    const total = await GasLog.countDocuments(query);
    
    res.json({
      logs: logs.map(log => log.toAdminJSON()),
      pagination: {
        current: page,
        pages: Math.ceil(total / limit),
        total,
        limit
      }
    });
  } catch (error) {
    console.error('Error fetching gas logs:', error);
    res.status(500).json({ message: 'Failed to fetch gas logs' });
  }
});

// ==================== ADMIN ACTION LOGS ====================
router.get('/admin-actions', adminAuth, async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 50;
    const skip = (page - 1) * limit;
    
    const { adminId, actionType, targetType, isSensitive, riskLevel, sortBy = 'createdAt', sortOrder = 'desc' } = req.query;
    
    // Build query
    let query = {};
    
    if (adminId) {
      query.adminId = adminId;
    }
    
    if (actionType) {
      query.actionType = actionType;
    }
    
    if (targetType) {
      query.targetType = targetType;
    }
    
    if (isSensitive !== undefined) {
      query.isSensitive = isSensitive === 'true';
    }
    
    if (riskLevel) {
      query.riskLevel = riskLevel;
    }
    
    // Sort options
    const sort = {};
    sort[sortBy] = sortOrder === 'desc' ? -1 : 1;
    
    const actions = await AdminAction.find(query)
      .sort(sort)
      .skip(skip)
      .limit(limit);
    
    const total = await AdminAction.countDocuments(query);
    
    res.json({
      actions: actions.map(action => action.toAdminJSON()),
      pagination: {
        current: page,
        pages: Math.ceil(total / limit),
        total,
        limit
      }
    });
  } catch (error) {
    console.error('Error fetching admin actions:', error);
    res.status(500).json({ message: 'Failed to fetch admin actions' });
  }
});

// ==================== SYSTEM ERROR MONITORING ====================
router.get('/system-errors', adminAuth, async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 50;
    const skip = (page - 1) * limit;
    
    const { errorType, severity, status, entityType, isEscalated, sortBy = 'createdAt', sortOrder = 'desc' } = req.query;
    
    // Build query
    let query = {};
    
    if (errorType) {
      query.errorType = errorType;
    }
    
    if (severity) {
      query.severity = severity;
    }
    
    if (status) {
      query.status = status;
    }
    
    if (entityType) {
      query.entityType = entityType;
    }
    
    if (isEscalated !== undefined) {
      query.isEscalated = isEscalated === 'true';
    }
    
    // Sort options
    const sort = {};
    sort[sortBy] = sortOrder === 'desc' ? -1 : 1;
    
    const errors = await SystemError.find(query)
      .sort(sort)
      .skip(skip)
      .limit(limit);
    
    const total = await SystemError.countDocuments(query);
    
    res.json({
      errors: errors.map(error => error.toAdminJSON()),
      pagination: {
        current: page,
        pages: Math.ceil(total / limit),
        total,
        limit
      }
    });
  } catch (error) {
    console.error('Error fetching system errors:', error);
    res.status(500).json({ message: 'Failed to fetch system errors' });
  }
});

router.post('/system-errors/:id/resolve', adminAuth, async (req, res) => {
  try {
    const { resolution, notes } = req.body;
    const errorId = req.params.id;
    
    const error = await SystemError.findById(errorId);
    if (!error) {
      return res.status(404).json({ message: 'Error not found' });
    }
    
    await error.resolve(resolution, req.headers['x-admin-name'] || 'Admin', notes);
    
    // Log admin action
    const adminAction = new AdminAction({
      adminId: req.headers['x-admin-id'] || 'unknown',
      adminName: req.headers['x-admin-name'] || 'Admin',
      adminEmail: req.headers['x-admin-email'] || 'admin@nxchain.com',
      adminRole: 'Super Admin',
      actionType: 'SYSTEM_CONFIG',
      targetType: 'SYSTEM',
      targetId: errorId,
      description: `Resolved system error: ${error.errorType}`,
      ipAddress: req.ip,
      userAgent: req.get('User-Agent'),
      details: { 
        errorType: error.errorType,
        resolution,
        notes
      }
    });
    
    await adminAction.save();
    
    res.json({ message: 'Error resolved successfully' });
  } catch (error) {
    console.error('Error resolving system error:', error);
    res.status(500).json({ message: 'Failed to resolve error' });
  }
});

// ==================== SYSTEM HEALTH ====================
router.get('/system-health', adminAuth, async (req, res) => {
  try {
    // Get system health metrics
    const health = await SystemError.getSystemHealth();
    
    // Get gas management stats
    const gasStats = await GasLog.getSystemStats();
    
    // Get admin action stats
    const adminStats = await AdminAction.getSystemStats(24);
    
    // Get recent errors
    const recentErrors = await SystemError.find({
      createdAt: { $gte: new Date(Date.now() - 60 * 60 * 1000) }
    }).sort({ createdAt: -1 }).limit(10);
    
    res.json({
      health,
      gasStats,
      adminStats,
      recentErrors: recentErrors.map(error => error.toAdminJSON()),
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('Error fetching system health:', error);
    res.status(500).json({ message: 'Failed to fetch system health' });
  }
});

// ==================== GAS STATISTICS ====================
router.get('/gas-stats', adminAuth, async (req, res) => {
  try {
    const timeRange = parseInt(req.query.timeRange) || 24; // hours
    
    const stats = await GasLog.getSystemStats();
    const walletStats = await GasLog.aggregate([
      {
        $group: {
          _id: '$walletAddress',
          totalGas: { $sum: '$amount' },
          gasCount: { $sum: 1 },
          lastGas: { $max: '$createdAt' }
        }
      },
      { $sort: { totalGas: -1 } },
      { $limit: 10 }
    ]);
    
    const typeStats = await GasLog.aggregate([
      {
        $group: {
          _id: '$supplyType',
          count: { $sum: 1 },
          totalAmount: { $sum: '$amount' },
          avgAmount: { $avg: '$amount' }
        }
      }
    ]);
    
    res.json({
      systemStats: stats,
      topWallets: walletStats,
      typeStats: typeStats.reduce((acc, stat) => {
        acc[stat._id] = stat;
        return acc;
      }, {}),
      timeRange
    });
  } catch (error) {
    console.error('Error fetching gas stats:', error);
    res.status(500).json({ message: 'Failed to fetch gas stats' });
  }
});

module.exports = router;
