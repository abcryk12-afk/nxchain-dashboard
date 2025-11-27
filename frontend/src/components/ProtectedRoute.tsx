import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

interface ProtectedRouteProps {
  children: React.ReactNode;
  requireAdmin?: boolean;
}

export const UserProtectedRoute: React.FC<ProtectedRouteProps> = ({ children }) => {
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

export const AdminProtectedRoute: React.FC<ProtectedRouteProps> = ({ children }) => {
  const { user, loading } = useAuth();
  const location = useLocation();
  
  if (loading) return <div>Loading...</div>;
  
  // If not logged in
  if (!user) {
    return <Navigate to="/admin-login" replace />;
  }
  
  // If user is NOT admin but trying to access admin page
  if (!user.isAdmin && location.pathname.startsWith('/admin')) {
    console.log('🔥 AdminProtectedRoute - Non-admin trying to access admin page, redirecting to user dashboard');
    return <Navigate to="/dashboard" replace />;
  }
  
  // If admin trying to access admin pages (this is correct)
  if (user.isAdmin && location.pathname.startsWith('/admin')) {
    console.log('🔥 AdminProtectedRoute - Admin accessing admin page, allowing access');
    return <>{children}</>;
  }
  
  // If admin trying to access non-admin pages
  if (user.isAdmin && !location.pathname.startsWith('/admin')) {
    console.log('🔥 AdminProtectedRoute - Admin trying to access user page, redirecting to admin dashboard');
    return <Navigate to="/admin" replace />;
  }
  
  return <>{children}</>;
};
