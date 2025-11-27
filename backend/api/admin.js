const express = require('express');
const router = express.Router();
const User = require('../models/User');
const Wallet = require('../models/Wallet');
const { authenticateToken } = require('../middleware/auth');

// Search users by email, user ID, or name
router.get('/user/details', authenticateToken, async (req, res) => {
  try {
    const { query } = req.query;
    
    if (!query) {
      return res.status(400).json({ message: 'Search query is required' });
    }

    // Check if requester is admin
    const requestingUser = await User.findOne({ userId: req.user.userId });
    if (!requestingUser || !requestingUser.isAdmin) {
      return res.status(403).json({ message: 'Admin access required' });
    }

    console.log('🔥 ADMIN SEARCHING USERS:', query);

    // Search in multiple fields
    const users = await User.find({
      isActive: true,
      $or: [
        { userId: { $regex: query, $options: 'i' } },
        { email: { $regex: query, $options: 'i' } },
        { firstName: { $regex: query, $options: 'i' } },
        { lastName: { $regex: query, $options: 'i' } }
      ]
    })
    .select('userId email firstName lastName phone country referralCode walletGenerated createdAt')
    .limit(10);

    console.log('🔥 FOUND USERS:', users.length);

    res.json({
      success: true,
      users: users.map(user => ({
        userId: user.userId,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        phone: user.phone,
        country: user.country,
        referralCode: user.referralCode,
        walletGenerated: user.walletGenerated,
        createdAt: user.createdAt
      }))
    });

  } catch (error) {
    console.error('🔥 ADMIN USER SEARCH ERROR:', error);
    res.status(500).json({ message: 'Failed to search users' });
  }
});

// Get user wallet details
router.get('/user/wallets/:userId', authenticateToken, async (req, res) => {
  try {
    const { userId } = req.params;
    
    // Check if requester is admin
    const requestingUser = await User.findOne({ userId: req.user.userId });
    if (!requestingUser || !requestingUser.isAdmin) {
      return res.status(403).json({ message: 'Admin access required' });
    }

    console.log('🔥 ADMIN FETCHING WALLET FOR USER:', userId);

    // Get user details
    const user = await User.findOne({ userId, isActive: true });
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    // Get wallet details
    const wallet = await Wallet.findOne({ userId, isActive: true });
    if (!wallet) {
      return res.status(404).json({ message: 'Wallet not found' });
    }

    console.log('🔥 WALLET FOUND FOR USER:', userId);

    res.json({
      success: true,
      wallet: {
        hdWalletId: wallet._id.toString(),
        mnemonicEncrypted: wallet.mnemonicEncrypted,
        xpub: wallet.xpub,
        addresses: wallet.addresses
      }
    });

  } catch (error) {
    console.error('🔥 ADMIN WALLET FETCH ERROR:', error);
    res.status(500).json({ message: 'Failed to fetch wallet details' });
  }
});

// Get wallet balance (mock implementation - integrate with real blockchain)
router.get('/user/wallet-balance/:walletAddress', authenticateToken, async (req, res) => {
  try {
    const { walletAddress } = req.params;
    
    // Check if requester is admin
    const requestingUser = await User.findOne({ userId: req.user.userId });
    if (!requestingUser || !requestingUser.isAdmin) {
      return res.status(403).json({ message: 'Admin access required' });
    }

    console.log('🔥 ADMIN FETCHING BALANCE FOR ADDRESS:', walletAddress);

    // Mock balance data - replace with real blockchain integration
    const mockBalance = {
      address: walletAddress,
      balance: Math.random() * 1000, // Random balance
      usdtBalance: Math.random() * 10000, // Random USDT balance
      networkBalance: Math.random() * 10 // Random network balance
    };

    console.log('🔥 BALANCE FETCHED:', mockBalance);

    res.json({
      success: true,
      ...mockBalance
    });

  } catch (error) {
    console.error('🔥 ADMIN BALANCE FETCH ERROR:', error);
    res.status(500).json({ message: 'Failed to fetch wallet balance' });
  }
});

// Get all users (admin only)
router.get('/users', authenticateToken, async (req, res) => {
  try {
    // Check if requester is admin
    const requestingUser = await User.findOne({ userId: req.user.userId });
    if (!requestingUser || !requestingUser.isAdmin) {
      return res.status(403).json({ message: 'Admin access required' });
    }

    const { page = 1, limit = 50, search } = req.query;
    
    let query = { isActive: true };
    
    if (search) {
      query.$or = [
        { userId: { $regex: search, $options: 'i' } },
        { email: { $regex: search, $options: 'i' } },
        { firstName: { $regex: search, $options: 'i' } },
        { lastName: { $regex: search, $options: 'i' } }
      ];
    }

    const users = await User.find(query)
      .select('userId email firstName lastName phone country referralCode walletGenerated balance totalEarnings createdAt')
      .sort({ createdAt: -1 })
      .limit(limit * 1)
      .skip((page - 1) * limit);

    const total = await User.countDocuments(query);

    res.json({
      success: true,
      users,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / limit)
      }
    });

  } catch (error) {
    console.error('🔥 ADMIN USERS FETCH ERROR:', error);
    res.status(500).json({ message: 'Failed to fetch users' });
  }
});

// Get specific user details (admin only)
router.get('/user/:userId', authenticateToken, async (req, res) => {
  try {
    const { userId } = req.params;
    
    // Check if requester is admin
    const requestingUser = await User.findOne({ userId: req.user.userId });
    if (!requestingUser || !requestingUser.isAdmin) {
      return res.status(403).json({ message: 'Admin access required' });
    }

    const user = await User.findOne({ userId, isActive: true });
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    // Get wallet details if available
    const wallet = await Wallet.findOne({ userId, isActive: true });

    res.json({
      success: true,
      user: {
        ...user.toJSON(),
        wallet: wallet ? {
          hdWalletId: wallet._id,
          walletGenerated: true,
          addresses: Object.keys(wallet.addresses).reduce((acc, network) => {
            acc[network] = {
              address: wallet.addresses[network].address,
              contractAddress: wallet.addresses[network].contractAddress,
              decimals: wallet.addresses[network].decimals,
              createdAt: wallet.addresses[network].createdAt
            };
            return acc;
          }, {})
        } : null
      }
    });

  } catch (error) {
    console.error('🔥 ADMIN USER DETAILS ERROR:', error);
    res.status(500).json({ message: 'Failed to fetch user details' });
  }
});

module.exports = router;
