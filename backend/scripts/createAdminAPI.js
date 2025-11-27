const axios = require('axios');

async function createAdminViaAPI() {
  try {
    console.log('🔥 Creating admin user via API...');

    // Register admin user
    const registerData = {
      email: 'admin@nxchain.com',
      password: 'admin123456',
      firstName: 'System',
      lastName: 'Administrator',
      referralCode: 'ADMIN-REFERRAL' // This will need to exist or be handled
    };

    // First, try to register
    try {
      const response = await axios.post('https://nxchain-dashboard.onrender.com/api/register', registerData);
      console.log('✅ Admin registered successfully!');
      console.log('📧 Email: admin@nxchain.com');
      console.log('🔑 Password: admin123456');
      console.log('🎯 Now need to manually set isAdmin=true in database');
    } catch (error) {
      if (error.response?.status === 400 && error.response?.data?.message === 'User already exists') {
        console.log('🔥 Admin user already exists!');
        console.log('📧 Email: admin@nxchain.com');
        console.log('🔑 Password: admin123456');
      } else {
        console.log('❌ Registration error:', error.response?.data || error.message);
      }
    }

    console.log('🎯 LOGIN CREDENTIALS:');
    console.log('📧 Email: admin@nxchain.com');
    console.log('🔑 Password: admin123456');
    console.log('🌐 Login URL: https://nxchain-frontend.onrender.com/login');
    console.log('🎯 Admin Panel: https://nxchain-frontend.onrender.com/admin/wallet-management');

  } catch (error) {
    console.error('❌ Error:', error.message);
  }
}

createAdminViaAPI();
