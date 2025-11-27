import React, { useState, useEffect } from 'react';
import { 
  WalletIcon, 
  MagnifyingGlassIcon,
  EyeIcon,
  ArrowPathIcon,
  BanknotesIcon,
  ArrowUpIcon,
  ArrowDownIcon,
  CurrencyDollarIcon
} from '@heroicons/react/24/outline';
import AdminHeader from '../../components/AdminHeader';

interface Wallet {
  _id: string;
  userId: {
    _id: string;
    email: string;
    firstName: string;
    lastName: string;
  };
  address: string;
  network: 'BSC' | 'ETH' | 'POLYGON';
  balance: number;
  currency: string;
  isActive: boolean;
  createdAt: string;
  lastTransaction?: string;
}

interface Transaction {
  _id: string;
  walletId: string;
  type: 'deposit' | 'withdrawal';
  amount: number;
  currency: string;
  network: string;
  hash?: string;
  status: 'pending' | 'confirmed' | 'failed';
  createdAt: string;
}

const WalletManagementPage: React.FC = () => {
  const [wallets, setWallets] = useState<Wallet[]>([]);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedWallet, setSelectedWallet] = useState<Wallet | null>(null);
  const [showTransactions, setShowTransactions] = useState(false);

  // Mock data - replace with actual API calls
  useEffect(() => {
    const mockWallets: Wallet[] = [
      {
        _id: '1',
        userId: {
          _id: '1',
          email: 'user1@example.com',
          firstName: 'John',
          lastName: 'Doe'
        },
        address: '0x1234567890abcdef1234567890abcdef12345678',
        network: 'BSC',
        balance: 1500.50,
        currency: 'USDT',
        isActive: true,
        createdAt: '2024-01-15T10:30:00Z',
        lastTransaction: '2024-11-28T08:15:00Z'
      },
      {
        _id: '2',
        userId: {
          _id: '2',
          email: 'user2@example.com',
          firstName: 'Jane',
          lastName: 'Smith'
        },
        address: '0xabcdef1234567890abcdef1234567890abcdef12',
        network: 'ETH',
        balance: 3200.75,
        currency: 'USDT',
        isActive: true,
        createdAt: '2024-02-20T14:22:00Z',
        lastTransaction: '2024-11-27T16:45:00Z'
      },
      {
        _id: '3',
        userId: {
          _id: '3',
          email: 'user3@example.com',
          firstName: 'Bob',
          lastName: 'Wilson'
        },
        address: '0x567890abcdef1234567890abcdef1234567890ab',
        network: 'POLYGON',
        balance: 800.25,
        currency: 'USDT',
        isActive: false,
        createdAt: '2024-03-10T09:15:00Z'
      }
    ];

    const mockTransactions: Transaction[] = [
      {
        _id: '1',
        walletId: '1',
        type: 'deposit',
        amount: 500,
        currency: 'USDT',
        network: 'BSC',
        hash: '0xabc123...',
        status: 'confirmed',
        createdAt: '2024-11-28T08:15:00Z'
      },
      {
        _id: '2',
        walletId: '2',
        type: 'withdrawal',
        amount: 200,
        currency: 'USDT',
        network: 'ETH',
        hash: '0xdef456...',
        status: 'pending',
        createdAt: '2024-11-27T16:45:00Z'
      }
    ];
    
    setTimeout(() => {
      setWallets(mockWallets);
      setTransactions(mockTransactions);
      setLoading(false);
    }, 1000);
  }, []);

  const filteredWallets = wallets.filter(wallet =>
    wallet.userId.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
    wallet.userId.firstName.toLowerCase().includes(searchTerm.toLowerCase()) ||
    wallet.userId.lastName.toLowerCase().includes(searchTerm.toLowerCase()) ||
    wallet.address.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const getNetworkColor = (network: string) => {
    switch (network) {
      case 'BSC': return 'text-yellow-400 bg-yellow-400/20';
      case 'ETH': return 'text-blue-400 bg-blue-400/20';
      case 'POLYGON': return 'text-purple-400 bg-purple-400/20';
      default: return 'text-gray-400 bg-gray-400/20';
    }
  };

  const getStatusColor = (status: boolean) => {
    return status 
      ? 'text-green-400 bg-green-400/20' 
      : 'text-red-400 bg-red-400/20';
  };

  const getTransactionStatusColor = (status: string) => {
    switch (status) {
      case 'confirmed': return 'text-green-400 bg-green-400/20';
      case 'pending': return 'text-yellow-400 bg-yellow-400/20';
      case 'failed': return 'text-red-400 bg-red-400/20';
      default: return 'text-gray-400 bg-gray-400/20';
    }
  };

  const handleViewTransactions = (wallet: Wallet) => {
    setSelectedWallet(wallet);
    setShowTransactions(true);
  };

  const formatAddress = (address: string) => {
    return `${address.slice(0, 6)}...${address.slice(-4)}`;
  };

  return (
    <>
      <AdminHeader />
      <div className="min-h-screen bg-gray-900 text-white p-6">
        <div className="max-w-7xl mx-auto">
          {/* Header */}
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-white mb-2">Wallet Management</h1>
            <p className="text-gray-400">Monitor and manage user wallets</p>
          </div>

          {/* Stats Cards */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
            <div className="glass-effect rounded-xl p-6">
              <div className="flex items-center justify-between mb-4">
                <WalletIcon className="w-8 h-8 text-blue-400" />
                <span className="text-2xl font-bold">{wallets.length}</span>
              </div>
              <p className="text-gray-400">Total Wallets</p>
            </div>
            <div className="glass-effect rounded-xl p-6">
              <div className="flex items-center justify-between mb-4">
                <BanknotesIcon className="w-8 h-8 text-green-400" />
                <span className="text-2xl font-bold">
                  ${wallets.reduce((sum, w) => sum + w.balance, 0).toLocaleString()}
                </span>
              </div>
              <p className="text-gray-400">Total Balance</p>
            </div>
            <div className="glass-effect rounded-xl p-6">
              <div className="flex items-center justify-between mb-4">
                <ArrowUpIcon className="w-8 h-8 text-yellow-400" />
                <span className="text-2xl font-bold">
                  {wallets.filter(w => w.isActive).length}
                </span>
              </div>
              <p className="text-gray-400">Active Wallets</p>
            </div>
            <div className="glass-effect rounded-xl p-6">
              <div className="flex items-center justify-between mb-4">
                <CurrencyDollarIcon className="w-8 h-8 text-purple-400" />
                <span className="text-2xl font-bold">{transactions.length}</span>
              </div>
              <p className="text-gray-400">Transactions</p>
            </div>
          </div>

          {/* Search Bar */}
          <div className="glass-effect rounded-xl p-4 mb-6">
            <div className="relative">
              <MagnifyingGlassIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
              <input
                type="text"
                placeholder="Search wallets by user, address..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-3 bg-white/5 border border-white/10 rounded-lg focus:outline-none focus:border-nx-blue text-white placeholder-gray-400"
              />
            </div>
          </div>

          {/* Wallets Table */}
          <div className="glass-effect rounded-xl overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-white/10">
                    <th className="text-left py-4 px-6 text-sm font-medium text-gray-400">User</th>
                    <th className="text-left py-4 px-6 text-sm font-medium text-gray-400">Address</th>
                    <th className="text-left py-4 px-6 text-sm font-medium text-gray-400">Network</th>
                    <th className="text-left py-4 px-6 text-sm font-medium text-gray-400">Balance</th>
                    <th className="text-left py-4 px-6 text-sm font-medium text-gray-400">Status</th>
                    <th className="text-left py-4 px-6 text-sm font-medium text-gray-400">Last Activity</th>
                    <th className="text-left py-4 px-6 text-sm font-medium text-gray-400">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {loading ? (
                    <tr>
                      <td colSpan={7} className="py-12 text-center text-gray-400">
                        Loading wallets...
                      </td>
                    </tr>
                  ) : filteredWallets.length === 0 ? (
                    <tr>
                      <td colSpan={7} className="py-12 text-center text-gray-400">
                        No wallets found matching your search.
                      </td>
                    </tr>
                  ) : (
                    filteredWallets.map((wallet) => (
                      <tr key={wallet._id} className="border-b border-white/5 hover:bg-white/5">
                        <td className="py-4 px-6">
                          <div>
                            <p className="text-white font-medium">
                              {wallet.userId.firstName} {wallet.userId.lastName}
                            </p>
                            <p className="text-sm text-gray-400">{wallet.userId.email}</p>
                          </div>
                        </td>
                        <td className="py-4 px-6">
                          <div className="flex items-center space-x-2">
                            <code className="text-xs bg-white/10 px-2 py-1 rounded">
                              {formatAddress(wallet.address)}
                            </code>
                            <button className="text-blue-400 hover:text-blue-300">
                              <EyeIcon className="w-4 h-4" />
                            </button>
                          </div>
                        </td>
                        <td className="py-4 px-6">
                          <span className={`inline-flex items-center space-x-1 px-2 py-1 rounded-full text-xs ${getNetworkColor(wallet.network)}`}>
                            <span>{wallet.network}</span>
                          </span>
                        </td>
                        <td className="py-4 px-6">
                          <p className="text-white font-medium">
                            {wallet.balance.toLocaleString()} {wallet.currency}
                          </p>
                        </td>
                        <td className="py-4 px-6">
                          <span className={`inline-flex items-center space-x-1 px-2 py-1 rounded-full text-xs ${getStatusColor(wallet.isActive)}`}>
                            <span>{wallet.isActive ? 'Active' : 'Inactive'}</span>
                          </span>
                        </td>
                        <td className="py-4 px-6">
                          {wallet.lastTransaction ? (
                            <p className="text-sm text-gray-400">
                              {new Date(wallet.lastTransaction).toLocaleDateString()}
                            </p>
                          ) : (
                            <p className="text-sm text-gray-500">No activity</p>
                          )}
                        </td>
                        <td className="py-4 px-6">
                          <div className="flex items-center space-x-2">
                            <button
                              onClick={() => handleViewTransactions(wallet)}
                              className="p-2 text-blue-400 hover:bg-blue-400/20 rounded-lg"
                            >
                              <EyeIcon className="w-4 h-4" />
                            </button>
                            <button className="p-2 text-yellow-400 hover:bg-yellow-400/20 rounded-lg">
                              <ArrowPathIcon className="w-4 h-4" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>

          {/* Transactions Modal */}
          {showTransactions && selectedWallet && (
            <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
              <div className="glass-effect rounded-xl p-6 max-w-4xl w-full max-h-[80vh] overflow-y-auto">
                <div className="flex items-center justify-between mb-6">
                  <h2 className="text-xl font-semibold text-white">
                    Transactions - {selectedWallet.userId.firstName} {selectedWallet.userId.lastName}
                  </h2>
                  <button
                    onClick={() => setShowTransactions(false)}
                    className="text-gray-400 hover:text-white"
                  >
                    ×
                  </button>
                </div>

                <div className="mb-4 p-4 bg-white/5 rounded-lg">
                  <p className="text-sm text-gray-400">Wallet Address</p>
                  <code className="text-white">{selectedWallet.address}</code>
                </div>

                <div className="space-y-3">
                  {transactions
                    .filter(t => t.walletId === selectedWallet._id)
                    .map((transaction) => (
                      <div key={transaction._id} className="glass-effect rounded-lg p-4">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center space-x-3">
                            <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${
                              transaction.type === 'deposit' 
                                ? 'bg-green-500/20' 
                                : 'bg-red-500/20'
                            }`}>
                              {transaction.type === 'deposit' ? (
                                <ArrowDownIcon className="w-5 h-5 text-green-400" />
                              ) : (
                                <ArrowUpIcon className="w-5 h-5 text-red-400" />
                              )}
                            </div>
                            <div>
                              <p className="text-white font-medium capitalize">
                                {transaction.type}
                              </p>
                              <p className="text-sm text-gray-400">
                                {new Date(transaction.createdAt).toLocaleString()}
                              </p>
                            </div>
                          </div>
                          <div className="text-right">
                            <p className={`font-bold ${
                              transaction.type === 'deposit' ? 'text-green-400' : 'text-red-400'
                            }`}>
                              {transaction.type === 'deposit' ? '+' : '-'}
                              {transaction.amount} {transaction.currency}
                            </p>
                            <span className={`inline-flex items-center space-x-1 px-2 py-1 rounded-full text-xs ${getTransactionStatusColor(transaction.status)}`}>
                              <span>{transaction.status}</span>
                            </span>
                          </div>
                        </div>
                        {transaction.hash && (
                          <div className="mt-3 pt-3 border-t border-white/10">
                            <p className="text-sm text-gray-400">Transaction Hash</p>
                            <code className="text-xs text-blue-400">{transaction.hash}</code>
                          </div>
                        )}
                      </div>
                    ))}
                  
                  {transactions.filter(t => t.walletId === selectedWallet._id).length === 0 && (
                    <div className="text-center py-8 text-gray-400">
                      No transactions found for this wallet.
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </>
  );
};

export default WalletManagementPage;
