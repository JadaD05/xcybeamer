import React, { useState } from 'react';
import { Gamepad2, Mail, Lock, Eye, EyeOff, Shield } from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import { authAPI } from '../utils/api';

export default function SignIn() {
  const navigate = useNavigate();
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [requires2FA, setRequires2FA] = useState(false);
  const [userId, setUserId] = useState('');
  const [twoFAToken, setTwoFAToken] = useState('');
  const [useBackupCode, setUseBackupCode] = useState(false);
  const [backupCode, setBackupCode] = useState('');
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    remember: false
  });
  const [showResendVerification, setShowResendVerification] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setShowResendVerification(false);
    setLoading(true);

    try {
      const response = await authAPI.signin({
        email: formData.email,
        password: formData.password
      });

      // Check if email verification is required
      if (response.data.requiresVerification) {
        setError('Please verify your email address before logging in.');
        setShowResendVerification(true);
        return;
      }

      // Check if 2FA is required
      if (response.data.requires2FA) {
        setRequires2FA(true);
        setUserId(response.data.userId);
      } else if (response.data.success) {
        // Save token to localStorage
        localStorage.setItem('token', response.data.token);
        localStorage.setItem('user', JSON.stringify(response.data.user));

        // Redirect to home or dashboard
        navigate('/');
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Login failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handle2FASubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const response = await authAPI.signin2FA(
        userId,
        useBackupCode ? '' : twoFAToken,
        useBackupCode ? backupCode : ''
      );

      if (response.data.success) {
        // Save token to localStorage
        localStorage.setItem('token', response.data.token);
        localStorage.setItem('user', JSON.stringify(response.data.user));

        // Redirect to home or dashboard
        navigate('/');
      }
    } catch (err) {
      setError(err.response?.data?.message || '2FA verification failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleResendVerification = async () => {
    if (!formData.email) {
      setError('Please enter your email address first');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const res = await authAPI.resendVerification(formData.email);
      if (res.data.success) {
        setError('Verification email sent! Please check your inbox.');
        setShowResendVerification(false);
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to resend verification email');
    } finally {
      setLoading(false);
    }
  };

  const handleBackToLogin = () => {
    setRequires2FA(false);
    setUserId('');
    setTwoFAToken('');
    setBackupCode('');
    setUseBackupCode(false);
    setError('');
    setShowResendVerification(false);
  };

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
  };

  // 2FA Login Form
  if (requires2FA) {
    return (
      <div className="min-h-screen w-full bg-gray-950 text-white overflow-x-hidden flex items-center justify-center p-4">
        {/* Background Effects */}
        <div className="absolute inset-0 bg-gradient-to-br from-blue-900/20 to-green-900/20"></div>
        <div className="absolute inset-0" style={{
          backgroundImage: 'radial-gradient(circle at 2px 2px, rgba(147, 51, 234, 0.1) 1px, transparent 0)',
          backgroundSize: '40px 40px'
        }}></div>

        {/* 2FA Card */}
        <div className="relative z-10 w-full max-w-md">
          {/* Logo */}
          <Link to="/" className="flex items-center justify-center space-x-2 mb-8">
            <Gamepad2 className="w-10 h-10 text-blue-500" />
            <span className="text-2xl font-bold bg-gradient-to-r from-blue-400 to-green-600 bg-clip-text text-transparent">
              XCY BEAMER
            </span>
          </Link>

          {/* Card */}
          <div className="bg-gray-900/80 backdrop-blur-xl p-8 rounded-2xl border border-gray-800 shadow-2xl">
            <div className="flex items-center justify-center mb-6">
              <div className="w-16 h-16 bg-blue-500/20 rounded-full flex items-center justify-center">
                <Shield className="w-8 h-8 text-blue-400" />
              </div>
            </div>

            <h1 className="text-3xl font-bold mb-2 text-center">Two-Factor Authentication</h1>
            <p className="text-gray-400 text-center mb-8">
              Enter the verification code from your authenticator app
            </p>

            {/* Error Message */}
            {error && (
              <div className="bg-red-500/10 border border-red-500 text-red-500 px-4 py-3 rounded-lg mb-6">
                {error}
              </div>
            )}

            <form onSubmit={handle2FASubmit} className="space-y-6">
              {!useBackupCode ? (
                <div>
                  <label htmlFor="twoFAToken" className="block text-sm font-medium mb-2">
                    6-digit verification code
                  </label>
                  <div className="relative">
                    <input
                      type="text"
                      id="twoFAToken"
                      value={twoFAToken}
                      onChange={(e) => setTwoFAToken(e.target.value.replace(/\D/g, '').slice(0, 6))}
                      className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-3 text-center text-2xl font-mono tracking-widest text-white placeholder-gray-500 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition"
                      placeholder="000000"
                      maxLength={6}
                      required
                    />
                  </div>
                  <div className="mt-2 text-right">
                    <button
                      type="button"
                      onClick={() => setUseBackupCode(true)}
                      className="text-sm text-blue-400 hover:text-blue-300 transition"
                    >
                      Use backup code instead
                    </button>
                  </div>
                </div>
              ) : (
                <div>
                  <label htmlFor="backupCode" className="block text-sm font-medium mb-2">
                    Backup code
                  </label>
                  <div className="relative">
                    <input
                      type="text"
                      id="backupCode"
                      value={backupCode}
                      onChange={(e) => setBackupCode(e.target.value.toUpperCase())}
                      className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-3 text-center font-mono text-white placeholder-gray-500 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition"
                      placeholder="ABCD-EFGH"
                      required
                    />
                  </div>
                  <div className="mt-2 text-right">
                    <button
                      type="button"
                      onClick={() => setUseBackupCode(false)}
                      className="text-sm text-blue-400 hover:text-blue-300 transition"
                    >
                      Use authenticator app instead
                    </button>
                  </div>
                </div>
              )}

              {/* Submit Button */}
              <button
                type="submit"
                disabled={loading || (!useBackupCode && twoFAToken.length !== 6) || (useBackupCode && !backupCode)}
                className="w-full bg-gradient-to-r from-blue-600 to-green-600 py-3 rounded-lg font-semibold hover:from-blue-700 hover:to-green-700 transition shadow-lg shadow-blue-500/30 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? 'Verifying...' : 'Verify & Continue'}
              </button>

              {/* Back to Login Button */}
              <button
                type="button"
                onClick={handleBackToLogin}
                className="w-full bg-gray-800 hover:bg-gray-700 py-3 rounded-lg font-semibold transition"
              >
                Back to Login
              </button>
            </form>

            {/* Help Text */}
            <div className="mt-6 p-4 bg-gray-800/50 rounded-lg">
              <p className="text-sm text-gray-400">
                <strong>Tip:</strong> If you've lost access to your authenticator app,
                use a backup code or contact support for assistance.
              </p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Regular Login Form
  return (
    <div className="min-h-screen w-full bg-gray-950 text-white overflow-x-hidden flex items-center justify-center p-4">
      {/* Background Effects */}
      <div className="absolute inset-0 bg-gradient-to-br from-blue-900/20 to-green-900/20"></div>
      <div className="absolute inset-0" style={{
        backgroundImage: 'radial-gradient(circle at 2px 2px, rgba(147, 51, 234, 0.1) 1px, transparent 0)',
        backgroundSize: '40px 40px'
      }}></div>

      {/* Sign In Card */}
      <div className="relative z-10 w-full max-w-md">
        {/* Logo */}
        <Link to="/" className="flex items-center justify-center space-x-2 mb-8">
          <Gamepad2 className="w-10 h-10 text-blue-500" />
          <span className="text-2xl font-bold bg-gradient-to-r from-blue-400 to-green-600 bg-clip-text text-transparent">
            XCY BEAMER
          </span>
        </Link>

        {/* Card */}
        <div className="bg-gray-900/80 backdrop-blur-xl p-8 rounded-2xl border border-gray-800 shadow-2xl">
          <h1 className="text-3xl font-bold mb-2 text-center">Welcome Back</h1>
          <p className="text-gray-400 text-center mb-8">Sign in to your account</p>

          {/* Error Message */}
          {error && (
            <div className="bg-red-500/10 border border-red-500 text-red-500 px-4 py-3 rounded-lg mb-6">
              {error}
            </div>
          )}

          {/* Resend Verification Section */}
          {showResendVerification && (
            <div className="mb-6 p-4 bg-yellow-500/10 border border-yellow-500/30 rounded-lg">
              <p className="text-yellow-400 text-sm mb-2">
                Please verify your email address before logging in.
              </p>
              <button
                onClick={handleResendVerification}
                disabled={loading}
                className="w-full bg-gradient-to-r from-yellow-600 to-orange-600 py-2 rounded-lg font-semibold hover:from-yellow-700 hover:to-orange-700 transition disabled:opacity-50 text-sm"
              >
                {loading ? 'Sending...' : 'Resend Verification Email'}
              </button>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Email Field */}
            <div>
              <label htmlFor="email" className="block text-sm font-medium mb-2">
                Email Address
              </label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                <input
                  type="email"
                  id="email"
                  name="email"
                  value={formData.email}
                  onChange={handleChange}
                  className="w-full bg-gray-800 border border-gray-700 rounded-lg pl-11 pr-4 py-3 text-white placeholder-gray-500 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition"
                  placeholder="you@example.com"
                  required
                />
              </div>
            </div>

            {/* Password Field */}
            <div>
              <label htmlFor="password" className="block text-sm font-medium mb-2">
                Password
              </label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                <input
                  type={showPassword ? 'text' : 'password'}
                  id="password"
                  name="password"
                  value={formData.password}
                  onChange={handleChange}
                  className="w-full bg-gray-800 border border-gray-700 rounded-lg pl-11 pr-12 py-3 text-white placeholder-gray-500 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition"
                  placeholder="••••••••"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-300 transition"
                >
                  {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                </button>
              </div>
            </div>

            {/* Remember Me & Forgot Password */}
            <div className="flex items-center justify-between">
              <label className="flex items-center space-x-2 cursor-pointer">
                <input
                  type="checkbox"
                  name="remember"
                  checked={formData.remember}
                  onChange={handleChange}
                  className="w-4 h-4 bg-gray-800 border-gray-700 rounded text-blue-600 focus:ring-blue-500 focus:ring-offset-gray-900"
                />
                <span className="text-sm text-gray-300">Remember me</span>
              </label>
              <Link
                to="/forgot-password"
                className="text-sm text-blue-400 hover:text-blue-300 transition"
              >
                Forgot password?
              </Link>
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={loading}
              className="w-full bg-gradient-to-r from-blue-600 to-green-600 py-3 rounded-lg font-semibold hover:from-blue-700 hover:to-green-700 transition shadow-lg shadow-blue-500/30 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? 'Signing In...' : 'Sign In'}
            </button>
          </form>

          {/* Sign Up Link */}
          <p className="text-center text-sm text-gray-400 mt-8">
            Don't have an account?{' '}
            <Link to="/signup" className="text-blue-400 hover:text-blue-300 font-semibold transition">
              Sign up
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}