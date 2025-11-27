import React, { useState, useEffect } from 'react';
import { 
  CurrencyDollarIcon, 
  UserGroupIcon, 
  ChartBarIcon,
  ArrowTrendingUpIcon,
  ShareIcon,
  ClipboardDocumentIcon,
  BanknotesIcon,
  ClockIcon,
  ArrowUpIcon
} from '@heroicons/react/24/outline';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { DashboardData, Referral } from '../types';
import { referral } from '../services/api';
import Header from './Header';

interface DashboardHomeProps {
  data: DashboardData;
}

const DashboardHome: React.FC<DashboardHomeProps> = ({ data }) => {
  const [referralStats, setReferralStats] = useState<any>(null);
  const [copied, setCopied] = useState(false);
  const [shareCopied, setShareCopied] = useState('')

  useEffect(() => {
    const fetchReferralStats = async () => {
      try {
        console.log('🔥 FRONTEND: Fetching referral stats...');
        const stats = await referral.getStats();
        console.log('🔥 FRONTEND: Referral stats received:', stats);
        setReferralStats(stats);
      } catch (error) {
        console.error('🔥 FRONTEND: Failed to fetch referral stats:', error);
      }
    };

    fetchReferralStats();
  }, []);

  const handleCopyReferralCode = () => {
    navigator.clipboard.writeText(data.user.referralCode);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleCopyReferralLink = () => {
    const link = `https://yourwebsite.com/register?ref=${data.user.referralCode}`;
    navigator.clipboard.writeText(link);
    setShareCopied('link');
    setTimeout(() => setShareCopied(''), 2000);
  };

  const handleShareWhatsApp = () => {
    const link = `https://yourwebsite.com/register?ref=${data.user.referralCode}`;
    const text = `Join NXChain and start earning! Use my referral code: ${data.user.referralCode}\n${link}`;
    window.open(`https://wa.me/?text=${encodeURIComponent(text)}`, '_blank');
  };

  const handleShareFacebook = () => {
    const link = `https://yourwebsite.com/register?ref=${data.user.referralCode}`;
    window.open(`https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(link)}`, '_blank');
  };

  const handleShareTelegram = () => {
    const link = `https://yourwebsite.com/register?ref=${data.user.referralCode}`;
    const text = `Join NXChain and start earning! Use my referral code: ${data.user.referralCode}\n${link}`;
    window.open(`https://t.me/share/url?url=${encodeURIComponent(link)}&text=${encodeURIComponent(text)}`, '_blank');
  };

  // Sample chart data (replace with real data)
  const chartData = [
    { name: 'Mon', earnings: 40 },
    { name: 'Tue', earnings: 30 },
    { name: 'Wed', earnings: 45 },
    { name: 'Thu', earnings: 50 },
    { name: 'Fri', earnings: 35 },
    { name: 'Sat', earnings: 60 },
    { name: 'Sun', earnings: 55 },
  ];

  return (
    <>
      <Header />
      <div className="min-h-screen bg-gray-900 text-white p-6">
        <div className="max-w-7xl mx-auto">
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-white mb-2">Welcome back, {data.user.firstName || 'User'}!</h1>
            <p className="text-gray-400">Here's your investment overview</p>
          </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="glass-effect rounded-xl p-6 card-hover">
          <div className="flex items-center justify-between mb-4">
            <div className="w-12 h-12 bg-gradient-to-r from-nx-blue to-nx-purple rounded-lg flex items-center justify-center">
              <CurrencyDollarIcon className="w-6 h-6 text-white" />
            </div>
            <ArrowTrendingUpIcon className="w-5 h-5 text-green-400" />
          </div>
          <div className="space-y-1">
            <p className="text-gray-400 text-sm">Total Balance</p>
            <p className="text-2xl font-bold text-white">
              ${data.user.balance.toLocaleString()}
            </p>
          </div>
        </div>

        <div className="glass-effect rounded-xl p-6 card-hover">
          <div className="flex items-center justify-between mb-4">
            <div className="w-12 h-12 bg-gradient-to-r from-green-400 to-emerald-500 rounded-lg flex items-center justify-center">
              <UserGroupIcon className="w-6 h-6 text-white" />
            </div>
            <span className="text-xs bg-green-400/20 text-green-400 px-2 py-1 rounded-full">
              Active
            </span>
          </div>
          <div className="space-y-1">
            <p className="text-gray-400 text-sm">Total Referrals</p>
            <p className="text-2xl font-bold text-white">
              {referralStats?.totalReferrals || 0}
            </p>
          </div>
        </div>

        <div className="glass-effect rounded-xl p-6 card-hover">
          <div className="flex items-center justify-between mb-4">
            <div className="w-12 h-12 bg-gradient-to-r from-yellow-400 to-orange-500 rounded-lg flex items-center justify-center">
              <BanknotesIcon className="w-6 h-6 text-white" />
            </div>
            <span className="text-xs bg-yellow-400/20 text-yellow-400 px-2 py-1 rounded-full">
              Earnings
            </span>
          </div>
          <div className="space-y-1">
            <p className="text-gray-400 text-sm">Total Earnings</p>
            <p className="text-2xl font-bold text-white">
              ${data.user.totalEarnings.toLocaleString()}
            </p>
          </div>
        </div>

        <div className="glass-effect rounded-xl p-6 card-hover">
          <div className="flex items-center justify-between mb-4">
            <div className="w-12 h-12 bg-gradient-to-r from-purple-400 to-pink-500 rounded-lg flex items-center justify-center">
              <ChartBarIcon className="w-6 h-6 text-white" />
            </div>
            <span className="text-xs bg-purple-400/20 text-purple-400 px-2 py-1 rounded-full">
              Active
            </span>
          </div>
          <div className="space-y-1">
            <p className="text-gray-400 text-sm">Active Stakes</p>
            <p className="text-2xl font-bold text-white">
              {data.activeStakes.length}
            </p>
          </div>
        </div>
      </div>

      {/* Referral Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Referral Code & Link */}
        <div className="glass-effect rounded-xl p-6">
          <h2 className="text-xl font-semibold text-white mb-4 flex items-center">
            <UserGroupIcon className="w-5 h-5 mr-2 text-nx-blue" />
            Your Referral Code
          </h2>
          
          <div className="space-y-4">
            <div>
              <label className="text-sm text-gray-400 block mb-2">Referral Code</label>
              <div className="flex items-center space-x-2">
                <div className="flex-1 bg-white/5 border border-white/10 rounded-lg px-4 py-3 font-mono text-white">
                  {data.user.referralCode}
                </div>
                <button
                  onClick={handleCopyReferralCode}
                  className="p-3 bg-nx-blue/20 hover:bg-nx-blue/30 rounded-lg transition-colors"
                >
                  <ClipboardDocumentIcon className="w-5 h-5 text-nx-blue" />
                </button>
              </div>
              {copied && (
                <p className="text-xs text-green-400 mt-1">Code copied!</p>
              )}
            </div>

            <div>
              <label className="text-sm text-gray-400 block mb-2">Referral Link</label>
              <div className="flex items-center space-x-2">
                <div className="flex-1 bg-white/5 border border-white/10 rounded-lg px-4 py-3 text-sm text-white truncate">
                  https://yourwebsite.com/register?ref={data.user.referralCode}
                </div>
                <button
                  onClick={handleCopyReferralLink}
                  className="p-3 bg-nx-blue/20 hover:bg-nx-blue/30 rounded-lg transition-colors"
                >
                  <ClipboardDocumentIcon className="w-5 h-5 text-nx-blue" />
                </button>
              </div>
              {shareCopied === 'link' && (
                <p className="text-xs text-green-400 mt-1">Link copied!</p>
              )}
            </div>

            <div>
              <label className="text-sm text-gray-400 block mb-2">Share Via</label>
              <div className="flex space-x-2">
                <button
                  onClick={handleShareWhatsApp}
                  className="flex-1 flex items-center justify-center space-x-2 p-3 bg-green-500/20 hover:bg-green-500/30 rounded-lg transition-colors"
                >
                  <svg className="w-5 h-5 text-green-400" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.149-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893A11.821 11.821 0 0020.465 3.488"/>
                  </svg>
                  <span className="text-green-400 text-sm font-medium">WhatsApp</span>
                </button>
                <button
                  onClick={handleShareFacebook}
                  className="flex-1 flex items-center justify-center space-x-2 p-3 bg-blue-500/20 hover:bg-blue-500/30 rounded-lg transition-colors"
                >
                  <svg className="w-5 h-5 text-blue-400" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/>
                  </svg>
                  <span className="text-blue-400 text-sm font-medium">Facebook</span>
                </button>
                <button
                  onClick={handleShareTelegram}
                  className="flex-1 flex items-center justify-center space-x-2 p-3 bg-cyan-500/20 hover:bg-cyan-500/30 rounded-lg transition-colors"
                >
                  <svg className="w-5 h-5 text-cyan-400" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm4.64 6.56c-.21 2.23-1.12 7.61-1.58 10.09-.2 1.06-.58 1.41-.96 1.45-.82.07-1.43-.54-2.22-1.06-1.23-.81-1.93-1.31-3.12-2.1-1.38-.89-.49-1.38.3-2.18.21-.21 3.77-3.45 3.84-3.75.01-.04.01-.18-.07-.26s-.19-.04-.27-.02c-.12.03-1.96 1.25-5.54 3.66-.52.36-.99.53-1.41.52-.47-.01-1.36-.26-2.03-.48-.82-.27-1.46-.42-1.41-.89.03-.24.35-.49.97-.75 3.78-1.65 6.3-2.73 7.57-3.24 3.61-1.5 4.35-1.76 4.82-1.77.08 0 .26.02.37.11.1.08.13.19.14.27-.01.06.01.24 0 .38z"/>
                  </svg>
                  <span className="text-cyan-400 text-sm font-medium">Telegram</span>
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Referral Earnings */}
        <div className="glass-effect rounded-xl p-6">
          <h2 className="text-xl font-semibold text-white mb-4 flex items-center">
            <CurrencyDollarIcon className="w-5 h-5 mr-2 text-green-400" />
            Referral Earnings
          </h2>
          
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="bg-white/5 rounded-lg p-4">
                <p className="text-sm text-gray-400 mb-1">Total Earnings</p>
                <p className="text-xl font-bold text-white">
                  ${data.user.referralEarnings.toLocaleString()}
                </p>
              </div>
              <div className="bg-white/5 rounded-lg p-4">
                <p className="text-sm text-gray-400 mb-1">Pending</p>
                <p className="text-xl font-bold text-yellow-400">
                  ${data.user.pendingEarnings.toLocaleString()}
                </p>
              </div>
              <div className="bg-white/5 rounded-lg p-4">
                <p className="text-sm text-gray-400 mb-1">Withdrawable</p>
                <p className="text-xl font-bold text-green-400">
                  ${data.user.withdrawableBalance.toLocaleString()}
                </p>
              </div>
              <div className="bg-white/5 rounded-lg p-4">
                <p className="text-sm text-gray-400 mb-1">Commission Rate</p>
                <p className="text-xl font-bold text-nx-blue">10%</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Recent Transactions & Earnings Chart */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recent Transactions */}
        <div className="glass-effect rounded-xl p-6">
          <h2 className="text-xl font-semibold text-white mb-4 flex items-center">
            <ClockIcon className="w-5 h-5 mr-2 text-nx-blue" />
            Recent Transactions
          </h2>
          
          <div className="space-y-3">
            {data.transactions.slice(0, 5).map((transaction) => (
              <div key={transaction._id} className="flex items-center justify-between p-3 bg-white/5 rounded-lg">
                <div className="flex items-center space-x-3">
                  <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${
                    transaction.type === 'deposit' ? 'bg-green-500/20' :
                    transaction.type === 'withdrawal' ? 'bg-red-500/20' :
                    transaction.type === 'staking' ? 'bg-blue-500/20' :
                    'bg-purple-500/20'
                  }`}>
                    {transaction.type === 'deposit' && <ArrowTrendingUpIcon className="w-5 h-5 text-green-400" />}
                    {transaction.type === 'withdrawal' && <ArrowUpIcon className="w-5 h-5 text-red-400" />}
                    {transaction.type === 'staking' && <BanknotesIcon className="w-5 h-5 text-blue-400" />}
                    {transaction.type === 'referral' && <UserGroupIcon className="w-5 h-5 text-purple-400" />}
                  </div>
                  <div>
                    <p className="text-white font-medium capitalize">{transaction.type}</p>
                    <p className="text-xs text-gray-400">
                      {new Date(transaction.createdAt).toLocaleDateString()}
                    </p>
                  </div>
                </div>
                <div className="text-right">
                  <p className={`font-semibold ${
                    transaction.type === 'deposit' || transaction.type === 'referral' ? 'text-green-400' :
                    transaction.type === 'withdrawal' ? 'text-red-400' : 'text-blue-400'
                  }`}>
                    {transaction.type === 'deposit' || transaction.type === 'referral' ? '+' : '-'}
                    ${transaction.amount.toLocaleString()}
                  </p>
                  <p className={`text-xs ${
                    transaction.status === 'confirmed' ? 'text-green-400' :
                    transaction.status === 'pending' ? 'text-yellow-400' : 'text-red-400'
                  }`}>
                    {transaction.status}
                  </p>
                </div>
              </div>
            ))}
            
            {data.transactions.length === 0 && (
              <p className="text-gray-400 text-center py-8">No transactions yet</p>
            )}
          </div>
        </div>

        {/* Earnings Chart */}
        <div className="glass-effect rounded-xl p-6">
          <h2 className="text-xl font-semibold text-white mb-4 flex items-center">
            <ChartBarIcon className="w-5 h-5 mr-2 text-nx-blue" />
            Weekly Earnings
          </h2>
          
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.1)" />
                <XAxis dataKey="name" stroke="#9ca3af" />
                <YAxis stroke="#9ca3af" />
                <Tooltip 
                  contentStyle={{ 
                    backgroundColor: 'rgba(0,0,0,0.8)', 
                    border: '1px solid rgba(255,255,255,0.1)',
                    borderRadius: '8px'
                  }}
                  labelStyle={{ color: '#9ca3af' }}
                  itemStyle={{ color: '#00d4ff' }}
                />
                <Line 
                  type="monotone" 
                  dataKey="earnings" 
                  stroke="#00d4ff" 
                  strokeWidth={2}
                  dot={{ fill: '#00d4ff', r: 4 }}
                  activeDot={{ r: 6 }}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Referrals Table */}
      <div className="glass-effect rounded-xl p-6">
        <h2 className="text-xl font-semibold text-white mb-4 flex items-center">
          <UserGroupIcon className="w-5 h-5 mr-2 text-nx-blue" />
          Your Referrals
        </h2>
        
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-white/10">
                <th className="text-left py-3 px-4 text-sm font-medium text-gray-400">User Email</th>
                <th className="text-left py-3 px-4 text-sm font-medium text-gray-400">Joined Date</th>
                <th className="text-left py-3 px-4 text-sm font-medium text-gray-400">Commission</th>
                <th className="text-left py-3 px-4 text-sm font-medium text-gray-400">Status</th>
              </tr>
            </thead>
            <tbody>
              {referralStats?.referrals?.map((referral: any, index: number) => (
                <tr key={index} className="border-b border-white/5">
                  <td className="py-3 px-4 text-white">{referral.email}</td>
                  <td className="py-3 px-4 text-gray-300">
                    {new Date(referral.joinedDate).toLocaleDateString()}
                  </td>
                  <td className="py-3 px-4 text-green-400">
                    ${referral.commission.toLocaleString()}
                  </td>
                  <td className="py-3 px-4">
                    <span className={`px-2 py-1 rounded-full text-xs ${
                      referral.status === 'Verified' 
                        ? 'bg-green-400/20 text-green-400' 
                        : 'bg-yellow-400/20 text-yellow-400'
                    }`}>
                      {referral.status}
                    </span>
                  </td>
                </tr>
              ))}
              
              {(!referralStats?.referrals || referralStats.referrals.length === 0) && (
                <tr>
                  <td colSpan={4} className="py-8 text-center text-gray-400">
                    No referrals yet. Start sharing your referral code!
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </>
  );
};

export default DashboardHome;
