import React from 'react';

interface AdminOnlyLayoutProps {
  children: React.ReactNode;
}

const AdminOnlyLayout: React.FC<AdminOnlyLayoutProps> = ({ children }) => {
  // Check if current path is admin-login
  const isAdminLoginPage = window.location.pathname === '/admin-login';
  
  // Don't show Header on admin login page
  if (isAdminLoginPage) {
    return <>{children}</>;
  }
  
  // Show Header on other pages
  const user = JSON.parse(localStorage.getItem('user') || '{}');
  if (user) {
    // Import Header dynamically to avoid circular imports
    const Header = require('./Header').default;
    return (
      <>
        <Header user={user} />
        <main className="container mx-auto px-4 py-8">
          {children}
        </main>
      </>
    );
  }
  
  return <>{children}</>;
};

export default AdminOnlyLayout;
