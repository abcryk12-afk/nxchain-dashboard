import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { 
  UserPlusIcon,
  EnvelopeIcon,
  LockClosedIcon,
  CheckCircleIcon
} from '@heroicons/react/24/outline';
import { auth } from '../services/api';
import { useAuth } from '../contexts/AuthContext';

const RegisterPage: React.FC = () => {
  const [searchParams] = useSearchParams();
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    confirmPassword: '',
    firstName: '',
    lastName: ''
  });
  const [referralCode, setReferralCode] = useState('');
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<{ [key: string]: string }>({});
  const navigate = useNavigate();
  const { login } = useAuth();

  useEffect(() => {
    const refCode = searchParams.get('ref');
    if (refCode) {
      setReferralCode(refCode);
    }
  }, [searchParams]);

  const validateForm = () => {
    const newErrors: { [key: string]: string } = {};

    if (!formData.email) {
      newErrors.email = 'Email is required';
    } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
      newErrors.email = 'Email is invalid';
    }

    if (!formData.password) {
      newErrors.password = 'Password is required';
    } else if (formData.password.length < 8) {
      newErrors.password = 'Password must be at least 8 characters';
    }

    if (!formData.confirmPassword) {
      newErrors.confirmPassword = 'Please confirm your password';
    } else if (formData.password !== formData.confirmPassword) {
      newErrors.confirmPassword = 'Passwords do not match';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    console.log('Registration form submitted');
    console.log('Form data:', formData);
    console.log('Referral code:', referralCode);
    
    if (!validateForm()) {
      console.log('Form validation failed');
      return;
    }

    setLoading(true);
    try {
      console.log('Sending registration request...');
      const response = await auth.register({
        email: formData.email,
        password: formData.password,
        firstName: formData.firstName || '',
        lastName: formData.lastName || '',
        referralCode: referralCode || undefined
      });
      
      console.log('Registration successful - Full response:', response);
      console.log('Response token:', response.token);
      console.log('Response user:', response.user);
      
      // Check if token exists in response
      if (!response.token) {
        console.error('No token in response!');
        setErrors({ general: 'Registration failed: No token received' });
        return;
      }
      
      // Use AuthContext login method
      login(response.user, response.token);
      
      console.log('AuthContext login called, navigating to dashboard...');
      console.log('Token stored in localStorage:', localStorage.getItem('token'));
      
      // Navigate to dashboard
      navigate('/dashboard');
      
      console.log('Navigation to dashboard called');
    } catch (error: any) {
      console.error('Registration failed:', error);
      setErrors({ general: error.response?.data?.message || 'Registration failed' });
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

        {/* Registration Form - Direct Registration */}
        <div className="glass-effect rounded-xl p-8">
          <div className="text-center mb-6">
            <h1 className="text-2xl font-bold text-white mb-2">Create Account</h1>
            <p className="text-gray-400">
              Join NXChain and start earning today
            </p>
          </div>

          <form onSubmit={handleRegister} className="space-y-6">
            {errors.general && (
              <div className="bg-red-400/10 border border-red-400/20 rounded-lg p-3">
                <p className="text-red-400 text-sm">{errors.general}</p>
              </div>
            )}

            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                First Name
              </label>
              <input
                type="text"
                value={formData.firstName}
                onChange={(e) => setFormData({ ...formData, firstName: e.target.value })}
                placeholder="Enter your first name"
                className={`w-full px-3 py-3 bg-white/5 border rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-nx-blue focus:border-transparent ${
                  errors.firstName ? 'border-red-400' : 'border-white/10'
                }`}
              />
              {errors.firstName && (
                <p className="text-red-400 text-xs mt-1">{errors.firstName}</p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Last Name
              </label>
              <input
                type="text"
                value={formData.lastName}
                onChange={(e) => setFormData({ ...formData, lastName: e.target.value })}
                placeholder="Enter your last name"
                className={`w-full px-3 py-3 bg-white/5 border rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-nx-blue focus:border-transparent ${
                  errors.lastName ? 'border-red-400' : 'border-white/10'
                }`}
              />
              {errors.lastName && (
                <p className="text-red-400 text-xs mt-1">{errors.lastName}</p>
              )}
            </div>

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
                  placeholder="Create a password"
                  className={`w-full pl-10 pr-3 py-3 bg-white/5 border rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-nx-blue focus:border-transparent ${
                    errors.password ? 'border-red-400' : 'border-white/10'
                  }`}
                />
              </div>
              {errors.password && (
                <p className="text-red-400 text-xs mt-1">{errors.password}</p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Confirm Password
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <LockClosedIcon className="w-5 h-5 text-gray-400" />
                </div>
                <input
                  type="password"
                  value={formData.confirmPassword}
                  onChange={(e) => setFormData({ ...formData, confirmPassword: e.target.value })}
                  placeholder="Confirm your password"
                  className={`w-full pl-10 pr-3 py-3 bg-white/5 border rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-nx-blue focus:border-transparent ${
                    errors.confirmPassword ? 'border-red-400' : 'border-white/10'
                  }`}
                />
              </div>
              {errors.confirmPassword && (
                <p className="text-red-400 text-xs mt-1">{errors.confirmPassword}</p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Referral Code (Optional)
              </label>
              <input
                type="text"
                value={referralCode}
                onChange={(e) => setReferralCode(e.target.value)}
                placeholder="Enter referral code"
                className="w-full px-3 py-3 bg-white/5 border border-white/10 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-nx-blue focus:border-transparent font-mono text-sm"
                readOnly={!!searchParams.get('ref')}
              />
              {searchParams.get('ref') && (
                <p className="text-xs text-green-400 mt-1">
                  Referral code auto-filled from invitation link
                </p>
              )}
            </div>

            <div className="bg-blue-400/10 border border-blue-400/20 rounded-lg p-4">
              <div className="flex items-start space-x-3">
                <CheckCircleIcon className="w-5 h-5 text-blue-400 flex-shrink-0 mt-0.5" />
                <div>
                  <p className="text-blue-400 font-medium text-sm">Benefits of Joining</p>
                  <ul className="text-gray-300 text-sm mt-1 space-y-1">
                    <li>• Earn daily rewards from staking</li>
                    <li>• 10% referral commission</li>
                    <li>• Secure and transparent platform</li>
                    <li>• 24/7 customer support</li>
                  </ul>
                </div>
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full btn-primary py-3 rounded-lg font-medium flex items-center justify-center space-x-2 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? (
                <span>Creating account...</span>
              ) : (
                <div className="flex items-center space-x-2">
                  <UserPlusIcon className="w-5 h-5" />
                  <span>Create Account</span>
                </div>
              )}
            </button>
          </form>
        </div>

        {/* Login Link */}
        <div className="text-center mt-6">
          <p className="text-gray-400 text-sm">
            Already have an account?{' '}
            <button
              onClick={() => navigate('/login')}
              className="text-nx-blue hover:text-nx-purple transition-colors"
            >
              Sign In
            </button>
          </p>
        </div>
      </div>
    </div>
  );
};

export default RegisterPage;