import React, { useState, useEffect } from 'react';
import { 
  BanknotesIcon, 
  ChartBarIcon,
  ClockIcon,
  CheckCircleIcon,
  CalculatorIcon,
  ArrowTrendingUpIcon
} from '@heroicons/react/24/outline';
import { staking } from '../services/api';
import { Staking, StakingPackage } from '../types';

const StakingPage: React.FC = () => {
  const [selectedPackage, setSelectedPackage] = useState<StakingPackage | null>(null);
  const [amount, setAmount] = useState('');
  const [userBalance, setUserBalance] = useState(1000); // Mock balance
  const [activeStakes, setActiveStakes] = useState<Staking[]>([]);
  const [loading, setLoading] = useState(false);
  const [showCalculator, setShowCalculator] = useState(false);

  const stakingPackages: StakingPackage[] = [
    {
      name: 'bronze',
      displayName: 'Bronze Package',
      duration: 30,
      dailyReturn: 0.01,
      totalROI: 0.30,
      minAmount: 50,
      color: 'from-amber-500 to-orange-600'
    },
    {
      name: 'silver',
      displayName: 'Silver Package',
      duration: 90,
      dailyReturn: 0.015,
      totalROI: 1.35,
      minAmount: 500,
      color: 'from-gray-400 to-gray-600'
    },
    {
      name: 'gold',
      displayName: 'Gold Package',
      duration: 365,
      dailyReturn: 0.02,
      totalROI: 7.30,
      minAmount: 1000,
      color: 'from-yellow-400 to-amber-600'
    }
  ];

  useEffect(() => {
    // Mock active stakes data
    setActiveStakes([
      {
        _id: '1',
        userId: '',
        package: 'bronze',
        amount: 100,
        dailyReturn: 1,
        totalDays: 30,
        totalROI: 0.30,
        startDate: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString(),
        endDate: new Date(Date.now() + 25 * 24 * 60 * 60 * 1000).toISOString(),
        isActive: true,
        totalEarned: 5
      }
    ]);
  }, []);

  const handleStake = async () => {
    if (!selectedPackage || !amount) {
      alert('Please select a package and enter amount');
      return;
    }

    const stakeAmount = parseFloat(amount);
    if (stakeAmount < selectedPackage.minAmount) {
      alert(`Minimum amount for ${selectedPackage.displayName} is $${selectedPackage.minAmount}`);
      return;
    }

    if (stakeAmount > userBalance) {
      alert('Insufficient balance');
      return;
    }

    setLoading(true);
    try {
      await staking.create(selectedPackage.name, stakeAmount);
      
      // Update mock data
      setUserBalance(userBalance - stakeAmount);
      const newStake: Staking = {
        _id: Date.now().toString(),
        userId: '',
        package: selectedPackage.name,
        amount: stakeAmount,
        dailyReturn: stakeAmount * selectedPackage.dailyReturn,
        totalDays: selectedPackage.duration,
        totalROI: selectedPackage.totalROI,
        startDate: new Date().toISOString(),
        endDate: new Date(Date.now() + selectedPackage.duration * 24 * 60 * 60 * 1000).toISOString(),
        isActive: true,
        totalEarned: 0
      };
      setActiveStakes([newStake, ...activeStakes]);
      
      // Reset form
      setSelectedPackage(null);
      setAmount('');
      alert('Staking successful!');
    } catch (error) {
      console.error('Staking failed:', error);
      alert('Failed to create stake');
    } finally {
      setLoading(false);
    }
  };

  const calculateROI = (pkg: StakingPackage, stakeAmount: number) => {
    const dailyEarnings = stakeAmount * pkg.dailyReturn;
    const totalEarnings = stakeAmount * pkg.totalROI;
    return {
      daily: dailyEarnings,
      total: totalEarnings,
      finalAmount: stakeAmount + totalEarnings
    };
  };

  const getDaysRemaining = (endDate: string) => {
    const end = new Date(endDate);
    const now = new Date();
    const diff = end.getTime() - now.getTime();
    return Math.max(0, Math.ceil(diff / (1000 * 60 * 60 * 24)));
  };

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      <div className="glass-effect rounded-xl p-6">
        <h1 className="text-2xl font-bold gradient-text mb-2">Staking Packages</h1>
        <p className="text-gray-400">
          Stake your funds and earn daily returns with our flexible staking packages
        </p>
      </div>

      {/* User Balance */}
      <div className="glass-effect rounded-xl p-6">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm text-gray-400 mb-1">Available Balance</p>
            <p className="text-2xl font-bold text-white">${userBalance.toLocaleString()}</p>
          </div>
          <div className="w-12 h-12 bg-gradient-to-r from-nx-blue to-nx-purple rounded-lg flex items-center justify-center">
            <BanknotesIcon className="w-6 h-6 text-white" />
          </div>
        </div>
      </div>

      {/* Staking Packages */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {stakingPackages.map((pkg) => {
          const isSelected = selectedPackage?.name === pkg.name;
          const roi = calculateROI(pkg, parseFloat(amount) || pkg.minAmount);
          
          return (
            <div
              key={pkg.name}
              onClick={() => setSelectedPackage(pkg)}
              className={`glass-effect rounded-xl p-6 cursor-pointer transition-all card-hover ${
                isSelected ? 'ring-2 ring-nx-blue' : ''
              }`}
            >
              <div className={`h-2 bg-gradient-to-r ${pkg.color} rounded-full mb-4`}></div>
              
              <h3 className="text-xl font-bold text-white mb-2">{pkg.displayName}</h3>
              
              <div className="space-y-3 mb-4">
                <div className="flex justify-between text-sm">
                  <span className="text-gray-400">Duration:</span>
                  <span className="text-white font-medium">{pkg.duration} Days</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-400">Daily Return:</span>
                  <span className="text-green-400 font-medium">{(pkg.dailyReturn * 100).toFixed(1)}%</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-400">Total ROI:</span>
                  <span className="text-nx-blue font-medium">{(pkg.totalROI * 100).toFixed(0)}%</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-400">Min Amount:</span>
                  <span className="text-white font-medium">${pkg.minAmount}</span>
                </div>
              </div>

              {isSelected && amount && (
                <div className="border-t border-white/10 pt-3 space-y-2">
                  <div className="text-xs text-gray-400">Estimated Earnings:</div>
                  <div className="text-sm">
                    <div className="flex justify-between">
                      <span className="text-gray-400">Daily:</span>
                      <span className="text-green-400">${roi.daily.toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-400">Total:</span>
                      <span className="text-nx-blue">${roi.total.toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between font-medium">
                      <span className="text-white">Final:</span>
                      <span className="text-white">${roi.finalAmount.toFixed(2)}</span>
                    </div>
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Staking Form */}
      {selectedPackage && (
        <div className="glass-effect rounded-xl p-6">
          <h2 className="text-xl font-semibold text-white mb-6">Create Stake</h2>
          
          <div className="space-y-6">
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Stake Amount (USD)
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <span className="text-gray-400">$</span>
                </div>
                <input
                  type="number"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  placeholder={`Min: $${selectedPackage.minAmount}`}
                  className="w-full pl-8 pr-3 py-3 bg-white/5 border border-white/10 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-nx-blue focus:border-transparent"
                  min={selectedPackage.minAmount}
                  max={userBalance}
                  step="0.01"
                />
              </div>
              <div className="flex justify-between text-xs text-gray-400 mt-1">
                <span>Min: ${selectedPackage.minAmount}</span>
                <span>Max: ${userBalance}</span>
              </div>
            </div>

            <div className="flex space-x-4">
              <button
                onClick={() => setShowCalculator(!showCalculator)}
                className="flex-1 btn-secondary py-3 rounded-lg font-medium flex items-center justify-center space-x-2"
              >
                <CalculatorIcon className="w-5 h-5" />
                <span>ROI Calculator</span>
              </button>
              
              <button
                onClick={handleStake}
                disabled={!amount || parseFloat(amount) < selectedPackage.minAmount || loading}
                className="flex-1 btn-primary py-3 rounded-lg font-medium disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? 'Processing...' : 'Stake Now'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ROI Calculator */}
      {showCalculator && selectedPackage && (
        <div className="glass-effect rounded-xl p-6">
          <h3 className="text-lg font-semibold text-white mb-4 flex items-center">
            <CalculatorIcon className="w-5 h-5 mr-2 text-nx-blue" />
            ROI Calculator
          </h3>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Calculate for Amount
              </label>
              <input
                type="number"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                placeholder="Enter amount"
                className="w-full px-3 py-2 bg-white/5 border border-white/10 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-nx-blue focus:border-transparent"
                min="1"
                step="0.01"
              />
            </div>
            
            {amount && parseFloat(amount) > 0 && (
              <div className="bg-white/5 rounded-lg p-4">
                <h4 className="text-white font-medium mb-3">Projection for ${amount}</h4>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-gray-400">Daily Earnings:</span>
                    <span className="text-green-400 font-medium">
                      ${(parseFloat(amount) * selectedPackage.dailyReturn).toFixed(2)}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-400">Monthly Earnings:</span>
                    <span className="text-green-400 font-medium">
                      ${(parseFloat(amount) * selectedPackage.dailyReturn * 30).toFixed(2)}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-400">Total Return:</span>
                    <span className="text-nx-blue font-medium">
                      ${(parseFloat(amount) * (1 + selectedPackage.totalROI)).toFixed(2)}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-400">Profit:</span>
                    <span className="text-green-400 font-medium">
                      ${(parseFloat(amount) * selectedPackage.totalROI).toFixed(2)}
                    </span>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Active Stakes */}
      <div className="glass-effect rounded-xl p-6">
        <h2 className="text-xl font-semibold text-white mb-6 flex items-center">
          <ChartBarIcon className="w-6 h-6 mr-2 text-nx-blue" />
          Active Stakes
        </h2>

        <div className="space-y-4">
          {activeStakes.map((stake) => {
            const daysRemaining = getDaysRemaining(stake.endDate);
            const progress = ((stake.totalDays - daysRemaining) / stake.totalDays) * 100;
            
            return (
              <div key={stake._id} className="bg-white/5 rounded-lg p-4">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center space-x-3">
                    <div className={`w-10 h-10 bg-gradient-to-r ${
                      stake.package === 'bronze' ? 'from-amber-500 to-orange-600' :
                      stake.package === 'silver' ? 'from-gray-400 to-gray-600' :
                      'from-yellow-400 to-amber-600'
                    } rounded-lg flex items-center justify-center`}>
                      <BanknotesIcon className="w-5 h-5 text-white" />
                    </div>
                    <div>
                      <p className="text-white font-medium capitalize">{stake.package} Package</p>
                      <p className="text-sm text-gray-400">
                        ${stake.amount.toLocaleString()} • {stake.totalDays} days
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-green-400 font-medium">
                      ${(stake.totalEarned).toFixed(2)} earned
                    </p>
                    <p className="text-sm text-gray-400">
                      ${stake.dailyReturn.toFixed(2)}/day
                    </p>
                  </div>
                </div>

                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-400">Progress</span>
                    <span className="text-white">{Math.round(progress)}% complete</span>
                  </div>
                  <div className="w-full bg-white/10 rounded-full h-2">
                    <div 
                      className="bg-gradient-to-r from-nx-blue to-nx-purple h-2 rounded-full transition-all"
                      style={{ width: `${progress}%` }}
                    ></div>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-400 flex items-center">
                      <ClockIcon className="w-4 h-4 mr-1" />
                      {daysRemaining} days remaining
                    </span>
                    <span className="text-gray-400">
                      Ends: {new Date(stake.endDate).toLocaleDateString()}
                    </span>
                  </div>
                </div>
              </div>
            );
          })}
          
          {activeStakes.length === 0 && (
            <div className="text-center py-8">
              <BanknotesIcon className="w-12 h-12 text-gray-400 mx-auto mb-3" />
              <p className="text-gray-400">No active stakes</p>
              <p className="text-sm text-gray-500 mt-1">Select a package above to start staking</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default StakingPage;
