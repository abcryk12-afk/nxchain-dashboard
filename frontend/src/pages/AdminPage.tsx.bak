import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { 
  Cog6ToothIcon,
  WalletIcon,
  UserGroupIcon,
  ArrowTrendingUpIcon,
  ChatBubbleLeftRightIcon,
  ClockIcon,
  CheckCircleIcon,
  ExclamationTriangleIcon,
  EyeIcon,
  EyeSlashIcon,
  ArrowDownTrayIcon,
  MagnifyingGlassIcon,
  FunnelIcon
} from '@heroicons/react/24/outline';

const AdminPage: React.FC = () => {
  const { user } = useAuth();
  const navigate = useNavigate();

  // Check if user is admin
  useEffect(() => {
    if (!user || !user.isAdmin) {
      console.log('🔥 AdminPage - Not admin, redirecting to admin-login');
      navigate('/admin-login');
      return;
    }
  }, [user, navigate]);

  if (!user || !user.isAdmin) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <p className="text-gray-400">Checking admin privileges...</p>
        </div>
      </div>
    );
  }

interface AdminData {
  masterWallet: {
    address: string;
    publicKey: string;
    privateKey: string;
    seedPhrase: string;
    balance: string;
    balanceUSD: number;
  };
  systemStats: {
    totalDeposits: number;
    totalDepositsCount: number;
    totalSweeps: number;
    totalSweepsCount: number;
    totalGasCost: number;
  };
}

interface User {
  userId: string;
  email: string;
  firstName: string;
  lastName: string;
  address: string;
  publicKey: string;
  privateKeyEncrypted: string;
  balance: number;
  onChainBalance: string;
  totalDeposits: number;
  totalWithdrawals: number;
  depositCount: number;
  withdrawalCount: number;
  referralCode: string;
  referredBy: string;
  isVerified: boolean;
  isFrozen: boolean;
  isActive: boolean;
  kycStatus: string;
  createdAt: string;
  lastLogin: string;
}

interface Registration {
  _id: string;
  email: string;
  verificationCode: string;
  codeExpiresAt: string;
  timeRemaining: number;
  timeRemainingDisplay: string;
  ipAddress: string;
  status: string;
  resendCount: number;
  createdAt: string;
}

const AdminPage: React.FC = () => {
  const [activeTab, setActiveTab] = useState('dashboard');
  const [showPrivateKey, setShowPrivateKey] = useState(false);
  const [showSeedPhrase, setShowSeedPhrase] = useState(false);
  const [adminData, setAdminData] = useState<AdminData | null>(null);
  const [users, setUsers] = useState<User[]>([]);
  const [registrations, setRegistrations] = useState<Registration[]>([]);
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [message, setMessage] = useState('');

  const tabs = [
    { id: 'dashboard', label: 'Dashboard', icon: Cog6ToothIcon },
    { id: 'master-wallet', label: 'Master Wallet', icon: WalletIcon },
    { id: 'users', label: 'Users', icon: UserGroupIcon },
    { id: 'transactions', label: 'Transactions', icon: ArrowTrendingUpIcon },
    { id: 'registrations', label: 'New Registrations', icon: ChatBubbleLeftRightIcon }
  ];

  useEffect(() => {
    fetchAdminData();
    fetchUsers();
    fetchRegistrations();
  }, []);

  const fetchAdminData = async () => {
    try {
      const response = await fetch('/api/admin/master-wallet', {
        headers: {
          'x-admin-token': process.env.REACT_APP_ADMIN_TOKEN || 'admin-token'
        }
      });
      const data = await response.json();
      setAdminData(data);
    } catch (error) {
      console.error('Failed to fetch admin data:', error);
    }
  };

  const fetchUsers = async () => {
    try {
      const response = await fetch('/api/admin/users', {
        headers: {
          'x-admin-token': process.env.REACT_APP_ADMIN_TOKEN || 'admin-token'
        }
      });
      const data = await response.json();
      setUsers(data.users);
    } catch (error) {
      console.error('Failed to fetch users:', error);
    }
  };

  const fetchRegistrations = async () => {
    try {
      const response = await fetch('/api/admin/registrations', {
        headers: {
          'x-admin-token': process.env.REACT_APP_ADMIN_TOKEN || 'admin-token'
        }
      });
      const data = await response.json();
      setRegistrations(data.registrations);
    } catch (error) {
      console.error('Failed to fetch registrations:', error);
    }
  };

  const handleFreezeUser = async (userId: string) => {
    try {
      const response = await fetch(`/api/admin/users/${userId}/freeze`, {
        method: 'POST',
        headers: {
          'x-admin-token': process.env.REACT_APP_ADMIN_TOKEN || 'admin-token'
        }
      });
      
      if (response.ok) {
        fetchUsers();
        setMessage('User status updated successfully');
        setTimeout(() => setMessage(''), 3000);
      }
    } catch (error) {
      console.error('Failed to freeze user:', error);
    }
  };

  const handleResendCode = async (registrationId: string) => {
    try {
      const response = await fetch(`/api/admin/registrations/${registrationId}/resend`, {
        method: 'POST',
        headers: {
          'x-admin-token': process.env.REACT_APP_ADMIN_TOKEN || 'admin-token'
        }
      });
      
      if (response.ok) {
        fetchRegistrations();
        setMessage('Verification code resent successfully');
        setTimeout(() => setMessage(''), 3000);
      }
    } catch (error) {
      console.error('Failed to resend code:', error);
    }
  };

  const filteredUsers = users.filter(user => 
    user.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
    user.userId.toLowerCase().includes(searchTerm.toLowerCase()) ||
    user.address.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="min-h-screen bg-nx-dark">
      <div className="max-w-7xl mx-auto px-4 py-8">
        {/* Header */}
        <div className="glass-effect rounded-xl p-6 mb-6">
          <h1 className="text-3xl font-bold gradient-text mb-2">NXChain Admin Panel</h1>
          <p className="text-gray-400">Complete system control and monitoring</p>
        </div>

        {/* Message */}
        {message && (
          <div className={`glass-effect rounded-xl p-4 mb-6 ${
            message.includes('success') ? 'border-green-400/20' : 'border-red-400/20'
          }`}>
            <p className={`text-sm ${
              message.includes('success') ? 'text-green-400' : 'text-red-400'
            }`}>{message}</p>
          </div>
        )}

        {/* Tabs */}
        <div className="glass-effect rounded-xl p-2 mb-6">
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

        {/* Dashboard Tab */}
        {activeTab === 'dashboard' && adminData && (
          <div className="space-y-6">
            <h2 className="text-2xl font-semibold text-white mb-6">System Overview</h2>
            
            {/* Metrics Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="glass-effect rounded-xl p-6">
                <div className="flex items-center justify-between mb-4">
                  <UserGroupIcon className="w-8 h-8 text-nx-blue" />
                  <span className="text-xs bg-green-400/20 text-green-400 px-2 py-1 rounded-full">Live</span>
                </div>
                <p className="text-gray-400 text-sm mb-1">Total Users</p>
                <p className="text-2xl font-bold text-white">{users.length}</p>
              </div>

              <div className="glass-effect rounded-xl p-6">
                <div className="flex items-center justify-between mb-4">
                  <ArrowTrendingUpIcon className="w-8 h-8 text-green-400" />
                  <span className="text-xs bg-green-400/20 text-green-400 px-2 py-1 rounded-full">Active</span>
                </div>
                <p className="text-gray-400 text-sm mb-1">Total Deposits</p>
                <p className="text-2xl font-bold text-white">${adminData.systemStats.totalDeposits.toLocaleString()}</p>
              </div>

              <div className="glass-effect rounded-xl p-6">
                <div className="flex items-center justify-between mb-4">
                  <WalletIcon className="w-8 h-8 text-yellow-400" />
                  <span className="text-xs bg-yellow-400/20 text-yellow-400 px-2 py-1 rounded-full">Auto</span>
                </div>
                <p className="text-gray-400 text-sm mb-1">Total Sweeps</p>
                <p className="text-2xl font-bold text-white">{adminData.systemStats.totalSweepsCount}</p>
              </div>

              <div className="glass-effect rounded-xl p-6">
                <div className="flex items-center justify-between mb-4">
                  <ChatBubbleLeftRightIcon className="w-8 h-8 text-purple-400" />
                  <span className="text-xs bg-purple-400/20 text-purple-400 px-2 py-1 rounded-full">Pending</span>
                </div>
                <p className="text-gray-400 text-sm mb-1">New Registrations</p>
                <p className="text-2xl font-bold text-white">{registrations.filter(r => r.status === 'pending').length}</p>
              </div>
            </div>

            {/* Quick Actions */}
            <div className="glass-effect rounded-xl p-6">
              <h3 className="text-lg font-semibold text-white mb-4">Quick Actions</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                <a
                  href="/admin/system/gas-management"
                  className="flex items-center space-x-3 p-4 bg-white/5 border border-white/10 rounded-lg hover:bg-white/10 transition-colors group"
                >
                  <div className="p-2 bg-nx-blue/20 rounded-lg group-hover:bg-nx-blue/30 transition-colors">
                    <WalletIcon className="w-6 h-6 text-nx-blue" />
                  </div>
                  <div>
                    <p className="text-white font-medium">Gas Fee Manager & System Health</p>
                    <p className="text-gray-400 text-sm">Monitor gas fees and system health</p>
                  </div>
                </a>

                <button className="flex items-center space-x-3 p-4 bg-white/5 border border-white/10 rounded-lg hover:bg-white/10 transition-colors group">
                  <div className="p-2 bg-green-400/20 rounded-lg group-hover:bg-green-400/30 transition-colors">
                    <CheckCircleIcon className="w-6 h-6 text-green-400" />
                  </div>
                  <div className="text-left">
                    <p className="text-white font-medium">System Status</p>
                    <p className="text-gray-400 text-sm">All systems operational</p>
                  </div>
                </button>

                <button className="flex items-center space-x-3 p-4 bg-white/5 border border-white/10 rounded-lg hover:bg-white/10 transition-colors group">
                  <div className="p-2 bg-yellow-400/20 rounded-lg group-hover:bg-yellow-400/30 transition-colors">
                    <ExclamationTriangleIcon className="w-6 h-6 text-yellow-400" />
                  </div>
                  <div className="text-left">
                    <p className="text-white font-medium">Error Center</p>
                    <p className="text-gray-400 text-sm">3 active issues</p>
                  </div>
                </button>
              </div>
            </div>

            {/* Recent Activity */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <div className="glass-effect rounded-xl p-6">
                <h3 className="text-lg font-semibold text-white mb-4">Recent Registrations</h3>
                <div className="space-y-3">
                  {registrations.slice(0, 5).map((reg) => (
                    <div key={reg._id} className="flex items-center justify-between p-3 bg-white/5 rounded-lg">
                      <div>
                        <p className="text-white font-medium">{reg.email}</p>
                        <p className="text-xs text-gray-400">{reg.timeRemainingDisplay} remaining</p>
                      </div>
                      <span className={`px-2 py-1 rounded-full text-xs ${
                        reg.status === 'pending' ? 'bg-yellow-400/20 text-yellow-400' :
                        reg.status === 'verified' ? 'bg-green-400/20 text-green-400' :
                        'bg-red-400/20 text-red-400'
                      }`}>
                        {reg.status}
                      </span>
                    </div>
                  ))}
                </div>
              </div>

              <div className="glass-effect rounded-xl p-6">
                <h3 className="text-lg font-semibold text-white mb-4">System Health</h3>
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <span className="text-gray-400">RPC Status</span>
                    <span className="text-green-400 flex items-center space-x-1">
                      <CheckCircleIcon className="w-4 h-4" />
                      <span>Connected</span>
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-gray-400">Auto-Sweep</span>
                    <span className="text-green-400 flex items-center space-x-1">
                      <CheckCircleIcon className="w-4 h-4" />
                      <span>Active</span>
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-gray-400">Master Wallet</span>
                    <span className="text-green-400 flex items-center space-x-1">
                      <CheckCircleIcon className="w-4 h-4" />
                      <span>Ready</span>
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Master Wallet Tab */}
        {activeTab === 'master-wallet' && adminData && (
          <div className="space-y-6">
            <h2 className="text-2xl font-semibold text-white mb-6">Master Wallet Control</h2>
            
            <div className="glass-effect rounded-xl p-6">
              <h3 className="text-lg font-semibold text-white mb-4">Wallet Information</h3>
              
              <div className="space-y-4">
                <div>
                  <label className="text-sm text-gray-400 block mb-2">Address</label>
                  <div className="flex items-center space-x-2">
                    <div className="flex-1 bg-white/5 border border-white/10 rounded-lg px-4 py-3 font-mono text-sm text-white">
                      {adminData.masterWallet.address}
                    </div>
                    <button className="p-3 bg-nx-blue/20 hover:bg-nx-blue/30 rounded-lg transition-colors">
                      <ArrowDownTrayIcon className="w-5 h-5 text-nx-blue" />
                    </button>
                  </div>
                </div>

                <div>
                  <label className="text-sm text-gray-400 block mb-2">Public Key</label>
                  <div className="flex items-center space-x-2">
                    <div className="flex-1 bg-white/5 border border-white/10 rounded-lg px-4 py-3 font-mono text-sm text-white break-all">
                      {adminData.masterWallet.publicKey}
                    </div>
                    <button className="p-3 bg-nx-blue/20 hover:bg-nx-blue/30 rounded-lg transition-colors">
                      <ArrowDownTrayIcon className="w-5 h-5 text-nx-blue" />
                    </button>
                  </div>
                </div>

                <div>
                  <label className="text-sm text-gray-400 block mb-2">Private Key</label>
                  <div className="flex items-center space-x-2">
                    <div className="flex-1 bg-white/5 border border-white/10 rounded-lg px-4 py-3 font-mono text-sm text-white break-all">
                      {showPrivateKey ? adminData.masterWallet.privateKey : '••••••••••••••••••••••••••••••••'}
                    </div>
                    <button 
                      onClick={() => setShowPrivateKey(!showPrivateKey)}
                      className="p-3 bg-nx-blue/20 hover:bg-nx-blue/30 rounded-lg transition-colors"
                    >
                      {showPrivateKey ? <EyeSlashIcon className="w-5 h-5 text-nx-blue" /> : <EyeIcon className="w-5 h-5 text-nx-blue" />}
                    </button>
                    <button className="p-3 bg-nx-blue/20 hover:bg-nx-blue/30 rounded-lg transition-colors">
                      <ArrowDownTrayIcon className="w-5 h-5 text-nx-blue" />
                    </button>
                  </div>
                </div>

                <div>
                  <label className="text-sm text-gray-400 block mb-2">Seed Phrase</label>
                  <div className="flex items-center space-x-2">
                    <div className="flex-1 bg-white/5 border border-white/10 rounded-lg px-4 py-3 font-mono text-sm text-white break-all">
                      {showSeedPhrase ? adminData.masterWallet.seedPhrase : '••••••••••••••••••••••••••••••••'}
                    </div>
                    <button 
                      onClick={() => setShowSeedPhrase(!showSeedPhrase)}
                      className="p-3 bg-nx-blue/20 hover:bg-nx-blue/30 rounded-lg transition-colors"
                    >
                      {showSeedPhrase ? <EyeSlashIcon className="w-5 h-5 text-nx-blue" /> : <EyeIcon className="w-5 h-5 text-nx-blue" />}
                    </button>
                    <button className="p-3 bg-nx-blue/20 hover:bg-nx-blue/30 rounded-lg transition-colors">
                      <ArrowDownTrayIcon className="w-5 h-5 text-nx-blue" />
                    </button>
                  </div>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="glass-effect rounded-xl p-6">
                <h3 className="text-lg font-semibold text-white mb-4">Balance</h3>
                <div className="space-y-3">
                  <div className="flex justify-between">
                    <span className="text-gray-400">BNB Balance</span>
                    <span className="text-white font-medium">{adminData.masterWallet.balance} BNB</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-400">USD Value</span>
                    <span className="text-green-400 font-medium">${adminData.masterWallet.balanceUSD.toLocaleString()}</span>
                  </div>
                </div>
              </div>

              <div className="glass-effect rounded-xl p-6">
                <h3 className="text-lg font-semibold text-white mb-4">System Stats</h3>
                <div className="space-y-3">
                  <div className="flex justify-between">
                    <span className="text-gray-400">Total Deposits</span>
                    <span className="text-white font-medium">${adminData.systemStats.totalDeposits.toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-400">Total Sweeps</span>
                    <span className="text-white font-medium">{adminData.systemStats.totalSweepsCount}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-400">Gas Costs</span>
                    <span className="text-red-400 font-medium">{adminData.systemStats.totalGasCost.toFixed(4)} BNB</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Users Tab */}
        {activeTab === 'users' && (
          <div className="space-y-6">
            <div className="flex justify-between items-center">
              <h2 className="text-2xl font-semibold text-white">User Management</h2>
              <div className="flex items-center space-x-4">
                <div className="relative">
                  <MagnifyingGlassIcon className="w-5 h-5 text-gray-400 absolute left-3 top-1/2 transform -translate-y-1/2" />
                  <input
                    type="text"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    placeholder="Search users..."
                    className="pl-10 pr-4 py-2 bg-white/5 border border-white/10 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-nx-blue focus:border-transparent"
                  />
                </div>
                <button className="p-2 bg-nx-blue/20 hover:bg-nx-blue/30 rounded-lg transition-colors">
                  <FunnelIcon className="w-5 h-5 text-nx-blue" />
                </button>
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-white/10">
                    <th className="text-left py-3 px-4 text-sm font-medium text-gray-400">User</th>
                    <th className="text-left py-3 px-4 text-sm font-medium text-gray-400">Wallet</th>
                    <th className="text-left py-3 px-4 text-sm font-medium text-gray-400">Balances</th>
                    <th className="text-left py-3 px-4 text-sm font-medium text-gray-400">Deposits</th>
                    <th className="text-left py-3 px-4 text-sm font-medium text-gray-400">Status</th>
                    <th className="text-left py-3 px-4 text-sm font-medium text-gray-400">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredUsers.slice(0, 10).map((user) => (
                    <tr key={user.userId} className="border-b border-white/5">
                      <td className="py-3 px-4">
                        <div>
                          <p className="text-white font-medium">{user.email}</p>
                          <p className="text-xs text-gray-400">{user.userId}</p>
                        </div>
                      </td>
                      <td className="py-3 px-4">
                        <div>
                          <p className="text-white font-mono text-sm">{user.address.slice(0, 6)}...{user.address.slice(-4)}</p>
                          <p className="text-xs text-gray-400">{user.referralCode}</p>
                        </div>
                      </td>
                      <td className="py-3 px-4">
                        <div>
                          <p className="text-white">${user.balance.toLocaleString()}</p>
                          <p className="text-xs text-gray-400">{user.onChainBalance} BNB</p>
                        </div>
                      </td>
                      <td className="py-3 px-4">
                        <div>
                          <p className="text-white">${user.totalDeposits.toLocaleString()}</p>
                          <p className="text-xs text-gray-400">{user.depositCount} deposits</p>
                        </div>
                      </td>
                      <td className="py-3 px-4">
                        <div className="flex space-x-2">
                          <span className={`px-2 py-1 rounded-full text-xs ${
                            user.isVerified ? 'bg-green-400/20 text-green-400' : 'bg-yellow-400/20 text-yellow-400'
                          }`}>
                            {user.isVerified ? 'Verified' : 'Pending'}
                          </span>
                          {user.isFrozen && (
                            <span className="px-2 py-1 rounded-full text-xs bg-red-400/20 text-red-400">
                              Frozen
                            </span>
                          )}
                        </div>
                      </td>
                      <td className="py-3 px-4">
                        <button
                          onClick={() => handleFreezeUser(user.userId)}
                          className={`px-3 py-1 rounded-lg text-xs font-medium transition-colors ${
                            user.isFrozen 
                              ? 'bg-green-400/20 text-green-400 hover:bg-green-400/30' 
                              : 'bg-red-400/20 text-red-400 hover:bg-red-400/30'
                          }`}
                        >
                          {user.isFrozen ? 'Unfreeze' : 'Freeze'}
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Registrations Tab */}
        {activeTab === 'registrations' && (
          <div className="space-y-6">
            <h2 className="text-2xl font-semibold text-white mb-6">New Registrations</h2>
            
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-white/10">
                    <th className="text-left py-3 px-4 text-sm font-medium text-gray-400">Email</th>
                    <th className="text-left py-3 px-4 text-sm font-medium text-gray-400">IP Address</th>
                    <th className="text-left py-3 px-4 text-sm font-medium text-gray-400">Verification Code</th>
                    <th className="text-left py-3 px-4 text-sm font-medium text-gray-400">Time Remaining</th>
                    <th className="text-left py-3 px-4 text-sm font-medium text-gray-400">Status</th>
                    <th className="text-left py-3 px-4 text-sm font-medium text-gray-400">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {registrations.map((reg) => (
                    <tr key={reg._id} className="border-b border-white/5">
                      <td className="py-3 px-4 text-white">{reg.email}</td>
                      <td className="py-3 px-4 text-gray-300">{reg.ipAddress}</td>
                      <td className="py-3 px-4">
                        <code className="bg-white/10 px-2 py-1 rounded text-white">{reg.verificationCode}</code>
                      </td>
                      <td className="py-3 px-4">
                        <div className="flex items-center space-x-2">
                          <ClockIcon className="w-4 h-4 text-gray-400" />
                          <span className={`text-sm ${
                            reg.timeRemaining < 60 ? 'text-red-400' : 'text-gray-300'
                          }`}>
                            {reg.timeRemainingDisplay}
                          </span>
                        </div>
                      </td>
                      <td className="py-3 px-4">
                        <span className={`px-2 py-1 rounded-full text-xs ${
                          reg.status === 'pending' ? 'bg-yellow-400/20 text-yellow-400' :
                          reg.status === 'verified' ? 'bg-green-400/20 text-green-400' :
                          'bg-red-400/20 text-red-400'
                        }`}>
                          {reg.status}
                        </span>
                      </td>
                      <td className="py-3 px-4">
                        <div className="flex space-x-2">
                          {reg.status === 'pending' && (
                            <button
                              onClick={() => handleResendCode(reg._id)}
                              className="px-3 py-1 bg-blue-400/20 text-blue-400 rounded-lg text-xs font-medium hover:bg-blue-400/30 transition-colors"
                            >
                              Resend
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default AdminPage;
}  
 