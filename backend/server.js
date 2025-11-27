const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const nodemailer = require('nodemailer');
const QRCode = require('qrcode');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors());
app.use(express.json());

// MongoDB Connection
mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/nxchain', {
    useNewUrlParser: true,
    useUnifiedTopology: true,
});

// User Schema
const userSchema = new mongoose.Schema({
    email: { type: String, required: true, unique: true },
    password: { type: String, required: true },
    referralCode: { type: String, required: true, unique: true },
    referredBy: { type: String, default: null },
    isVerified: { type: Boolean, default: false },
    otp: { type: String, default: null },
    otpExpires: { type: Date, default: null },
    balance: { type: Number, default: 0 },
    totalEarnings: { type: Number, default: 0 },
    referralEarnings: { type: Number, default: 0 },
    withdrawableBalance: { type: Number, default: 0 },
    pendingEarnings: { type: Number, default: 0 },
    createdAt: { type: Date, default: Date.now }
});

// Transaction Schema
const transactionSchema = new mongoose.Schema({
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    type: { type: String, enum: ['deposit', 'withdrawal', 'staking', 'referral'], required: true },
    amount: { type: Number, required: true },
    status: { type: String, enum: ['pending', 'confirmed', 'rejected'], default: 'pending' },
    description: { type: String },
    createdAt: { type: Date, default: Date.now }
});

// Staking Schema
const stakingSchema = new mongoose.Schema({
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    package: { type: String, enum: ['bronze', 'silver', 'gold'], required: true },
    amount: { type: Number, required: true },
    dailyReturn: { type: Number, required: true },
    totalDays: { type: Number, required: true },
    totalROI: { type: Number, required: true },
    startDate: { type: Date, default: Date.now },
    endDate: { type: Date },
    isActive: { type: Boolean, default: true },
    totalEarned: { type: Number, default: 0 }
});

// Support Ticket Schema
const supportSchema = new mongoose.Schema({
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    subject: { type: String, required: true },
    message: { type: String, required: true },
    status: { type: String, enum: ['open', 'in_progress', 'resolved'], default: 'open' },
    response: { type: String, default: null },
    createdAt: { type: Date, default: Date.now },
    updatedAt: { type: Date, default: Date.now }
});

// Referral Schema
const referralSchema = new mongoose.Schema({
    referrer: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    referred: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    level: { type: Number, default: 1 },
    commission: { type: Number, default: 0 },
    createdAt: { type: Date, default: Date.now }
});

const User = mongoose.model('User', userSchema);
const Transaction = mongoose.model('Transaction', transactionSchema);
const Staking = mongoose.model('Staking', stakingSchema);
const Support = mongoose.model('Support', supportSchema);
const Referral = mongoose.model('Referral', referralSchema);

// Generate unique referral code
function generateReferralCode() {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
    let code = '';
    for (let i = 0; i < 8; i++) {
        code += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return code;
}

// Email transporter
const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS
    }
});

// Send OTP email
async function sendOTPEmail(email, otp) {
    const mailOptions = {
        from: process.env.EMAIL_USER,
        to: email,
        subject: 'NXChain - Email Verification',
        html: `
            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
                <h2 style="color: #00d4ff;">NXChain Email Verification</h2>
                <p>Your verification code is:</p>
                <div style="background: #f0f0f0; padding: 20px; text-align: center; font-size: 24px; font-weight: bold; margin: 20px 0;">
                    ${otp}
                </div>
                <p>This code will expire in 10 minutes.</p>
                <p style="color: #666;">If you didn't request this code, please ignore this email.</p>
            </div>
        `
    };

    await transporter.sendMail(mailOptions);
}

// Middleware to verify JWT
const verifyToken = (req, res, next) => {
    const token = req.header('Authorization')?.replace('Bearer ', '');
    
    if (!token) {
        return res.status(401).json({ message: 'Access denied. No token provided.' });
    }

    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET || 'your-secret-key');
        req.user = decoded;
        next();
    } catch (error) {
        res.status(401).json({ message: 'Invalid token.' });
    }
};

// Routes

// Register
app.post('/api/register', async (req, res) => {
    try {
        const { email, password, referralCode } = req.body;

        // Check if user already exists
        const existingUser = await User.findOne({ email });
        if (existingUser) {
            return res.status(400).json({ message: 'User already exists' });
        }

        // Generate referral code for new user
        const userReferralCode = generateReferralCode();

        // Hash password
        const hashedPassword = await bcrypt.hash(password, 10);

        // Create user
        const user = new User({
            email,
            password: hashedPassword,
            referralCode: userReferralCode,
            referredBy: referralCode || null
        });

        await user.save();

        // Generate OTP
        const otp = Math.floor(100000 + Math.random() * 900000).toString();
        user.otp = otp;
        user.otpExpires = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes
        await user.save();

        // Send OTP email
        await sendOTPEmail(email, otp);

        // Create referral record if referred
        if (referralCode) {
            const referrer = await User.findOne({ referralCode });
            if (referrer) {
                const referral = new Referral({
                    referrer: referrer._id,
                    referred: user._id,
                    level: 1
                });
                await referral.save();
            }
        }

        res.status(201).json({ 
            message: 'Registration successful. Please check your email for verification code.',
            userId: user._id
        });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

// Verify OTP
app.post('/api/verify-otp', async (req, res) => {
    try {
        const { userId, otp } = req.body;

        const user = await User.findById(userId);
        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }

        if (user.otp !== otp || user.otpExpires < Date.now()) {
            return res.status(400).json({ message: 'Invalid or expired OTP' });
        }

        user.isVerified = true;
        user.otp = null;
        user.otpExpires = null;
        await user.save();

        // Generate JWT token
        const token = jwt.sign(
            { userId: user._id, email: user.email },
            process.env.JWT_SECRET || 'your-secret-key',
            { expiresIn: '7d' }
        );

        res.json({ 
            message: 'Email verified successfully',
            token,
            user: {
                id: user._id,
                email: user.email,
                referralCode: user.referralCode,
                balance: user.balance,
                totalEarnings: user.totalEarnings,
                referralEarnings: user.referralEarnings,
                withdrawableBalance: user.withdrawableBalance,
                pendingEarnings: user.pendingEarnings
            }
        });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

// Login
app.post('/api/login', async (req, res) => {
    try {
        const { email, password } = req.body;

        const user = await User.findOne({ email });
        if (!user) {
            return res.status(400).json({ message: 'Invalid credentials' });
        }

        const isMatch = await bcrypt.compare(password, user.password);
        if (!isMatch) {
            return res.status(400).json({ message: 'Invalid credentials' });
        }

        if (!user.isVerified) {
            return res.status(400).json({ message: 'Please verify your email first' });
        }

        const token = jwt.sign(
            { userId: user._id, email: user.email },
            process.env.JWT_SECRET || 'your-secret-key',
            { expiresIn: '7d' }
        );

        res.json({
            token,
            user: {
                id: user._id,
                email: user.email,
                referralCode: user.referralCode,
                balance: user.balance,
                totalEarnings: user.totalEarnings,
                referralEarnings: user.referralEarnings,
                withdrawableBalance: user.withdrawableBalance,
                pendingEarnings: user.pendingEarnings
            }
        });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

// Get user dashboard data
app.get('/api/dashboard', verifyToken, async (req, res) => {
    try {
        const user = await User.findById(req.user.userId);
        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }

        // Get recent transactions
        const transactions = await Transaction.find({ userId: user._id })
            .sort({ createdAt: -1 })
            .limit(10);

        // Get active stakes
        const activeStakes = await Staking.find({ userId: user._id, isActive: true });

        // Get referrals
        const referrals = await Referral.find({ referrer: user._id })
            .populate('referred', 'email createdAt')
            .sort({ createdAt: -1 });

        res.json({
            user: {
                id: user._id,
                email: user.email,
                referralCode: user.referralCode,
                balance: user.balance,
                totalEarnings: user.totalEarnings,
                referralEarnings: user.referralEarnings,
                withdrawableBalance: user.withdrawableBalance,
                pendingEarnings: user.pendingEarnings
            },
            transactions,
            activeStakes,
            referrals
        });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

// Generate deposit address and QR code
app.post('/api/deposit', verifyToken, async (req, res) => {
    try {
        const { amount } = req.body;
        
        // Generate USDT BEP20 deposit address (in production, this would come from your wallet service)
        const depositAddress = '0x3934ae202f24a29464f1f7f572a8681a4c6cdb97'; // Example address
        
        // Generate QR code
        const qrCodeData = `usdt:${depositAddress}?amount=${amount}`;
        const qrCodeDataURL = await QRCode.toDataURL(qrCodeData);

        res.json({
            depositAddress,
            qrCode: qrCodeDataURL,
            minimumDeposit: 10
        });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

// Create stake
app.post('/api/stake', verifyToken, async (req, res) => {
    try {
        const { package: packageName, amount } = req.body;
        
        const user = await User.findById(req.user.userId);
        if (user.balance < amount) {
            return res.status(400).json({ message: 'Insufficient balance' });
        }

        // Define staking packages
        const packages = {
            bronze: { days: 30, dailyRate: 0.01, totalROI: 0.30 },
            silver: { days: 90, dailyRate: 0.015, totalROI: 1.35 },
            gold: { days: 365, dailyRate: 0.02, totalROI: 7.30 }
        };

        const selectedPackage = packages[packageName];
        if (!selectedPackage) {
            return res.status(400).json({ message: 'Invalid package' });
        }

        const dailyReturn = amount * selectedPackage.dailyRate;
        const endDate = new Date(Date.now() + selectedPackage.days * 24 * 60 * 60 * 1000);

        // Create stake
        const stake = new Staking({
            userId: user._id,
            package: packageName,
            amount,
            dailyReturn,
            totalDays: selectedPackage.days,
            totalROI: selectedPackage.totalROI,
            endDate
        });

        await stake.save();

        // Deduct from user balance
        user.balance -= amount;
        await user.save();

        // Create transaction record
        const transaction = new Transaction({
            userId: user._id,
            type: 'staking',
            amount,
            status: 'confirmed',
            description: `${packageName} package staking`
        });
        await transaction.save();

        res.json({
            message: 'Staking successful',
            stake
        });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

// Withdraw
app.post('/api/withdraw', verifyToken, async (req, res) => {
    try {
        const { amount, walletAddress, note } = req.body;
        
        const user = await User.findById(req.user.userId);
        if (user.withdrawableBalance < amount) {
            return res.status(400).json({ message: 'Insufficient withdrawable balance' });
        }

        // Create withdrawal transaction
        const transaction = new Transaction({
            userId: user._id,
            type: 'withdrawal',
            amount,
            status: 'pending',
            description: note || 'Withdrawal to ' + walletAddress
        });

        await transaction.save();

        // Update user balance (will be updated when withdrawal is approved)
        user.pendingEarnings += amount;
        user.withdrawableBalance -= amount;
        await user.save();

        res.json({
            message: 'Withdrawal request submitted successfully',
            transaction
        });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

// Get referral statistics
app.get('/api/referral-stats', verifyToken, async (req, res) => {
    try {
        const user = await User.findById(req.user.userId);
        
        const referrals = await Referral.find({ referrer: user._id })
            .populate('referred', 'email createdAt isVerified')
            .sort({ createdAt: -1 });

        // Calculate statistics
        const totalReferrals = referrals.length;
        const verifiedReferrals = referrals.filter(r => r.referred.isVerified).length;
        const totalCommission = referrals.reduce((sum, r) => sum + (r.commission || 0), 0);

        res.json({
            referralCode: user.referralCode,
            referralLink: `https://yourwebsite.com/register?ref=${user.referralCode}`,
            totalReferrals,
            verifiedReferrals,
            totalCommission,
            referrals: referrals.map(r => ({
                email: r.referred.email,
                joinedDate: r.referred.createdAt,
                commission: r.commission || 0,
                status: r.referred.isVerified ? 'Verified' : 'Pending'
            }))
        });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

// Support ticket
app.post('/api/support', verifyToken, async (req, res) => {
    try {
        const { subject, message } = req.body;
        
        const ticket = new Support({
            userId: req.user.userId,
            subject,
            message
        });

        await ticket.save();

        res.json({
            message: 'Support ticket created successfully',
            ticket
        });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

// Get support tickets
app.get('/api/support', verifyToken, async (req, res) => {
    try {
        const tickets = await Support.find({ userId: req.user.userId })
            .sort({ createdAt: -1 });

        res.json(tickets);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});
