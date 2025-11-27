import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { Shield, Lock, Eye, EyeOff, Loader2 } from 'lucide-react';
import { Button } from '../../components/ui/button';
import { Input } from '../../components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/card';
import { toast } from 'sonner';
import { useAuth } from '../../contexts/AuthContext';

const AdminLoginPage: React.FC = () => {
  const [credentials, setCredentials] = useState({
    email: 'admin@nxchain.com',
    password: ''
  });
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const { login } = useAuth();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!credentials.email || !credentials.password) {
      toast.error('Please enter email and password');
      return;
    }

    setLoading(true);
    
    try {
      const response = await axios.post('https://nxchain-dashboard.onrender.com/api/login', {
        email: credentials.email,
        password: credentials.password
      });

      if (response.data.success) {
        // Check if user is admin
        if (response.data.user.isAdmin) {
          // Use AuthContext login to update global state
          login(response.data.user, response.data.token);
          
          toast.success('Admin login successful!');
          navigate('/admin');
        } else {
          toast.error('Access denied. Admin privileges required.');
        }
      } else {
        toast.error(response.data.message || 'Login failed');
      }
    } catch (error: any) {
      console.error('Admin login error:', error);
      if (error.response?.data?.message) {
        toast.error(error.response.data.message);
      } else {
        toast.error('Login failed. Please try again.');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-blue-900 to-gray-900 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black bg-opacity-50"></div>
      
      <div className="relative z-10 w-full max-w-md">
        <Card className="border-gray-700 bg-gray-800/90 backdrop-blur-sm shadow-2xl">
          <CardHeader className="text-center pb-4">
            <div className="mx-auto w-16 h-16 bg-blue-600 rounded-full flex items-center justify-center mb-4">
              <Shield className="h-8 w-8 text-white" />
            </div>
            <CardTitle className="text-2xl font-bold text-white">
              Admin Portal
            </CardTitle>
            <p className="text-gray-400 text-sm">
              Enter admin credentials to access dashboard
            </p>
          </CardHeader>
          
          <CardContent className="space-y-4">
            <form onSubmit={handleLogin} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Admin Email
                </label>
                <div className="relative">
                  <Input
                    type="email"
                    value={credentials.email}
                    onChange={(e) => setCredentials(prev => ({ ...prev, email: e.target.value }))}
                    className="bg-gray-700 border-gray-600 text-white placeholder-gray-400"
                    placeholder="admin@nxchain.com"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Admin Password
                </label>
                <div className="relative">
                  <Input
                    type={showPassword ? "text" : "password"}
                    value={credentials.password}
                    onChange={(e) => setCredentials(prev => ({ ...prev, password: e.target.value }))}
                    className="bg-gray-700 border-gray-600 text-white placeholder-gray-400 pr-10"
                    placeholder="Enter admin password"
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-white"
                  >
                    {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
              </div>

              <Button
                type="submit"
                disabled={loading}
                className="w-full bg-blue-600 hover:bg-blue-700 text-white font-medium py-3"
              >
                {loading ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Signing in...
                  </>
                ) : (
                  <>
                    <Lock className="h-4 w-4 mr-2" />
                    Sign in to Admin Panel
                  </>
                )}
              </Button>
            </form>

            <div className="pt-4 border-t border-gray-700">
              <div className="text-center text-sm text-gray-400">
                <p className="mb-2">Default Admin Credentials:</p>
                <div className="bg-gray-700/50 rounded p-2 text-xs">
                  <p>Email: admin@nxchain.com</p>
                  <p>Password: admin123456</p>
                </div>
              </div>
            </div>

            <div className="text-center">
              <Button
                variant="ghost"
                onClick={() => window.location.href = '/login'}
                className="text-gray-400 hover:text-white text-sm"
              >
                ← Back to User Login
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default AdminLoginPage;
