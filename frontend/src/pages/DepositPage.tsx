import React, { useState } from 'react';
import { 
  CurrencyDollarIcon, 
  QrCodeIcon,
  ClipboardDocumentIcon,
  ExclamationTriangleIcon,
  CheckCircleIcon,
  ClockIcon
} from '@heroicons/react/24/outline';
import { deposit } from '../services/api';
import { Transaction } from '../types';

const DepositPage: React.FC = () => {
  const [amount, setAmount] = useState('');
  const [depositData, setDepositData] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [copied, setCopied] = useState(false);
  const [depositHistory, setDepositHistory] = useState<Transaction[]>([]);

  const handleGenerateDeposit = async () => {
    if (!amount || parseFloat(amount) < 10) {
      alert('Minimum deposit amount is $10');
      return;
    }

    setLoading(true);
    try {
      const data = await deposit.create({ amount: parseFloat(amount) });
      setDepositData(data);
      
      // Add to mock deposit history (in real app, this would come from backend)
      const newTransaction: Transaction = {
        _id: Date.now().toString(),
        userId: '',
        type: 'deposit',
        amount: parseFloat(amount),
        status: 'pending',
        description: `USDT deposit - ${parseFloat(amount)} USDT`,
        createdAt: new Date().toISOString()
      };
      setDepositHistory([newTransaction, ...depositHistory]);
    } catch (error) {
      console.error('Failed to generate deposit:', error);
      alert('Failed to generate deposit address');
    } finally {
      setLoading(false);
    }
  };

  const handleCopyAddress = () => {
    if (depositData?.depositAddress) {
      navigator.clipboard.writeText(depositData.depositAddress);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'confirmed': return 'text-green-400 bg-green-400/20';
      case 'pending': return 'text-yellow-400 bg-yellow-400/20';
      case 'rejected': return 'text-red-400 bg-red-400/20';
      default: return 'text-gray-400 bg-gray-400/20';
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div className="glass-effect rounded-xl p-6">
        <h1 className="text-2xl font-bold gradient-text mb-2">Deposit Funds</h1>
        <p className="text-gray-400">
          Deposit USDT (BEP-20) to your NXChain wallet
        </p>
      </div>

      {/* Deposit Form */}
      <div className="glass-effect rounded-xl p-6">
        <h2 className="text-xl font-semibold text-white mb-6 flex items-center">
          <CurrencyDollarIcon className="w-6 h-6 mr-2 text-nx-blue" />
          Generate Deposit Address
        </h2>

        <div className="space-y-6">
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Deposit Amount (USDT)
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
                step="0.01"
              />
            </div>
            <p className="text-xs text-gray-400 mt-1">Minimum deposit: $10 USDT</p>
          </div>

          <div className="bg-yellow-400/10 border border-yellow-400/20 rounded-lg p-4">
            <div className="flex items-start space-x-3">
              <ExclamationTriangleIcon className="w-5 h-5 text-yellow-400 flex-shrink-0 mt-0.5" />
              <div>
                <p className="text-yellow-400 font-medium text-sm">Important Notice</p>
                <ul className="text-gray-300 text-sm mt-1 space-y-1">
                  <li>• Only send USDT on Binance Smart Chain (BEP-20)</li>
                  <li>• Minimum deposit: $10 USDT</li>
                  <li>• Deposits are typically confirmed within 5-30 minutes</li>
                  <li>• Do not send other tokens to this address</li>
                </ul>
              </div>
            </div>
          </div>

          <button
            onClick={handleGenerateDeposit}
            disabled={!amount || parseFloat(amount) < 10 || loading}
            className="w-full btn-primary py-3 rounded-lg font-medium disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? 'Generating...' : 'Generate Deposit Address'}
          </button>
        </div>
      </div>

      {/* Deposit Address Display */}
      {depositData && (
        <div className="glass-effect rounded-xl p-6">
          <h2 className="text-xl font-semibold text-white mb-6 flex items-center">
            <QrCodeIcon className="w-6 h-6 mr-2 text-nx-blue" />
            Your Deposit Address
          </h2>

          <div className="space-y-6">
            {/* QR Code */}
            <div className="flex justify-center">
              <div className="bg-white p-4 rounded-lg">
                <img 
                  src={depositData.qrCode} 
                  alt="Deposit QR Code" 
                  className="w-48 h-48"
                />
              </div>
            </div>

            {/* Address */}
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Deposit Address (BEP-20)
              </label>
              <div className="flex items-center space-x-2">
                <div className="flex-1 bg-white/5 border border-white/10 rounded-lg px-4 py-3 font-mono text-sm text-white break-all">
                  {depositData.depositAddress}
                </div>
                <button
                  onClick={handleCopyAddress}
                  className="p-3 bg-nx-blue/20 hover:bg-nx-blue/30 rounded-lg transition-colors"
                >
                  <ClipboardDocumentIcon className="w-5 h-5 text-nx-blue" />
                </button>
              </div>
              {copied && (
                <p className="text-xs text-green-400 mt-1">Address copied!</p>
              )}
            </div>

            {/* Deposit Info */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="bg-white/5 rounded-lg p-4">
                <p className="text-sm text-gray-400 mb-1">Network</p>
                <p className="text-white font-medium">Binance Smart Chain (BEP-20)</p>
              </div>
              <div className="bg-white/5 rounded-lg p-4">
                <p className="text-sm text-gray-400 mb-1">Token</p>
                <p className="text-white font-medium">USDT</p>
              </div>
              <div className="bg-white/5 rounded-lg p-4">
                <p className="text-sm text-gray-400 mb-1">Amount</p>
                <p className="text-white font-medium">${amount} USDT</p>
              </div>
              <div className="bg-white/5 rounded-lg p-4">
                <p className="text-sm text-gray-400 mb-1">Status</p>
                <div className="flex items-center space-x-2">
                  <ClockIcon className="w-4 h-4 text-yellow-400" />
                  <p className="text-yellow-400 font-medium">Waiting for deposit</p>
                </div>
              </div>
            </div>

            <div className="bg-blue-400/10 border border-blue-400/20 rounded-lg p-4">
              <div className="flex items-start space-x-3">
                <CheckCircleIcon className="w-5 h-5 text-blue-400 flex-shrink-0 mt-0.5" />
                <div>
                  <p className="text-blue-400 font-medium text-sm">Next Steps</p>
                  <p className="text-gray-300 text-sm mt-1">
                    Send {amount} USDT to the address above. Once confirmed, the funds will be automatically credited to your account.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Deposit History */}
      <div className="glass-effect rounded-xl p-6">
        <h2 className="text-xl font-semibold text-white mb-6 flex items-center">
          <ClockIcon className="w-6 h-6 mr-2 text-nx-blue" />
          Deposit History
        </h2>

        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-white/10">
                <th className="text-left py-3 px-4 text-sm font-medium text-gray-400">Date</th>
                <th className="text-left py-3 px-4 text-sm font-medium text-gray-400">Coin</th>
                <th className="text-left py-3 px-4 text-sm font-medium text-gray-400">Amount</th>
                <th className="text-left py-3 px-4 text-sm font-medium text-gray-400">Status</th>
              </tr>
            </thead>
            <tbody>
              {depositHistory.map((transaction) => (
                <tr key={transaction._id} className="border-b border-white/5">
                  <td className="py-3 px-4 text-gray-300">
                    {new Date(transaction.createdAt).toLocaleDateString()}
                  </td>
                  <td className="py-3 px-4">
                    <div className="flex items-center space-x-2">
                      <div className="w-6 h-6 bg-green-500/20 rounded-full flex items-center justify-center">
                        <span className="text-xs text-green-400 font-bold">₮</span>
                      </div>
                      <span className="text-white">USDT</span>
                    </div>
                  </td>
                  <td className="py-3 px-4 text-green-400 font-medium">
                    ${transaction.amount.toLocaleString()}
                  </td>
                  <td className="py-3 px-4">
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(transaction.status)}`}>
                      {transaction.status}
                    </span>
                  </td>
                </tr>
              ))}
              
              {depositHistory.length === 0 && (
                <tr>
                  <td colSpan={4} className="py-8 text-center text-gray-400">
                    No deposit history yet
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default DepositPage;
