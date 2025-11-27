const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const nodemailer = require('nodemailer');
const qrcode = require('qrcode');
const crypto = require('crypto');

// Import blockchain components
const WalletManager = require('./blockchain/walletManager');
const DepositListener = require('./blockchain/depositListener');
const adminRoutes = require('./admin/adminRoutes');

// Import models
const User = require('./models/User');
const Transaction = require('./models/Transaction');
const Staking = require('./models/Staking');
const Support = require('./models/Support');
const Referral = require('./models/Referral');
const Deposit = require('./models/Deposit');
const Sweep = require('./models/Sweep');
const TempRegistration = require('./models/TempRegistration');
const GasLog = require('./models/GasLog');
const AdminAction = require('./models/AdminAction');
const SystemError = require('./models/SystemError');

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
const corsOptions = {
  origin: [
    'https://nxchain-frontend.onrender.com',
    'http://localhost:3000',
    'http://localhost:3001'
  ],
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
};

app.use(cors(corsOptions));
app.use(express.json());

// MongoDB Connection
mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/nxchain');

// Initialize blockchain components with error handling
let walletManager, depositListener;
try {
  walletManager = new WalletManager();
  console.log('✅ Wallet Manager initialized successfully');
} catch (error) {
  console.error('❌ Failed to initialize Wallet Manager:', error);
  walletManager = null;
}

try {
  depositListener = new DepositListener();
  console.log('✅ Deposit Listener initialized successfully');
} catch (error) {
  console.error('❌ Failed to initialize Deposit Listener:', error);
  depositListener = null;
}

// Email Transporter
const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS
  }
});

// JWT Middleware
const authenticateToken = (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    return res.status(401).json({ message: 'Access token required' });
  }

  jwt.verify(token, process.env.JWT_SECRET || 'your-super-secret-jwt-key-change-this-in-production', (err, user) => {
    if (err) {
      return res.status(403).json({ message: 'Invalid token' });
    }
    req.user = user;
    next();
  });
};

// Start deposit listener
depositListener.startListening().catch(console.error);

// Monitor token contracts
const tokenContracts = [
  process.env.USDT_CONTRACT || '0x55d398326f99059ff775485246999027b3197955', // USDT on BSC
  process.env.USDC_CONTRACT || '0x8ac76a51cc950d9822d68b83fe1ad97b32cd580d', // USDC on BSC
  process.env.BUSD_CONTRACT || '0xe9e7cea3dedca5984780bafc599bd69add087d56'  // BUSD on BSC
];

tokenContracts.forEach(contract => {
  depositListener.monitorTokenTransfers(contract);
});

// Cleanup expired registrations every 5 minutes
setInterval(async () => {
  try {
    await TempRegistration.cleanupExpired();
  } catch (error) {
    console.error('Error cleaning up expired registrations:', error);
  }
}, 5 * 60 * 1000);

// Routes
app.use('/api/admin', adminRoutes);

// Registration with wallet generation (simplified for testing)
app.post('/api/register', async (req, res) => {
  try {
    const { email, password, firstName, lastName, referralCode } = req.body;

    // Check if user already exists
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({ message: 'User already exists' });
    }

    // Generate user ID
    const newUserId = User.generateUserId();

    // Generate user wallet
    const userWallet = walletManager.generateUserWallet(newUserId);

    // Handle referral
    let referredBy = null;
    if (referralCode) {
      const referrer = await User.findOne({ referralCode });
      if (referrer) {
        referredBy = referrer.referralCode;
        
        // Create referral record
        const referral = new Referral({
          referrerId: referrer.userId,
          referredId: newUserId,
          referralCode,
          status: 'active',
          level: 1
        });
        await referral.save();
      }
    }

    // Generate referral code for new user
    const userReferralCode = User.generateReferralCode();

    // Create user
    const user = new User({
      userId: newUserId,
      email,
      password,
      firstName: firstName || '',
      lastName: lastName || '',
      address: userWallet.address,
      publicKey: userWallet.publicKey,
      privateKeyEncrypted: userWallet.privateKeyEncrypted,
      derivationPath: userWallet.derivationPath,
      referralCode: userReferralCode,
      referredBy
    });

    await user.save();

    // Generate JWT token
    const token = jwt.sign(
      { userId: user.userId, email: user.email },
      process.env.JWT_SECRET || 'your-super-secret-jwt-key-change-this-in-production',
      { expiresIn: '24h' }
    );

    res.status(201).json({ 
      message: 'Registration successful',
      token,
      user: {
        userId: user.userId,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        address: user.address,
        referralCode: user.referralCode
      }
    });
  } catch (error) {
    console.error('Registration error:', error);
    res.status(400).json({ message: error.message || 'Registration failed' });
  }
});

// OTP Verification with user creation
app.post('/api/verify-otp', async (req, res) => {
  try {
    const { userId, otp } = req.body;

    // Find temporary registration
    const tempReg = await TempRegistration.findById(userId);
    if (!tempReg) {
      return res.status(404).json({ message: 'Registration not found' });
    }

    // Verify OTP
    await tempReg.verifyCode(otp);

    // Generate user ID
    const newUserId = User.generateUserId();

    // Generate user wallet
    const userWallet = walletManager.generateUserWallet(newUserId);

    // Handle referral
    let referredBy = null;
    if (tempReg.registrationData.referralCode) {
      const referrer = await User.findOne({ referralCode: tempReg.registrationData.referralCode });
      if (referrer) {
        referredBy = referrer.referralCode;
        
        // Create referral record
        const referral = new Referral({
          referrerId: referrer.userId,
          referredId: newUserId,
          referralCode: referrer.referralCode,
          commission: 0,
          status: 'pending',
          createdAt: new Date()
        });
        await referral.save();
      }
    }

    // Create user
    const user = new User({
      userId: newUserId,
      email: tempReg.email,
      password: tempReg.registrationData.password,
      firstName: tempReg.registrationData.firstName,
      lastName: tempReg.registrationData.lastName,
      phone: tempReg.registrationData.phone,
      country: tempReg.registrationData.country,
      address: userWallet.address,
      publicKey: userWallet.publicKey,
      privateKeyEncrypted: userWallet.privateKeyEncrypted,
      derivationPath: userWallet.derivationPath,
      referralCode: User.generateReferralCode(),
      referredBy,
      isVerified: true
    });

    await user.save();

    // Generate JWT token
    const token = jwt.sign(
      { userId: user.userId, email: user.email },
      process.env.JWT_SECRET || 'your-super-secret-jwt-key-change-this-in-production',
      { expiresIn: '7d' }
    );

    // Mark temp registration as verified
    tempReg.status = 'verified';
    tempReg.verifiedAt = new Date();
    await tempReg.save();

    res.json({
      token,
      user: {
        userId: user.userId,
        email: user.email,
        referralCode: user.referralCode,
        balance: user.balance,
        isVerified: user.isVerified
      }
    });
  } catch (error) {
    console.error('OTP verification error:', error);
    res.status(400).json({ message: error.message || 'Verification failed' });
  }
});

// Login
app.post('/api/login', async (req, res) => {
  try {
    const { email, password } = req.body;

    // Check for admin credentials
    if (email === 'admin@nxchain.com' && password === 'admin123456') {
      // Create admin user if not exists
      let adminUser = await User.findOne({ email: 'admin@nxchain.com' });
      if (!adminUser) {
        const adminUserId = User.generateUserId();
        const adminWallet = walletManager.generateUserWallet(adminUserId);
        const adminReferralCode = User.generateReferralCode();
        
        adminUser = new User({
          userId: adminUserId,
          email: 'admin@nxchain.com',
          password: 'admin123456',
          firstName: 'Admin',
          lastName: 'User',
          address: adminWallet.address,
          publicKey: adminWallet.publicKey,
          privateKeyEncrypted: adminWallet.privateKeyEncrypted,
          derivationPath: adminWallet.derivationPath,
          referralCode: adminReferralCode,
          referredBy: null,
          isAdmin: true,
          isActive: true
        });
        await adminUser.save();
      }

      const token = jwt.sign(
        { userId: adminUser.userId, email: adminUser.email, isAdmin: true },
        process.env.JWT_SECRET || 'your-super-secret-jwt-key-change-this-in-production',
        { expiresIn: '24h' }
      );

      return res.status(200).json({
        message: 'Login successful',
        token,
        user: {
          userId: adminUser.userId,
          email: adminUser.email,
          firstName: adminUser.firstName,
          lastName: adminUser.lastName,
          isAdmin: true
        }
      });
    }

    const user = await User.findOne({ email, isActive: true });
    if (!user) {
      return res.status(401).json({ message: 'Invalid credentials' });
    }

    if (user.isLocked) {
      return res.status(423).json({ message: 'Account locked. Try again later.' });
    }

    const isValidPassword = await user.comparePassword(password);
    if (!isValidPassword) {
      await user.incrementLoginAttempts();
      return res.status(401).json({ message: 'Invalid credentials' });
    }

    if (user.loginAttempts > 0) {
      await user.decrementLoginAttempts();
    }

    user.lastLogin = new Date();
    await user.save();

    const token = jwt.sign(
      { userId: user.userId, email: user.email },
      process.env.JWT_SECRET || 'your-super-secret-jwt-key-change-this-in-production',
      { expiresIn: '7d' }
    );

    res.json({
      token,
      user: {
        userId: user.userId,
        email: user.email,
        referralCode: user.referralCode,
        balance: user.balance,
        totalEarnings: user.totalEarnings,
        referralEarnings: user.referralEarnings,
        withdrawableBalance: user.withdrawableBalance,
        pendingEarnings: user.pendingEarnings,
        isVerified: user.isVerified
      }
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ message: 'Login failed' });
  }
});

// Dashboard data with blockchain integration
app.get('/api/dashboard', authenticateToken, async (req, res) => {
  try {
    const user = await User.findOne({ userId: req.user.userId });
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    // Get user's on-chain balance
    const provider = new (require('ethers')).JsonRpcProvider(
      process.env.BNB_RPC_URL || 'https://bsc-dataseed1.binance.org/'
    );
    const onChainBalance = await provider.getBalance(user.address);

    // Get deposits and sweeps
    const deposits = await Deposit.findByUser(user.userId, { limit: 10 });
    const sweeps = await Sweep.findByUser(user.userId, { limit: 10 });

    // Get active stakes
    const activeStakes = await Staking.find({ 
      userId: user.userId, 
      isActive: true 
    });

    // Get transactions
    const transactions = await Transaction.find({ 
      userId: user.userId 
    }).sort({ createdAt: -1 }).limit(10);

    // Get referral stats
    const referralStats = await Referral.aggregate([
      { $match: { referrerId: user.userId } },
      {
        $group: {
          _id: '$status',
          count: { $sum: 1 },
          totalCommission: { $sum: '$commission' }
        }
      }
    ]);

    res.json({
      user: {
        userId: user.userId,
        email: user.email,
        referralCode: user.referralCode,
        balance: user.balance,
        onChainBalance: require('ethers').formatEther(onChainBalance),
        totalEarnings: user.totalEarnings,
        referralEarnings: user.referralEarnings,
        withdrawableBalance: user.withdrawableBalance,
        pendingEarnings: user.pendingEarnings,
        isVerified: user.isVerified
      },
      deposits,
      sweeps,
      activeStakes,
      transactions,
      referralStats
    });
  } catch (error) {
    console.error('Dashboard error:', error);
    res.status(500).json({ message: 'Failed to fetch dashboard data' });
  }
});

// Deposit endpoint with blockchain integration
app.post('/api/deposit', authenticateToken, async (req, res) => {
  try {
    const { amount } = req.body;
    const user = await User.findOne({ userId: req.user.userId });

    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    const depositAddress = user.address;
    const qrCodeData = `bnb:${depositAddress}?amount=${amount}`;
    const qrCode = await qrcode.toDataURL(qrCodeData);

    res.json({
      depositAddress,
      qrCode,
      minimumDeposit: 10
    });
  } catch (error) {
    console.error('Deposit error:', error);
    res.status(500).json({ message: 'Failed to generate deposit address' });
  }
});

// Staking endpoint
app.post('/api/stake', authenticateToken, async (req, res) => {
  try {
    const { package: packageType, amount } = req.body;
    const user = await User.findOne({ userId: req.user.userId });

    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    if (user.balance < amount) {
      return res.status(400).json({ message: 'Insufficient balance' });
    }

    const stakingPackages = {
      bronze: { duration: 30, dailyReturn: 0.01, totalROI: 0.30, minAmount: 50 },
      silver: { duration: 90, dailyReturn: 0.015, totalROI: 1.35, minAmount: 500 },
      gold: { duration: 365, dailyReturn: 0.02, totalROI: 7.30, minAmount: 1000 }
    };

    const stakingPackage = stakingPackages[packageType];
    if (!stakingPackage || amount < stakingPackage.minAmount) {
      return res.status(400).json({ message: 'Invalid package or insufficient amount' });
    }

    const dailyReturn = amount * stakingPackage.dailyReturn;
    const endDate = new Date(Date.now() + stakingPackage.duration * 24 * 60 * 60 * 1000);

    const stake = new Staking({
      userId: user.userId,
      package: packageType,
      amount,
      dailyReturn,
      totalDays: stakingPackage.duration,
      totalROI: stakingPackage.totalROI,
      startDate: new Date(),
      endDate,
      isActive: true,
      totalEarned: 0
    });

    await stake.save();

    // Update user balance
    user.balance -= amount;
    await user.save();

    // Create transaction record
    const transaction = new Transaction({
      userId: user.userId,
      type: 'staking',
      amount,
      status: 'confirmed',
      description: `${packageType} staking package`,
      createdAt: new Date()
    });
    await transaction.save();

    res.json({ 
      message: 'Staking successful',
      stake
    });
  } catch (error) {
    console.error('Staking error:', error);
    res.status(500).json({ message: 'Staking failed' });
  }
});

// Withdrawal endpoint
app.post('/api/withdraw', authenticateToken, async (req, res) => {
  try {
    const { amount, walletAddress, note } = req.body;
    const user = await User.findOne({ userId: req.user.userId });

    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    if (user.withdrawableBalance < amount) {
      return res.status(400).json({ message: 'Insufficient withdrawable balance' });
    }

    const transaction = new Transaction({
      userId: user.userId,
      type: 'withdrawal',
      amount,
      status: 'pending',
      description: `Withdrawal to ${walletAddress}`,
      createdAt: new Date()
    });

    await transaction.save();

    res.json({ 
      message: 'Withdrawal request submitted',
      transaction
    });
  } catch (error) {
    console.error('Withdrawal error:', error);
    res.status(500).json({ message: 'Withdrawal failed' });
  }
});

// Referral stats endpoint
app.get('/api/referral-stats', authenticateToken, async (req, res) => {
  try {
    const user = await User.findOne({ userId: req.user.userId });
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    const referrals = await Referral.find({ referrerId: user.userId })
      .populate('referredId', 'email createdAt')
      .sort({ createdAt: -1 });

    const referralCode = user.referralCode;
    const referralLink = `https://yourwebsite.com/register?ref=${referralCode}`;

    const totalReferrals = referrals.length;
    const verifiedReferrals = referrals.filter(r => r.status === 'verified').length;
    const totalCommission = referrals.reduce((sum, r) => sum + r.commission, 0);

    res.json({
      referralCode,
      referralLink,
      totalReferrals,
      verifiedReferrals,
      totalCommission,
      referrals: referrals.map(r => ({
        email: r.referredId?.email || 'Unknown',
        joinedDate: r.createdAt,
        commission: r.commission,
        status: r.status
      }))
    });
  } catch (error) {
    console.error('Referral stats error:', error);
    res.status(500).json({ message: 'Failed to fetch referral stats' });
  }
});

// Support endpoints
app.post('/api/support', authenticateToken, async (req, res) => {
  try {
    const { subject, message, category } = req.body;
    const user = await User.findOne({ userId: req.user.userId });

    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    const ticket = new Support({
      userId: user.userId,
      subject,
      message,
      category,
      status: 'open',
      createdAt: new Date()
    });

    await ticket.save();

    res.json({ 
      message: 'Support ticket created',
      ticket
    });
  } catch (error) {
    console.error('Support ticket error:', error);
    res.status(500).json({ message: 'Failed to create support ticket' });
  }
});

app.get('/api/support', authenticateToken, async (req, res) => {
  try {
    const user = await User.findOne({ userId: req.user.userId });
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    const tickets = await Support.find({ userId: user.userId })
      .sort({ createdAt: -1 });

    res.json(tickets);
  } catch (error) {
    console.error('Support tickets error:', error);
    res.status(500).json({ message: 'Failed to fetch support tickets' });
  }
});

// Health check endpoint
app.get('/api/health', (req, res) => {
  try {
    const healthData = {
      status: 'ok',
      timestamp: new Date(),
      uptime: process.uptime(),
      blockchain: {
        depositListener: depositListener ? depositListener.getStatus() : 'disabled',
        masterWallet: walletManager ? walletManager.getMasterWallet().address : 'disabled'
      }
    };
    res.json(healthData);
  } catch (error) {
    console.error('Health check error:', error);
    res.json({
      status: 'degraded',
      timestamp: new Date(),
      uptime: process.uptime(),
      error: error.message
    });
  }
});

// Global error handler
app.use((err, req, res, next) => {
  console.error('Global error:', err);
  res.status(500).json({ 
    message: 'Internal server error',
    error: process.env.NODE_ENV === 'development' ? err.message : undefined
  });
});

// 404 handler
app.use((req, res) => {
  res.status(404).json({ message: 'Route not found' });
});

app.listen(PORT, () => {
  console.log(`NXChain Server running on port ${PORT}`);
  if (walletManager) {
    console.log(`Master Wallet: ${walletManager.getMasterWallet().address}`);
  }
  if (depositListener) {
    console.log('Blockchain integration active');
  } else {
    console.log('Blockchain integration disabled');
  }
});
