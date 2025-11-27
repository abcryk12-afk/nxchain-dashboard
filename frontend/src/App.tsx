import React, { useEffect, useState } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import Header from './components/Header';
import DashboardHome from './components/DashboardHome';
import RegisterPage from './pages/RegisterPage';
import LoginPage from './pages/LoginPage';
import DepositPage from './pages/DepositPage';
import StakingPage from './pages/StakingPage';
import WithdrawalPage from './pages/WithdrawalPage';
import ProfilePage from './pages/ProfilePage';
import SupportPage from './pages/SupportPage';
import AdminPage from './pages/AdminPage';
import GasManagementPage from './pages/GasManagementPage';
import { dashboard } from './services/api';
import { DashboardData, User } from './types';
import { AuthProvider, useAuth } from './contexts/AuthContext';

function AppContent() {
  const { user, loading } = useAuth();
  const [dashboardData, setDashboardData] = useState<DashboardData | null>(null);

  useEffect(() => {
    if (user) {
      // Fetch dashboard data when user is authenticated
      const fetchDashboardData = async () => {
        try {
          console.log('Fetching dashboard data...');
          const data = await dashboard.getData();
          console.log('Dashboard data fetched:', data);
          setDashboardData(data);
        } catch (error) {
          console.error('Failed to fetch dashboard data:', error);
          // Don't clear token here - let AuthContext handle it
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
          {/* Public Routes */}
          <Route 
            path="/register" 
            element={<RegisterPage />} 
          />
          <Route 
            path="/login" 
            element={<LoginPage />} 
          />

          {/* Protected Routes */}
          <Route 
            path="/" 
            element={
              user ? (
                <>
                  <Header user={user} />
                  <main className="container mx-auto px-4 py-8">
                    <Routes>
                      <Route 
                        index 
                        element={
                          dashboardData ? (
                            <DashboardHome data={dashboardData} />
                          ) : (
                            <div className="text-center py-8">
                              <p className="text-gray-400">Loading dashboard...</p>
                            </div>
                          )
                        } 
                      />
                      <Route 
                        path="dashboard" 
                        element={
                          dashboardData ? (
                            <DashboardHome data={dashboardData} />
                          ) : (
                            <div className="text-center py-8">
                              <p className="text-gray-400">Loading dashboard...</p>
                            </div>
                          )
                        } 
                      />
                      <Route 
                        path="deposit" 
                        element={<DepositPage />} 
                      />
                      <Route 
                        path="staking" 
                        element={<StakingPage />} 
                      />
                      <Route 
                        path="withdrawal" 
                        element={<WithdrawalPage />} 
                      />
                      <Route 
                        path="profile" 
                        element={<ProfilePage />} 
                      />
                      <Route 
                        path="support" 
                        element={<SupportPage />} 
                      />
                      <Route 
                        path="admin" 
                        element={<AdminPage />} 
                      />
                      <Route 
                        path="admin/system/gas-management" 
                        element={<GasManagementPage />} 
                      />
                    </Routes>
                  </main>
                </>
              ) : (
                <Navigate to="/login" replace />
              )
            } 
          />
          
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
