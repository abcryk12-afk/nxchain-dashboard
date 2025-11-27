const express = require('express');
const router = express.Router();
const HDWalletService = require('../services/hdwallet');
const User = require('../models/User');
const Wallet = require('../models/Wallet');
const { authenticateToken } = require('../middleware/auth');

const hdWalletService = new HDWalletService();

// Get user wallet addresses
router.get('/addresses', authenticateToken, async (req, res) => {
  try {
    const user = await User.findOne({ userId: req.user.userId });
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    // If wallet not generated, generate it
    if (!user.walletGenerated) {
      const userAddresses = hdWalletService.getUserAddresses(user.userId);
      
      user.multiNetworkAddresses = {};
      user.walletGenerated = true;
      
      for (const [network, addressData] of Object.entries(userAddresses)) {
        user.multiNetworkAddresses[network] = {
          address: addressData.address,
          privateKeyEncrypted: hdWalletService.encrypt(addressData.privateKey || '', user.userId),
          publicKey: addressData.publicKey || '',
          derivationPath: addressData.derivationPath || '',
          contractAddress: addressData.contractAddress,
          decimals: addressData.decimals,
          createdAt: new Date()
        };
      }
      
      await user.save();
    }

    // Return only public address information
    const publicAddresses = {};
    for (const [network, data] of Object.entries(user.multiNetworkAddresses)) {
      publicAddresses[network] = {
        address: data.address,
        contractAddress: data.contractAddress,
        decimals: data.decimals,
        network: hdWalletService.networks[network].name,
        createdAt: data.createdAt
      };
    }

    res.json({
      success: true,
      userId: user.userId,
      walletGenerated: user.walletGenerated,
      addresses: publicAddresses
    });

  } catch (error) {
    console.error('🔥 WALLET ADDRESSES ERROR:', error);
    res.status(500).json({ message: 'Failed to fetch wallet addresses' });
  }
});

// Get wallet private key (admin only)
router.get('/private-key/:userId', authenticateToken, async (req, res) => {
  try {
    const requestingUser = await User.findOne({ userId: req.user.userId });
    if (!requestingUser || !requestingUser.isAdmin) {
      return res.status(403).json({ message: 'Admin access required' });
    }

    const { userId } = req.params;
    const user = await User.findOne({ userId });
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    // Decrypt and return private keys
    const privateKeys = {};
    for (const [network, data] of Object.entries(user.multiNetworkAddresses)) {
      if (data.privateKeyEncrypted) {
        privateKeys[network] = {
          address: data.address,
          privateKey: hdWalletService.decrypt(data.privateKeyEncrypted, userId),
          network: hdWalletService.networks[network].name
        };
      }
    }

    res.json({
      success: true,
      userId: user.userId,
      privateKeys
    });

  } catch (error) {
    console.error('🔥 PRIVATE KEY FETCH ERROR:', error);
    res.status(500).json({ message: 'Failed to fetch private keys' });
  }
});

// Master wallet info (admin only)
router.get('/master-info', authenticateToken, async (req, res) => {
  try {
    const user = await User.findOne({ userId: req.user.userId });
    if (!user || !user.isAdmin) {
      return res.status(403).json({ message: 'Admin access required' });
    }

    const masterInfo = hdWalletService.getMasterWalletInfo();
    
    res.json({
      success: true,
      masterInfo
    });

  } catch (error) {
    console.error('🔥 MASTER WALLET INFO ERROR:', error);
    res.status(500).json({ message: 'Failed to fetch master wallet info' });
  }
});

module.exports = router;
