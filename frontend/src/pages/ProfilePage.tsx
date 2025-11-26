import React, { useState } from 'react';
import { 
  UserIcon, 
  Cog6ToothIcon,
  KeyIcon,
  WalletIcon,
  ShieldCheckIcon,
  EnvelopeIcon,
  CalendarIcon,
  IdentificationIcon,
  ArrowRightOnRectangleIcon
} from '@heroicons/react/24/outline';

const ProfilePage: React.FC = () => {
  const [activeTab, setActiveTab] = useState('profile');
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    phone: '',
    country: '',
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  });
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');

  // Mock user data - in real app this would come from API
  const userData = {
    id: 'USR123456',
    email: 'user@example.com',
    referralCode: 'USER-982410',
    isVerified: true,
    createdAt: '2024-01-15',
    lastLogin: '2024-11-26',
    twoFactorEnabled: false,
    connectedWallets: [
      { address: '0x1234...5678', type: 'BEP-20', verified: true },
      { address: '0xabcd...efgh', type: 'ERC-20', verified: false }
    ]
  };

  const handleUpdateProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    
    try {
      // Mock API call
      await new Promise(resolve => setTimeout(resolve, 1000));
      setMessage('Profile updated successfully!');
      setTimeout(() => setMessage(''), 3000);
    } catch (error) {
      setMessage('Failed to update profile');
    } finally {
      setLoading(false);
    }
  };

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (formData.newPassword !== formData.confirmPassword) {
      setMessage('Passwords do not match');
      return;
    }

    setLoading(true);
    
    try {
      // Mock API call
      await new Promise(resolve => setTimeout(resolve, 1000));
      setMessage('Password changed successfully!');
      setFormData({ ...formData, currentPassword: '', newPassword: '', confirmPassword: '' });
      setTimeout(() => setMessage(''), 3000);
    } catch (error) {
      setMessage('Failed to change password');
    } finally {
      setLoading(false);
    }
  };

  const handleEnable2FA = async () => {
    setLoading(true);
    
    try {
      // Mock API call
      await new Promise(resolve => setTimeout(resolve, 1000));
      setMessage('2FA setup instructions sent to your email');
      setTimeout(() => setMessage(''), 3000);
    } catch (error) {
      setMessage('Failed to enable 2FA');
    } finally {
      setLoading(false);
    }
  };

  const tabs = [
    { id: 'profile', label: 'Profile', icon: UserIcon },
    { id: 'security', label: 'Security', icon: ShieldCheckIcon },
    { id: 'wallets', label: 'Wallets', icon: WalletIcon },
    { id: 'settings', label: 'Settings', icon: Cog6ToothIcon }
  ];

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div className="glass-effect rounded-xl p-6">
        <h1 className="text-2xl font-bold gradient-text mb-2">Profile Settings</h1>
        <p className="text-gray-400">
          Manage your account settings and preferences
        </p>
      </div>

      {/* User Info Card */}
      <div className="glass-effect rounded-xl p-6">
        <div className="flex items-center space-x-4">
          <div className="w-20 h-20 bg-gradient-to-r from-nx-blue to-nx-purple rounded-full flex items-center justify-center">
            <UserIcon className="w-10 h-10 text-white" />
          </div>
          <div className="flex-1">
            <h2 className="text-xl font-semibold text-white">{userData.email}</h2>
            <div className="flex items-center space-x-4 text-sm text-gray-400 mt-1">
              <span className="flex items-center space-x-1">
                <IdentificationIcon className="w-4 h-4" />
                <span>ID: {userData.id}</span>
              </span>
              <span className="flex items-center space-x-1">
                <CalendarIcon className="w-4 h-4" />
                <span>Joined: {new Date(userData.createdAt).toLocaleDateString()}</span>
              </span>
              {userData.isVerified && (
                <span className="flex items-center space-x-1 text-green-400">
                  <ShieldCheckIcon className="w-4 h-4" />
                  <span>Verified</span>
                </span>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="glass-effect rounded-xl p-2">
        <div className="flex space-x-1">
          {tabs.map((tab) => {
            const Icon = tab.icon;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex-1 flex items-center justify-center space-x-2 px-4 py-3 rounded-lg transition-colors ${
                  activeTab === tab.id
                    ? 'bg-nx-blue/20 text-nx-blue'
                    : 'text-gray-400 hover:text-white hover:bg-white/5'
                }`}
              >
                <Icon className="w-5 h-5" />
                <span className="font-medium">{tab.label}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Tab Content */}
      <div className="glass-effect rounded-xl p-6">
        {/* Profile Tab */}
        {activeTab === 'profile' && (
          <div className="space-y-6">
            <h3 className="text-lg font-semibold text-white mb-4">Personal Information</h3>
            
            {message && (
              <div className={`p-3 rounded-lg ${
                message.includes('success') 
                  ? 'bg-green-400/10 border border-green-400/20 text-green-400' 
                  : 'bg-red-400/10 border border-red-400/20 text-red-400'
              }`}>
                <p className="text-sm">{message}</p>
              </div>
            )}

            <form onSubmit={handleUpdateProfile} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    First Name
                  </label>
                  <input
                    type="text"
                    value={formData.firstName}
                    onChange={(e) => setFormData({ ...formData, firstName: e.target.value })}
                    placeholder="Enter first name"
                    className="w-full px-3 py-3 bg-white/5 border border-white/10 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-nx-blue focus:border-transparent"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    Last Name
                  </label>
                  <input
                    type="text"
                    value={formData.lastName}
                    onChange={(e) => setFormData({ ...formData, lastName: e.target.value })}
                    placeholder="Enter last name"
                    className="w-full px-3 py-3 bg-white/5 border border-white/10 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-nx-blue focus:border-transparent"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Email Address
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <EnvelopeIcon className="w-5 h-5 text-gray-400" />
                  </div>
                  <input
                    type="email"
                    value={userData.email}
                    disabled
                    className="w-full pl-10 pr-3 py-3 bg-white/5 border border-white/10 rounded-lg text-gray-400 cursor-not-allowed"
                  />
                </div>
                <p className="text-xs text-gray-400 mt-1">Email cannot be changed</p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    Phone Number
                  </label>
                  <input
                    type="tel"
                    value={formData.phone}
                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                    placeholder="+1 234 567 8900"
                    className="w-full px-3 py-3 bg-white/5 border border-white/10 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-nx-blue focus:border-transparent"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    Country
                  </label>
                  <select
                    value={formData.country}
                    onChange={(e) => setFormData({ ...formData, country: e.target.value })}
                    className="w-full px-3 py-3 bg-white/5 border border-white/10 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-nx-blue focus:border-transparent"
                  >
                    <option value="">Select country</option>
                    <option value="US">United States</option>
                    <option value="UK">United Kingdom</option>
                    <option value="CA">Canada</option>
                    <option value="AU">Australia</option>
                    <option value="Other">Other</option>
                  </select>
                </div>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full btn-primary py-3 rounded-lg font-medium disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? 'Updating...' : 'Update Profile'}
              </button>
            </form>
          </div>
        )}

        {/* Security Tab */}
        {activeTab === 'security' && (
          <div className="space-y-6">
            <h3 className="text-lg font-semibold text-white mb-4">Security Settings</h3>
            
            {message && (
              <div className={`p-3 rounded-lg ${
                message.includes('success') 
                  ? 'bg-green-400/10 border border-green-400/20 text-green-400' 
                  : 'bg-red-400/10 border border-red-400/20 text-red-400'
              }`}>
                <p className="text-sm">{message}</p>
              </div>
            )}

            {/* Change Password */}
            <div className="border-b border-white/10 pb-6">
              <h4 className="text-white font-medium mb-4 flex items-center">
                <KeyIcon className="w-5 h-5 mr-2 text-nx-blue" />
                Change Password
              </h4>
              
              <form onSubmit={handleChangePassword} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    Current Password
                  </label>
                  <input
                    type="password"
                    value={formData.currentPassword}
                    onChange={(e) => setFormData({ ...formData, currentPassword: e.target.value })}
                    placeholder="Enter current password"
                    className="w-full px-3 py-3 bg-white/5 border border-white/10 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-nx-blue focus:border-transparent"
                  />
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">
                      New Password
                    </label>
                    <input
                      type="password"
                      value={formData.newPassword}
                      onChange={(e) => setFormData({ ...formData, newPassword: e.target.value })}
                      placeholder="Enter new password"
                      className="w-full px-3 py-3 bg-white/5 border border-white/10 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-nx-blue focus:border-transparent"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">
                      Confirm New Password
                    </label>
                    <input
                      type="password"
                      value={formData.confirmPassword}
                      onChange={(e) => setFormData({ ...formData, confirmPassword: e.target.value })}
                      placeholder="Confirm new password"
                      className="w-full px-3 py-3 bg-white/5 border border-white/10 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-nx-blue focus:border-transparent"
                    />
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className="btn-primary py-2 px-6 rounded-lg font-medium disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {loading ? 'Changing...' : 'Change Password'}
                </button>
              </form>
            </div>

            {/* 2FA */}
            <div>
              <h4 className="text-white font-medium mb-4 flex items-center">
                <ShieldCheckIcon className="w-5 h-5 mr-2 text-nx-blue" />
                Two-Factor Authentication
              </h4>
              
              <div className="bg-white/5 rounded-lg p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-white font-medium">2FA Status</p>
                    <p className="text-gray-400 text-sm">
                      {userData.twoFactorEnabled 
                        ? 'Two-factor authentication is enabled' 
                        : 'Add an extra layer of security to your account'
                      }
                    </p>
                  </div>
                  <button
                    onClick={handleEnable2FA}
                    disabled={loading || userData.twoFactorEnabled}
                    className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                      userData.twoFactorEnabled
                        ? 'bg-green-400/20 text-green-400 cursor-not-allowed'
                        : 'btn-primary disabled:opacity-50 disabled:cursor-not-allowed'
                    }`}
                  >
                    {userData.twoFactorEnabled ? 'Enabled' : loading ? 'Enabling...' : 'Enable 2FA'}
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Wallets Tab */}
        {activeTab === 'wallets' && (
          <div className="space-y-6">
            <h3 className="text-lg font-semibold text-white mb-4">Connected Wallets</h3>
            
            <div className="space-y-4">
              {userData.connectedWallets.map((wallet, index) => (
                <div key={index} className="bg-white/5 rounded-lg p-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                      <div className="w-10 h-10 bg-gradient-to-r from-nx-blue to-nx-purple rounded-lg flex items-center justify-center">
                        <WalletIcon className="w-5 h-5 text-white" />
                      </div>
                      <div>
                        <p className="text-white font-medium">{wallet.address}</p>
                        <p className="text-sm text-gray-400">{wallet.type}</p>
                      </div>
                    </div>
                    <div className="flex items-center space-x-2">
                      {wallet.verified ? (
                        <span className="flex items-center space-x-1 text-green-400 text-sm">
                          <ShieldCheckIcon className="w-4 h-4" />
                          <span>Verified</span>
                        </span>
                      ) : (
                        <span className="text-yellow-400 text-sm">Pending</span>
                      )}
                      <button className="text-red-400 hover:text-red-300 text-sm">
                        Disconnect
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            <button className="w-full btn-secondary py-3 rounded-lg font-medium">
              Add New Wallet
            </button>
          </div>
        )}

        {/* Settings Tab */}
        {activeTab === 'settings' && (
          <div className="space-y-6">
            <h3 className="text-lg font-semibold text-white mb-4">Account Settings</h3>
            
            <div className="space-y-4">
              <div className="flex items-center justify-between p-4 bg-white/5 rounded-lg">
                <div>
                  <p className="text-white font-medium">Email Notifications</p>
                  <p className="text-gray-400 text-sm">Receive email updates about your account</p>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input type="checkbox" className="sr-only peer" defaultChecked />
                  <div className="w-11 h-6 bg-gray-700 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-nx-blue"></div>
                </label>
              </div>

              <div className="flex items-center justify-between p-4 bg-white/5 rounded-lg">
                <div>
                  <p className="text-white font-medium">SMS Notifications</p>
                  <p className="text-gray-400 text-sm">Receive SMS alerts for important updates</p>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input type="checkbox" className="sr-only peer" />
                  <div className="w-11 h-6 bg-gray-700 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-nx-blue"></div>
                </label>
              </div>

              <div className="flex items-center justify-between p-4 bg-white/5 rounded-lg">
                <div>
                  <p className="text-white font-medium">Dark Mode</p>
                  <p className="text-gray-400 text-sm">Use dark theme across the platform</p>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input type="checkbox" className="sr-only peer" defaultChecked />
                  <div className="w-11 h-6 bg-gray-700 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-nx-blue"></div>
                </label>
              </div>
            </div>

            <div className="border-t border-white/10 pt-6">
              <h4 className="text-white font-medium mb-4">Danger Zone</h4>
              <div className="space-y-4">
                <button className="w-full btn-secondary py-3 rounded-lg font-medium text-red-400 border-red-400/20 hover:bg-red-400/10">
                  Delete Account
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default ProfilePage;
