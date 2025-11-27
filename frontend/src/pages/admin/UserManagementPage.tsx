import React, { useState, useEffect } from 'react';
import { 
  UserIcon, 
  MagnifyingGlassIcon,
  PencilIcon,
  TrashIcon,
  ShieldCheckIcon,
  ClockIcon,
  CheckCircleIcon,
  XCircleIcon
} from '@heroicons/react/24/outline';
import Header from '../../components/Header';

interface User {
  _id: string;
  email: string;
  firstName: string;
  lastName: string;
  phone?: string;
  country?: string;
  balance: number;
  totalEarnings: number;
  referralEarnings: number;
  status: 'active' | 'suspended' | 'pending';
  isAdmin: boolean;
  createdAt: string;
  lastLogin?: string;
}

const UserManagementPage: React.FC = () => {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [showEditModal, setShowEditModal] = useState(false);

  // Mock data - replace with actual API call
  useEffect(() => {
    const mockUsers: User[] = [
      {
        _id: '1',
        email: 'user1@example.com',
        firstName: 'John',
        lastName: 'Doe',
        phone: '+1234567890',
        country: 'USA',
        balance: 1500,
        totalEarnings: 250,
        referralEarnings: 50,
        status: 'active',
        isAdmin: false,
        createdAt: '2024-01-15T10:30:00Z',
        lastLogin: '2024-11-28T08:15:00Z'
      },
      {
        _id: '2',
        email: 'user2@example.com',
        firstName: 'Jane',
        lastName: 'Smith',
        balance: 3200,
        totalEarnings: 480,
        referralEarnings: 120,
        status: 'active',
        isAdmin: false,
        createdAt: '2024-02-20T14:22:00Z',
        lastLogin: '2024-11-27T16:45:00Z'
      },
      {
        _id: '3',
        email: 'admin@example.com',
        firstName: 'Admin',
        lastName: 'User',
        balance: 0,
        totalEarnings: 0,
        referralEarnings: 0,
        status: 'active',
        isAdmin: true,
        createdAt: '2024-01-01T00:00:00Z',
        lastLogin: '2024-11-28T09:00:00Z'
      }
    ];
    
    setTimeout(() => {
      setUsers(mockUsers);
      setLoading(false);
    }, 1000);
  }, []);

  const filteredUsers = users.filter(user =>
    user.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
    user.firstName.toLowerCase().includes(searchTerm.toLowerCase()) ||
    user.lastName.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active': return 'text-green-400 bg-green-400/20';
      case 'suspended': return 'text-red-400 bg-red-400/20';
      case 'pending': return 'text-yellow-400 bg-yellow-400/20';
      default: return 'text-gray-400 bg-gray-400/20';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'active': return <CheckCircleIcon className="w-4 h-4" />;
      case 'suspended': return <XCircleIcon className="w-4 h-4" />;
      case 'pending': return <ClockIcon className="w-4 h-4" />;
      default: return <ClockIcon className="w-4 h-4" />;
    }
  };

  const handleUserAction = (action: string, user: User) => {
    switch (action) {
      case 'edit':
        setSelectedUser(user);
        setShowEditModal(true);
        break;
      case 'suspend':
        // Handle suspend user
        console.log('Suspend user:', user._id);
        break;
      case 'delete':
        // Handle delete user
        console.log('Delete user:', user._id);
        break;
    }
  };

  return (
    <>
      <Header />
      <div className="min-h-screen bg-gray-900 text-white p-6">
        <div className="max-w-7xl mx-auto">
          {/* Header */}
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-white mb-2">User Management</h1>
            <p className="text-gray-400">Manage registered users and their accounts</p>
          </div>

          {/* Stats Cards */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
            <div className="glass-effect rounded-xl p-6">
              <div className="flex items-center justify-between mb-4">
                <UserIcon className="w-8 h-8 text-blue-400" />
                <span className="text-2xl font-bold">{users.length}</span>
              </div>
              <p className="text-gray-400">Total Users</p>
            </div>
            <div className="glass-effect rounded-xl p-6">
              <div className="flex items-center justify-between mb-4">
                <CheckCircleIcon className="w-8 h-8 text-green-400" />
                <span className="text-2xl font-bold">
                  {users.filter(u => u.status === 'active').length}
                </span>
              </div>
              <p className="text-gray-400">Active Users</p>
            </div>
            <div className="glass-effect rounded-xl p-6">
              <div className="flex items-center justify-between mb-4">
                <ClockIcon className="w-8 h-8 text-yellow-400" />
                <span className="text-2xl font-bold">
                  {users.filter(u => u.status === 'pending').length}
                </span>
              </div>
              <p className="text-gray-400">Pending Users</p>
            </div>
            <div className="glass-effect rounded-xl p-6">
              <div className="flex items-center justify-between mb-4">
                <ShieldCheckIcon className="w-8 h-8 text-purple-400" />
                <span className="text-2xl font-bold">
                  {users.filter(u => u.isAdmin).length}
                </span>
              </div>
              <p className="text-gray-400">Admin Users</p>
            </div>
          </div>

          {/* Search Bar */}
          <div className="glass-effect rounded-xl p-4 mb-6">
            <div className="relative">
              <MagnifyingGlassIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
              <input
                type="text"
                placeholder="Search users by email, name..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-3 bg-white/5 border border-white/10 rounded-lg focus:outline-none focus:border-nx-blue text-white placeholder-gray-400"
              />
            </div>
          </div>

          {/* Users Table */}
          <div className="glass-effect rounded-xl overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-white/10">
                    <th className="text-left py-4 px-6 text-sm font-medium text-gray-400">User</th>
                    <th className="text-left py-4 px-6 text-sm font-medium text-gray-400">Contact</th>
                    <th className="text-left py-4 px-6 text-sm font-medium text-gray-400">Balance</th>
                    <th className="text-left py-4 px-6 text-sm font-medium text-gray-400">Earnings</th>
                    <th className="text-left py-4 px-6 text-sm font-medium text-gray-400">Status</th>
                    <th className="text-left py-4 px-6 text-sm font-medium text-gray-400">Role</th>
                    <th className="text-left py-4 px-6 text-sm font-medium text-gray-400">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {loading ? (
                    <tr>
                      <td colSpan={7} className="py-12 text-center text-gray-400">
                        Loading users...
                      </td>
                    </tr>
                  ) : filteredUsers.length === 0 ? (
                    <tr>
                      <td colSpan={7} className="py-12 text-center text-gray-400">
                        No users found matching your search.
                      </td>
                    </tr>
                  ) : (
                    filteredUsers.map((user) => (
                      <tr key={user._id} className="border-b border-white/5 hover:bg-white/5">
                        <td className="py-4 px-6">
                          <div className="flex items-center space-x-3">
                            <div className="w-10 h-10 bg-gradient-to-r from-blue-400 to-purple-500 rounded-full flex items-center justify-center">
                              <UserIcon className="w-5 h-5 text-white" />
                            </div>
                            <div>
                              <p className="text-white font-medium">
                                {user.firstName} {user.lastName}
                              </p>
                              <p className="text-sm text-gray-400">
                                Joined {new Date(user.createdAt).toLocaleDateString()}
                              </p>
                            </div>
                          </div>
                        </td>
                        <td className="py-4 px-6">
                          <p className="text-white">{user.email}</p>
                          {user.phone && (
                            <p className="text-sm text-gray-400">{user.phone}</p>
                          )}
                        </td>
                        <td className="py-4 px-6">
                          <p className="text-white font-medium">
                            ${user.balance.toLocaleString()}
                          </p>
                        </td>
                        <td className="py-4 px-6">
                          <div className="space-y-1">
                            <p className="text-white">
                              Total: ${user.totalEarnings.toLocaleString()}
                            </p>
                            <p className="text-sm text-green-400">
                              Referral: ${user.referralEarnings.toLocaleString()}
                            </p>
                          </div>
                        </td>
                        <td className="py-4 px-6">
                          <span className={`inline-flex items-center space-x-1 px-2 py-1 rounded-full text-xs ${getStatusColor(user.status)}`}>
                            {getStatusIcon(user.status)}
                            <span>{user.status}</span>
                          </span>
                        </td>
                        <td className="py-4 px-6">
                          <span className={`inline-flex items-center space-x-1 px-2 py-1 rounded-full text-xs ${
                            user.isAdmin 
                              ? 'text-purple-400 bg-purple-400/20' 
                              : 'text-gray-400 bg-gray-400/20'
                          }`}>
                            <ShieldCheckIcon className="w-3 h-3" />
                            <span>{user.isAdmin ? 'Admin' : 'User'}</span>
                          </span>
                        </td>
                        <td className="py-4 px-6">
                          <div className="flex items-center space-x-2">
                            <button
                              onClick={() => handleUserAction('edit', user)}
                              className="p-2 text-blue-400 hover:bg-blue-400/20 rounded-lg"
                            >
                              <PencilIcon className="w-4 h-4" />
                            </button>
                            <button
                              onClick={() => handleUserAction('suspend', user)}
                              className="p-2 text-yellow-400 hover:bg-yellow-400/20 rounded-lg"
                            >
                              <ClockIcon className="w-4 h-4" />
                            </button>
                            <button
                              onClick={() => handleUserAction('delete', user)}
                              className="p-2 text-red-400 hover:bg-red-400/20 rounded-lg"
                            >
                              <TrashIcon className="w-4 h-4" />
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
        </div>
      </div>
    </>
  );
};

export default UserManagementPage;
