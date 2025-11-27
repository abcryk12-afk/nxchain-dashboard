import React, { useState, useEffect } from 'react';
import { 
  ArrowPathIcon, 
  MagnifyingGlassIcon,
  EyeIcon,
  CheckCircleIcon,
  XCircleIcon,
  ClockIcon,
  ArrowUpIcon,
  ArrowDownIcon,
  CurrencyDollarIcon,
  FunnelIcon
} from '@heroicons/react/24/outline';
import Header from '../../components/Header';

interface Transaction {
  _id: string;
  userId: {
    _id: string;
    email: string;
    firstName: string;
    lastName: string;
  };
  type: 'deposit' | 'withdrawal';
  amount: number;
  currency: string;
  network: string;
  walletAddress: string;
  hash?: string;
  status: 'pending' | 'confirmed' | 'failed';
  description: string;
  createdAt: string;
  updatedAt: string;
  adminNotes?: string;
}

const TransactionsPage: React.FC = () => {
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [typeFilter, setTypeFilter] = useState<string>('all');
  const [selectedTransaction, setSelectedTransaction] = useState<Transaction | null>(null);
  const [showDetails, setShowDetails] = useState(false);

  // Mock data - replace with actual API call
  useEffect(() => {
    const mockTransactions: Transaction[] = [
      {
        _id: '1',
        userId: {
          _id: '1',
          email: 'user1@example.com',
          firstName: 'John',
          lastName: 'Doe'
        },
        type: 'deposit',
        amount: 500,
        currency: 'USDT',
        network: 'BSC',
        walletAddress: '0x1234567890abcdef1234567890abcdef12345678',
        hash: '0xabc123def4567890abcdef1234567890abcdef12345678',
        status: 'confirmed',
        description: 'USDT deposit - 500 USDT on Binance Smart Chain',
        createdAt: '2024-11-28T08:15:00Z',
        updatedAt: '2024-11-28T08:30:00Z',
        adminNotes: 'Verified and confirmed'
      },
      {
        _id: '2',
        userId: {
          _id: '2',
          email: 'user2@example.com',
          firstName: 'Jane',
          lastName: 'Smith'
        },
        type: 'withdrawal',
        amount: 200,
        currency: 'USDT',
        network: 'ETH',
        walletAddress: '0xabcdef1234567890abcdef1234567890abcdef12',
        hash: '0xdef4567890abcdef1234567890abcdef1234567890abc',
        status: 'pending',
        description: 'Withdrawal to external wallet',
        createdAt: '2024-11-27T16:45:00Z',
        updatedAt: '2024-11-27T16:45:00Z',
        adminNotes: 'Pending verification'
      },
      {
        _id: '3',
        userId: {
          _id: '3',
          email: 'user3@example.com',
          firstName: 'Bob',
          lastName: 'Wilson'
        },
        type: 'deposit',
        amount: 1000,
        currency: 'USDT',
        network: 'POLYGON',
        walletAddress: '0x567890abcdef1234567890abcdef1234567890ab',
        hash: '0x567890abcdef1234567890abcdef1234567890abcdef12',
        status: 'failed',
        description: 'Failed deposit - insufficient gas',
        createdAt: '2024-11-26T12:30:00Z',
        updatedAt: '2024-11-26T12:45:00Z',
        adminNotes: 'Transaction failed due to network congestion'
      },
      {
        _id: '4',
        userId: {
          _id: '1',
          email: 'user1@example.com',
          firstName: 'John',
          lastName: 'Doe'
        },
        type: 'withdrawal',
        amount: 150,
        currency: 'USDT',
        network: 'BSC',
        walletAddress: '0x1234567890abcdef1234567890abcdef12345678',
        hash: '0x7890abcdef1234567890abcdef1234567890abcdef12',
        status: 'confirmed',
        description: 'Withdrawal processed successfully',
        createdAt: '2024-11-25T14:20:00Z',
        updatedAt: '2024-11-25T14:35:00Z'
      }
    ];
    
    setTimeout(() => {
      setTransactions(mockTransactions);
      setLoading(false);
    }, 1000);
  }, []);

  const filteredTransactions = transactions.filter(transaction => {
    const matchesSearch = 
      transaction.userId.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
      transaction.userId.firstName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      transaction.userId.lastName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      transaction.hash?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      transaction.walletAddress.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesStatus = statusFilter === 'all' || transaction.status === statusFilter;
    const matchesType = typeFilter === 'all' || transaction.type === typeFilter;

    return matchesSearch && matchesStatus && matchesType;
  });

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'confirmed': return 'text-green-400 bg-green-400/20';
      case 'pending': return 'text-yellow-400 bg-yellow-400/20';
      case 'failed': return 'text-red-400 bg-red-400/20';
      default: return 'text-gray-400 bg-gray-400/20';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'confirmed': return <CheckCircleIcon className="w-4 h-4" />;
      case 'pending': return <ClockIcon className="w-4 h-4" />;
      case 'failed': return <XCircleIcon className="w-4 h-4" />;
      default: return <ClockIcon className="w-4 h-4" />;
    }
  };

  const getNetworkColor = (network: string) => {
    switch (network) {
      case 'BSC': return 'text-yellow-400 bg-yellow-400/20';
      case 'ETH': return 'text-blue-400 bg-blue-400/20';
      case 'POLYGON': return 'text-purple-400 bg-purple-400/20';
      default: return 'text-gray-400 bg-gray-400/20';
    }
  };

  const handleUpdateStatus = (transactionId: string, newStatus: string) => {
    // Handle status update
    console.log('Update status:', transactionId, newStatus);
  };

  const handleViewDetails = (transaction: Transaction) => {
    setSelectedTransaction(transaction);
    setShowDetails(true);
  };

  const formatAddress = (address: string) => {
    return `${address.slice(0, 6)}...${address.slice(-4)}`;
  };

  const formatHash = (hash: string) => {
    return `${hash.slice(0, 8)}...${hash.slice(-8)}`;
  };

  return (
    <>
      <Header />
      <div className="min-h-screen bg-gray-900 text-white p-6">
        <div className="max-w-7xl mx-auto">
          {/* Header */}
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-white mb-2">Transactions</h1>
            <p className="text-gray-400">View and monitor all transactions</p>
          </div>

          {/* Stats Cards */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
            <div className="glass-effect rounded-xl p-6">
              <div className="flex items-center justify-between mb-4">
                <ArrowPathIcon className="w-8 h-8 text-blue-400" />
                <span className="text-2xl font-bold">{transactions.length}</span>
              </div>
              <p className="text-gray-400">Total Transactions</p>
            </div>
            <div className="glass-effect rounded-xl p-6">
              <div className="flex items-center justify-between mb-4">
                <CheckCircleIcon className="w-8 h-8 text-green-400" />
                <span className="text-2xl font-bold">
                  {transactions.filter(t => t.status === 'confirmed').length}
                </span>
              </div>
              <p className="text-gray-400">Confirmed</p>
            </div>
            <div className="glass-effect rounded-xl p-6">
              <div className="flex items-center justify-between mb-4">
                <ClockIcon className="w-8 h-8 text-yellow-400" />
                <span className="text-2xl font-bold">
                  {transactions.filter(t => t.status === 'pending').length}
                </span>
              </div>
              <p className="text-gray-400">Pending</p>
            </div>
            <div className="glass-effect rounded-xl p-6">
              <div className="flex items-center justify-between mb-4">
                <CurrencyDollarIcon className="w-8 h-8 text-purple-400" />
                <span className="text-2xl font-bold">
                  ${transactions.reduce((sum, t) => sum + t.amount, 0).toLocaleString()}
                </span>
              </div>
              <p className="text-gray-400">Total Volume</p>
            </div>
          </div>

          {/* Filters and Search */}
          <div className="glass-effect rounded-xl p-4 mb-6">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div className="relative">
                <MagnifyingGlassIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                <input
                  type="text"
                  placeholder="Search transactions..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-10 pr-4 py-3 bg-white/5 border border-white/10 rounded-lg focus:outline-none focus:border-nx-blue text-white placeholder-gray-400"
                />
              </div>
              
              <div className="flex items-center space-x-2">
                <FunnelIcon className="w-5 h-5 text-gray-400" />
                <select
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
                  className="flex-1 bg-white/5 border border-white/10 rounded-lg px-4 py-3 focus:outline-none focus:border-nx-blue text-white"
                >
                  <option value="all">All Status</option>
                  <option value="pending">Pending</option>
                  <option value="confirmed">Confirmed</option>
                  <option value="failed">Failed</option>
                </select>
              </div>

              <div className="flex items-center space-x-2">
                <select
                  value={typeFilter}
                  onChange={(e) => setTypeFilter(e.target.value)}
                  className="flex-1 bg-white/5 border border-white/10 rounded-lg px-4 py-3 focus:outline-none focus:border-nx-blue text-white"
                >
                  <option value="all">All Types</option>
                  <option value="deposit">Deposits</option>
                  <option value="withdrawal">Withdrawals</option>
                </select>
              </div>

              <button className="btn-primary py-3 px-6 rounded-lg font-medium">
                <ArrowPathIcon className="w-5 h-5 mr-2" />
                Refresh
              </button>
            </div>
          </div>

          {/* Transactions Table */}
          <div className="glass-effect rounded-xl overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-white/10">
                    <th className="text-left py-4 px-6 text-sm font-medium text-gray-400">User</th>
                    <th className="text-left py-4 px-6 text-sm font-medium text-gray-400">Type</th>
                    <th className="text-left py-4 px-6 text-sm font-medium text-gray-400">Amount</th>
                    <th className="text-left py-4 px-6 text-sm font-medium text-gray-400">Network</th>
                    <th className="text-left py-4 px-6 text-sm font-medium text-gray-400">Wallet</th>
                    <th className="text-left py-4 px-6 text-sm font-medium text-gray-400">Hash</th>
                    <th className="text-left py-4 px-6 text-sm font-medium text-gray-400">Status</th>
                    <th className="text-left py-4 px-6 text-sm font-medium text-gray-400">Date</th>
                    <th className="text-left py-4 px-6 text-sm font-medium text-gray-400">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {loading ? (
                    <tr>
                      <td colSpan={9} className="py-12 text-center text-gray-400">
                        Loading transactions...
                      </td>
                    </tr>
                  ) : filteredTransactions.length === 0 ? (
                    <tr>
                      <td colSpan={9} className="py-12 text-center text-gray-400">
                        No transactions found matching your criteria.
                      </td>
                    </tr>
                  ) : (
                    filteredTransactions.map((transaction) => (
                      <tr key={transaction._id} className="border-b border-white/5 hover:bg-white/5">
                        <td className="py-4 px-6">
                          <div>
                            <p className="text-white font-medium">
                              {transaction.userId.firstName} {transaction.userId.lastName}
                            </p>
                            <p className="text-sm text-gray-400">{transaction.userId.email}</p>
                          </div>
                        </td>
                        <td className="py-4 px-6">
                          <div className="flex items-center space-x-2">
                            <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${
                              transaction.type === 'deposit' 
                                ? 'bg-green-500/20' 
                                : 'bg-red-500/20'
                            }`}>
                              {transaction.type === 'deposit' ? (
                                <ArrowDownIcon className="w-4 h-4 text-green-400" />
                              ) : (
                                <ArrowUpIcon className="w-4 h-4 text-red-400" />
                              )}
                            </div>
                            <span className="text-white capitalize">{transaction.type}</span>
                          </div>
                        </td>
                        <td className="py-4 px-6">
                          <p className={`font-bold ${
                            transaction.type === 'deposit' ? 'text-green-400' : 'text-red-400'
                          }`}>
                            {transaction.type === 'deposit' ? '+' : '-'}
                            {transaction.amount} {transaction.currency}
                          </p>
                        </td>
                        <td className="py-4 px-6">
                          <span className={`inline-flex items-center space-x-1 px-2 py-1 rounded-full text-xs ${getNetworkColor(transaction.network)}`}>
                            <span>{transaction.network}</span>
                          </span>
                        </td>
                        <td className="py-4 px-6">
                          <code className="text-xs bg-white/10 px-2 py-1 rounded">
                            {formatAddress(transaction.walletAddress)}
                          </code>
                        </td>
                        <td className="py-4 px-6">
                          {transaction.hash ? (
                            <code className="text-xs text-blue-400 bg-white/10 px-2 py-1 rounded">
                              {formatHash(transaction.hash)}
                            </code>
                          ) : (
                            <span className="text-xs text-gray-500">No hash</span>
                          )}
                        </td>
                        <td className="py-4 px-6">
                          <span className={`inline-flex items-center space-x-1 px-2 py-1 rounded-full text-xs ${getStatusColor(transaction.status)}`}>
                            {getStatusIcon(transaction.status)}
                            <span>{transaction.status}</span>
                          </span>
                        </td>
                        <td className="py-4 px-6">
                          <div>
                            <p className="text-white">
                              {new Date(transaction.createdAt).toLocaleDateString()}
                            </p>
                            <p className="text-xs text-gray-400">
                              {new Date(transaction.createdAt).toLocaleTimeString()}
                            </p>
                          </div>
                        </td>
                        <td className="py-4 px-6">
                          <div className="flex items-center space-x-2">
                            <button
                              onClick={() => handleViewDetails(transaction)}
                              className="p-2 text-blue-400 hover:bg-blue-400/20 rounded-lg"
                            >
                              <EyeIcon className="w-4 h-4" />
                            </button>
                            {transaction.status === 'pending' && (
                              <>
                                <button
                                  onClick={() => handleUpdateStatus(transaction._id, 'confirmed')}
                                  className="p-2 text-green-400 hover:bg-green-400/20 rounded-lg"
                                >
                                  <CheckCircleIcon className="w-4 h-4" />
                                </button>
                                <button
                                  onClick={() => handleUpdateStatus(transaction._id, 'failed')}
                                  className="p-2 text-red-400 hover:bg-red-400/20 rounded-lg"
                                >
                                  <XCircleIcon className="w-4 h-4" />
                                </button>
                              </>
                            )}
                          </div>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>

          {/* Transaction Details Modal */}
          {showDetails && selectedTransaction && (
            <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
              <div className="glass-effect rounded-xl p-6 max-w-2xl w-full">
                <div className="flex items-center justify-between mb-6">
                  <h2 className="text-xl font-semibold text-white">Transaction Details</h2>
                  <button
                    onClick={() => setShowDetails(false)}
                    className="text-gray-400 hover:text-white"
                  >
                    ×
                  </button>
                </div>

                <div className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <p className="text-sm text-gray-400">Transaction ID</p>
                      <code className="text-white">{selectedTransaction._id}</code>
                    </div>
                    <div>
                      <p className="text-sm text-gray-400">Type</p>
                      <p className="text-white capitalize">{selectedTransaction.type}</p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-400">Amount</p>
                      <p className={`font-bold ${
                        selectedTransaction.type === 'deposit' ? 'text-green-400' : 'text-red-400'
                      }`}>
                        {selectedTransaction.type === 'deposit' ? '+' : '-'}
                        {selectedTransaction.amount} {selectedTransaction.currency}
                      </p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-400">Status</p>
                      <span className={`inline-flex items-center space-x-1 px-2 py-1 rounded-full text-xs ${getStatusColor(selectedTransaction.status)}`}>
                        {getStatusIcon(selectedTransaction.status)}
                        <span>{selectedTransaction.status}</span>
                      </span>
                    </div>
                    <div>
                      <p className="text-sm text-gray-400">Network</p>
                      <span className={`inline-flex items-center space-x-1 px-2 py-1 rounded-full text-xs ${getNetworkColor(selectedTransaction.network)}`}>
                        <span>{selectedTransaction.network}</span>
                      </span>
                    </div>
                    <div>
                      <p className="text-sm text-gray-400">User</p>
                      <p className="text-white">
                        {selectedTransaction.userId.firstName} {selectedTransaction.userId.lastName}
                      </p>
                      <p className="text-sm text-gray-400">{selectedTransaction.userId.email}</p>
                    </div>
                  </div>

                  <div>
                    <p className="text-sm text-gray-400 mb-2">Wallet Address</p>
                    <code className="text-white bg-white/10 px-3 py-2 rounded block">
                      {selectedTransaction.walletAddress}
                    </code>
                  </div>

                  {selectedTransaction.hash && (
                    <div>
                      <p className="text-sm text-gray-400 mb-2">Transaction Hash</p>
                      <code className="text-blue-400 bg-white/10 px-3 py-2 rounded block">
                        {selectedTransaction.hash}
                      </code>
                    </div>
                  )}

                  <div>
                    <p className="text-sm text-gray-400 mb-2">Description</p>
                    <p className="text-white">{selectedTransaction.description}</p>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <p className="text-sm text-gray-400">Created</p>
                      <p className="text-white">
                        {new Date(selectedTransaction.createdAt).toLocaleString()}
                      </p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-400">Updated</p>
                      <p className="text-white">
                        {new Date(selectedTransaction.updatedAt).toLocaleString()}
                      </p>
                    </div>
                  </div>

                  {selectedTransaction.adminNotes && (
                    <div>
                      <p className="text-sm text-gray-400 mb-2">Admin Notes</p>
                      <p className="text-white bg-white/5 p-3 rounded">
                        {selectedTransaction.adminNotes}
                      </p>
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

export default TransactionsPage;
