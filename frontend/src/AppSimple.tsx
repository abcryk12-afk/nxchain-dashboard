import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { Toaster } from 'sonner';
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

// Admin Protected Route - Bug-Free Version
const AdminProtectedRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user, loading } = useAuth();
  const location = useLocation();
  
  if (loading) return <div>Loading...</div>;
  
  // If not logged in
  if (!user) {
    return <Navigate to="/admin-login" replace />;
  }
  
  // If user is NOT admin but trying to access admin page
  if (!user.isAdmin && location.pathname.startsWith('/admin')) {
    console.log('🔥 ProtectedRoute - Non-admin trying to access admin page, redirecting to user dashboard');
    return <Navigate to="/dashboard" replace />;
  }
  
  // If admin trying to access admin pages (this is correct)
  if (user.isAdmin && location.pathname.startsWith('/admin')) {
    console.log('🔥 ProtectedRoute - Admin accessing admin page, allowing access');
    return <>{children}</>;
  }
  
  // If admin trying to access non-admin pages
  if (user.isAdmin && !location.pathname.startsWith('/admin')) {
    console.log('🔥 ProtectedRoute - Admin trying to access user page, redirecting to admin dashboard');
    return <Navigate to="/admin" replace />;
  }
  
  return <>{children}</>;
};

// User Protected Route - Bug-Free Version
const UserProtectedRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user, loading } = useAuth();
  const location = useLocation();
  
  if (loading) return <div>Loading...</div>;
  
  // If not logged in
  if (!user) {
    return <Navigate to="/login" replace />;
  }
  
  // If user is admin but trying to access user pages
  if (user.isAdmin && !location.pathname.startsWith('/admin')) {
    console.log('🔥 UserProtectedRoute - Admin trying to access user page, redirecting to admin dashboard');
    return <Navigate to="/admin" replace />;
  }
  
  // If user is NOT admin and trying to access user pages (this is correct)
  if (!user.isAdmin && !location.pathname.startsWith('/admin')) {
    console.log('🔥 UserProtectedRoute - Regular user accessing user page, allowing access');
    return <>{children}</>;
  }
  
  // If regular user trying to access admin pages
  if (!user.isAdmin && location.pathname.startsWith('/admin')) {
    console.log('🔥 UserProtectedRoute - Regular user trying to access admin page, redirecting to user dashboard');
    return <Navigate to="/dashboard" replace />;
  }
  
  return <>{children}</>;
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
          
          {/* Admin Protected Routes */}
          <Route path="/admin" element={
            <AdminProtectedRoute>
              <SimpleAdminPage />
            </AdminProtectedRoute>
          } />
          
          {/* Admin Sub-Routes - All redirect to main admin dashboard for now */}
          <Route path="/admin/users" element={
            <AdminProtectedRoute>
              <SimpleAdminPage />
            </AdminProtectedRoute>
          } />
          <Route path="/admin/wallet-management" element={
            <AdminProtectedRoute>
              <SimpleAdminPage />
            </AdminProtectedRoute>
          } />
          <Route path="/admin/transactions" element={
            <AdminProtectedRoute>
              <SimpleAdminPage />
            </AdminProtectedRoute>
          } />
          <Route path="/admin/system/gas-management" element={
            <AdminProtectedRoute>
              <SimpleAdminPage />
            </AdminProtectedRoute>
          } />
          <Route path="/admin/settings" element={
            <AdminProtectedRoute>
              <SimpleAdminPage />
            </AdminProtectedRoute>
          } />
          
          {/* Default redirect */}
          <Route path="*" element={<Navigate to="/login" replace />} />
        </Routes>
        <Toaster />
      </Router>
    </AuthProvider>
  );
}

export default AppSimple;
