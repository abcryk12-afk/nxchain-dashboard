import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './contexts/AuthContext';
import AdminLoginPage from './pages/admin/AdminLoginPage';
import SimpleAdminPage from './pages/SimpleAdminPage';

// Simple Protected Route
const SimpleProtectedRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user, loading } = useAuth();
  
  if (loading) {
    return <div>Loading...</div>;
  }
  
  if (!user || !user.isAdmin) {
    return <Navigate to="/admin-login" replace />;
  }
  
  return <>{children}</>;
};

// Import useAuth
import { useAuth } from './contexts/AuthContext';

function AppSimple() {
  return (
    <AuthProvider>
      <Router>
        <Routes>
          <Route path="/admin-login" element={<AdminLoginPage />} />
          <Route 
            path="/admin" 
            element={
              <SimpleProtectedRoute>
                <SimpleAdminPage />
              </SimpleProtectedRoute>
            } 
          />
          <Route path="*" element={<Navigate to="/admin-login" replace />} />
        </Routes>
      </Router>
    </AuthProvider>
  );
}

export default AppSimple;
