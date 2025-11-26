const express = require('express');
const router = express.Router();
const User = require('../models/User');
const Deposit = require('../models/Deposit');
const Sweep = require('../models/Sweep');
const TempRegistration = require('../models/TempRegistration');
const WalletManager = require('../blockchain/walletManager');
const { ethers } = require('ethers');

// Import gas management routes
const gasRoutes = require('./gasRoutes');

// Use gas management routes
router.use('/gas', gasRoutes);

// Middleware to check if user is admin
const adminAuth = (req, res, next) => {
  // In production, implement proper admin authentication
  // For now, we'll use a simple check
  const adminToken = req.headers['x-admin-token'];
  if (adminToken !== process.env.ADMIN_TOKEN) {
    return res.status(401).json({ message: 'Unauthorized' });
  }
  next();
};

// Initialize wallet manager
const walletManager = new WalletManager();

// ==================== MASTER WALLET CONTROL ====================
router.get('/master-wallet', adminAuth, async (req, res) => {
  try {
    const masterWallet = walletManager.getMasterWallet();
    
    // Get master wallet balance
    const provider = new ethers.JsonRpcProvider(process.env.BNB_RPC_URL || 'https://bsc-dataseed1.binance.org/');
    const balance = await provider.getBalance(masterWallet.address);
    
    // Get total system stats
    const totalDeposits = await Deposit.aggregate([
      { $group: { _id: null, total: { $sum: '$usdValue' }, count: { $sum: 1 } } }
    ]);
    
    const totalSweeps = await Sweep.getSystemStats();
    
    res.json({
      masterWallet: {
        address: masterWallet.address,
        publicKey: masterWallet.publicKey,
        privateKey: masterWallet.privateKeyEncrypted,
        seedPhrase: masterWallet.seedPhrase,
        balance: ethers.formatEther(balance),
        balanceUSD: parseFloat(ethers.formatEther(balance)) * 250 // Mock BNB price
      },
      systemStats: {
        totalDeposits: totalDeposits[0]?.total || 0,
        totalDepositsCount: totalDeposits[0]?.count || 0,
        totalSweeps: totalSweeps.totalSweeps || 0,
        totalSweepsCount: totalSweeps.sweepCount || 0,
        totalGasCost: totalSweeps.totalGasCost || 0
      }
    });
  } catch (error) {
    console.error('Error fetching master wallet info:', error);
    res.status(500).json({ message: 'Failed to fetch master wallet info' });
  }
});

router.post('/master-wallet/refresh', adminAuth, async (req, res) => {
  try {
    // Reinitialize master wallet
    await walletManager.initializeMasterWallet();
    
    res.json({ message: 'Master wallet refreshed successfully' });
  } catch (error) {
    console.error('Error refreshing master wallet:', error);
    res.status(500).json({ message: 'Failed to refresh master wallet' });
  }
});

// ==================== USER MANAGEMENT ====================
router.get('/users', adminAuth, async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 20;
    const skip = (page - 1) * limit;
    
    const { search, status, kycStatus, sortBy = 'createdAt', sortOrder = 'desc' } = req.query;
    
    // Build query
    let query = {};
    
    if (search) {
      query.$or = [
        { email: { $regex: search, $options: 'i' } },
        { userId: { $regex: search, $options: 'i' } },
        { address: { $regex: search, $options: 'i' } },
        { referralCode: { $regex: search, $options: 'i' } }
      ];
    }
    
    if (status) {
      query.isActive = status === 'active';
    }
    
    if (kycStatus) {
      query.kycStatus = kycStatus;
    }
    
    // Sort options
    const sort = {};
    sort[sortBy] = sortOrder === 'desc' ? -1 : 1;
    
    const users = await User.find(query)
      .sort(sort)
      .skip(skip)
      .limit(limit);
    
    const total = await User.countDocuments(query);
    
    // Get additional stats for each user
    const usersWithStats = await Promise.all(
      users.map(async (user) => {
        const depositStats = await Deposit.getStats(user.userId);
        const sweepStats = await Sweep.getStats(user.userId);
        
        // Get on-chain balance
        const provider = new ethers.JsonRpcProvider(process.env.BNB_RPC_URL || 'https://bsc-dataseed1.binance.org/');
        const onChainBalance = await provider.getBalance(user.address);
        
        return {
          ...user.toAdminJSON(),
          onChainBalance: ethers.formatEther(onChainBalance),
          depositStats,
          sweepStats
        };
      })
    );
    
    res.json({
      users: usersWithStats,
      pagination: {
        current: page,
        pages: Math.ceil(total / limit),
        total,
        limit
      }
    });
  } catch (error) {
    console.error('Error fetching users:', error);
    res.status(500).json({ message: 'Failed to fetch users' });
  }
});

router.get('/users/:userId', adminAuth, async (req, res) => {
  try {
    const user = await User.findOne({ userId: req.params.userId });
    
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }
    
    // Get detailed stats
    const depositStats = await Deposit.getStats(user.userId);
    const sweepStats = await Sweep.getStats(user.userId);
    const deposits = await Deposit.findByUser(user.userId, { limit: 50 });
    const sweeps = await Sweep.findByUser(user.userId, { limit: 50 });
    
    // Get on-chain balance
    const provider = new ethers.JsonRpcProvider(process.env.BNB_RPC_URL || 'https://bsc-dataseed1.binance.org/');
    const onChainBalance = await provider.getBalance(user.address);
    
    res.json({
      user: user.toAdminJSON(),
      onChainBalance: ethers.formatEther(onChainBalance),
      depositStats,
      sweepStats,
      recentDeposits: deposits,
      recentSweeps: sweeps
    });
  } catch (error) {
    console.error('Error fetching user details:', error);
    res.status(500).json({ message: 'Failed to fetch user details' });
  }
});

router.post('/users/:userId/freeze', adminAuth, async (req, res) => {
  try {
    const user = await User.findOne({ userId: req.params.userId });
    
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }
    
    user.isFrozen = !user.isFrozen;
    await user.save();
    
    res.json({ 
      message: `User ${user.isFrozen ? 'frozen' : 'unfrozen'} successfully`,
      isFrozen: user.isFrozen
    });
  } catch (error) {
    console.error('Error freezing user:', error);
    res.status(500).json({ message: 'Failed to freeze user' });
  }
});

router.delete('/users/:userId', adminAuth, async (req, res) => {
  try {
    const user = await User.findOne({ userId: req.params.userId });
    
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }
    
    // Soft delete - mark as inactive
    user.isActive = false;
    await user.save();
    
    res.json({ message: 'User deleted successfully' });
  } catch (error) {
    console.error('Error deleting user:', error);
    res.status(500).json({ message: 'Failed to delete user' });
  }
});

// ==================== WITHDRAWAL MANAGEMENT ====================
router.get('/withdrawals', adminAuth, async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 20;
    const skip = (page - 1) * limit;
    
    const { status, tokenType, sortBy = 'createdAt', sortOrder = 'desc' } = req.query;
    
    // Build query
    let query = {};
    
    if (status) {
      query.status = status;
    }
    
    if (tokenType) {
      query.tokenType = tokenType;
    }
    
    // Sort options
    const sort = {};
    sort[sortBy] = sortOrder === 'desc' ? -1 : 1;
    
    // For now, we'll mock withdrawal data since we don't have a Withdrawal model yet
    const withdrawals = []; // This would be populated from your Withdrawal model
    const total = 0;
    
    res.json({
      withdrawals,
      pagination: {
        current: page,
        pages: Math.ceil(total / limit),
        total,
        limit
      }
    });
  } catch (error) {
    console.error('Error fetching withdrawals:', error);
    res.status(500).json({ message: 'Failed to fetch withdrawals' });
  }
});

// ==================== TRANSACTION HISTORY ====================
router.get('/transactions', adminAuth, async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 50;
    const skip = (page - 1) * limit;
    
    const { type, status, userId, tokenType, sortBy = 'createdAt', sortOrder = 'desc' } = req.query;
    
    let transactions = [];
    
    // Get deposits
    if (!type || type === 'deposit') {
      let depositQuery = {};
      if (status) depositQuery.status = status;
      if (userId) depositQuery.userId = userId;
      if (tokenType) depositQuery.tokenType = tokenType;
      
      const deposits = await Deposit.find(depositQuery)
        .sort({ [sortBy]: sortOrder === 'desc' ? -1 : 1 })
        .skip(skip)
        .limit(limit);
      
      transactions.push(...deposits.map(d => ({ ...d.toJSON(), type: 'deposit' })));
    }
    
    // Get sweeps
    if (!type || type === 'sweep') {
      let sweepQuery = {};
      if (status) sweepQuery.status = status;
      if (userId) sweepQuery.userId = userId;
      if (tokenType) sweepQuery.tokenType = tokenType;
      
      const sweeps = await Sweep.find(sweepQuery)
        .sort({ [sortBy]: sortOrder === 'desc' ? -1 : 1 })
        .skip(skip)
        .limit(limit);
      
      transactions.push(...sweeps.map(s => ({ ...s.toJSON(), type: 'sweep' })));
    }
    
    // Sort combined results
    transactions.sort((a, b) => {
      const dateA = new Date(a.createdAt);
      const dateB = new Date(b.createdAt);
      return sortOrder === 'desc' ? dateB - dateA : dateA - dateB;
    });
    
    // Paginate
    const total = transactions.length;
    transactions = transactions.slice(skip, skip + limit);
    
    res.json({
      transactions,
      pagination: {
        current: page,
        pages: Math.ceil(total / limit),
        total,
        limit
      }
    });
  } catch (error) {
    console.error('Error fetching transactions:', error);
    res.status(500).json({ message: 'Failed to fetch transactions' });
  }
});

// ==================== NEW REGISTRATIONS ====================
router.get('/registrations', adminAuth, async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 20;
    const skip = (page - 1) * limit;
    
    const { status, sortBy = 'createdAt', sortOrder = 'desc' } = req.query;
    
    // Build query
    let query = {};
    
    if (status) {
      query.status = status;
    }
    
    // Sort options
    const sort = {};
    sort[sortBy] = sortOrder === 'desc' ? -1 : 1;
    
    const registrations = await TempRegistration.find(query)
      .sort(sort)
      .skip(skip)
      .limit(limit);
    
    const total = await TempRegistration.countDocuments(query);
    
    res.json({
      registrations: registrations.map(reg => reg.toAdminJSON()),
      pagination: {
        current: page,
        pages: Math.ceil(total / limit),
        total,
        limit
      }
    });
  } catch (error) {
    console.error('Error fetching registrations:', error);
    res.status(500).json({ message: 'Failed to fetch registrations' });
  }
});

router.post('/registrations/:id/resend', adminAuth, async (req, res) => {
  try {
    const registration = await TempRegistration.findById(req.params.id);
    
    if (!registration) {
      return res.status(404).json({ message: 'Registration not found' });
    }
    
    await registration.resendCode();
    
    // Here you would send the actual email
    // await sendVerificationEmail(registration.email, registration.verificationCode);
    
    res.json({ 
      message: 'Verification code resent successfully',
      newCode: registration.verificationCode,
      expiresAt: registration.codeExpiresAt
    });
  } catch (error) {
    console.error('Error resending verification code:', error);
    res.status(500).json({ message: error.message });
  }
});

router.post('/registrations/:id/verify', adminAuth, async (req, res) => {
  try {
    const registration = await TempRegistration.findById(req.params.id);
    
    if (!registration) {
      return res.status(404).json({ message: 'Registration not found' });
    }
    
    // Create actual user from temp registration
    const User = require('../models/User');
    const walletManager = require('../blockchain/walletManager');
    
    // Generate user wallet
    const userId = User.generateUserId();
    const userWallet = walletManager.generateUserWallet(userId);
    
    const user = new User({
      userId,
      email: registration.email,
      password: registration.registrationData.password,
      firstName: registration.registrationData.firstName,
      lastName: registration.registrationData.lastName,
      phone: registration.registrationData.phone,
      country: registration.registrationData.country,
      address: userWallet.address,
      publicKey: userWallet.publicKey,
      privateKeyEncrypted: userWallet.privateKeyEncrypted,
      derivationPath: userWallet.derivationPath,
      referralCode: User.generateReferralCode(),
      referredBy: registration.registrationData.referralCode,
      isVerified: true
    });
    
    await user.save();
    
    // Mark temp registration as verified
    registration.status = 'verified';
    registration.verifiedAt = new Date();
    await registration.save();
    
    res.json({ 
      message: 'Registration verified and user created successfully',
      userId: user.userId
    });
  } catch (error) {
    console.error('Error verifying registration:', error);
    res.status(500).json({ message: error.message });
  }
});

router.delete('/registrations/:id', adminAuth, async (req, res) => {
  try {
    const registration = await TempRegistration.findById(req.params.id);
    
    if (!registration) {
      return res.status(404).json({ message: 'Registration not found' });
    }
    
    await TempRegistration.findByIdAndDelete(req.params.id);
    
    res.json({ message: 'Registration deleted successfully' });
  } catch (error) {
    console.error('Error deleting registration:', error);
    res.status(500).json({ message: 'Failed to delete registration' });
  }
});

// ==================== SYSTEM METRICS ====================
router.get('/metrics', adminAuth, async (req, res) => {
  try {
    const now = new Date();
    const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    
    // User stats
    const totalUsers = await User.countDocuments({ isActive: true });
    const newUsers = await User.countDocuments({ 
      createdAt: { $gte: sevenDaysAgo },
      isActive: true 
    });
    
    // Deposit stats
    const depositStats = await Deposit.aggregate([
      {
        $group: {
          _id: null,
          totalDeposits: { $sum: '$usdValue' },
          depositCount: { $sum: 1 },
          recentDeposits: {
            $sum: {
              $cond: [{ $gte: ['$createdAt', sevenDaysAgo] }, 1, 0]
            }
          }
        }
      }
    ]);
    
    // Sweep stats
    const sweepStats = await Sweep.getSystemStats();
    
    // Registration stats
    const pendingRegistrations = await TempRegistration.getPendingCount();
    const registrationStats = await TempRegistration.getStats();
    
    // System health
    const provider = new ethers.JsonRpcProvider(process.env.BNB_RPC_URL || 'https://bsc-dataseed1.binance.org/');
    const blockNumber = await provider.getBlockNumber();
    
    res.json({
      users: {
        total: totalUsers,
        newThisWeek: newUsers
      },
      deposits: {
        total: depositStats[0]?.totalDeposits || 0,
        count: depositStats[0]?.depositCount || 0,
        newThisWeek: depositStats[0]?.recentDeposits || 0
      },
      sweeps: {
        total: sweepStats.totalSweeps || 0,
        count: sweepStats.sweepCount || 0,
        completed: sweepStats.completedSweeps || 0,
        failed: sweepStats.failedSweeps || 0
      },
      registrations: {
        pending: pendingRegistrations,
        stats: registrationStats
      },
      system: {
        blockNumber,
        rpcLatency: Date.now() - now.getTime(),
        uptime: process.uptime()
      }
    });
  } catch (error) {
    console.error('Error fetching metrics:', error);
    res.status(500).json({ message: 'Failed to fetch metrics' });
  }
});

module.exports = router;
