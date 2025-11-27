import React, { useState, useEffect } from 'react';
import { 
  ArrowUpTrayIcon, 
  BanknotesIcon,
  CheckCircleIcon,
  ClockIcon,
  ExclamationTriangleIcon,
  WalletIcon
} from '@heroicons/react/24/outline';
import { withdrawal } from '../services/api';
import { Transaction } from '../types';
import Header from '../components/Header';

const WithdrawalPage: React.FC = () => {
  const [amount, setAmount] = useState('');
  const [walletAddress, setWalletAddress] = useState('');
  const [note, setNote] = useState('');
  const [loading, setLoading] = useState(false);
  const [withdrawableBalance, setWithdrawableBalance] = useState(250); // Mock balance
  const [withdrawalHistory, setWithdrawalHistory] = useState<Transaction[]>([]);

  useEffect(() => {
    // Mock withdrawal history
    setWithdrawalHistory([
      {
        _id: '1',
        userId: '',
        type: 'withdrawal',
        amount: 100,
        status: 'approved',
        description: 'Withdrawal to 0x1234...5678',
        createdAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString()
      },
      {
        _id: '2',
        userId: '',
        type: 'withdrawal',
        amount: 50,
        status: 'pending',
        description: 'Withdrawal to 0xabcd...efgh',
        createdAt: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString()
      }
    ]);
  }, []);

  const handleWithdrawal = async () => {
    if (!amount || parseFloat(amount) <= 0) {
      alert('Please enter a valid amount');
      return;
    }

    if (parseFloat(amount) > withdrawableBalance) {
      alert('Insufficient withdrawable balance');
      return;
    }

    if (!walletAddress) {
      alert('Please enter your wallet address');
      return;
    }

    if (!walletAddress.startsWith('0x') || walletAddress.length !== 42) {
      alert('Please enter a valid BEP-20 wallet address');
      return;
    }

    setLoading(true);
    try {
      await withdrawal.create({
        amount: parseFloat(amount),
        walletAddress,
        note: note || undefined
      });
      
      // Update mock data
      setWithdrawableBalance(withdrawableBalance - parseFloat(amount));
      const newTransaction: Transaction = {
        _id: Date.now().toString(),
        userId: '',
        type: 'withdrawal',
        amount: parseFloat(amount),
        status: 'pending',
        description: `Withdrawal to ${walletAddress.slice(0, 6)}...${walletAddress.slice(-4)}`,
        createdAt: new Date().toISOString()
      };
      setWithdrawalHistory([newTransaction, ...withdrawalHistory]);
      
      // Reset form
      setAmount('');
      setWalletAddress('');
      setNote('');
      alert('Withdrawal request submitted successfully!');
    } catch (error) {
      console.error('Withdrawal failed:', error);
      alert('Failed to submit withdrawal request');
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'approved': return 'text-green-400 bg-green-400/20';
      case 'pending': return 'text-yellow-400 bg-yellow-400/20';
      case 'rejected': return 'text-red-400 bg-red-400/20';
      default: return 'text-gray-400 bg-gray-400/20';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'approved': return <CheckCircleIcon className="w-4 h-4" />;
      case 'pending': return <ClockIcon className="w-4 h-4" />;
      case 'rejected': return <ExclamationTriangleIcon className="w-4 h-4" />;
      default: return <ClockIcon className="w-4 h-4" />;
    }
  };

  const formatAddress = (address: string) => {
    return `${address.slice(0, 6)}...${address.slice(-4)}`;
  };

  return (
    <>
      <Header />
      <div className="max-w-4xl mx-auto space-y-6">
        <div className="glass-effect rounded-xl p-6">
          <h1 className="text-2xl font-bold gradient-text mb-2">Withdraw Funds</h1>
          <p className="text-gray-400">
            Withdraw your earnings to your BEP-20 wallet address
          </p>
      </div>

      {/* Balance Overview */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="glass-effect rounded-xl p-6">
          <div className="flex items-center justify-between mb-4">
            <div className="w-12 h-12 bg-gradient-to-r from-green-400 to-emerald-500 rounded-lg flex items-center justify-center">
              <BanknotesIcon className="w-6 h-6 text-white" />
            </div>
          </div>
          <div className="space-y-1">
            <p className="text-gray-400 text-sm">Withdrawable Balance</p>
            <p className="text-2xl font-bold text-white">
              ${withdrawableBalance.toLocaleString()}
            </p>
          </div>
        </div>

        <div className="glass-effect rounded-xl p-6">
          <div className="flex items-center justify-between mb-4">
            <div className="w-12 h-12 bg-gradient-to-r from-yellow-400 to-orange-500 rounded-lg flex items-center justify-center">
              <ClockIcon className="w-6 h-6 text-white" />
            </div>
          </div>
          <div className="space-y-1">
            <p className="text-gray-400 text-sm">Pending Withdrawals</p>
            <p className="text-2xl font-bold text-yellow-400">
              ${withdrawalHistory.filter(w => w.status === 'pending').reduce((sum, w) => sum + w.amount, 0).toLocaleString()}
            </p>
          </div>
        </div>

        <div className="glass-effect rounded-xl p-6">
          <div className="flex items-center justify-between mb-4">
            <div className="w-12 h-12 bg-gradient-to-r from-blue-400 to-cyan-500 rounded-lg flex items-center justify-center">
              <WalletIcon className="w-6 h-6 text-white" />
            </div>
          </div>
          <div className="space-y-1">
            <p className="text-gray-400 text-sm">Total Withdrawn</p>
            <p className="text-2xl font-bold text-blue-400">
              ${withdrawalHistory.filter(w => w.status === 'approved').reduce((sum, w) => sum + w.amount, 0).toLocaleString()}
            </p>
          </div>
        </div>
      </div>

      {/* Withdrawal Form */}
      <div className="glass-effect rounded-xl p-6">
        <h2 className="text-xl font-semibold text-white mb-6 flex items-center">
          <ArrowUpTrayIcon className="w-6 h-6 mr-2 text-nx-blue" />
          Request Withdrawal
        </h2>

        <div className="space-y-6">
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Withdrawal Amount (USD)
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <span className="text-gray-400">$</span>
              </div>
              <input
                type="number"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                placeholder="Enter amount"
                className="w-full pl-8 pr-3 py-3 bg-white/5 border border-white/10 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-nx-blue focus:border-transparent"
                min="10"
                max={withdrawableBalance}
                step="0.01"
              />
            </div>
            <div className="flex justify-between text-xs text-gray-400 mt-1">
              <span>Minimum: $10</span>
              <span>Available: ${withdrawableBalance}</span>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Wallet Address (BEP-20)
            </label>
            <input
              type="text"
              value={walletAddress}
              onChange={(e) => setWalletAddress(e.target.value)}
              placeholder="0x..."
              className="w-full px-3 py-3 bg-white/5 border border-white/10 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-nx-blue focus:border-transparent font-mono text-sm"
            />
            <p className="text-xs text-gray-400 mt-1">
              Enter your BEP-20 compatible wallet address (USDT, BUSD, etc.)
            </p>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Withdrawal Note (Optional)
            </label>
            <textarea
              value={note}
              onChange={(e) => setNote(e.target.value)}
              placeholder="Add any additional notes..."
              rows={3}
              className="w-full px-3 py-3 bg-white/5 border border-white/10 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-nx-blue focus:border-transparent resize-none"
            />
          </div>

          <div className="bg-yellow-400/10 border border-yellow-400/20 rounded-lg p-4">
            <div className="flex items-start space-x-3">
              <ExclamationTriangleIcon className="w-5 h-5 text-yellow-400 flex-shrink-0 mt-0.5" />
              <div>
                <p className="text-yellow-400 font-medium text-sm">Important Information</p>
                <ul className="text-gray-300 text-sm mt-1 space-y-1">
                  <li>• Withdrawals are processed within 24-48 hours</li>
                  <li>• Minimum withdrawal amount is $10</li>
                  <li>• Network fees may apply</li>
                  <li>• Double-check your wallet address before submitting</li>
                </ul>
              </div>
            </div>
          </div>

          <button
            onClick={handleWithdrawal}
            disabled={!amount || parseFloat(amount) < 10 || parseFloat(amount) > withdrawableBalance || !walletAddress || loading}
            className="w-full btn-primary py-3 rounded-lg font-medium disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? 'Processing...' : 'Submit Withdrawal Request'}
          </button>
        </div>
      </div>

      {/* Withdrawal History */}
      <div className="glass-effect rounded-xl p-6">
        <h2 className="text-xl font-semibold text-white mb-6 flex items-center">
          <ClockIcon className="w-6 h-6 mr-2 text-nx-blue" />
          Withdrawal History
        </h2>

        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-white/10">
                <th className="text-left py-3 px-4 text-sm font-medium text-gray-400">Date</th>
                <th className="text-left py-3 px-4 text-sm font-medium text-gray-400">Amount</th>
                <th className="text-left py-3 px-4 text-sm font-medium text-gray-400">Wallet Address</th>
                <th className="text-left py-3 px-4 text-sm font-medium text-gray-400">Status</th>
              </tr>
            </thead>
            <tbody>
              {withdrawalHistory.map((transaction) => (
                <tr key={transaction._id} className="border-b border-white/5">
                  <td className="py-3 px-4 text-gray-300">
                    {new Date(transaction.createdAt).toLocaleDateString()}
                  </td>
                  <td className="py-3 px-4 text-red-400 font-medium">
                    -${transaction.amount.toLocaleString()}
                  </td>
                  <td className="py-3 px-4">
                    <div className="flex items-center space-x-2">
                      <WalletIcon className="w-4 h-4 text-gray-400" />
                      <span className="text-white font-mono text-sm">
                        {transaction.description.includes('0x') 
                          ? formatAddress(transaction.description.split('to ')[1])
                          : 'N/A'
                        }
                      </span>
                    </div>
                  </td>
                  <td className="py-3 px-4">
                    <span className={`inline-flex items-center space-x-1 px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(transaction.status)}`}>
                      {getStatusIcon(transaction.status)}
                      <span>{transaction.status}</span>
                    </span>
                  </td>
                </tr>
              ))}
              
              {withdrawalHistory.length === 0 && (
                <tr>
                  <td colSpan={4} className="py-8 text-center text-gray-400">
                    No withdrawal history yet
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="glass-effect rounded-xl p-6">
          <h3 className="text-lg font-semibold text-white mb-4">Withdrawal Limits</h3>
          <div className="space-y-3">
            <div className="flex justify-between">
              <span className="text-gray-400">Minimum withdrawal:</span>
              <span className="text-white font-medium">$10</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-400">Maximum withdrawal:</span>
              <span className="text-white font-medium">$10,000/day</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-400">Processing time:</span>
              <span className="text-white font-medium">24-48 hours</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-400">Network fee:</span>
              <span className="text-white font-medium">~$2-5 USDT</span>
            </div>
          </div>
        </div>

        <div className="glass-effect rounded-xl p-6">
          <h3 className="text-lg font-semibold text-white mb-4">Supported Networks</h3>
          <div className="space-y-3">
            <div className="flex items-center space-x-3">
              <div className="w-8 h-8 bg-yellow-400/20 rounded-full flex items-center justify-center">
                <span className="text-xs text-yellow-400 font-bold">BSC</span>
              </div>
              <div>
                <p className="text-white font-medium">Binance Smart Chain</p>
                <p className="text-xs text-gray-400">BEP-20 tokens</p>
              </div>
            </div>
            <div className="flex items-center space-x-3">
              <div className="w-8 h-8 bg-blue-400/20 rounded-full flex items-center justify-center">
                <span className="text-xs text-blue-400 font-bold">ETH</span>
              </div>
              <div>
                <p className="text-white font-medium">Ethereum</p>
                <p className="text-xs text-gray-400">ERC-20 tokens</p>
              </div>
            </div>
            <div className="flex items-center space-x-3">
              <div className="w-8 h-8 bg-purple-400/20 rounded-full flex items-center justify-center">
                <span className="text-xs text-purple-400 font-bold">POLY</span>
              </div>
              <div>
                <p className="text-white font-medium">Polygon</p>
                <p className="text-xs text-gray-400">Coming soon</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
    </>
  );
};

export default WithdrawalPage;
