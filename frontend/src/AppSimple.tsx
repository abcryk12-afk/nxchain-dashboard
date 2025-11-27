import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
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

// Admin Protected Route
const AdminProtectedRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user, loading } = useAuth();
  
  if (loading) {
    return <div>Loading...</div>;
  }
  
  if (!user || !user.isAdmin) {
    return <Navigate to="/admin-login" replace />;
  }
  
  return <>{children}</>;
};

// User Protected Route
const UserProtectedRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user, loading } = useAuth();
  
  if (loading) {
    return <div>Loading...</div>;
  }
  
  if (!user) {
    return <Navigate to="/login" replace />;
  }
  
  if (user.isAdmin) {
    return <Navigate to="/admin" replace />;
  }
  
  return <>{children}</>;
};

function AppSimple() {
  return (
    <AuthProvider>
      <Router>
        <Routes>
          {/* Public Routes */}
          <Route path="/login" element={<LoginPage />} />
          <Route path="/register" element={<RegisterPage />} />
          <Route path="/admin-login" element={<AdminLoginPage />} />
          
          {/* User Protected Routes */}
          <Route path="/" element={
            <UserProtectedRoute>
              <DashboardHome />
            </UserProtectedRoute>
          } />
          <Route path="/dashboard" element={
            <UserProtectedRoute>
              <DashboardHome />
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
          
          {/* Default redirect */}
          <Route path="*" element={<Navigate to="/login" replace />} />
        </Routes>
        <Toaster />
      </Router>
    </AuthProvider>
  );
}

export default AppSimple;
