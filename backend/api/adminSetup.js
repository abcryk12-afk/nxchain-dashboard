const express = require('express');
const bcrypt = require('bcryptjs');
const User = require('../models/User');

const router = express.Router();

// Emergency admin creation endpoint
router.post('/create-admin', async (req, res) => {
  try {
    console.log('🔥 Emergency admin creation...');

    // Check if admin already exists
    let admin = await User.findOne({ email: 'admin@nxchain.com' });
    
    if (admin) {
      // Update existing user to admin
      admin.isAdmin = true;
      admin.isVerified = true;
      admin.isActive = true;
      await admin.save();
      console.log('✅ Existing user promoted to admin!');
    } else {
      // Create new admin
      const hashedPassword = await bcrypt.hash('admin123456', 10);
      
      admin = new User({
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
        isAdmin: true,
        isVerified: true,
        isActive: true,
        walletGenerated: true
      });

      await admin.save();
      console.log('✅ New admin created!');
    }

    res.json({
      success: true,
      message: 'Admin user created/updated successfully!',
      credentials: {
        email: 'admin@nxchain.com',
        password: 'admin123456'
      }
    });

  } catch (error) {
    console.error('❌ Admin creation error:', error);
    res.status(500).json({ message: 'Failed to create admin' });
  }
});

module.exports = router;
