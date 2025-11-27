import React, { useEffect, useState } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import Header from './components/Header';
import DashboardHome from './components/DashboardHome';
import RegisterPage from './pages/RegisterPage';
import LoginPage from './pages/LoginPage';
import DepositPage from './pages/DepositPage';
import StakingPage from './pages/StakingPage';
import WithdrawalPage from './pages/WithdrawalPage';
import ProfilePage from './pages/ProfilePage';
import SupportPage from './pages/SupportPage';
// import AdminPage from './pages/AdminPage';
// import GasManagementPage from './pages/GasManagementPage';
// import UserWalletManagement from './pages/admin/UserWalletManagement';
import AdminLoginPage from './pages/admin/AdminLoginPage';
import SimpleAdminPage from './pages/SimpleAdminPage';
import AdminOnlyLayout from './components/AdminOnlyLayout';
import { dashboard } from './services/api';
import { DashboardData, User } from './types';
import { AuthProvider, useAuth } from './contexts/AuthContext';

// Route wrapper for authenticated routes
const ProtectedRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user } = useAuth();
  const location = useLocation();
  
  console.log('🔥 ProtectedRoute - User:', !!user);
  console.log('🔥 ProtectedRoute - Path:', location.pathname);
  
  if (!user) {
    console.log('🔥 ProtectedRoute - Redirecting to login');
    return <Navigate to="/login" state={{ from: location }} replace />;
  }
  
  return <>{children}</>;
};

// Route wrapper for public routes
const PublicRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user } = useAuth();
  const location = useLocation();
  
  console.log('🔥 PublicRoute - User:', !!user);
  console.log('🔥 PublicRoute - Path:', location.pathname);
  
  if (user) {
    console.log('🔥 PublicRoute - Redirecting to dashboard');
    return <Navigate to="/dashboard" replace />;
  }
  
  return <>{children}</>;
};

// Layout wrapper for pages with header
const PageLayout: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user } = useAuth();
  
  return (
    <>
      {user && <Header />}
      <main className="container mx-auto px-4 py-8">
        {children}
      </main>
    </>
  );
};

// Layout wrapper for admin pages (no header on admin-login)
const AdminPageLayout: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user } = useAuth();
  const isAdminLoginPage = window.location.pathname === '/admin-login';
  
  if (isAdminLoginPage) {
    return <>{children}</>;
  }
  return (
    <>
      {user && <Header />}
      <main className="container mx-auto px-4 py-8">
        {children}
      </main>
    </>
  );
};

function AppContent() {
  const { user, loading } = useAuth();
  const [dashboardData, setDashboardData] = useState<DashboardData | null>(null);

  console.log('🔥 AppContent - User:', !!user);
  console.log('🔥 AppContent - Loading:', loading);
  console.log('🔥 AppContent - Current Path:', window.location.pathname);

  useEffect(() => {
    if (user) {
      console.log('🔥 AppContent - User authenticated, fetching dashboard data...');
      const fetchDashboardData = async () => {
        try {
          console.log('🔥 Fetching dashboard data...');
          const data = await dashboard.getData();
          console.log('🔥 Dashboard data fetched:', data);
          setDashboardData(data);
        } catch (error) {
          console.error('🔥 Failed to fetch dashboard data:', error);
        }
      };

      fetchDashboardData();
    }
  }, [user]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-nx-blue border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-400">Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <Router>
      <div className="min-h-screen bg-nx-dark">
        <Routes>
          {/* Admin Login - No wrapper */}
          <Route 
            path="/admin-login" 
            element={<AdminLoginPage />}
          />

          {/* Public Routes */}
          <Route 
            path="/register" 
            element={
              <PublicRoute>
                <RegisterPage />
              </PublicRoute>
            } 
          />
          <Route 
            path="/login" 
            element={
              <PublicRoute>
                <LoginPage />
              </PublicRoute>
            } 
          />

          {/* Protected Routes */}
          <Route 
            path="/" 
            element={
              <ProtectedRoute>
                <PageLayout>
                  {dashboardData ? (
                    <DashboardHome data={dashboardData} />
                  ) : (
                    <div className="text-center py-8">
                      <p className="text-gray-400">Loading dashboard...</p>
                    </div>
                  )}
                </PageLayout>
              </ProtectedRoute>
            } 
          />
          
          <Route 
            path="/dashboard" 
            element={
              <ProtectedRoute>
                <PageLayout>
                  {dashboardData ? (
                    <DashboardHome data={dashboardData} />
                  ) : (
                    <div className="text-center py-8">
                      <p className="text-gray-400">Loading dashboard...</p>
                    </div>
                  )}
                </PageLayout>
              </ProtectedRoute>
            } 
          />
          
          <Route 
            path="/deposit" 
            element={
              <ProtectedRoute>
                <PageLayout>
                  <DepositPage />
                </PageLayout>
              </ProtectedRoute>
            } 
          />
          
          <Route 
            path="/staking" 
            element={
              <ProtectedRoute>
                <PageLayout>
                  <StakingPage />
                </PageLayout>
              </ProtectedRoute>
            } 
          />
          
          <Route 
            path="/withdrawal" 
            element={
              <ProtectedRoute>
                <PageLayout>
                  <WithdrawalPage />
                </PageLayout>
              </ProtectedRoute>
            } 
          />
          
          <Route 
            path="/profile" 
            element={
              <ProtectedRoute>
                <PageLayout>
                  <ProfilePage />
                </PageLayout>
              </ProtectedRoute>
            } 
          />
          
          <Route 
            path="/support" 
            element={
              <ProtectedRoute>
                <PageLayout>
                  <SupportPage />
                </PageLayout>
              </ProtectedRoute>
            } 
          />
          
          {/* Admin Dashboard Route */}
          <Route 
            path="/admin" 
            element={
              <ProtectedRoute>
                <SimpleAdminPage />
              </ProtectedRoute>
            } 
          />
          
          {/* Temporarily disabled due to export issues */}
          {/*
          <Route 
            path="/admin" 
            element={
              <ProtectedRoute>
                <AdminPageLayout>
                  <AdminPage />
                </AdminPageLayout>
              </ProtectedRoute>
            } 
          />
          
          <Route 
            path="/admin/system/gas-management" 
            element={
              <ProtectedRoute>
                <AdminPageLayout>
                  <GasManagementPage />
                </AdminPageLayout>
              </ProtectedRoute>
            } 
          />
          */}
          
          {/* Temporarily disabled due to export issues */}
          {/*
          <Route 
            path="/admin/wallet-management" 
            element={
              <ProtectedRoute>
                <UserWalletManagement />
              </ProtectedRoute>
            } 
          />
          */}

          {/* Catch-all redirect to login */}
          <Route 
            path="*" 
            element={<Navigate to="/login" replace />} 
          />
        </Routes>
      </div>
    </Router>
  );
}

function App() {
  return (
    <AuthProvider>
      <AppContent />
    </AuthProvider>
  );
}

export default App;
