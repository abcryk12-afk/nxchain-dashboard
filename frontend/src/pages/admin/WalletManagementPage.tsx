import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { 
  WalletIcon, 
  MagnifyingGlassIcon,
  UserIcon,
  DocumentDuplicateIcon,
  EyeIcon,
  EyeSlashIcon,
  QrCodeIcon,
  FunnelIcon,
  ArrowPathIcon,
  XMarkIcon
} from '@heroicons/react/24/outline';
import AdminHeader from '../../components/AdminHeader';

// Types matching database models
interface UserDetails {
  userId: string;
  email: string;
  firstName: string;
  lastName: string;
  phone?: string;
  country?: string;
  referralCode?: string;
  walletGenerated: boolean;
  createdAt: string;
}

interface WalletDetails {
  hdWalletId: string;
  mnemonicEncrypted: string;
  xpub: string;
  walletPassword: string;
  addresses: {
    bnb: {
      network: string;
      address: string;
      publicKey: string;
      privateKey: string;
    };
    ethereum: {
      network: string;
      address: string;
      publicKey: string;
      privateKey: string;
    };
    tron: {
      network: string;
      address: string;
      publicKey: string;
      privateKey: string;
    };
    polygon: {
      network: string;
      address: string;
      publicKey: string;
      privateKey: string;
    };
  };
}

interface WalletBalance {
  address: string;
  balances: {
    BNB?: number;
    ETH?: number;
    TRX?: number;
    USDT?: number;
    MATIC?: number;
  };
}

const WalletManagementPage: React.FC = () => {
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<UserDetails[]>([]);
  const [selectedUser, setSelectedUser] = useState<UserDetails | null>(null);
  const [walletDetails, setWalletDetails] = useState<WalletDetails | null>(null);
  const [walletBalances, setWalletBalances] = useState<WalletBalance[]>([]);
  const [loading, setLoading] = useState(false);
  const [searchLoading, setSearchLoading] = useState(false);
  const [showPrivateKey, setShowPrivateKey] = useState<{ [key: string]: boolean }>({});
  const [showQRCode, setShowQRCode] = useState<{ address: string; network: string } | null>(null);

  // API Base URL
  const API_BASE = process.env.REACT_APP_API_URL || 'http://localhost:5000/api';

  // Search users
  const handleSearch = async (query: string) => {
    if (!query.trim()) {
      setSearchResults([]);
      return;
    }

    setSearchLoading(true);
    try {
      const response = await axios.get(`${API_BASE}/admin/user/details?query=${query}`);
      if (response.data && response.data.user) {
        // If single user found, convert to array
        setSearchResults([response.data.user]);
      } else if (Array.isArray(response.data)) {
        setSearchResults(response.data);
      } else {
        setSearchResults([]);
      }
    } catch (error) {
      console.error('Search error:', error);
      setSearchResults([]);
    } finally {
      setSearchLoading(false);
    }
  };

  // Select user and fetch details
  const handleSelectUser = async (user: UserDetails) => {
    setSelectedUser(user);
    setSearchResults([]);
    setSearchQuery('');
    setLoading(true);

    try {
      // Fetch wallet details
      const walletResponse = await axios.get(`${API_BASE}/admin/user/wallets/${user.userId}`);
      if (walletResponse.data) {
        setWalletDetails(walletResponse.data);

        // Fetch balances for all wallet addresses
        const balancePromises = Object.entries(walletResponse.data.addresses).map(
          async ([network, addressData]: [string, any]) => {
            try {
              const balanceResponse = await axios.get(
                `${API_BASE}/admin/user/wallet-balance/${addressData.address}`
              );
              return {
                address: addressData.address,
                balances: balanceResponse.data || {}
              };
            } catch (error) {
              return {
                address: addressData.address,
                balances: {}
              };
            }
          }
        );

        const balances = await Promise.all(balancePromises);
        setWalletBalances(balances);
      }
    } catch (error) {
      console.error('Fetch wallet details error:', error);
      setWalletDetails(null);
      setWalletBalances([]);
    } finally {
      setLoading(false);
    }
  };

  // Copy to clipboard
  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
  };

  // Toggle private key visibility
  const togglePrivateKey = (address: string) => {
    setShowPrivateKey(prev => ({
      ...prev,
      [address]: !prev[address]
    }));
  };

  // Format address
  const formatAddress = (address: string) => {
    return `${address.slice(0, 6)}...${address.slice(-4)}`;
  };

  // Get balance for address
  const getBalanceForAddress = (address: string) => {
    const balance = walletBalances.find(b => b.address === address);
    return balance?.balances || {};
  };

  return (
    <>
      <AdminHeader />
      <div className="min-h-screen bg-gray-900 text-white p-6">
        <div className="max-w-7xl mx-auto">
          {/* Page Header */}
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-white mb-2">User Wallet Management</h1>
            <p className="text-gray-400">Search users and view their complete wallet details</p>
          </div>

          {/* User Search Panel */}
          <div className="glass-effect rounded-xl p-6 mb-6">
            <h2 className="text-xl font-semibold text-white mb-4 flex items-center">
              <FunnelIcon className="w-5 h-5 mr-2 text-nx-blue" />
              Search User
            </h2>
            
            <div className="relative">
              <input
                type="text"
                placeholder="Search by email, user ID, or name..."
                value={searchQuery}
                onChange={(e) => {
                  setSearchQuery(e.target.value);
                  handleSearch(e.target.value);
                }}
                className="w-full pl-12 pr-4 py-3 bg-white/5 border border-white/10 rounded-lg focus:outline-none focus:border-nx-blue text-white placeholder-gray-400"
              />
              <MagnifyingGlassIcon className="absolute left-4 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
              
              {searchQuery && (
                <button
                  onClick={() => {
                    setSearchQuery('');
                    setSearchResults([]);
                  }}
                  className="absolute right-4 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-white"
                >
                  <XMarkIcon className="w-5 h-5" />
                </button>
              )}
            </div>

            {/* Search Results Dropdown */}
            {searchLoading && (
              <div className="mt-2 p-4 bg-white/5 rounded-lg flex items-center justify-center">
                <ArrowPathIcon className="w-5 h-5 animate-spin text-nx-blue" />
                <span className="ml-2 text-gray-400">Searching...</span>
              </div>
            )}

            {searchResults.length > 0 && (
              <div className="mt-2 bg-white/5 border border-white/10 rounded-lg overflow-hidden">
                {searchResults.map((user) => (
                  <button
                    key={user.userId}
                    onClick={() => handleSelectUser(user)}
                    className="w-full p-4 text-left hover:bg-white/10 transition-colors border-b border-white/5 last:border-b-0"
                  >
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-white font-medium">
                          {user.firstName} {user.lastName}
                        </p>
                        <p className="text-sm text-gray-400">{user.email}</p>
                        <p className="text-xs text-gray-500">ID: {user.userId}</p>
                      </div>
                      <UserIcon className="w-5 h-5 text-gray-400" />
                    </div>
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* User Details Panel */}
          {selectedUser ? (
            <div className="space-y-6">
              {/* User Information */}
              <div className="glass-effect rounded-xl p-6">
                <h2 className="text-xl font-semibold text-white mb-4 flex items-center">
                  <UserIcon className="w-5 h-5 mr-2 text-nx-blue" />
                  User Information
                </h2>
                
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  <div>
                    <p className="text-sm text-gray-400 mb-1">User ID</p>
                    <p className="text-white font-mono text-sm">{selectedUser.userId}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-400 mb-1">Full Name</p>
                    <p className="text-white">
                      {selectedUser.firstName} {selectedUser.lastName}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-400 mb-1">Email</p>
                    <p className="text-white">{selectedUser.email}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-400 mb-1">Phone</p>
                    <p className="text-white">{selectedUser.phone || 'Not provided'}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-400 mb-1">Country</p>
                    <p className="text-white">{selectedUser.country || 'Not provided'}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-400 mb-1">Registration Date</p>
                    <p className="text-white">
                      {new Date(selectedUser.createdAt).toLocaleDateString()}
                    </p>
                  </div>
                </div>
              </div>

              {/* Wallet Details */}
              {loading ? (
                <div className="glass-effect rounded-xl p-12 text-center">
                  <ArrowPathIcon className="w-8 h-8 animate-spin text-nx-blue mx-auto mb-4" />
                  <p className="text-gray-400">Loading wallet details...</p>
                </div>
              ) : walletDetails ? (
                <div className="glass-effect rounded-xl p-6">
                  <h2 className="text-xl font-semibold text-white mb-4 flex items-center">
                    <WalletIcon className="w-5 h-5 mr-2 text-nx-blue" />
                    Wallet Details
                  </h2>

                  {/* HD Wallet Information */}
                  <div className="mb-6 p-4 bg-white/5 rounded-lg">
                    <h3 className="text-lg font-medium text-white mb-3">HD Wallet Information</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <p className="text-sm text-gray-400 mb-1">HD Wallet ID</p>
                        <p className="text-white font-mono text-sm">{walletDetails.hdWalletId}</p>
                      </div>
                      <div>
                        <p className="text-sm text-gray-400 mb-1">XPub</p>
                        <p className="text-white font-mono text-sm">{walletDetails.xpub}</p>
                      </div>
                    </div>
                  </div>

                  {/* Wallet Addresses Table */}
                  <div className="overflow-x-auto">
                    <table className="w-full">
                      <thead>
                        <tr className="border-b border-white/10">
                          <th className="text-left py-3 px-4 text-sm font-medium text-gray-400">Wallet Type</th>
                          <th className="text-left py-3 px-4 text-sm font-medium text-gray-400">Network</th>
                          <th className="text-left py-3 px-4 text-sm font-medium text-gray-400">Address</th>
                          <th className="text-left py-3 px-4 text-sm font-medium text-gray-400">Public Key</th>
                          <th className="text-left py-3 px-4 text-sm font-medium text-gray-400">Private Key</th>
                          <th className="text-left py-3 px-4 text-sm font-medium text-gray-400">Balance</th>
                          <th className="text-left py-3 px-4 text-sm font-medium text-gray-400">Actions</th>
                        </tr>
                      </thead>
                      <tbody>
                        {Object.entries(walletDetails.addresses).map(([walletType, addressData]) => {
                          const balance = getBalanceForAddress(addressData.address);
                          const totalBalance = Object.values(balance).reduce((sum, val) => sum + (val || 0), 0);
                          
                          return (
                            <tr key={walletType} className="border-b border-white/5 hover:bg-white/5">
                              <td className="py-3 px-4">
                                <span className="text-white capitalize">{walletType}</span>
                              </td>
                              <td className="py-3 px-4">
                                <span className="text-white">{addressData.network}</span>
                              </td>
                              <td className="py-3 px-4">
                                <div className="flex items-center space-x-2">
                                  <code className="text-blue-400 bg-white/10 px-2 py-1 rounded text-xs">
                                    {formatAddress(addressData.address)}
                                  </code>
                                  <button
                                    onClick={() => copyToClipboard(addressData.address)}
                                    className="p-1 text-gray-400 hover:text-white"
                                  >
                                    <DocumentDuplicateIcon className="w-4 h-4" />
                                  </button>
                                </div>
                              </td>
                              <td className="py-3 px-4">
                                <code className="text-gray-400 bg-white/10 px-2 py-1 rounded text-xs max-w-32 truncate">
                                  {formatAddress(addressData.publicKey)}
                                </code>
                              </td>
                              <td className="py-3 px-4">
                                <div className="flex items-center space-x-2">
                                  <code className="text-yellow-400 bg-white/10 px-2 py-1 rounded text-xs max-w-32 truncate">
                                    {showPrivateKey[addressData.address] 
                                      ? addressData.privateKey 
                                      : formatAddress(addressData.privateKey)
                                    }
                                  </code>
                                  <button
                                    onClick={() => togglePrivateKey(addressData.address)}
                                    className="p-1 text-gray-400 hover:text-white"
                                  >
                                    {showPrivateKey[addressData.address] ? (
                                      <EyeSlashIcon className="w-4 h-4" />
                                    ) : (
                                      <EyeIcon className="w-4 h-4" />
                                    )}
                                  </button>
                                  <button
                                    onClick={() => copyToClipboard(addressData.privateKey)}
                                    className="p-1 text-gray-400 hover:text-white"
                                  >
                                    <DocumentDuplicateIcon className="w-4 h-4" />
                                  </button>
                                </div>
                              </td>
                              <td className="py-3 px-4">
                                <div className="text-sm">
                                  {Object.entries(balance).map(([token, value]) => (
                                    value && value > 0 ? (
                                      <div key={token} className="text-green-400">
                                        {value.toFixed(4)} {token}
                                      </div>
                                    ) : null
                                  ))}
                                  {totalBalance === 0 && (
                                    <span className="text-gray-500">0.0000</span>
                                  )}
                                </div>
                              </td>
                              <td className="py-3 px-4">
                                <div className="flex items-center space-x-2">
                                  <button
                                    onClick={() => setShowQRCode({ address: addressData.address, network: addressData.network })}
                                    className="p-2 text-blue-400 hover:bg-blue-400/20 rounded-lg"
                                  >
                                    <QrCodeIcon className="w-4 h-4" />
                                  </button>
                                </div>
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                </div>
              ) : (
                <div className="glass-effect rounded-xl p-12 text-center">
                  <WalletIcon className="w-16 h-16 text-gray-600 mx-auto mb-4" />
                  <p className="text-gray-400">No wallet details available for this user.</p>
                </div>
              )}
            </div>
          ) : (
            // Placeholder when no user selected
            <div className="glass-effect rounded-xl p-12 text-center">
              <FunnelIcon className="w-16 h-16 text-gray-600 mx-auto mb-4" />
              <h3 className="text-xl font-medium text-gray-300 mb-2">
                Search for a user to view wallet details.
              </h3>
              <p className="text-gray-500">
                Use the search bar above to find users by email, user ID, or name.
              </p>
            </div>
          )}

          {/* QR Code Modal */}
          {showQRCode && (
            <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
              <div className="glass-effect rounded-xl p-6 max-w-md w-full">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-semibold text-white">QR Code</h3>
                  <button
                    onClick={() => setShowQRCode(null)}
                    className="text-gray-400 hover:text-white"
                  >
                    <XMarkIcon className="w-5 h-5" />
                  </button>
                </div>
                
                <div className="text-center">
                  <div className="w-48 h-48 bg-white rounded-lg mx-auto mb-4 flex items-center justify-center">
                    <p className="text-gray-800 text-sm">QR Code Placeholder</p>
                  </div>
                  <p className="text-sm text-gray-400 mb-2">{showQRCode.network}</p>
                  <code className="text-xs text-blue-400 bg-white/10 px-2 py-1 rounded">
                    {showQRCode.address}
                  </code>
                  <button
                    onClick={() => copyToClipboard(showQRCode.address)}
                    className="ml-2 p-1 text-blue-400 hover:bg-blue-400/20 rounded"
                  >
                    <DocumentDuplicateIcon className="w-4 h-4" />
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

export default WalletManagementPage;
