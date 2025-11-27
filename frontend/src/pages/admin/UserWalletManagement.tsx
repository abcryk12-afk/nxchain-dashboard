import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { Search, Copy, Wallet, User, Calendar, Phone, Globe, QrCode, Eye, EyeOff, Loader2, Check, Key, Shield, Database } from 'lucide-react';
import { Input } from '../../components/ui/input';
import { Button } from '../../components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../../components/ui/table';
import { Badge } from '../../components/ui/badge';
import { Skeleton } from '../../components/ui/skeleton';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '../../components/ui/dialog';
import { toast } from 'sonner';
import AdminLayout from '../../components/admin/AdminLayout';

const UserWalletManagement: React.FC = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  // Check if user is admin
  useEffect(() => {
    if (!user || !user.isAdmin) {
      console.log('🔥 UserWalletManagement - Not admin, redirecting to admin-login');
      navigate('/admin-login');
      return;
    }
  }, [user, navigate]);

  if (!user || !user.isAdmin) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <p className="text-gray-400">Checking admin privileges...</p>
        </div>
      </div>
    );
  }

  // Types
interface UserDetails {
  userId: string;
  email: string;
  firstName: string;
  lastName: string;
  phone: string;
  country: string;
  referralCode: string;
  walletGenerated: boolean;
  createdAt: string;
  hdWalletId?: string;
}

interface WalletDetails {
  hdWalletId: string;
  mnemonicEncrypted: string;
  xpub: string;
  addresses: {
    bnb: {
      address: string;
      publicKey: string;
      privateKeyEncrypted: string;
      contractAddress: string;
      decimals: number;
      network: string;
    };
    ethereum: {
      address: string;
      publicKey: string;
      privateKeyEncrypted: string;
      contractAddress: string;
      decimals: number;
      network: string;
    };
    tron: {
      address: string;
      publicKey: string;
      privateKeyEncrypted: string;
      contractAddress: string;
      decimals: number;
      network: string;
    };
    polygon: {
      address: string;
      publicKey: string;
      privateKeyEncrypted: string;
      contractAddress: string;
      decimals: number;
      network: string;
    };
  };
}

interface WalletBalance {
  address: string;
  balance: number;
  usdtBalance: number;
  networkBalance: number;
}

const API_BASE_URL = process.env.REACT_APP_API_URL || 'https://nxchain-dashboard.onrender.com/api';

export default function UserWalletManagement() {
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<UserDetails[]>([]);
  const [selectedUser, setSelectedUser] = useState<UserDetails | null>(null);
  const [walletDetails, setWalletDetails] = useState<WalletDetails | null>(null);
  const [walletBalances, setWalletBalances] = useState<Record<string, WalletBalance>>({});
  const [loading, setLoading] = useState(false);
  const [showPrivateKeys, setShowPrivateKeys] = useState<Record<string, boolean>>({});
  const [copied, setCopied] = useState<string>('');

  // Search users
  const searchUsers = async (query: string) => {
    if (!query.trim()) {
      setSearchResults([]);
      return;
    }

    setLoading(true);
    try {
      const response = await axios.get(`${API_BASE_URL}/admin/user/details?query=${query}`, {
        headers: {
          Authorization: `Bearer ${localStorage.getItem('token')}`
        }
      });

      if (response.data.success) {
        setSearchResults(response.data.users || []);
      }
    } catch (error) {
      console.error('Search error:', error);
      toast.error('Failed to search users');
    } finally {
      setLoading(false);
    }
  };

  // Load user details
  const loadUserDetails = async (user: UserDetails) => {
    setSelectedUser(user);
    setSearchResults([]);
    setSearchQuery('');

    // Load wallet details
    try {
      const walletResponse = await axios.get(`${API_BASE_URL}/admin/user/wallets/${user.userId}`, {
        headers: {
          Authorization: `Bearer ${localStorage.getItem('token')}`
        }
      });

      if (walletResponse.data.success) {
        setWalletDetails(walletResponse.data.wallet);
        
        // Load balances for all addresses
        const addresses = Object.values(walletResponse.data.wallet.addresses);
        const balancePromises = addresses.map(async (addr: any) => {
          try {
            const balanceResponse = await axios.get(`${API_BASE_URL}/admin/user/wallet-balance/${addr.address}`, {
              headers: {
                Authorization: `Bearer ${localStorage.getItem('token')}`
              }
            });
            return {
              address: addr.address,
              ...balanceResponse.data
            };
          } catch (error) {
            return {
              address: addr.address,
              balance: 0,
              usdtBalance: 0,
              networkBalance: 0
            };
          }
        });

        const balances = await Promise.all(balancePromises);
        const balanceMap = balances.reduce((acc, balance) => {
          acc[balance.address] = balance;
          return acc;
        }, {} as Record<string, WalletBalance>);

        setWalletBalances(balanceMap);
      }
    } catch (error) {
      console.error('Wallet details error:', error);
      toast.error('Failed to load wallet details');
    }
  };

  // Copy to clipboard
  const copyToClipboard = async (text: string, type: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(type);
      toast.success('Copied to clipboard');
      setTimeout(() => setCopied(''), 2000);
    } catch (error) {
      toast.error('Failed to copy');
    }
  };

  // Fetch master wallet info
  const fetchMasterWalletInfo = async () => {
    try {
      const response = await axios.get(`${API_BASE_URL}/wallet/master-info`, {
        headers: {
          Authorization: `Bearer ${localStorage.getItem('token')}`
        }
      });

      if (response.data.success) {
        console.log('🔥 MASTER WALLET INFO:', response.data.masterInfo);
        toast.success('Master wallet info loaded!');
      }
    } catch (error) {
      console.error('🔥 MASTER WALLET INFO ERROR:', error);
      toast.error('Failed to fetch master wallet info');
    }
  };
  const togglePrivateKey = (address: string) => {
    setShowPrivateKeys(prev => ({
      ...prev,
      [address]: !prev[address]
    }));
  };

  // Format balance
  const formatBalance = (balance: number, decimals: number = 6) => {
    return balance.toFixed(decimals);
  };

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      {/* Page Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">User Wallet Management</h1>
        <p className="text-gray-600">Search users and view their wallet details</p>
      </div>

      {/* Search Panel */}
      <Card className="mb-6">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Search className="h-5 w-5" />
            Search Users
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="relative">
            <Input
              placeholder="Search by email, user ID, or name..."
              value={searchQuery}
              onChange={(e) => {
                setSearchQuery(e.target.value);
                searchUsers(e.target.value);
              }}
              className="pr-12"
            />
            <div className="absolute right-3 top-3">
              {loading ? (
                <Loader2 className="h-5 w-5 animate-spin text-gray-400" />
              ) : (
                <Search className="h-5 w-5 text-gray-400" />
              )}
            </div>
          </div>

          {/* Search Results */}
          {searchResults.length > 0 && (
            <div className="mt-4 border rounded-lg p-2 max-h-60 overflow-y-auto">
              {searchResults.map((user) => (
                <div
                  key={user.userId}
                  onClick={() => loadUserDetails(user)}
                  className="p-3 hover:bg-gray-50 rounded cursor-pointer transition-colors"
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="font-medium">{user.firstName} {user.lastName}</div>
                      <div className="text-sm text-gray-500">{user.email}</div>
                      <div className="text-xs text-gray-400">ID: {user.userId}</div>
                    </div>
                    <Badge variant={user.walletGenerated ? "default" : "secondary"}>
                      {user.walletGenerated ? "Wallet" : "No Wallet"}
                    </Badge>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Master Wallet Info Section */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Shield className="h-5 w-5" />
            Master Wallet Information
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="p-4 border rounded-lg bg-gray-50">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                  <Key className="h-5 w-5 text-blue-600" />
                  <span className="font-medium">HD Wallet System</span>
                </div>
                <Badge variant="outline">Production Ready</Badge>
              </div>
              
              <div className="grid grid-cols-2 gap-4 mb-4">
                <div>
                  <label className="text-sm font-medium text-gray-500">Master Mnemonic</label>
                  <div className="text-sm mt-1 font-mono bg-gray-100 p-2 rounded">
                    danger attack gesture cliff clap stage tag spare loop cousin either put
                  </div>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-500">Supported Networks</label>
                  <div className="text-sm mt-1">
                    <Badge variant="secondary" className="mr-1">BSC</Badge>
                    <Badge variant="secondary" className="mr-1">ETH</Badge>
                    <Badge variant="secondary" className="mr-1">TRON</Badge>
                    <Badge variant="secondary">POLYGON</Badge>
                  </div>
                </div>
              </div>

              <div className="flex gap-2">
                <Button 
                  onClick={fetchMasterWalletInfo}
                  className="flex items-center gap-2"
                >
                  <Database className="h-4 w-4" />
                  Fetch Master Wallet Info
                </Button>
                <Button 
                  variant="outline"
                  onClick={() => copyToClipboard('danger attack gesture cliff clap stage tag spare loop cousin either put', 'mnemonic')}
                >
                  {copied === 'mnemonic' ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                  Copy Mnemonic
                </Button>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* User Details Panel */}
      {selectedUser ? (
        <div className="space-y-6">
          {/* User Information */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <User className="h-5 w-5" />
                User Information
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium text-gray-500">User ID</label>
                  <div className="flex items-center gap-2 mt-1">
                    <span className="text-sm font-mono">{selectedUser.userId}</span>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => copyToClipboard(selectedUser.userId, 'userId')}
                    >
                      {copied === 'userId' ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                    </Button>
                  </div>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-500">Full Name</label>
                  <div className="text-sm mt-1">{selectedUser.firstName} {selectedUser.lastName}</div>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-500">Email</label>
                  <div className="flex items-center gap-2 mt-1">
                    <span className="text-sm">{selectedUser.email}</span>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => copyToClipboard(selectedUser.email, 'email')}
                    >
                      {copied === 'email' ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                    </Button>
                  </div>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-500">Phone</label>
                  <div className="text-sm mt-1 flex items-center gap-2">
                    <Phone className="h-4 w-4 text-gray-400" />
                    {selectedUser.phone || 'Not provided'}
                  </div>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-500">Country</label>
                  <div className="text-sm mt-1 flex items-center gap-2">
                    <Globe className="h-4 w-4 text-gray-400" />
                    {selectedUser.country || 'Not provided'}
                  </div>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-500">Registration Date</label>
                  <div className="text-sm mt-1 flex items-center gap-2">
                    <Calendar className="h-4 w-4 text-gray-400" />
                    {new Date(selectedUser.createdAt).toLocaleDateString()}
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Wallet Details */}
          {walletDetails && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Wallet className="h-5 w-5" />
                  Wallet Details
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-3 gap-4 mb-6">
                  <div>
                    <label className="text-sm font-medium text-gray-500">HD Wallet ID</label>
                    <div className="text-sm font-mono mt-1">{walletDetails.hdWalletId}</div>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-500">XPub</label>
                    <div className="text-sm font-mono mt-1 truncate">{walletDetails.xpub}</div>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-500">Wallet Status</label>
                    <div className="mt-1">
                      <Badge variant="default">Active</Badge>
                    </div>
                  </div>
                </div>

                {/* Wallet Addresses Table */}
                <div className="border rounded-lg overflow-hidden">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Network</TableHead>
                        <TableHead>Address</TableHead>
                        <TableHead>Public Key</TableHead>
                        <TableHead>Private Key</TableHead>
                        <TableHead>USDT Balance</TableHead>
                        <TableHead>Network Balance</TableHead>
                        <TableHead>Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {Object.entries(walletDetails.addresses).map(([network, wallet]) => {
                        const balance = walletBalances[wallet.address];
                        return (
                          <TableRow key={network}>
                            <TableCell>
                              <Badge variant="outline" className="capitalize">
                                {network}
                              </Badge>
                            </TableCell>
                            <TableCell>
                              <div className="flex items-center gap-2">
                                <span className="font-mono text-sm truncate max-w-[200px]">
                                  {wallet.address}
                                </span>
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => copyToClipboard(wallet.address, `address-${network}`)}
                                >
                                  {copied === `address-${network}` ? (
                                    <Check className="h-4 w-4" />
                                  ) : (
                                    <Copy className="h-4 w-4" />
                                  )}
                                </Button>
                              </div>
                            </TableCell>
                            <TableCell>
                              <div className="flex items-center gap-2">
                                <span className="font-mono text-xs truncate max-w-[150px]">
                                  {wallet.publicKey}
                                </span>
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => copyToClipboard(wallet.publicKey, `public-${network}`)}
                                >
                                  {copied === `public-${network}` ? (
                                    <Check className="h-4 w-4" />
                                  ) : (
                                    <Copy className="h-4 w-4" />
                                  )}
                                </Button>
                              </div>
                            </TableCell>
                            <TableCell>
                              <div className="flex items-center gap-2">
                                <span className="font-mono text-xs truncate max-w-[150px]">
                                  {showPrivateKeys[wallet.address] ? wallet.privateKeyEncrypted : '••••••••••••••••'}
                                </span>
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => togglePrivateKey(wallet.address)}
                                >
                                  {showPrivateKeys[wallet.address] ? (
                                    <EyeOff className="h-4 w-4" />
                                  ) : (
                                    <Eye className="h-4 w-4" />
                                  )}
                                </Button>
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => copyToClipboard(wallet.privateKeyEncrypted, `private-${network}`)}
                                >
                                  {copied === `private-${network}` ? (
                                    <Check className="h-4 w-4" />
                                  ) : (
                                    <Copy className="h-4 w-4" />
                                  )}
                                </Button>
                              </div>
                            </TableCell>
                            <TableCell>
                              <div className="text-sm">
                                {balance ? formatBalance(balance.usdtBalance, wallet.decimals) : '0.000000'} USDT
                              </div>
                            </TableCell>
                            <TableCell>
                              <div className="text-sm">
                                {balance ? formatBalance(balance.networkBalance, 4) : '0.0000'} {network.toUpperCase()}
                              </div>
                            </TableCell>
                            <TableCell>
                              <div className="flex items-center gap-2">
                                <Dialog>
                                  <DialogTrigger asChild>
                                    <Button variant="ghost" size="sm">
                                      <QrCode className="h-4 w-4" />
                                    </Button>
                                  </DialogTrigger>
                                  <DialogContent>
                                    <DialogHeader>
                                      <DialogTitle>QR Code - {network.toUpperCase()}</DialogTitle>
                                    </DialogHeader>
                                    <div className="flex justify-center p-6">
                                      <div className="bg-white p-4 rounded-lg">
                                        <div className="w-48 h-48 bg-gray-200 flex items-center justify-center">
                                          <QrCode className="h-24 w-24 text-gray-400" />
                                        </div>
                                      </div>
                                    </div>
                                    <div className="text-center">
                                      <p className="text-sm text-gray-600 mb-2">{wallet.address}</p>
                                      <Button
                                        onClick={() => copyToClipboard(wallet.address, `qr-${network}`)}
                                        variant="outline"
                                        size="sm"
                                      >
                                        Copy Address
                                      </Button>
                                    </div>
                                  </DialogContent>
                                </Dialog>
                              </div>
                            </TableCell>
                          </TableRow>
                        );
                      })}
                    </TableBody>
                  </Table>
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      ) : (
        // Placeholder when no user selected
        <Card className="text-center py-12">
          <CardContent>
            <div className="flex flex-col items-center justify-center text-gray-500">
              <Search className="h-12 w-12 mb-4 text-gray-300" />
              <h3 className="text-lg font-medium mb-2">No User Selected</h3>
              <p>Search for a user to view wallet details.</p>
            </div>
          </CardContent>
        </Card>
      )
    </div>
  );
};

// Wrap with AdminLayout
const UserWalletManagementWithLayout: React.FC = () => {
  return (
    <AdminLayout title="Wallet Management">
      <UserWalletManagement />
    </AdminLayout>
  );
};

export default UserWalletManagementWithLayout;
