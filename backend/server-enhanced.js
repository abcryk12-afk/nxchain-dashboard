const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const nodemailer = require('nodemailer');
const qrcode = require('qrcode');
const crypto = require('crypto');

// Import routes
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

// API Server - Lightweight (No blockchain components)
// Blockchain operations moved to separate workers
console.log('🚀 NXChain API Server starting (lightweight mode)...');
console.log('📡 Blockchain scanner and sweep worker should run as separate processes');

// Simple wallet generation for registration (moved from WalletManager)
const { ethers } = require('ethers');

function generateUserWallet(userId) {
  try {
    const masterSeedPhrase = process.env.MASTER_SEED_PHRASE || 'danger attack gesture cliff clap stage tag spare loop cousin either put';
    
    // Convert userId to unique numeric index using hash
    let hash = 0;
    for (let i = 0; i < userId.length; i++) {
      const char = userId.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash; // Convert to 32-bit integer
    }
    const userIndex = Math.abs(hash) % 1000000000; // Ensure positive and within reasonable range
    const derivationPath = `m/44'/60'/0'/0/${userIndex}`;
    
    // Create wallet directly from seed phrase with derivation path
    const userWalletNode = ethers.HDNodeWallet.fromPhrase(masterSeedPhrase, derivationPath);
    
    return {
      userId,
      address: userWalletNode.address,
      publicKey: userWalletNode.publicKey,
      privateKey: userWalletNode.privateKey,
      privateKeyEncrypted: userWalletNode.privateKey, // Simplified for now
      derivationPath,
      created_at: new Date()
    };
  } catch (error) {
    console.error('Failed to generate user wallet:', error);
    throw error;
  }
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
// Blockchain monitoring moved to separate workers
// depositListener.startListening() - REMOVED
// tokenContracts.forEach() - REMOVED

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

// Registration with wallet generation - MANDATORY REFERRAL VALIDATION
app.post('/api/register', async (req, res) => {
  try {
    console.log('🔥 REGISTER ENDPOINT CALLED - MANDATORY REFERRAL VALIDATION');
    const { email, password, firstName, lastName, referralCode } = req.body;

    // Check if user already exists
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({ message: 'User already exists' });
    }

    // MANDATORY REFERRAL CODE VALIDATION
    if (!referralCode || referralCode.trim() === '') {
      return res.status(400).json({ message: 'Referral code is required.' });
    }

    console.log('🔥 VALIDATING REFERRAL CODE:', referralCode.trim());
    
    // Find sponsor by referral code
    const sponsor = await User.findOne({ referralCode: referralCode.trim() });
    if (!sponsor) {
      return res.status(400).json({ message: 'Invalid referral code.' });
    }

    console.log('🔥 SPONSOR FOUND:', sponsor.email, 'userId:', sponsor.userId);

    // Generate user ID
    const newUserId = User.generateUserId();

    // Generate user wallet
    const userWallet = generateUserWallet(newUserId);

    // Generate referral code for new user
    const userReferralCode = User.generateReferralCode();
    console.log('🔥 NEW USER REFERRAL CODE GENERATED:', userReferralCode);

    // Hash password and generate salt manually
    const crypto = require('crypto');
    const salt = crypto.randomBytes(16).toString('hex');
    const hashedPassword = crypto.pbkdf2Sync(password, salt, 10000, 64, 'sha512').toString('hex');

    // Create user with sponsor linking
    const user = new User({
      userId: newUserId,
      email,
      password: hashedPassword,
      salt: salt,
      firstName: firstName || '',
      lastName: lastName || '',
      address: userWallet.address,
      publicKey: userWallet.publicKey,
      privateKeyEncrypted: userWallet.privateKeyEncrypted,
      derivationPath: userWallet.derivationPath,
      referralCode: userReferralCode,
      sponsorId: sponsor.userId, // Link to sponsor's userId
      referredBy: sponsor.referralCode // Keep for compatibility
    });

    console.log('🔥 SAVING USER WITH SPONSOR LINKING...');
    await user.save();
    console.log('🔥 USER SAVED SUCCESSFULLY!');

    // Create referral record immediately after user save
    try {
      console.log('🔥 CREATING REFERRAL RECORD...');
      const referral = new Referral({
        referrer: sponsor._id, // Use sponsor's MongoDB _id
        referred: user._id,     // Use new user's MongoDB _id
        referralCode: referralCode.trim(),
        status: 'active',
        level: 1
      });
      
      await referral.save();
      console.log('🔥 REFERRAL RECORD CREATED SUCCESSFULLY!');
    } catch (referralError) {
      console.error('🔥 REFERRAL CREATION ERROR:', referralError);
      // Continue even if referral creation fails - user is already created
    }

    // Generate JWT token
    const token = jwt.sign(
      { userId: user.userId, email: user.email },
      process.env.JWT_SECRET || 'your-super-secret-jwt-key-change-this-in-production',
      { expiresIn: '24h' }
    );

    console.log('🔥 REGISTRATION COMPLETED SUCCESSFULLY!');
    console.log('🔥 USER:', user.email);
    console.log('🔥 SPONSOR:', sponsor.email);
    console.log('🔥 USER REFERRAL CODE:', userReferralCode);

    res.status(201).json({ 
      message: 'Registration successful',
      token,
      user: {
        userId: user.userId,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        address: user.address,
        referralCode: user.referralCode,
        sponsorId: user.sponsorId,
        balance: user.balance,
        totalEarnings: user.totalEarnings,
        referralEarnings: user.referralEarnings,
        withdrawableBalance: user.withdrawableBalance,
        pendingEarnings: user.pendingEarnings,
        isVerified: user.isVerified
      }
    });
  } catch (error) {
    console.error('🔥 REGISTRATION ERROR:', error);
    console.error('🔥 ERROR STACK:', error.stack);
    res.status(500).json({ message: 'Registration failed: ' + error.message });
  }
});

// OTP Verification with user creation - MANDATORY REFERRAL VALIDATION
app.post('/api/verify-otp', async (req, res) => {
  try {
    console.log('🔥 VERIFICATION ENDPOINT CALLED - MANDATORY REFERRAL VALIDATION');
    const { userId, otp } = req.body;

    // Find temporary registration
    const tempReg = await TempRegistration.findById(userId);
    if (!tempReg) {
      return res.status(404).json({ message: 'Registration not found' });
    }

    // Verify OTP
    await tempReg.verifyCode(otp);

    // MANDATORY REFERRAL CODE VALIDATION
    const referralCode = tempReg.registrationData.referralCode;
    if (!referralCode || referralCode.trim() === '') {
      return res.status(400).json({ message: 'Referral code is required.' });
    }

    console.log('🔥 VERIFICATION - VALIDATING REFERRAL CODE:', referralCode.trim());
    
    // Find sponsor by referral code
    const sponsor = await User.findOne({ referralCode: referralCode.trim() });
    if (!sponsor) {
      return res.status(400).json({ message: 'Invalid referral code.' });
    }

    console.log('🔥 VERIFICATION - SPONSOR FOUND:', sponsor.email, 'userId:', sponsor.userId);

    // Generate user ID
    const newUserId = User.generateUserId();

    // Generate user wallet
    const userWallet = generateUserWallet(newUserId);

    // Generate referral code for new user
    const userReferralCode = User.generateReferralCode();
    console.log('🔥 VERIFICATION - NEW USER REFERRAL CODE GENERATED:', userReferralCode);

    // Create user with sponsor linking
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
      referralCode: userReferralCode,
      sponsorId: sponsor.userId, // Link to sponsor's userId
      referredBy: sponsor.referralCode, // Keep for compatibility
      isVerified: true
    });

    console.log('🔥 VERIFICATION - SAVING USER WITH SPONSOR LINKING...');
    await user.save();
    console.log('🔥 VERIFICATION - USER SAVED SUCCESSFULLY!');

    // Create referral record immediately after user save
    try {
      console.log('🔥 VERIFICATION - CREATING REFERRAL RECORD...');
      const referral = new Referral({
        referrer: sponsor._id, // Use sponsor's MongoDB _id
        referred: user._id,     // Use new user's MongoDB _id
        referralCode: referralCode.trim(),
        commission: 0,
        status: 'active', // Active since user is verified
        createdAt: new Date()
      });
      
      await referral.save();
      console.log('🔥 VERIFICATION - REFERRAL RECORD CREATED SUCCESSFULLY!');
    } catch (referralError) {
      console.error('🔥 VERIFICATION - REFERRAL CREATION ERROR:', referralError);
      // Continue even if referral creation fails - user is already created
    }

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

    console.log('🔥 VERIFICATION COMPLETED SUCCESSFULLY!');
    console.log('🔥 USER:', user.email);
    console.log('🔥 SPONSOR:', sponsor.email);
    console.log('🔥 USER REFERRAL CODE:', userReferralCode);

    res.json({
      message: 'OTP verified and registration successful',
      token,
      user: {
        userId: user.userId,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        referralCode: user.referralCode,
        sponsorId: user.sponsorId,
        balance: user.balance,
        totalEarnings: user.totalEarnings,
        referralEarnings: user.referralEarnings,
        withdrawableBalance: user.withdrawableBalance,
        pendingEarnings: user.pendingEarnings,
        isVerified: user.isVerified
      }
    });
  } catch (error) {
    console.error('🔥 VERIFICATION ERROR:', error);
    console.error('🔥 ERROR STACK:', error.stack);
    res.status(500).json({ message: 'OTP verification failed: ' + error.message });
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
        const adminWallet = generateUserWallet(adminUserId);
        const adminReferralCode = User.generateReferralCode();
        
        // Hash admin password manually
        const crypto = require('crypto');
        const adminSalt = crypto.randomBytes(16).toString('hex');
        const hashedAdminPassword = crypto.pbkdf2Sync('admin123456', adminSalt, 10000, 64, 'sha512').toString('hex');
        
        adminUser = new User({
          userId: adminUserId,
          email: 'admin@nxchain.com',
          password: hashedAdminPassword,
          salt: adminSalt,
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

    // Get referral stats - PROPERLY IMPLEMENTED
    const referralStats = await Referral.aggregate([
      { $match: { referrer: user._id } },
      {
        $group: {
          _id: '$status',
          count: { $sum: 1 },
          totalCommission: { $sum: '$commission' }
        }
      }
    ]);

    console.log('🔥 DASHBOARD REFERRAL STATS:', referralStats);

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

// Referral stats endpoint - COMPREHENSIVE DEBUGGING
app.get('/api/referral-stats', authenticateToken, async (req, res) => {
  try {
    console.log('🔥 REFERRAL STATS REQUEST FOR USER:', req.user.userId);
    
    const user = await User.findOne({ userId: req.user.userId });
    if (!user) {
      console.log('🔥 USER NOT FOUND:', req.user.userId);
      return res.status(404).json({ message: 'User not found' });
    }

    console.log('🔥 USER FOUND:', user.email);
    console.log('🔥 USER MONGODB _ID:', user._id);
    console.log('🔥 USER REFERRAL CODE:', user.referralCode);
    console.log('🔥 USER SPONSOR ID:', user.sponsorId);

    // DEBUG: Check all referrals in database
    const allReferrals = await Referral.find({});
    console.log('🔥 TOTAL REFERRALS IN DATABASE:', allReferrals.length);
    
    // DEBUG: Check if user is a referrer in any referral
    const userAsReferrer = await Referral.find({ referrer: user._id });
    console.log('🔥 REFERRALS WHERE USER IS REFERRER:', userAsReferrer.length);
    
    // DEBUG: Check referral details
    userAsReferrer.forEach((referral, index) => {
      console.log(`🔥 REFERRAL ${index + 1}:`, {
        id: referral._id,
        referrer: referral.referrer,
        referred: referral.referred,
        referralCode: referral.referralCode,
        status: referral.status
      });
    });

    // Find referrals where this user is the referrer (using MongoDB _id)
    const referrals = await Referral.find({ referrer: user._id })
      .populate('referred', 'email createdAt isVerified')
      .sort({ createdAt: -1 });

    console.log('🔥 FINAL REFERRALS FOUND:', referrals.length);

    const referralCode = user.referralCode;
    const referralLink = `https://nxchain-frontend.onrender.com/register?ref=${referralCode}`;

    const totalReferrals = referrals.length;
    const verifiedReferrals = referrals.filter(r => r.referred && r.referred.isVerified).length;
    const totalCommission = referrals.reduce((sum, r) => sum + (r.commission || 0), 0);

    console.log('🔥 REFERRAL STATS:', {
      totalReferrals,
      verifiedReferrals,
      totalCommission
    });

    // DEBUG: Log final response data
    const responseData = {
      referralCode,
      referralLink,
      sponsorId: user.sponsorId,
      totalReferrals,
      verifiedReferrals,
      totalCommission,
      referrals: referrals.map(r => ({
        email: r.referred?.email || 'Unknown',
        joinedDate: r.createdAt,
        commission: r.commission || 0,
        status: r.referred?.isVerified ? 'Verified' : 'Pending'
      }))
    };
    
    console.log('🔥 SENDING RESPONSE:', responseData);

    res.json(responseData);
  } catch (error) {
    console.error('🔥 REFERRAL STATS ERROR:', error);
    console.error('🔥 ERROR STACK:', error.stack);
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
      server: 'API Server (Lightweight)',
      blockchain: {
        scanner: 'separate_process',
        sweepWorker: 'separate_process',
        note: 'Blockchain operations moved to separate workers'
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
  console.log(`🚀 NXChain API Server running on port ${PORT}`);
  console.log('📡 Lightweight mode - Blockchain operations in separate workers');
  console.log('🔗 To start scanner: node workers/depositScanner.js');
  console.log('🔗 To start sweep worker: node workers/sweepWorker.js');
  console.log('🌐 API ready for user requests');
});
