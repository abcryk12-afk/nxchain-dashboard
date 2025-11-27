import React, { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { 
  HomeIcon,
  UserGroupIcon,
  WalletIcon,
  ArrowPathIcon,
  FunnelIcon,
  Cog6ToothIcon,
  ArrowRightOnRectangleIcon,
  UserIcon,
  ChevronDownIcon,
  Bars3Icon,
  XMarkIcon
} from '@heroicons/react/24/outline';

const AdminHeader: React.FC = () => {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [profileDropdownOpen, setProfileDropdownOpen] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();
  const { user, logout } = useAuth();

  const adminNavItems = [
    {
      name: 'Dashboard',
      path: '/admin',
      icon: HomeIcon,
      description: 'Admin overview'
    },
    {
      name: 'User Management',
      path: '/admin/users',
      icon: UserGroupIcon,
      description: 'Manage users'
    },
    {
      name: 'Wallet Management',
      path: '/admin/wallet-management',
      icon: WalletIcon,
      description: 'Monitor wallets'
    },
    {
      name: 'Transactions',
      path: '/admin/transactions',
      icon: ArrowPathIcon,
      description: 'View transactions'
    },
    {
      name: 'Gas Management',
      path: '/admin/system/gas-management',
      icon: FunnelIcon,
      description: 'Gas settings'
    },
    {
      name: 'System Settings',
      path: '/admin/settings',
      icon: Cog6ToothIcon,
      description: 'System config'
    }
  ];

  const handleLogout = async () => {
    try {
      await logout();
      navigate('/admin-login');
    } catch (error) {
      console.error('Logout failed:', error);
    }
  };

  const handleSwitchToUser = () => {
    navigate('/dashboard');
  };

  const isActivePath = (path: string) => {
    if (path === '/admin') {
      return location.pathname === '/admin';
    }
    return location.pathname.startsWith(path);
  };

  return (
    <header className="bg-gray-900 border-b border-gray-800 sticky top-0 z-50">
      {/* Desktop Navigation */}
      <nav className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          {/* Logo and Main Nav */}
          <div className="flex items-center space-x-8">
            {/* Logo */}
            <div 
              className="flex items-center space-x-3 cursor-pointer"
              onClick={() => navigate('/admin')}
            >
              <div className="w-8 h-8 bg-gradient-to-r from-red-500 to-purple-600 rounded-lg flex items-center justify-center">
                <span className="text-white font-bold text-sm">NX</span>
              </div>
              <span className="text-white font-bold text-xl">Admin</span>
            </div>

            {/* Desktop Navigation Links */}
            <div className="hidden md:flex items-center space-x-1">
              {adminNavItems.map((item) => (
                <button
                  key={item.path}
                  onClick={() => navigate(item.path)}
                  className={`flex items-center space-x-2 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                    isActivePath(item.path)
                      ? 'bg-red-500/20 text-red-400 border border-red-500/30'
                      : 'text-gray-300 hover:bg-white/10 hover:text-white'
                  }`}
                >
                  <item.icon className="w-4 h-4" />
                  <span>{item.name}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Right Side Actions */}
          <div className="flex items-center space-x-4">
            {/* Switch to User Dashboard */}
            <button
              onClick={handleSwitchToUser}
              className="hidden sm:flex items-center space-x-2 px-3 py-2 bg-blue-600/20 text-blue-400 border border-blue-500/30 rounded-lg hover:bg-blue-600/30 transition-colors"
            >
              <UserIcon className="w-4 h-4" />
              <span className="text-sm">User View</span>
            </button>

            {/* Profile Dropdown */}
            <div className="relative">
              <button
                onClick={() => setProfileDropdownOpen(!profileDropdownOpen)}
                className="flex items-center space-x-2 p-2 rounded-lg hover:bg-white/10 transition-colors"
              >
                <div className="w-8 h-8 bg-gradient-to-r from-red-500 to-purple-600 rounded-full flex items-center justify-center">
                  <UserIcon className="w-4 h-4 text-white" />
                </div>
                <ChevronDownIcon className="w-4 h-4 text-gray-400" />
              </button>

              {/* Dropdown Menu */}
              {profileDropdownOpen && (
                <div className="absolute right-0 mt-2 w-48 bg-gray-800 border border-gray-700 rounded-lg shadow-lg py-1">
                  <div className="px-4 py-2 border-b border-gray-700">
                    <p className="text-sm font-medium text-white">Admin User</p>
                    <p className="text-xs text-gray-400">{user?.email}</p>
                  </div>
                  
                  <button
                    onClick={handleSwitchToUser}
                    className="w-full flex items-center space-x-2 px-4 py-2 text-sm text-gray-300 hover:bg-gray-700 transition-colors"
                  >
                    <UserIcon className="w-4 h-4" />
                    <span>Switch to User View</span>
                  </button>
                  
                  <button
                    onClick={() => navigate('/admin/settings')}
                    className="w-full flex items-center space-x-2 px-4 py-2 text-sm text-gray-300 hover:bg-gray-700 transition-colors"
                  >
                    <Cog6ToothIcon className="w-4 h-4" />
                    <span>Settings</span>
                  </button>
                  
                  <div className="border-t border-gray-700">
                    <button
                      onClick={handleLogout}
                      className="w-full flex items-center space-x-2 px-4 py-2 text-sm text-red-400 hover:bg-red-500/10 transition-colors"
                    >
                      <ArrowRightOnRectangleIcon className="w-4 h-4" />
                      <span>Logout</span>
                    </button>
                  </div>
                </div>
              )}
            </div>

            {/* Mobile Menu Button */}
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="md:hidden p-2 rounded-lg hover:bg-white/10 transition-colors"
            >
              {mobileMenuOpen ? (
                <XMarkIcon className="w-6 h-6 text-white" />
              ) : (
                <Bars3Icon className="w-6 h-6 text-white" />
              )}
            </button>
          </div>
        </div>

        {/* Mobile Navigation */}
        {mobileMenuOpen && (
          <div className="md:hidden py-4 border-t border-gray-800">
            <div className="space-y-2">
              {adminNavItems.map((item) => (
                <button
                  key={item.path}
                  onClick={() => {
                    navigate(item.path);
                    setMobileMenuOpen(false);
                  }}
                  className={`w-full flex items-center space-x-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                    isActivePath(item.path)
                      ? 'bg-red-500/20 text-red-400 border border-red-500/30'
                      : 'text-gray-300 hover:bg-white/10'
                  }`}
                >
                  <item.icon className="w-5 h-5" />
                  <div className="flex-1 text-left">
                    <div>{item.name}</div>
                    <div className="text-xs text-gray-400">{item.description}</div>
                  </div>
                </button>
              ))}
              
              <div className="border-t border-gray-700 pt-2 mt-2">
                <button
                  onClick={handleSwitchToUser}
                  className="w-full flex items-center space-x-3 px-3 py-2 rounded-lg text-sm font-medium text-blue-400 bg-blue-600/20 border border-blue-500/30"
                >
                  <UserIcon className="w-5 h-5" />
                  <span>Switch to User View</span>
                </button>
              </div>
            </div>
          </div>
        )}
      </nav>
    </header>
  );
};

export default AdminHeader;
