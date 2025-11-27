import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

const SimpleAdminPage: React.FC = () => {
  const navigate = useNavigate();
  const { user, logout } = useAuth();  // ✅ Add logout here

  console.log('🔥 SimpleAdminPage - Component loaded');
  console.log('🔥 SimpleAdminPage - User:', user);
  console.log('🔥 SimpleAdminPage - User isAdmin:', user?.isAdmin);

  // Admin check
  if (!user || !user.isAdmin) {
    console.log('🔥 SimpleAdminPage - Not admin or no user, redirecting to admin-login');
    navigate('/admin-login');
    return null;
  }

  console.log('🔥 SimpleAdminPage - Admin check passed, rendering dashboard');

  return (
    <div className="min-h-screen bg-gray-900 text-white p-8">
      <div className="max-w-6xl mx-auto">
        <h1 className="text-4xl font-bold mb-8 text-center">NXChain Admin Dashboard</h1>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          <div className="bg-gray-800 p-6 rounded-lg">
            <h2 className="text-2xl font-semibold mb-4">👥 User Management</h2>
            <p className="text-gray-400 mb-4">Manage registered users and their accounts</p>
            <button 
              className="bg-blue-600 hover:bg-blue-700 px-4 py-2 rounded w-full"
              onClick={() => navigate('/admin/users')}
            >
              Manage Users
            </button>
          </div>

          <div className="bg-gray-800 p-6 rounded-lg">
            <h2 className="text-2xl font-semibold mb-4">💰 Wallet Management</h2>
            <p className="text-gray-400 mb-4">Monitor and manage user wallets</p>
            <button 
              className="bg-green-600 hover:bg-green-700 px-4 py-2 rounded w-full"
              onClick={() => navigate('/admin/wallet-management')}
            >
              Manage Wallets
            </button>
          </div>

          <div className="bg-gray-800 p-6 rounded-lg">
            <h2 className="text-2xl font-semibold mb-4">🔄 Transactions</h2>
            <p className="text-gray-400 mb-4">View and monitor all transactions</p>
            <button 
              className="bg-purple-600 hover:bg-purple-700 px-4 py-2 rounded w-full"
              onClick={() => navigate('/admin/transactions')}
            >
              View Transactions
            </button>
          </div>

          <div className="bg-gray-800 p-6 rounded-lg">
            <h2 className="text-2xl font-semibold mb-4">⛽ Gas Management</h2>
            <p className="text-gray-400 mb-4">Manage gas fees and settings</p>
            <button 
              className="bg-yellow-600 hover:bg-yellow-700 px-4 py-2 rounded w-full"
              onClick={() => navigate('/admin/system/gas-management')}
            >
              Manage Gas
            </button>
          </div>

          <div className="bg-gray-800 p-6 rounded-lg">
            <h2 className="text-2xl font-semibold mb-4">⚙️ System Settings</h2>
            <p className="text-gray-400 mb-4">Configure system parameters</p>
            <button 
              className="bg-gray-600 hover:bg-gray-700 px-4 py-2 rounded w-full"
              onClick={() => navigate('/admin/settings')}
            >
              Settings
            </button>
          </div>

          <div className="bg-gray-800 p-6 rounded-lg">
            <h2 className="text-2xl font-semibold mb-4">📊 Dashboard</h2>
            <p className="text-gray-400 mb-4">View system statistics</p>
            <button 
              className="bg-indigo-600 hover:bg-indigo-700 px-4 py-2 rounded w-full"
              onClick={() => navigate('/admin')}
            >
              Dashboard
            </button>
          </div>
        </div>

        <div className="mt-8 text-center">
          <button 
            className="bg-red-600 hover:bg-red-700 px-6 py-3 rounded-lg"
            onClick={() => {
              console.log('🔥 Admin logout clicked');
              logout(true);  // ✅ Use AuthContext logout with isAdmin=true
            }}
          >
            Logout
          </button>
        </div>
      </div>
    </div>
  );
};

export default SimpleAdminPage;
