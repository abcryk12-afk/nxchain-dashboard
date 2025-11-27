import React, { useState } from 'react';
import { 
  CurrencyDollarIcon, 
  QrCodeIcon,
  ClipboardDocumentIcon,
  ExclamationTriangleIcon,
  CheckCircleIcon,
  ClockIcon,
  BanknotesIcon,
  ArrowDownTrayIcon
} from '@heroicons/react/24/outline';
import { deposit } from '../services/api';
import { Transaction } from '../types';
import Header from '../components/Header';

const DepositPage: React.FC = () => {
  const [amount, setAmount] = useState('');
  const [selectedNetwork, setSelectedNetwork] = useState('bnb');
  const [depositData, setDepositData] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [copied, setCopied] = useState(false);
  const [depositHistory, setDepositHistory] = useState<Transaction[]>([]);

  // Network configurations
  const networks = [
    {
      id: 'bnb',
      name: 'Binance Smart Chain (BEP-20)',
      token: 'USDT',
      icon: '',
      description: 'Fast and low fees',
      minimumDeposit: 10,
      estimatedTime: '5-30 minutes'
    },
    {
      id: 'eth',
      name: 'Ethereum (ERC-20)',
      token: 'USDT',
      icon: '',
      description: 'Universal network',
      minimumDeposit: 25,
      estimatedTime: '15-60 minutes'
    },
    {
      id: 'tron',
      name: 'TRON (TRC-20)',
      token: 'USDT',
      icon: '',
      description: 'No gas fees',
      minimumDeposit: 5,
      estimatedTime: '1-5 minutes'
    },
    {
      id: 'polygon',
      name: 'Polygon (MATIC)',
      token: 'USDT',
      icon: '',
      description: 'Very low fees',
      minimumDeposit: 10,
      estimatedTime: '2-10 minutes'
    }
  ];

  const selectedNetworkConfig = networks.find(n => n.id === selectedNetwork);

  const handleGenerateDeposit = async () => {
    if (!amount || parseFloat(amount) < (selectedNetworkConfig?.minimumDeposit || 10)) {
      alert(`Minimum deposit is $${selectedNetworkConfig?.minimumDeposit || 10} USDT`);
      return;
    }

    setLoading(true);
    try {
      const data = await deposit.create({ 
        amount: parseFloat(amount),
        network: selectedNetwork 
      });
      setDepositData(data);
      
      // Add to mock deposit history
      const newTransaction: Transaction = {
        _id: Date.now().toString(),
        userId: '',
        type: 'deposit',
        amount: parseFloat(amount),
        status: 'pending',
        description: `USDT deposit - ${parseFloat(amount)} USDT on ${selectedNetworkConfig?.name}`,
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
    <>
      <Header />
      <div className="max-w-4xl mx-auto space-y-6">
        <div className="glass-effect rounded-xl p-6">
          <h1 className="text-2xl font-bold gradient-text mb-2">Deposit Funds</h1>
        <p className="text-gray-400">
          Deposit USDT to your NXChain wallet - Multiple networks supported
        </p>
      </div>

      {/* Network Selection */}
      <div className="glass-effect rounded-xl p-6">
        <h2 className="text-xl font-semibold text-white mb-6 flex items-center">
          <BanknotesIcon className="w-6 h-6 mr-2 text-nx-blue" />
          Select Network
        </h2>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {networks.map((network) => (
            <div
              key={network.id}
              onClick={() => setSelectedNetwork(network.id)}
              className={`p-4 rounded-lg border-2 cursor-pointer transition-all ${
                selectedNetwork === network.id
                  ? 'border-nx-blue bg-nx-blue/10'
                  : 'border-white/10 hover:border-white/20 bg-white/5'
              }`}
            >
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center space-x-3">
                  <span className="text-2xl">{network.icon}</span>
                  <div>
                    <h3 className="text-white font-medium">{network.name}</h3>
                    <p className="text-gray-400 text-sm">{network.description}</p>
                  </div>
                </div>
                {selectedNetwork === network.id && (
                  <CheckCircleIcon className="w-6 h-6 text-nx-blue" />
                )}
              </div>
              <div className="flex items-center justify-between text-sm">
                <span className="text-gray-400">Min: ${network.minimumDeposit}</span>
                <span className="text-gray-400">{network.estimatedTime}</span>
              </div>
            </div>
          ))}
        </div>
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
              Deposit Amount ({selectedNetworkConfig?.token} on {selectedNetworkConfig?.name})
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
                min={selectedNetworkConfig?.minimumDeposit || 10}
                step="0.01"
              />
            </div>
            <p className="text-xs text-gray-400 mt-1">
              Minimum deposit: ${selectedNetworkConfig?.minimumDeposit} {selectedNetworkConfig?.token}
            </p>
          </div>

          <div className="bg-yellow-400/10 border border-yellow-400/20 rounded-lg p-4">
            <div className="flex items-start space-x-3">
              <ExclamationTriangleIcon className="w-5 h-5 text-yellow-400 flex-shrink-0 mt-0.5" />
              <div>
                <p className="text-yellow-400 font-medium text-sm">Important Notice</p>
                <ul className="text-gray-300 text-sm mt-1 space-y-1">
                  <li>• Only send {selectedNetworkConfig?.token} on {selectedNetworkConfig?.name}</li>
                  <li>• Minimum deposit: ${selectedNetworkConfig?.minimumDeposit} {selectedNetworkConfig?.token}</li>
                  <li>• Estimated confirmation: {selectedNetworkConfig?.estimatedTime}</li>
                  <li>• Do not send other tokens to this address</li>
                  <li>• Network fees may apply</li>
                </ul>
              </div>
            </div>
          </div>

          <button
            onClick={handleGenerateDeposit}
            disabled={!amount || parseFloat(amount) < (selectedNetworkConfig?.minimumDeposit || 10) || loading}
            className="w-full btn-primary py-3 rounded-lg font-medium disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? 'Generating...' : `Generate ${selectedNetworkConfig?.name} Address`}
          </button>
        </div>
      </div>

      {/* Deposit Address Display */}
      {depositData && (
        <div className="glass-effect rounded-xl p-6">
          <h2 className="text-xl font-semibold text-white mb-6 flex items-center">
            <QrCodeIcon className="w-6 h-6 mr-2 text-nx-blue" />
            Your {selectedNetworkConfig?.name} Deposit Address
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
                Deposit Address ({selectedNetworkConfig?.name})
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

            {/* Network Info */}
            <div className="bg-blue-400/10 border border-blue-400/20 rounded-lg p-4">
              <div className="flex items-center space-x-3">
                <span className="text-xl">{selectedNetworkConfig?.icon}</span>
                <div>
                  <p className="text-blue-400 font-medium text-sm">{selectedNetworkConfig?.name}</p>
                  <p className="text-gray-300 text-sm">
                    Send exactly ${amount} {selectedNetworkConfig?.token} to this address
                  </p>
                </div>
              </div>
            </div>

            {/* External Wallet Links */}
            <div className="space-y-3">
              <p className="text-sm text-gray-400">Quick access from popular wallets:</p>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                <button
                  onClick={() => window.open(`https://trustwallet.com/`, '_blank')}
                  className="p-3 bg-white/5 border border-white/10 rounded-lg text-white text-sm hover:bg-white/10 transition-colors"
                >
                  Trust Wallet
                </button>
                <button
                  onClick={() => window.open(`https://metamask.io/`, '_blank')}
                  className="p-3 bg-white/5 border border-white/10 rounded-lg text-white text-sm hover:bg-white/10 transition-colors"
                >
                  MetaMask
                </button>
                <button
                  onClick={() => window.open(`https://binance.com/`, '_blank')}
                  className="p-3 bg-white/5 border border-white/10 rounded-lg text-white text-sm hover:bg-white/10 transition-colors"
                >
                  Binance
                </button>
                <button
                  onClick={() => window.open(`https://www.tronlink.org/`, '_blank')}
                  className="p-3 bg-white/5 border border-white/10 rounded-lg text-white text-sm hover:bg-white/10 transition-colors"
                >
                  TronLink
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Deposit History */}
      <div className="glass-effect rounded-xl p-6">
        <h2 className="text-xl font-semibold text-white mb-6 flex items-center">
          <ClockIcon className="w-6 h-6 mr-2 text-nx-blue" />
          Recent Deposits
        </h2>

        {depositHistory.length === 0 ? (
          <div className="text-center py-8">
            <ArrowDownTrayIcon className="w-12 h-12 text-gray-400 mx-auto mb-4" />
            <p className="text-gray-400">No deposits yet. Make your first deposit above!</p>
          </div>
        ) : (
          <div className="space-y-3">
            {depositHistory.map((transaction) => (
              <div key={transaction._id} className="flex items-center justify-between p-4 bg-white/5 rounded-lg">
                <div className="flex items-center space-x-3">
                  <div className="w-10 h-10 rounded-lg bg-green-500/20 flex items-center justify-center">
                    <ArrowDownTrayIcon className="w-5 h-5 text-green-400" />
                  </div>
                  <div>
                    <p className="text-white font-medium">{transaction.description}</p>
                    <p className="text-xs text-gray-400">
                      {new Date(transaction.createdAt).toLocaleDateString()}
                    </p>
                  </div>
                </div>
                <div className="text-right">
                  <div className={`px-3 py-1 rounded-full text-xs font-medium ${getStatusColor(transaction.status)}`}>
                    {transaction.status}
                  </div>
                  <p className="text-green-400 font-semibold mt-1">
                    +${transaction.amount.toLocaleString()}
                  </p>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
    </>
  );
};

export default DepositPage;
