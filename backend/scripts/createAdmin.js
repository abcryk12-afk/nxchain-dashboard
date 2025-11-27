const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const User = require('../models/User');

// MongoDB connection
mongoose.connect(process.env.MONGODB_URI || 'mongodb+srv://musmanasir673:Musman12345@cluster0.jzxfx.mongodb.net/nxchain?retryWrites=true&w=majority&appName=Cluster0')
  .then(() => console.log('🔥 Connected to MongoDB'))
  .catch(err => console.error('❌ MongoDB connection error:', err));

async function createAdmin() {
  try {
    console.log('🔥 Creating admin user...');

    // Check if admin already exists
    const existingAdmin = await User.findOne({ email: 'admin@nxchain.com' });
    if (existingAdmin) {
      console.log('🔥 Admin user already exists!');
      console.log('📧 Email: admin@nxchain.com');
      console.log('🔑 Password: admin123456');
      return;
    }

    // Create admin user
    const hashedPassword = await bcrypt.hash('admin123456', 10);
    
    const admin = new User({
      userId: 'ADMIN-001',
      email: 'admin@nxchain.com',
      password: hashedPassword,
      firstName: 'System',
      lastName: 'Administrator',
      phone: '+1234567890',
      country: 'Pakistan',
      address: '0x0000000000000000000000000000000000000000',
      publicKey: '0x000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000',
      privateKeyEncrypted: 'encrypted_admin_private_key',
      derivationPath: 'admin/derivation/path',
      referralCode: 'ADMIN-REFERRAL',
      sponsorId: null,
      isAdmin: true, // This makes user an admin
      isVerified: true,
      isActive: true,
      walletGenerated: true
    });

    await admin.save();
    console.log('✅ Admin user created successfully!');
    console.log('📧 Email: admin@nxchain.com');
    console.log('🔑 Password: admin123456');
    console.log('🎯 Go to: https://nxchain-frontend.onrender.com/admin/wallet-management');

  } catch (error) {
    console.error('❌ Error creating admin:', error);
  } finally {
    mongoose.connection.close();
  }
}

createAdmin();
