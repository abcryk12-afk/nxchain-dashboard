import React, { useState, useEffect } from 'react';
import { 
  Cog6ToothIcon,
  WalletIcon,
  ArrowTrendingUpIcon,
  ExclamationTriangleIcon,
  CheckCircleIcon,
  ClockIcon,
  EyeIcon,
  EyeSlashIcon,
  FunnelIcon,
  MagnifyingGlassIcon,
  ArrowPathIcon,
  ShieldCheckIcon,
  ServerIcon,
  UserGroupIcon,
  DocumentTextIcon,
  ArrowDownTrayIcon,
  PlusIcon,
  PowerIcon,
  ArrowPathIcon
} from '@heroicons/react/24/outline';

interface GasWallet {
  address: string;
  balance: string;
  minRequiredGas: string;
  gasStatus: 'OK' | 'LOW' | 'CRITICAL';
  lastGasUpdate: string;
  userId: string;
}

interface GasLog {
  id: string;
  wallet: string;
  amount: string;
  type: 'AUTO' | 'MANUAL';
  txHash: string;
  status: 'PENDING' | 'CONFIRMED' | 'FAILED';
  timestamp: string;
  adminName?: string;
}

interface AdminAction {
  id: string;
  adminName: string;
  actionType: string;
  target: string;
  description: string;
  ipAddress: string;
  timestamp: string;
}

interface SystemError {
  id: string;
  errorType: string;
  walletOrTx: string;
  errorMessage: string;
  retryCount: number;
  status: 'PENDING' | 'RESOLVED';
  timestamp: string;
}

interface AdminRole {
  name: string;
  permissions: string[];
  userCount: number;
}

const GasManagementPage: React.FC = () => {
  const [activeTab, setActiveTab] = useState('gas-monitor');
  const [searchTerm, setSearchTerm] = useState('');
  const [autoGasSupply, setAutoGasSupply] = useState(true);
  const [threshold, setThreshold] = useState('0.0003');
  const [showManualGasModal, setShowManualGasModal] = useState(false);
  const [selectedWallet, setSelectedWallet] = useState('');
  const [gasAmount, setGasAmount] = useState('');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [showPrivateKey, setShowPrivateKey] = useState(false);

  // Mock data - in production, fetch from API
  const [gasWallets, setGasWallets] = useState<GasWallet[]>([
    {
      address: '0x1234...5678',
      balance: '0.0001',
      minRequiredGas: '0.0003',
      gasStatus: 'CRITICAL',
      lastGasUpdate: '2024-11-26T15:30:00Z',
      userId: 'USR-001'
    },
    {
      address: '0xabcd...efgh',
      balance: '0.0025',
      minRequiredGas: '0.0003',
      gasStatus: 'LOW',
      lastGasUpdate: '2024-11-26T15:25:00Z',
      userId: 'USR-002'
    },
    {
      address: '0x9876...5432',
      balance: '0.0050',
      minRequiredGas: '0.0003',
      gasStatus: 'OK',
      lastGasUpdate: '2024-11-26T15:20:00Z',
      userId: 'USR-003'
    }
  ]);

  const [gasLogs, setGasLogs] = useState<GasLog[]>([
    {
      id: '1',
      wallet: '0x1234...5678',
      amount: '0.001',
      type: 'AUTO',
      txHash: '0xabc123...',
      status: 'CONFIRMED',
      timestamp: '2024-11-26T15:30:00Z',
      adminName: 'System'
    },
    {
      id: '2',
      wallet: '0xabcd...efgh',
      amount: '0.002',
      type: 'MANUAL',
      txHash: '0xdef456...',
      status: 'CONFIRMED',
      timestamp: '2024-11-26T15:25:00Z',
      adminName: 'Admin1'
    }
  ]);

  const [adminActions, setAdminActions] = useState<AdminAction[]>([
    {
      id: '1',
      adminName: 'SuperAdmin',
      actionType: 'GAS_SENT',
      target: '0x1234...5678',
      description: 'Manual gas top-up of 0.001 BNB',
      ipAddress: '192.168.1.100',
      timestamp: '2024-11-26T15:30:00Z'
    },
    {
      id: '2',
      adminName: 'FinanceAdmin',
      actionType: 'WITHDRAWAL_APPROVED',
      target: 'USR-002',
      description: 'Approved withdrawal of $500',
      ipAddress: '192.168.1.101',
      timestamp: '2024-11-26T15:25:00Z'
    }
  ]);

  const [systemErrors, setSystemErrors] = useState<SystemError[]>([
    {
      id: '1',
      errorType: 'GAS_FAIL',
      walletOrTx: '0x1234...5678',
      errorMessage: 'Insufficient gas for transaction',
      retryCount: 3,
      status: 'PENDING',
      timestamp: '2024-11-26T15:30:00Z'
    },
    {
      id: '2',
      errorType: 'RPC_ERROR',
      walletOrTx: '0xabcd...efgh',
      errorMessage: 'RPC connection timeout',
      retryCount: 1,
      status: 'RESOLVED',
      timestamp: '2024-11-26T15:25:00Z'
    }
  ]);

  const [adminRoles] = useState<AdminRole[]>([
    {
      name: 'Super Admin',
      permissions: ['read', 'write', 'sensitive_actions', 'system_config'],
      userCount: 2
    },
    {
      name: 'Finance Admin',
      permissions: ['read', 'write', 'financial_actions'],
      userCount: 3
    },
    {
      name: 'Moderator',
      permissions: ['read', 'user_management'],
      userCount: 5
    },
    {
      name: 'Viewer',
      permissions: ['read'],
      userCount: 10
    }
  ]);

  const tabs = [
    { id: 'gas-monitor', label: 'Gas Monitor', icon: WalletIcon },
    { id: 'action-logs', label: 'Action Logs', icon: DocumentTextIcon },
    { id: 'rbac', label: 'Admin Roles', icon: UserGroupIcon },
    { id: 'error-monitor', label: 'Error Monitor', icon: ExclamationTriangleIcon },
    { id: 'security', label: 'Security Center', icon: ShieldCheckIcon }
  ];

  const handleManualGasSend = async () => {
    if (!selectedWallet || !gasAmount) {
      setMessage('Please select wallet and enter amount');
      return;
    }

    setLoading(true);
    try {
      // Mock API call
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      const newLog: GasLog = {
        id: Date.now().toString(),
        wallet: selectedWallet,
        amount: gasAmount,
        type: 'MANUAL',
        txHash: '0x' + Math.random().toString(36).substring(7),
        status: 'CONFIRMED',
        timestamp: new Date().toISOString(),
        adminName: 'Current Admin'
      };

      setGasLogs([newLog, ...gasLogs]);
      
      // Update wallet balance
      setGasWallets(wallets => 
        wallets.map(w => 
          w.address === selectedWallet 
            ? { ...w, balance: (parseFloat(w.balance) + parseFloat(gasAmount)).toString(), gasStatus: 'OK' }
            : w
        )
      );

      setShowManualGasModal(false);
      setSelectedWallet('');
      setGasAmount('');
      setMessage('Gas sent successfully!');
      setTimeout(() => setMessage(''), 3000);
    } catch (error) {
      setMessage('Failed to send gas');
    } finally {
      setLoading(false);
    }
  };

  const getGasStatusColor = (status: string) => {
    switch (status) {
      case 'OK': return 'text-green-400 bg-green-400/20';
      case 'LOW': return 'text-yellow-400 bg-yellow-400/20';
      case 'CRITICAL': return 'text-red-400 bg-red-400/20';
      default: return 'text-gray-400 bg-gray-400/20';
    }
  };

  const getErrorStatusColor = (status: string) => {
    switch (status) {
      case 'RESOLVED': return 'text-green-400 bg-green-400/20';
      case 'PENDING': return 'text-yellow-400 bg-yellow-400/20';
      default: return 'text-gray-400 bg-gray-400/20';
    }
  };

  return (
    <div className="min-h-screen bg-nx-dark">
      <div className="max-w-7xl mx-auto px-4 py-8">
        {/* Header */}
        <div className="glass-effect rounded-xl p-6 mb-6">
          <h1 className="text-3xl font-bold gradient-text mb-2">Gas Fee Management & System Health</h1>
          <p className="text-gray-400">Monitor gas fees, manage wallet balances, and track system health</p>
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
          <div className="flex space-x-1 overflow-x-auto">
            {tabs.map((tab) => {
              const Icon = tab.icon;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`flex items-center space-x-2 px-4 py-3 rounded-lg transition-colors whitespace-nowrap ${
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

        {/* Gas Monitor Tab */}
        {activeTab === 'gas-monitor' && (
          <div className="space-y-6">
            {/* Gas Fee Monitor Table */}
            <div className="glass-effect rounded-xl p-6">
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-xl font-semibold text-white">Gas Fee Monitor</h2>
                <div className="flex items-center space-x-4">
                  <div className="relative">
                    <MagnifyingGlassIcon className="w-5 h-5 text-gray-400 absolute left-3 top-1/2 transform -translate-y-1/2" />
                    <input
                      type="text"
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      placeholder="Search wallets..."
                      className="pl-10 pr-4 py-2 bg-white/5 border border-white/10 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-nx-blue focus:border-transparent"
                    />
                  </div>
                  <button className="p-2 bg-nx-blue/20 hover:bg-nx-blue/30 rounded-lg transition-colors">
                    <ArrowPathIcon className="w-5 h-5 text-nx-blue" />
                  </button>
                </div>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-white/10">
                      <th className="text-left py-3 px-4 text-sm font-medium text-gray-400">Wallet Address</th>
                      <th className="text-left py-3 px-4 text-sm font-medium text-gray-400">BNB Balance</th>
                      <th className="text-left py-3 px-4 text-sm font-medium text-gray-400">Min Required Gas</th>
                      <th className="text-left py-3 px-4 text-sm font-medium text-gray-400">Gas Status</th>
                      <th className="text-left py-3 px-4 text-sm font-medium text-gray-400">Last Update</th>
                      <th className="text-left py-3 px-4 text-sm font-medium text-gray-400">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {gasWallets
                      .filter(wallet => 
                        wallet.address.toLowerCase().includes(searchTerm.toLowerCase()) ||
                        wallet.userId.toLowerCase().includes(searchTerm.toLowerCase())
                      )
                      .map((wallet) => (
                      <tr key={wallet.address} className="border-b border-white/5">
                        <td className="py-3 px-4">
                          <div>
                            <p className="text-white font-mono text-sm">{wallet.address}</p>
                            <p className="text-xs text-gray-400">{wallet.userId}</p>
                          </div>
                        </td>
                        <td className="py-3 px-4">
                          <span className="text-white">{wallet.balance} BNB</span>
                        </td>
                        <td className="py-3 px-4">
                          <span className="text-gray-300">{wallet.minRequiredGas} BNB</span>
                        </td>
                        <td className="py-3 px-4">
                          <span className={`px-2 py-1 rounded-full text-xs font-medium ${getGasStatusColor(wallet.gasStatus)}`}>
                            {wallet.gasStatus}
                          </span>
                        </td>
                        <td className="py-3 px-4">
                          <span className="text-gray-400 text-sm">
                            {new Date(wallet.lastGasUpdate).toLocaleString()}
                          </span>
                        </td>
                        <td className="py-3 px-4">
                          <button
                            onClick={() => {
                              setSelectedWallet(wallet.address);
                              setShowManualGasModal(true);
                            }}
                            className="px-3 py-1 bg-nx-blue/20 text-nx-blue rounded-lg text-xs font-medium hover:bg-nx-blue/30 transition-colors"
                          >
                            Add Gas
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Auto Gas Top-Up System */}
            <div className="glass-effect rounded-xl p-6">
              <h3 className="text-lg font-semibold text-white mb-4">Auto Gas Top-Up System</h3>
              
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                <div className="bg-white/5 rounded-lg p-4">
                  <div className="flex items-center justify-between mb-3">
                    <span className="text-gray-400 text-sm">Auto Gas Supply</span>
                    <button
                      onClick={() => setAutoGasSupply(!autoGasSupply)}
                      className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                        autoGasSupply ? 'bg-nx-blue' : 'bg-gray-600'
                      }`}
                    >
                      <span
                        className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                          autoGasSupply ? 'translate-x-6' : 'translate-x-1'
                        }`}
                      />
                    </button>
                  </div>
                  <span className={`text-sm font-medium ${autoGasSupply ? 'text-green-400' : 'text-red-400'}`}>
                    {autoGasSupply ? 'Active' : 'Disabled'}
                  </span>
                </div>

                <div className="bg-white/5 rounded-lg p-4">
                  <label className="text-gray-400 text-sm block mb-2">Threshold Setting</label>
                  <div className="flex items-center space-x-2">
                    <input
                      type="text"
                      value={threshold}
                      onChange={(e) => setThreshold(e.target.value)}
                      className="bg-white/10 border border-white/20 rounded px-3 py-1 text-white text-sm w-24"
                    />
                    <span className="text-gray-400 text-sm">BNB</span>
                  </div>
                </div>

                <div className="bg-white/5 rounded-lg p-4">
                  <span className="text-gray-400 text-sm block mb-2">Auto Retry Queue</span>
                  <span className="text-white font-medium">3 pending</span>
                </div>

                <div className="bg-white/5 rounded-lg p-4">
                  <span className="text-gray-400 text-sm block mb-2">System Status</span>
                  <span className="text-green-400 font-medium flex items-center space-x-1">
                    <CheckCircleIcon className="w-4 h-4" />
                    <span>Operational</span>
                  </span>
                </div>
              </div>
            </div>

            {/* Gas History Logs */}
            <div className="glass-effect rounded-xl p-6">
              <h3 className="text-lg font-semibold text-white mb-4">Gas History Logs</h3>
              
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-white/10">
                      <th className="text-left py-3 px-4 text-sm font-medium text-gray-400">Wallet</th>
                      <th className="text-left py-3 px-4 text-sm font-medium text-gray-400">Amount</th>
                      <th className="text-left py-3 px-4 text-sm font-medium text-gray-400">Type</th>
                      <th className="text-left py-3 px-4 text-sm font-medium text-gray-400">TX Hash</th>
                      <th className="text-left py-3 px-4 text-sm font-medium text-gray-400">Status</th>
                      <th className="text-left py-3 px-4 text-sm font-medium text-gray-400">Timestamp</th>
                    </tr>
                  </thead>
                  <tbody>
                    {gasLogs.map((log) => (
                      <tr key={log.id} className="border-b border-white/5">
                        <td className="py-3 px-4">
                          <span className="text-white font-mono text-sm">{log.wallet}</span>
                        </td>
                        <td className="py-3 px-4">
                          <span className="text-white">{log.amount} BNB</span>
                        </td>
                        <td className="py-3 px-4">
                          <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                            log.type === 'AUTO' ? 'bg-blue-400/20 text-blue-400' : 'bg-purple-400/20 text-purple-400'
                          }`}>
                            {log.type}
                          </span>
                        </td>
                        <td className="py-3 px-4">
                          <span className="text-white font-mono text-sm">{log.txHash}</span>
                        </td>
                        <td className="py-3 px-4">
                          <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                            log.status === 'CONFIRMED' ? 'bg-green-400/20 text-green-400' :
                            log.status === 'PENDING' ? 'bg-yellow-400/20 text-yellow-400' :
                            'bg-red-400/20 text-red-400'
                          }`}>
                            {log.status}
                          </span>
                        </td>
                        <td className="py-3 px-4">
                          <span className="text-gray-400 text-sm">
                            {new Date(log.timestamp).toLocaleString()}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* Action Logs Tab */}
        {activeTab === 'action-logs' && (
          <div className="space-y-6">
            <div className="glass-effect rounded-xl p-6">
              <h2 className="text-xl font-semibold text-white mb-6">Manual Action Logging System</h2>
              
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-white/10">
                      <th className="text-left py-3 px-4 text-sm font-medium text-gray-400">Admin Name</th>
                      <th className="text-left py-3 px-4 text-sm font-medium text-gray-400">Action Type</th>
                      <th className="text-left py-3 px-4 text-sm font-medium text-gray-400">Target</th>
                      <th className="text-left py-3 px-4 text-sm font-medium text-gray-400">Description</th>
                      <th className="text-left py-3 px-4 text-sm font-medium text-gray-400">IP Address</th>
                      <th className="text-left py-3 px-4 text-sm font-medium text-gray-400">Timestamp</th>
                    </tr>
                  </thead>
                  <tbody>
                    {adminActions.map((action) => (
                      <tr key={action.id} className="border-b border-white/5">
                        <td className="py-3 px-4">
                          <span className="text-white font-medium">{action.adminName}</span>
                        </td>
                        <td className="py-3 px-4">
                          <span className="px-2 py-1 bg-nx-blue/20 text-nx-blue rounded-full text-xs font-medium">
                            {action.actionType}
                          </span>
                        </td>
                        <td className="py-3 px-4">
                          <span className="text-white font-mono text-sm">{action.target}</span>
                        </td>
                        <td className="py-3 px-4">
                          <span className="text-gray-300 text-sm">{action.description}</span>
                        </td>
                        <td className="py-3 px-4">
                          <span className="text-gray-400 text-sm">{action.ipAddress}</span>
                        </td>
                        <td className="py-3 px-4">
                          <span className="text-gray-400 text-sm">
                            {new Date(action.timestamp).toLocaleString()}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* RBAC Tab */}
        {activeTab === 'rbac' && (
          <div className="space-y-6">
            <div className="glass-effect rounded-xl p-6">
              <h2 className="text-xl font-semibold text-white mb-6">Role-Based Admin Panel (RBAC)</h2>
              
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-2 gap-6">
                {adminRoles.map((role) => (
                  <div key={role.name} className="bg-white/5 rounded-lg p-6">
                    <div className="flex items-center justify-between mb-4">
                      <h3 className="text-lg font-semibold text-white">{role.name}</h3>
                      <span className="text-nx-blue font-medium">{role.userCount} users</span>
                    </div>
                    
                    <div className="space-y-2 mb-4">
                      {role.permissions.map((permission) => (
                        <div key={permission} className="flex items-center space-x-2">
                          <CheckCircleIcon className="w-4 h-4 text-green-400" />
                          <span className="text-gray-300 text-sm capitalize">
                            {permission.replace('_', ' ')}
                          </span>
                        </div>
                      ))}
                    </div>
                    
                    <button className="w-full px-4 py-2 bg-nx-blue/20 text-nx-blue rounded-lg text-sm font-medium hover:bg-nx-blue/30 transition-colors">
                      Manage Role
                    </button>
                  </div>
                ))}
              </div>
              
              <div className="mt-6 text-center">
                <button className="px-6 py-3 bg-nx-blue text-white rounded-lg font-medium hover:bg-nx-blue/80 transition-colors">
                  Open Admin Roles & Permissions Page
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Error Monitor Tab */}
        {activeTab === 'error-monitor' && (
          <div className="space-y-6">
            <div className="glass-effect rounded-xl p-6">
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-xl font-semibold text-white">System Error Monitoring</h2>
                <button className="px-4 py-2 bg-nx-blue/20 text-nx-blue rounded-lg text-sm font-medium hover:bg-nx-blue/30 transition-colors">
                  View Full Error Center
                </button>
              </div>
              
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-white/10">
                      <th className="text-left py-3 px-4 text-sm font-medium text-gray-400">Error Type</th>
                      <th className="text-left py-3 px-4 text-sm font-medium text-gray-400">Wallet/TX</th>
                      <th className="text-left py-3 px-4 text-sm font-medium text-gray-400">Error Message</th>
                      <th className="text-left py-3 px-4 text-sm font-medium text-gray-400">Retry Count</th>
                      <th className="text-left py-3 px-4 text-sm font-medium text-gray-400">Status</th>
                      <th className="text-left py-3 px-4 text-sm font-medium text-gray-400">Time</th>
                    </tr>
                  </thead>
                  <tbody>
                    {systemErrors.map((error) => (
                      <tr key={error.id} className="border-b border-white/5">
                        <td className="py-3 px-4">
                          <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                            error.errorType === 'RPC_ERROR' ? 'bg-red-400/20 text-red-400' :
                            error.errorType === 'GAS_FAIL' ? 'bg-yellow-400/20 text-yellow-400' :
                            'bg-orange-400/20 text-orange-400'
                          }`}>
                            {error.errorType}
                          </span>
                        </td>
                        <td className="py-3 px-4">
                          <span className="text-white font-mono text-sm">{error.walletOrTx}</span>
                        </td>
                        <td className="py-3 px-4">
                          <span className="text-gray-300 text-sm">{error.errorMessage}</span>
                        </td>
                        <td className="py-3 px-4">
                          <span className="text-white">{error.retryCount}</span>
                        </td>
                        <td className="py-3 px-4">
                          <span className={`px-2 py-1 rounded-full text-xs font-medium ${getErrorStatusColor(error.status)}`}>
                            {error.status}
                          </span>
                        </td>
                        <td className="py-3 px-4">
                          <span className="text-gray-400 text-sm">
                            {new Date(error.timestamp).toLocaleString()}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* Security Center Tab */}
        {activeTab === 'security' && (
          <div className="space-y-6">
            <div className="glass-effect rounded-xl p-6">
              <h2 className="text-xl font-semibold text-white mb-6">Security Center</h2>
              
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                <div className="bg-white/5 rounded-lg p-6">
                  <div className="flex items-center justify-between mb-4">
                    <ShieldCheckIcon className="w-8 h-8 text-green-400" />
                    <span className="text-green-400 text-sm">OK</span>
                  </div>
                  <h3 className="text-white font-medium mb-2">Encryption Status</h3>
                  <p className="text-gray-400 text-sm">AES-256 encryption active</p>
                </div>

                <div className="bg-white/5 rounded-lg p-6">
                  <div className="flex items-center justify-between mb-4">
                    <ArrowDownTrayIcon className="w-8 h-8 text-blue-400" />
                    <span className="text-blue-400 text-sm">Updated</span>
                  </div>
                  <h3 className="text-white font-medium mb-2">Wallet Backup Status</h3>
                  <p className="text-gray-400 text-sm">Last backup: 2 hours ago</p>
                </div>

                <div className="bg-white/5 rounded-lg p-6">
                  <div className="flex items-center justify-between mb-4">
                    <ServerIcon className="w-8 h-8 text-green-400" />
                    <span className="text-green-400 text-sm">Healthy</span>
                  </div>
                  <h3 className="text-white font-medium mb-2">Database Health</h3>
                  <p className="text-gray-400 text-sm">All systems operational</p>
                </div>

                <div className="bg-white/5 rounded-lg p-6">
                  <div className="flex items-center justify-between mb-4">
                    <DocumentTextIcon className="w-8 h-8 text-yellow-400" />
                    <span className="text-yellow-400 text-sm">127</span>
                  </div>
                  <h3 className="text-white font-medium mb-2">Admin Activity Logs</h3>
                  <p className="text-gray-400 text-sm">Last 24 hours</p>
                </div>

                <div className="bg-white/5 rounded-lg p-6">
                  <div className="flex items-center justify-between mb-4">
                    <UserGroupIcon className="w-8 h-8 text-purple-400" />
                    <span className="text-purple-400 text-sm">43</span>
                  </div>
                  <h3 className="text-white font-medium mb-2">Session IP Logs</h3>
                  <p className="text-gray-400 text-sm">Active sessions</p>
                </div>

                <div className="bg-white/5 rounded-lg p-6">
                  <div className="flex items-center justify-between mb-4">
                    <ShieldCheckIcon className="w-8 h-8 text-green-400" />
                    <span className="text-green-400 text-sm">Secure</span>
                  </div>
                  <h3 className="text-white font-medium mb-2">Login Device Security</h3>
                  <p className="text-gray-400 text-sm">2FA enabled on all admin accounts</p>
                </div>
              </div>
              
              <div className="mt-6 text-center">
                <button className="px-6 py-3 bg-nx-blue text-white rounded-lg font-medium hover:bg-nx-blue/80 transition-colors">
                  Open Full Security Page
                </button>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Manual Gas Modal */}
      {showManualGasModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="glass-effect rounded-xl p-6 w-full max-w-md">
            <h3 className="text-xl font-semibold text-white mb-4">Add Gas Manually</h3>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Select Wallet
                </label>
                <select
                  value={selectedWallet}
                  onChange={(e) => setSelectedWallet(e.target.value)}
                  className="w-full px-3 py-3 bg-white/5 border border-white/10 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-nx-blue focus:border-transparent"
                >
                  <option value="">Select a wallet</option>
                  {gasWallets.map((wallet) => (
                    <option key={wallet.address} value={wallet.address}>
                      {wallet.address} - {wallet.balance} BNB
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Amount (BNB)
                </label>
                <input
                  type="text"
                  value={gasAmount}
                  onChange={(e) => setGasAmount(e.target.value)}
                  placeholder="0.001"
                  className="w-full px-3 py-3 bg-white/5 border border-white/10 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-nx-blue focus:border-transparent"
                />
              </div>

              <div className="bg-yellow-400/10 border border-yellow-400/20 rounded-lg p-3">
                <p className="text-yellow-400 text-sm">
                  This action will be logged for security purposes.
                </p>
              </div>
            </div>

            <div className="flex space-x-4 mt-6">
              <button
                onClick={handleManualGasSend}
                disabled={loading}
                className="flex-1 btn-primary py-3 rounded-lg font-medium disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? 'Sending...' : 'Send Gas'}
              </button>
              <button
                onClick={() => {
                  setShowManualGasModal(false);
                  setSelectedWallet('');
                  setGasAmount('');
                }}
                className="flex-1 btn-secondary py-3 rounded-lg font-medium"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default GasManagementPage;
