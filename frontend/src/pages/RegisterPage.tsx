import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { 
  UserPlusIcon,
  EnvelopeIcon,
  LockClosedIcon,
  CheckCircleIcon,
  ArrowRightIcon
} from '@heroicons/react/24/outline';
import { auth } from '../services/api';

const RegisterPage: React.FC = () => {
  const [searchParams] = useSearchParams();
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    confirmPassword: ''
  });
  const [referralCode, setReferralCode] = useState('');
  const [loading, setLoading] = useState(false);
  const [step, setStep] = useState(1); // 1: registration, 2: OTP verification
  const [userId, setUserId] = useState('');
  const [otp, setOtp] = useState(['', '', '', '', '', '']);
  const [errors, setErrors] = useState<{ [key: string]: string }>({});
  const navigate = useNavigate();

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
    
    if (!validateForm()) {
      return;
    }

    setLoading(true);
    try {
      const response = await auth.register({
        email: formData.email,
        password: formData.password,
        referralCode: referralCode || undefined
      });
      
      setUserId(response.userId);
      setStep(2);
    } catch (error: any) {
      console.error('Registration failed:', error);
      setErrors({ general: error.response?.data?.message || 'Registration failed' });
    } finally {
      setLoading(false);
    }
  };

  const handleOTPChange = (index: number, value: string) => {
    if (value.length > 1) return;
    
    const newOtp = [...otp];
    newOtp[index] = value;
    setOtp(newOtp);

    // Auto focus next input
    if (value && index < 5) {
      const nextInput = document.getElementById(`otp-${index + 1}`) as HTMLInputElement;
      if (nextInput) nextInput.focus();
    }
  };

  const handleOTPKeyDown = (index: number, e: React.KeyboardEvent) => {
    if (e.key === 'Backspace' && !otp[index] && index > 0) {
      const prevInput = document.getElementById(`otp-${index - 1}`) as HTMLInputElement;
      if (prevInput) prevInput.focus();
    }
  };

  const handleVerifyOTP = async () => {
    const otpString = otp.join('');
    
    if (otpString.length !== 6) {
      setErrors({ otp: 'Please enter all 6 digits' });
      return;
    }

    setLoading(true);
    try {
      const response = await auth.verifyOTP(userId, otpString);
      
      // Store token and redirect to dashboard
      localStorage.setItem('token', response.token);
      localStorage.setItem('user', JSON.stringify(response.user));
      navigate('/dashboard');
    } catch (error: any) {
      console.error('OTP verification failed:', error);
      setErrors({ otp: error.response?.data?.message || 'Invalid OTP' });
    } finally {
      setLoading(false);
    }
  };

  const handleResendOTP = async () => {
    setLoading(true);
    try {
      // In a real app, this would call a resend OTP endpoint
      setErrors({ general: 'OTP resent successfully' });
      setTimeout(() => setErrors({}), 3000);
    } catch (error: any) {
      setErrors({ general: 'Failed to resend OTP' });
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

        {/* Registration Form */}
        {step === 1 && (
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
                  <>
                    <UserPlusIcon className="w-5 h-5" />
                    <span>Create Account</span>
                  </>
                )}
              </button>

              <div className="text-center">
                <p className="text-gray-400 text-sm">
                  Already have an account?{' '}
                  <button
                    type="button"
                    onClick={() => navigate('/login')}
                    className="text-nx-blue hover:text-nx-purple transition-colors"
                  >
                    Sign In
                  </button>
                </p>
              </div>
            </form>
          </div>
        )}

        {/* OTP Verification */}
        {step === 2 && (
          <div className="glass-effect rounded-xl p-8">
            <div className="text-center mb-6">
              <div className="w-16 h-16 bg-green-400/20 rounded-full flex items-center justify-center mx-auto mb-4">
                <EnvelopeIcon className="w-8 h-8 text-green-400" />
              </div>
              <h1 className="text-2xl font-bold text-white mb-2">Verify Your Email</h1>
              <p className="text-gray-400">
                We've sent a 6-digit code to {formData.email}
              </p>
            </div>

            <div className="space-y-6">
              {errors.otp && (
                <div className="bg-red-400/10 border border-red-400/20 rounded-lg p-3">
                  <p className="text-red-400 text-sm">{errors.otp}</p>
                </div>
              )}

              {errors.general && (
                <div className="bg-green-400/10 border border-green-400/20 rounded-lg p-3">
                  <p className="text-green-400 text-sm">{errors.general}</p>
                </div>
              )}

              <div>
                <label className="block text-sm font-medium text-gray-300 mb-4 text-center">
                  Enter Verification Code
                </label>
                <div className="flex justify-center space-x-2">
                  {otp.map((digit, index) => (
                    <input
                      key={index}
                      id={`otp-${index}`}
                      type="text"
                      value={digit}
                      onChange={(e) => handleOTPChange(index, e.target.value)}
                      onKeyDown={(e) => handleOTPKeyDown(index, e)}
                      maxLength={1}
                      className="w-12 h-12 bg-white/5 border border-white/10 rounded-lg text-white text-center text-xl font-mono focus:outline-none focus:ring-2 focus:ring-nx-blue focus:border-transparent"
                    />
                  ))}
                </div>
              </div>

              <button
                onClick={handleVerifyOTP}
                disabled={loading || otp.join('').length !== 6}
                className="w-full btn-primary py-3 rounded-lg font-medium flex items-center justify-center space-x-2 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? (
                  <span>Verifying...</span>
                ) : (
                  <>
                    <CheckCircleIcon className="w-5 h-5" />
                    <span>Verify Email</span>
                  </>
                )}
              </button>

              <div className="text-center">
                <p className="text-gray-400 text-sm mb-2">
                  Didn't receive the code?
                </p>
                <button
                  onClick={handleResendOTP}
                  disabled={loading}
                  className="text-nx-blue hover:text-nx-purple transition-colors text-sm disabled:opacity-50"
                >
                  Resend Code
                </button>
              </div>

              <div className="text-center">
                <button
                  onClick={() => {
                    setStep(1);
                    setOtp(['', '', '', '', '', '']);
                    setErrors({});
                  }}
                  className="text-gray-400 hover:text-white transition-colors text-sm"
                >
                  Back to Registration
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Terms */}
        <div className="text-center mt-6">
          <p className="text-gray-500 text-xs">
            By creating an account, you agree to our{' '}
            <a href="#" className="text-nx-blue hover:text-nx-purple transition-colors">
              Terms of Service
            </a>{' '}
            and{' '}
            <a href="#" className="text-nx-blue hover:text-nx-purple transition-colors">
              Privacy Policy
            </a>
          </p>
        </div>
      </div>
    </div>
  );
};

export default RegisterPage;
