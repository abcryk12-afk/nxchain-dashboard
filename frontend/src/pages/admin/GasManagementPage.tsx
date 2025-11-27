import React, { useState, useEffect } from 'react';
import { 
  FunnelIcon, 
  MagnifyingGlassIcon,
  PencilIcon,
  CheckCircleIcon,
  ExclamationTriangleIcon,
  CurrencyDollarIcon,
  ChartBarIcon,
  ArrowTrendingUpIcon,
  ArrowTrendingDownIcon,
  ClockIcon
} from '@heroicons/react/24/outline';
import Header from '../../components/Header';

interface GasConfig {
  _id: string;
  network: string;
  currency: string;
  gasPrice: number;
  gasLimit: number;
  priorityFee: number;
  isActive: boolean;
  lastUpdated: string;
  averageConfirmationTime: number;
  successRate: number;
}

interface GasHistory {
  _id: string;
  network: string;
  gasPrice: number;
  timestamp: string;
  status: 'success' | 'failed';
}

const GasManagementPage: React.FC = () => {
  const [gasConfigs, setGasConfigs] = useState<GasConfig[]>([]);
  const [gasHistory, setGasHistory] = useState<GasHistory[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedNetwork, setSelectedNetwork] = useState<string>('all');
  const [showEditModal, setShowEditModal] = useState(false);
  const [editingConfig, setEditingConfig] = useState<GasConfig | null>(null);

  // Mock data - replace with actual API calls
  useEffect(() => {
    const mockConfigs: GasConfig[] = [
      {
        _id: '1',
        network: 'BSC',
        currency: 'BNB',
        gasPrice: 5.2,
        gasLimit: 21000,
        priorityFee: 1.5,
        isActive: true,
        lastUpdated: '2024-11-28T08:15:00Z',
        averageConfirmationTime: 15,
        successRate: 98.5
      },
      {
        _id: '2',
        network: 'ETH',
        currency: 'ETH',
        gasPrice: 25.8,
        gasLimit: 21000,
        priorityFee: 2.1,
        isActive: true,
        lastUpdated: '2024-11-28T08:10:00Z',
        averageConfirmationTime: 45,
        successRate: 97.2
      },
      {
        _id: '3',
        network: 'POLYGON',
        currency: 'MATIC',
        gasPrice: 30.5,
        gasLimit: 21000,
        priorityFee: 15.2,
        isActive: false,
        lastUpdated: '2024-11-27T22:30:00Z',
        averageConfirmationTime: 8,
        successRate: 99.1
      }
    ];

    const mockHistory: GasHistory[] = [
      { _id: '1', network: 'BSC', gasPrice: 5.1, timestamp: '2024-11-28T08:00:00Z', status: 'success' },
      { _id: '2', network: 'BSC', gasPrice: 5.2, timestamp: '2024-11-28T08:15:00Z', status: 'success' },
      { _id: '3', network: 'ETH', gasPrice: 25.5, timestamp: '2024-11-28T08:00:00Z', status: 'success' },
      { _id: '4', network: 'ETH', gasPrice: 25.8, timestamp: '2024-11-28T08:15:00Z', status: 'success' },
      { _id: '5', network: 'POLYGON', gasPrice: 31.2, timestamp: '2024-11-27T22:00:00Z', status: 'failed' },
      { _id: '6', network: 'POLYGON', gasPrice: 30.5, timestamp: '2024-11-27T22:30:00Z', status: 'success' }
    ];
    
    setTimeout(() => {
      setGasConfigs(mockConfigs);
      setGasHistory(mockHistory);
      setLoading(false);
    }, 1000);
  }, []);

  const filteredConfigs = selectedNetwork === 'all' 
    ? gasConfigs 
    : gasConfigs.filter(config => config.network === selectedNetwork);

  const getNetworkColor = (network: string) => {
    switch (network) {
      case 'BSC': return 'text-yellow-400 bg-yellow-400/20';
      case 'ETH': return 'text-blue-400 bg-blue-400/20';
      case 'POLYGON': return 'text-purple-400 bg-purple-400/20';
      default: return 'text-gray-400 bg-gray-400/20';
    }
  };

  const getStatusColor = (isActive: boolean) => {
    return isActive 
      ? 'text-green-400 bg-green-400/20' 
      : 'text-red-400 bg-red-400/20';
  };

  const getSuccessRateColor = (rate: number) => {
    if (rate >= 98) return 'text-green-400';
    if (rate >= 95) return 'text-yellow-400';
    return 'text-red-400';
  };

  const handleEditConfig = (config: GasConfig) => {
    setEditingConfig(config);
    setShowEditModal(true);
  };

  const handleSaveConfig = () => {
    // Handle save configuration
    console.log('Save config:', editingConfig);
    setShowEditModal(false);
    setEditingConfig(null);
  };

  const handleToggleStatus = (configId: string) => {
    // Handle toggle active status
    setGasConfigs(configs => 
      configs.map(config => 
        config._id === configId 
          ? { ...config, isActive: !config.isActive }
          : config
      )
    );
  };

  const getRecentHistory = (network: string, limit: number = 5) => {
    return gasHistory
      .filter(h => h.network === network)
      .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
      .slice(0, limit);
  };

  return (
    <>
      <Header />
      <div className="min-h-screen bg-gray-900 text-white p-6">
        <div className="max-w-7xl mx-auto">
          {/* Header */}
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-white mb-2">Gas Management</h1>
            <p className="text-gray-400">Manage gas fees and settings across networks</p>
          </div>

          {/* Stats Cards */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
            <div className="glass-effect rounded-xl p-6">
              <div className="flex items-center justify-between mb-4">
                <FunnelIcon className="w-8 h-8 text-blue-400" />
                <span className="text-2xl font-bold">{gasConfigs.length}</span>
              </div>
              <p className="text-gray-400">Network Configs</p>
            </div>
            <div className="glass-effect rounded-xl p-6">
              <div className="flex items-center justify-between mb-4">
                <CheckCircleIcon className="w-8 h-8 text-green-400" />
                <span className="text-2xl font-bold">
                  {gasConfigs.filter(c => c.isActive).length}
                </span>
              </div>
              <p className="text-gray-400">Active Networks</p>
            </div>
            <div className="glass-effect rounded-xl p-6">
              <div className="flex items-center justify-between mb-4">
                <CurrencyDollarIcon className="w-8 h-8 text-yellow-400" />
                <span className="text-2xl font-bold">
                  {gasConfigs.length > 0 
                    ? (gasConfigs.reduce((sum, c) => sum + c.gasPrice, 0) / gasConfigs.length).toFixed(1)
                    : '0'
                  }
                </span>
              </div>
              <p className="text-gray-400">Avg Gas Price</p>
            </div>
            <div className="glass-effect rounded-xl p-6">
              <div className="flex items-center justify-between mb-4">
                <ChartBarIcon className="w-8 h-8 text-purple-400" />
                <span className="text-2xl font-bold">
                  {gasConfigs.length > 0 
                    ? (gasConfigs.reduce((sum, c) => sum + c.successRate, 0) / gasConfigs.length).toFixed(1)
                    : '0'
                  }%
                </span>
              </div>
              <p className="text-gray-400">Avg Success Rate</p>
            </div>
          </div>

          {/* Network Filter */}
          <div className="glass-effect rounded-xl p-4 mb-6">
            <div className="flex items-center space-x-4">
              <FunnelIcon className="w-5 h-5 text-gray-400" />
              <select
                value={selectedNetwork}
                onChange={(e) => setSelectedNetwork(e.target.value)}
                className="bg-white/5 border border-white/10 rounded-lg px-4 py-2 focus:outline-none focus:border-nx-blue text-white"
              >
                <option value="all">All Networks</option>
                <option value="BSC">BSC</option>
                <option value="ETH">ETH</option>
                <option value="POLYGON">POLYGON</option>
              </select>
            </div>
          </div>

          {/* Gas Configurations */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
            {loading ? (
              <div className="col-span-2 text-center py-12 text-gray-400">
                Loading gas configurations...
              </div>
            ) : filteredConfigs.length === 0 ? (
              <div className="col-span-2 text-center py-12 text-gray-400">
                No configurations found for the selected network.
              </div>
            ) : (
              filteredConfigs.map((config) => (
                <div key={config._id} className="glass-effect rounded-xl p-6">
                  <div className="flex items-center justify-between mb-6">
                    <div className="flex items-center space-x-3">
                      <span className={`inline-flex items-center space-x-1 px-3 py-1 rounded-full text-sm ${getNetworkColor(config.network)}`}>
                        <span>{config.network}</span>
                      </span>
                      <span className={`inline-flex items-center space-x-1 px-2 py-1 rounded-full text-xs ${getStatusColor(config.isActive)}`}>
                        <span>{config.isActive ? 'Active' : 'Inactive'}</span>
                      </span>
                    </div>
                    <div className="flex items-center space-x-2">
                      <button
                        onClick={() => handleToggleStatus(config._id)}
                        className={`p-2 rounded-lg ${
                          config.isActive 
                            ? 'text-red-400 hover:bg-red-400/20' 
                            : 'text-green-400 hover:bg-green-400/20'
                        }`}
                      >
                        {config.isActive ? (
                          <ExclamationTriangleIcon className="w-4 h-4" />
                        ) : (
                          <CheckCircleIcon className="w-4 h-4" />
                        )}
                      </button>
                      <button
                        onClick={() => handleEditConfig(config)}
                        className="p-2 text-blue-400 hover:bg-blue-400/20 rounded-lg"
                      >
                        <PencilIcon className="w-4 h-4" />
                      </button>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4 mb-6">
                    <div>
                      <p className="text-sm text-gray-400 mb-1">Gas Price</p>
                      <p className="text-xl font-bold text-white">{config.gasPrice} Gwei</p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-400 mb-1">Gas Limit</p>
                      <p className="text-xl font-bold text-white">{config.gasLimit.toLocaleString()}</p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-400 mb-1">Priority Fee</p>
                      <p className="text-xl font-bold text-white">{config.priorityFee} Gwei</p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-400 mb-1">Currency</p>
                      <p className="text-xl font-bold text-white">{config.currency}</p>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4 mb-6">
                    <div>
                      <p className="text-sm text-gray-400 mb-1">Confirmation Time</p>
                      <div className="flex items-center space-x-2">
                        <ClockIcon className="w-4 h-4 text-gray-400" />
                        <p className="text-white">{config.averageConfirmationTime}s</p>
                      </div>
                    </div>
                    <div>
                      <p className="text-sm text-gray-400 mb-1">Success Rate</p>
                      <div className="flex items-center space-x-2">
                        <ChartBarIcon className="w-4 h-4 text-gray-400" />
                        <p className={`font-bold ${getSuccessRateColor(config.successRate)}`}>
                          {config.successRate}%
                        </p>
                      </div>
                    </div>
                  </div>

                  <div className="border-t border-white/10 pt-4">
                    <p className="text-sm text-gray-400 mb-2">Recent History</p>
                    <div className="space-y-2">
                      {getRecentHistory(config.network).map((history) => (
                        <div key={history._id} className="flex items-center justify-between text-sm">
                          <span className="text-gray-400">
                            {new Date(history.timestamp).toLocaleString()}
                          </span>
                          <div className="flex items-center space-x-2">
                            <span className="text-white">{history.gasPrice} Gwei</span>
                            {history.status === 'success' ? (
                              <ArrowTrendingUpIcon className="w-4 h-4 text-green-400" />
                            ) : (
                              <ArrowTrendingDownIcon className="w-4 h-4 text-red-400" />
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>

          {/* Edit Modal */}
          {showEditModal && editingConfig && (
            <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
              <div className="glass-effect rounded-xl p-6 max-w-md w-full">
                <div className="flex items-center justify-between mb-6">
                  <h2 className="text-xl font-semibold text-white">
                    Edit {editingConfig.network} Configuration
                  </h2>
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
                      Gas Price (Gwei)
                    </label>
                    <input
                      type="number"
                      step="0.1"
                      value={editingConfig.gasPrice}
                      onChange={(e) => setEditingConfig({
                        ...editingConfig,
                        gasPrice: parseFloat(e.target.value)
                      })}
                      className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-3 focus:outline-none focus:border-nx-blue text-white"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-400 mb-2">
                      Gas Limit
                    </label>
                    <input
                      type="number"
                      value={editingConfig.gasLimit}
                      onChange={(e) => setEditingConfig({
                        ...editingConfig,
                        gasLimit: parseInt(e.target.value)
                      })}
                      className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-3 focus:outline-none focus:border-nx-blue text-white"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-400 mb-2">
                      Priority Fee (Gwei)
                    </label>
                    <input
                      type="number"
                      step="0.1"
                      value={editingConfig.priorityFee}
                      onChange={(e) => setEditingConfig({
                        ...editingConfig,
                        priorityFee: parseFloat(e.target.value)
                      })}
                      className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-3 focus:outline-none focus:border-nx-blue text-white"
                    />
                  </div>

                  <div className="flex items-center justify-between">
                    <label className="text-sm font-medium text-gray-400">
                      Active Status
                    </label>
                    <button
                      onClick={() => setEditingConfig({
                        ...editingConfig,
                        isActive: !editingConfig.isActive
                      })}
                      className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                        editingConfig.isActive ? 'bg-blue-600' : 'bg-gray-600'
                      }`}
                    >
                      <span
                        className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                          editingConfig.isActive ? 'translate-x-6' : 'translate-x-1'
                        }`}
                      />
                    </button>
                  </div>
                </div>

                <div className="flex space-x-3 mt-6">
                  <button
                    onClick={handleSaveConfig}
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

export default GasManagementPage;
