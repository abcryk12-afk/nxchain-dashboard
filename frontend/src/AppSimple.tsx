import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import AdminLoginPage from './pages/admin/AdminLoginPage';
import SimpleAdminPage from './pages/SimpleAdminPage';
import LoginPage from './pages/LoginPage';
import RegisterPage from './pages/RegisterPage';
import DashboardHome from './components/DashboardHome';
import DepositPage from './pages/DepositPage';
import StakingPage from './pages/StakingPage';
import WithdrawalPage from './pages/WithdrawalPage';
import ProfilePage from './pages/ProfilePage';
import SupportPage from './pages/SupportPage';
import { dashboard } from './services/api';
import { DashboardData } from './types';
import UserManagementPage from './pages/admin/UserManagementPage';
import WalletManagementPage from './pages/admin/WalletManagementPage';
import TransactionsPage from './pages/admin/TransactionsPage';
import GasManagementPage from './pages/admin/GasManagementPage';
import AdminSettingsPage from './pages/admin/AdminSettingsPage';
import { UserProtectedRoute, AdminProtectedRoute } from './components/ProtectedRoute';

// Admin Public Route - for admin login page
const AdminPublicRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user } = useAuth();
  
  // If admin already logged in, redirect to admin dashboard
  if (user && user.isAdmin) {
    return <Navigate to="/admin" replace />;
  }
  
  // If normal user is logged in, stop them from accessing admin login
  if (user && !user.isAdmin) {
    return <Navigate to="/dashboard" replace />;
  }
  
  return <>{children}</>;
};

// User Public Route - for user login/register pages
const UserPublicRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user } = useAuth();
  
  // If any user is logged in, redirect to appropriate dashboard
  if (user) {
    if (user.isAdmin) {
      return <Navigate to="/admin" replace />;
    } else {
      return <Navigate to="/dashboard" replace />;
    }
  }
  
  return <>{children}</>;
};

// Dashboard Wrapper Component
const DashboardWrapper: React.FC = () => {
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const { user } = useAuth();

  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        if (user) {
          const dashboardData = await dashboard.getData();
          setData(dashboardData);
        }
      } catch (error) {
        console.error('Failed to fetch dashboard data:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchDashboardData();
  }, [user]);

  if (loading) {
    return <div>Loading dashboard...</div>;
  }

  if (!data) {
    return <div>Failed to load dashboard</div>;
  }

  return <DashboardHome data={data} />;
};

function AppSimple() {
  return (
    <AuthProvider>
      <Router>
        <Routes>
          {/* Public Routes */}
          <Route path="/login" element={<UserPublicRoute><LoginPage /></UserPublicRoute>} />
          <Route path="/register" element={<UserPublicRoute><RegisterPage /></UserPublicRoute>} />
          <Route path="/admin-login" element={<AdminPublicRoute><AdminLoginPage /></AdminPublicRoute>} />
          
          {/* User Protected Routes */}
          <Route path="/" element={
            <UserProtectedRoute>
              <DashboardWrapper />
            </UserProtectedRoute>
          } />
          <Route path="/dashboard" element={
            <UserProtectedRoute>
              <DashboardWrapper />
            </UserProtectedRoute>
          } />
          <Route path="/deposit" element={
            <UserProtectedRoute>
              <DepositPage />
            </UserProtectedRoute>
          } />
          <Route path="/staking" element={
            <UserProtectedRoute>
              <StakingPage />
            </UserProtectedRoute>
          } />
          <Route path="/withdrawal" element={
            <UserProtectedRoute>
              <WithdrawalPage />
            </UserProtectedRoute>
          } />
          <Route path="/profile" element={
            <UserProtectedRoute>
              <ProfilePage />
            </UserProtectedRoute>
          } />
          <Route path="/support" element={
            <UserProtectedRoute>
              <SupportPage />
            </UserProtectedRoute>
          } />
          <Route path="/settings" element={
            <UserProtectedRoute>
              <DashboardWrapper />
            </UserProtectedRoute>
          } />
          
          {/* Admin Protected Routes */}
          <Route path="/admin" element={
            <AdminProtectedRoute>
              <SimpleAdminPage />
            </AdminProtectedRoute>
          } />
          
          {/* Admin Sub-Routes - Now pointing to actual pages */}
          <Route path="/admin/users" element={
            <AdminProtectedRoute>
              <UserManagementPage />
            </AdminProtectedRoute>
          } />
          <Route path="/admin/wallet-management" element={
            <AdminProtectedRoute>
              <WalletManagementPage />
            </AdminProtectedRoute>
          } />
          <Route path="/admin/transactions" element={
            <AdminProtectedRoute>
              <TransactionsPage />
            </AdminProtectedRoute>
          } />
          <Route path="/admin/system/gas-management" element={
            <AdminProtectedRoute>
              <GasManagementPage />
            </AdminProtectedRoute>
          } />
          <Route path="/admin/settings" element={
            <AdminProtectedRoute>
              <AdminSettingsPage />
            </AdminProtectedRoute>
          } />
          
          {/* Default redirect */}
          <Route path="*" element={<Navigate to="/login" replace />} />
        </Routes>
      </Router>
    </AuthProvider>
  );
}

export default AppSimple;
