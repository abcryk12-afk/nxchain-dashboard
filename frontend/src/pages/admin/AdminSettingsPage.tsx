import React, { useState, useEffect } from 'react';
import { 
  Cog6ToothIcon, 
  MagnifyingGlassIcon,
  PencilIcon,
  CheckCircleIcon,
  ExclamationTriangleIcon,
  ShieldCheckIcon,
  BellIcon,
  GlobeAltIcon,
  CurrencyDollarIcon,
  UserGroupIcon,
  DocumentTextIcon,
  ServerIcon
} from '@heroicons/react/24/outline';
import Header from '../../components/Header';

interface SystemSetting {
  _id: string;
  category: string;
  key: string;
  label: string;
  value: string | number | boolean;
  type: 'string' | 'number' | 'boolean' | 'select';
  description: string;
  options?: string[];
  isRequired: boolean;
  lastUpdated: string;
  updatedBy: string;
}

interface SystemLog {
  _id: string;
  level: 'info' | 'warning' | 'error' | 'success';
  message: string;
  category: string;
  timestamp: string;
  userId?: string;
  details?: any;
}

const AdminSettingsPage: React.FC = () => {
  const [settings, setSettings] = useState<SystemSetting[]>([]);
  const [logs, setLogs] = useState<SystemLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeCategory, setActiveCategory] = useState<string>('all');
  const [showEditModal, setShowEditModal] = useState(false);
  const [editingSetting, setEditingSetting] = useState<SystemSetting | null>(null);
  const [searchTerm, setSearchTerm] = useState('');

  // Mock data - replace with actual API calls
  useEffect(() => {
    const mockSettings: SystemSetting[] = [
      {
        _id: '1',
        category: 'general',
        key: 'site_name',
        label: 'Site Name',
        value: 'NXChain',
        type: 'string',
        description: 'The name of the platform',
        isRequired: true,
        lastUpdated: '2024-11-28T08:15:00Z',
        updatedBy: 'admin@example.com'
      },
      {
        _id: '2',
        category: 'general',
        key: 'maintenance_mode',
        label: 'Maintenance Mode',
        value: false,
        type: 'boolean',
        description: 'Enable maintenance mode to disable user access',
        isRequired: false,
        lastUpdated: '2024-11-27T16:30:00Z',
        updatedBy: 'admin@example.com'
      },
      {
        _id: '3',
        category: 'security',
        key: '2fa_required',
        label: 'Require 2FA',
        value: true,
        type: 'boolean',
        description: 'Require two-factor authentication for all users',
        isRequired: false,
        lastUpdated: '2024-11-25T10:20:00Z',
        updatedBy: 'admin@example.com'
      },
      {
        _id: '4',
        category: 'security',
        key: 'session_timeout',
        label: 'Session Timeout (minutes)',
        value: 30,
        type: 'number',
        description: 'User session timeout in minutes',
        isRequired: true,
        lastUpdated: '2024-11-24T14:15:00Z',
        updatedBy: 'admin@example.com'
      },
      {
        _id: '5',
        category: 'transactions',
        key: 'min_deposit_amount',
        label: 'Minimum Deposit Amount',
        value: 10,
        type: 'number',
        description: 'Minimum amount for deposit transactions',
        isRequired: true,
        lastUpdated: '2024-11-23T09:45:00Z',
        updatedBy: 'admin@example.com'
      },
      {
        _id: '6',
        category: 'transactions',
        key: 'max_withdrawal_daily',
        label: 'Max Daily Withdrawal',
        value: 10000,
        type: 'number',
        description: 'Maximum withdrawal amount per day',
        isRequired: true,
        lastUpdated: '2024-11-22T11:30:00Z',
        updatedBy: 'admin@example.com'
      },
      {
        _id: '7',
        category: 'notifications',
        key: 'email_notifications',
        label: 'Email Notifications',
        value: 'enabled',
        type: 'select',
        description: 'Enable or disable email notifications',
        options: ['enabled', 'disabled'],
        isRequired: false,
        lastUpdated: '2024-11-21T13:20:00Z',
        updatedBy: 'admin@example.com'
      },
      {
        _id: '8',
        category: 'referral',
        key: 'referral_commission_rate',
        label: 'Referral Commission Rate (%)',
        value: 10,
        type: 'number',
        description: 'Commission rate for referral program',
        isRequired: true,
        lastUpdated: '2024-11-20T15:10:00Z',
        updatedBy: 'admin@example.com'
      }
    ];

    const mockLogs: SystemLog[] = [
      {
        _id: '1',
        level: 'info',
        message: 'System settings updated',
        category: 'settings',
        timestamp: '2024-11-28T08:15:00Z',
        userId: 'admin',
        details: { setting: 'site_name', oldValue: 'NXChain Platform', newValue: 'NXChain' }
      },
      {
        _id: '2',
        level: 'warning',
        message: 'High gas price detected',
        category: 'gas',
        timestamp: '2024-11-28T07:45:00Z',
        details: { network: 'ETH', gasPrice: 35.2 }
      },
      {
        _id: '3',
        level: 'success',
        message: 'User registration completed',
        category: 'users',
        timestamp: '2024-11-28T06:30:00Z',
        userId: 'user123',
        details: { email: 'newuser@example.com' }
      },
      {
        _id: '4',
        level: 'error',
        message: 'Transaction failed',
        category: 'transactions',
        timestamp: '2024-11-28T05:15:00Z',
        userId: 'user456',
        details: { transactionId: 'tx_789', error: 'Insufficient gas' }
      }
    ];
    
    setTimeout(() => {
      setSettings(mockSettings);
      setLogs(mockLogs);
      setLoading(false);
    }, 1000);
  }, []);

  const categories = ['all', ...Array.from(new Set(settings.map(s => s.category)))];
  
  const filteredSettings = settings.filter(setting => {
    const matchesCategory = activeCategory === 'all' || setting.category === activeCategory;
    const matchesSearch = 
      setting.label.toLowerCase().includes(searchTerm.toLowerCase()) ||
      setting.key.toLowerCase().includes(searchTerm.toLowerCase()) ||
      setting.description.toLowerCase().includes(searchTerm.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  const getCategoryIcon = (category: string) => {
    switch (category) {
      case 'general': return <Cog6ToothIcon className="w-5 h-5" />;
      case 'security': return <ShieldCheckIcon className="w-5 h-5" />;
      case 'transactions': return <CurrencyDollarIcon className="w-5 h-5" />;
      case 'notifications': return <BellIcon className="w-5 h-5" />;
      case 'referral': return <UserGroupIcon className="w-5 h-5" />;
      default: return <DocumentTextIcon className="w-5 h-5" />;
    }
  };

  const getCategoryColor = (category: string) => {
    switch (category) {
      case 'general': return 'text-blue-400 bg-blue-400/20';
      case 'security': return 'text-green-400 bg-green-400/20';
      case 'transactions': return 'text-yellow-400 bg-yellow-400/20';
      case 'notifications': return 'text-purple-400 bg-purple-400/20';
      case 'referral': return 'text-pink-400 bg-pink-400/20';
      default: return 'text-gray-400 bg-gray-400/20';
    }
  };

  const getLogLevelColor = (level: string) => {
    switch (level) {
      case 'info': return 'text-blue-400 bg-blue-400/20';
      case 'warning': return 'text-yellow-400 bg-yellow-400/20';
      case 'error': return 'text-red-400 bg-red-400/20';
      case 'success': return 'text-green-400 bg-green-400/20';
      default: return 'text-gray-400 bg-gray-400/20';
    }
  };

  const handleEditSetting = (setting: SystemSetting) => {
    setEditingSetting(setting);
    setShowEditModal(true);
  };

  const handleSaveSetting = () => {
    if (editingSetting) {
      setSettings(settings => 
        settings.map(s => 
          s._id === editingSetting._id 
            ? { ...editingSetting, lastUpdated: new Date().toISOString(), updatedBy: 'admin' }
            : s
        )
      );
      setShowEditModal(false);
      setEditingSetting(null);
    }
  };

  const renderSettingValue = (setting: SystemSetting) => {
    switch (setting.type) {
      case 'boolean':
        return (
          <span className={`inline-flex items-center space-x-1 px-2 py-1 rounded-full text-xs ${
            setting.value ? 'text-green-400 bg-green-400/20' : 'text-red-400 bg-red-400/20'
          }`}>
            <span>{setting.value ? 'Enabled' : 'Disabled'}</span>
          </span>
        );
      case 'select':
        return (
          <span className="text-white">{setting.value}</span>
        );
      default:
        return (
          <span className="text-white">{setting.value}</span>
        );
    }
  };

  return (
    <>
      <Header />
      <div className="min-h-screen bg-gray-900 text-white p-6">
        <div className="max-w-7xl mx-auto">
          {/* Header */}
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-white mb-2">System Settings</h1>
            <p className="text-gray-400">Configure system parameters and platform settings</p>
          </div>

          {/* Stats Cards */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
            <div className="glass-effect rounded-xl p-6">
              <div className="flex items-center justify-between mb-4">
                <Cog6ToothIcon className="w-8 h-8 text-blue-400" />
                <span className="text-2xl font-bold">{settings.length}</span>
              </div>
              <p className="text-gray-400">Total Settings</p>
            </div>
            <div className="glass-effect rounded-xl p-6">
              <div className="flex items-center justify-between mb-4">
                <ShieldCheckIcon className="w-8 h-8 text-green-400" />
                <span className="text-2xl font-bold">
                  {settings.filter(s => s.category === 'security').length}
                </span>
              </div>
              <p className="text-gray-400">Security Settings</p>
            </div>
            <div className="glass-effect rounded-xl p-6">
              <div className="flex items-center justify-between mb-4">
                <CurrencyDollarIcon className="w-8 h-8 text-yellow-400" />
                <span className="text-2xl font-bold">
                  {settings.filter(s => s.category === 'transactions').length}
                </span>
              </div>
              <p className="text-gray-400">Transaction Settings</p>
            </div>
            <div className="glass-effect rounded-xl p-6">
              <div className="flex items-center justify-between mb-4">
                <ServerIcon className="w-8 h-8 text-purple-400" />
                <span className="text-2xl font-bold">{logs.length}</span>
              </div>
              <p className="text-gray-400">System Logs</p>
            </div>
          </div>

          {/* Category Filter and Search */}
          <div className="glass-effect rounded-xl p-4 mb-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="flex items-center space-x-2">
                <GlobeAltIcon className="w-5 h-5 text-gray-400" />
                <select
                  value={activeCategory}
                  onChange={(e) => setActiveCategory(e.target.value)}
                  className="flex-1 bg-white/5 border border-white/10 rounded-lg px-4 py-2 focus:outline-none focus:border-nx-blue text-white"
                >
                  {categories.map(category => (
                    <option key={category} value={category}>
                      {category.charAt(0).toUpperCase() + category.slice(1)}
                    </option>
                  ))}
                </select>
              </div>
              
              <div className="relative">
                <MagnifyingGlassIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                <input
                  type="text"
                  placeholder="Search settings..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 bg-white/5 border border-white/10 rounded-lg focus:outline-none focus:border-nx-blue text-white placeholder-gray-400"
                />
              </div>
            </div>
          </div>

          {/* Settings Table */}
          <div className="glass-effect rounded-xl overflow-hidden mb-8">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-white/10">
                    <th className="text-left py-4 px-6 text-sm font-medium text-gray-400">Category</th>
                    <th className="text-left py-4 px-6 text-sm font-medium text-gray-400">Setting</th>
                    <th className="text-left py-4 px-6 text-sm font-medium text-gray-400">Value</th>
                    <th className="text-left py-4 px-6 text-sm font-medium text-gray-400">Description</th>
                    <th className="text-left py-4 px-6 text-sm font-medium text-gray-400">Last Updated</th>
                    <th className="text-left py-4 px-6 text-sm font-medium text-gray-400">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {loading ? (
                    <tr>
                      <td colSpan={6} className="py-12 text-center text-gray-400">
                        Loading settings...
                      </td>
                    </tr>
                  ) : filteredSettings.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="py-12 text-center text-gray-400">
                        No settings found matching your criteria.
                      </td>
                    </tr>
                  ) : (
                    filteredSettings.map((setting) => (
                      <tr key={setting._id} className="border-b border-white/5 hover:bg-white/5">
                        <td className="py-4 px-6">
                          <span className={`inline-flex items-center space-x-1 px-2 py-1 rounded-full text-xs ${getCategoryColor(setting.category)}`}>
                            {getCategoryIcon(setting.category)}
                            <span>{setting.category}</span>
                          </span>
                        </td>
                        <td className="py-4 px-6">
                          <div>
                            <p className="text-white font-medium">{setting.label}</p>
                            <p className="text-xs text-gray-400">{setting.key}</p>
                          </div>
                        </td>
                        <td className="py-4 px-6">
                          {renderSettingValue(setting)}
                        </td>
                        <td className="py-4 px-6">
                          <p className="text-sm text-gray-300">{setting.description}</p>
                        </td>
                        <td className="py-4 px-6">
                          <div>
                            <p className="text-sm text-gray-300">
                              {new Date(setting.lastUpdated).toLocaleDateString()}
                            </p>
                            <p className="text-xs text-gray-400">{setting.updatedBy}</p>
                          </div>
                        </td>
                        <td className="py-4 px-6">
                          <button
                            onClick={() => handleEditSetting(setting)}
                            className="p-2 text-blue-400 hover:bg-blue-400/20 rounded-lg"
                          >
                            <PencilIcon className="w-4 h-4" />
                          </button>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>

          {/* System Logs */}
          <div className="glass-effect rounded-xl p-6">
            <h2 className="text-xl font-semibold text-white mb-4 flex items-center">
              <DocumentTextIcon className="w-5 h-5 mr-2 text-nx-blue" />
              Recent System Logs
            </h2>
            
            <div className="space-y-3">
              {logs.slice(0, 10).map((log) => (
                <div key={log._id} className="flex items-start space-x-3 p-3 bg-white/5 rounded-lg">
                  <span className={`inline-flex items-center space-x-1 px-2 py-1 rounded-full text-xs mt-1 ${getLogLevelColor(log.level)}`}>
                    <span>{log.level}</span>
                  </span>
                  <div className="flex-1">
                    <p className="text-white text-sm">{log.message}</p>
                    <div className="flex items-center space-x-4 text-xs text-gray-400 mt-1">
                      <span>{log.category}</span>
                      <span>{new Date(log.timestamp).toLocaleString()}</span>
                      {log.userId && <span>User: {log.userId}</span>}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Edit Modal */}
          {showEditModal && editingSetting && (
            <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
              <div className="glass-effect rounded-xl p-6 max-w-md w-full">
                <div className="flex items-center justify-between mb-6">
                  <h2 className="text-xl font-semibold text-white">Edit Setting</h2>
                  <button
                    onClick={() => setShowEditModal(false)}
                    className="text-gray-400 hover:text-white"
                  >
                    ×
                  </button>
                </div>

                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-400 mb-2">
                      {editingSetting.label}
                    </label>
                    <p className="text-xs text-gray-500 mb-3">{editingSetting.description}</p>
                    
                    {editingSetting.type === 'boolean' ? (
                      <div className="flex items-center justify-between">
                        <span className="text-white">
                          {editingSetting.value ? 'Enabled' : 'Disabled'}
                        </span>
                        <button
                          onClick={() => setEditingSetting({
                            ...editingSetting,
                            value: !editingSetting.value
                          })}
                          className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                            editingSetting.value ? 'bg-blue-600' : 'bg-gray-600'
                          }`}
                        >
                          <span
                            className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                              editingSetting.value ? 'translate-x-6' : 'translate-x-1'
                            }`}
                          />
                        </button>
                      </div>
                    ) : editingSetting.type === 'select' && editingSetting.options ? (
                      <select
                        value={editingSetting.value as string}
                        onChange={(e) => setEditingSetting({
                          ...editingSetting,
                          value: e.target.value
                        })}
                        className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-3 focus:outline-none focus:border-nx-blue text-white"
                      >
                        {editingSetting.options.map(option => (
                          <option key={option} value={option}>{option}</option>
                        ))}
                      </select>
                    ) : editingSetting.type === 'number' ? (
                      <input
                        type="number"
                        value={editingSetting.value as number}
                        onChange={(e) => setEditingSetting({
                          ...editingSetting,
                          value: parseFloat(e.target.value)
                        })}
                        className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-3 focus:outline-none focus:border-nx-blue text-white"
                      />
                    ) : (
                      <input
                        type="text"
                        value={editingSetting.value as string}
                        onChange={(e) => setEditingSetting({
                          ...editingSetting,
                          value: e.target.value
                        })}
                        className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-3 focus:outline-none focus:border-nx-blue text-white"
                      />
                    )}
                  </div>
                </div>

                <div className="flex space-x-3 mt-6">
                  <button
                    onClick={handleSaveSetting}
                    className="flex-1 btn-primary py-3 rounded-lg font-medium"
                  >
                    Save Changes
                  </button>
                  <button
                    onClick={() => setShowEditModal(false)}
                    className="flex-1 btn-secondary py-3 rounded-lg font-medium"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </>
  );
};

export default AdminSettingsPage;
