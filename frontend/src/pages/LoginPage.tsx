import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  UserIcon,
  EnvelopeIcon,
  LockClosedIcon,
  ArrowRightIcon
} from '@heroicons/react/24/outline';
import { auth } from '../services/api';

const LoginPage: React.FC = () => {
  const [formData, setFormData] = useState({
    email: '',
    password: ''
  });
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<{ [key: string]: string }>({});
  const navigate = useNavigate();

  const validateForm = () => {
    const newErrors: { [key: string]: string } = {};

    if (!formData.email) {
      newErrors.email = 'Email is required';
    } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
      newErrors.email = 'Email is invalid';
    }

    if (!formData.password) {
      newErrors.password = 'Password is required';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    console.log('Login form submitted');
    console.log('Form data:', formData);
    
    if (!validateForm()) {
      console.log('Form validation failed');
      return;
    }

    setLoading(true);
    try {
      console.log('Sending login request...');
      const response = await auth.login(formData);
      
      console.log('Login successful:', response);
      
      // Store token and user data
      localStorage.setItem('token', response.token);
      localStorage.setItem('user', JSON.stringify(response.user));
      
      console.log('Token stored in localStorage');
      console.log('User data stored in localStorage');
      console.log('About to navigate to dashboard...');
      
      // Redirect to dashboard
      navigate('/dashboard');
      
      console.log('Navigation to dashboard called');
    } catch (error: any) {
      console.error('Login failed:', error);
      setErrors({ general: error.response?.data?.message || 'Login failed' });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center px-4">
      <div className="w-full max-w-md">
        {/* Logo */}
        <div className="flex justify-center mb-8">
          <div className="flex items-center space-x-2">
            <div className="w-10 h-10 bg-gradient-to-r from-nx-blue to-nx-purple rounded-lg flex items-center justify-center">
              <span className="text-white font-bold">NX</span>
            </div>
            <span className="text-white font-semibold text-xl">Chain</span>
          </div>
        </div>

        {/* Login Form */}
        <div className="glass-effect rounded-xl p-8">
          <div className="text-center mb-6">
            <h1 className="text-2xl font-bold text-white mb-2">Welcome Back</h1>
            <p className="text-gray-400">
              Sign in to your NXChain account
            </p>
          </div>

          <form onSubmit={handleLogin} className="space-y-6">
            {errors.general && (
              <div className="bg-red-400/10 border border-red-400/20 rounded-lg p-3">
                <p className="text-red-400 text-sm">{errors.general}</p>
              </div>
            )}

            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Email Address
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <EnvelopeIcon className="w-5 h-5 text-gray-400" />
                </div>
                <input
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  placeholder="Enter your email"
                  className={`w-full pl-10 pr-3 py-3 bg-white/5 border rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-nx-blue focus:border-transparent ${
                    errors.email ? 'border-red-400' : 'border-white/10'
                  }`}
                />
              </div>
              {errors.email && (
                <p className="text-red-400 text-xs mt-1">{errors.email}</p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Password
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <LockClosedIcon className="w-5 h-5 text-gray-400" />
                </div>
                <input
                  type="password"
                  value={formData.password}
                  onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                  placeholder="Enter your password"
                  className={`w-full pl-10 pr-3 py-3 bg-white/5 border rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-nx-blue focus:border-transparent ${
                    errors.password ? 'border-red-400' : 'border-white/10'
                  }`}
                />
              </div>
              {errors.password && (
                <p className="text-red-400 text-xs mt-1">{errors.password}</p>
              )}
            </div>

            <div className="flex items-center justify-between">
              <label className="flex items-center">
                <input
                  type="checkbox"
                  className="w-4 h-4 bg-white/5 border-white/10 rounded text-nx-blue focus:ring-nx-blue focus:ring-offset-0"
                />
                <span className="ml-2 text-sm text-gray-300">Remember me</span>
              </label>
              <a href="#" className="text-sm text-nx-blue hover:text-nx-purple transition-colors">
                Forgot password?
              </a>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full btn-primary py-3 rounded-lg font-medium flex items-center justify-center space-x-2 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? (
                <span>Signing in...</span>
              ) : (
                <>
                  <UserIcon className="w-5 h-5" />
                  <span>Sign In</span>
                </>
              )}
            </button>

            <div className="text-center">
              <p className="text-gray-400 text-sm">
                Don't have an account?{' '}
                <button
                  type="button"
                  onClick={() => navigate('/register')}
                  className="text-nx-blue hover:text-nx-purple transition-colors"
                >
                  Sign Up
                </button>
              </p>
            </div>
          </form>
        </div>

        {/* Quick Links */}
        <div className="mt-6 text-center">
          <div className="glass-effect rounded-lg p-4">
            <p className="text-gray-400 text-sm mb-3">New to NXChain?</p>
            <div className="flex justify-center space-x-4">
              <a
                href="/register?ref=DEMO123"
                className="text-nx-blue hover:text-nx-purple transition-colors text-sm"
              >
                Try Demo Account
              </a>
              <span className="text-gray-500">•</span>
              <a href="#" className="text-nx-blue hover:text-nx-purple transition-colors text-sm">
                Learn More
              </a>
            </div>
          </div>
        </div>

        {/* Security Notice */}
        <div className="text-center mt-6">
          <p className="text-gray-500 text-xs">
            Secured with 256-bit SSL encryption
          </p>
        </div>
      </div>
    </div>
  );
};

export default LoginPage;
