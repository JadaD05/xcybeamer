import React, { useState } from 'react';
import { Gamepad2, Mail, Lock, Eye, EyeOff, User } from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import { authAPI } from '../utils/api';

export default function SignUp() {
  const navigate = useNavigate();
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(''); // Added success state
  const [formData, setFormData] = useState({
    username: '',
    email: '',
    password: '',
    confirmPassword: '',
    terms: false
  });
  const [showVerificationPrompt, setShowVerificationPrompt] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    setLoading(true);

    try {
      const response = await authAPI.signup({
        username: formData.username,
        email: formData.email,
        password: formData.password,
        confirmPassword: formData.confirmPassword
      });

      if (response.data.success) {
        if (response.data.requiresVerification) {
          setSuccess(response.data.message);
          // Store token for limited access
          if (response.data.token) {
            localStorage.setItem('token', response.data.token);
            localStorage.setItem('user', JSON.stringify(response.data.user));
          }
          setShowVerificationPrompt(true);
        } else {
          // For non-verified signups (if you disable verification)
          localStorage.setItem('token', response.data.token);
          localStorage.setItem('user', JSON.stringify(response.data.user));
          navigate('/');
        }
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Registration failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleResendVerification = async () => {
    try {
      const res = await authAPI.resendVerification(formData.email);
      if (res.data.success) {
        alert('Verification email sent! Please check your inbox.');
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to resend verification email');
    }
  };

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
  };

  return (
    <div className="min-h-screen w-full bg-gray-950 text-white overflow-x-hidden flex items-center justify-center p-4">
      {/* Background Effects */}
      <div className="absolute inset-0 bg-gradient-to-br from-blue-900/20 to-green-900/20"></div>
      <div className="absolute inset-0" style={{
        backgroundImage: 'radial-gradient(circle at 2px 2px, rgba(147, 51, 234, 0.1) 1px, transparent 0)',
        backgroundSize: '40px 40px'
      }}></div>

      {/* Sign Up Card */}
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
          <h1 className="text-3xl font-bold mb-2 text-center">Create Account</h1>
          <p className="text-gray-400 text-center mb-8">Join thousands of gamers today</p>

          {/* Success Message */}
          {success && (
            <div className="bg-green-500/10 border border-green-500 text-green-500 px-4 py-3 rounded-lg mb-6">
              {success}
            </div>
          )}

          {/* Error Message */}
          {error && (
            <div className="bg-red-500/10 border border-red-500 text-red-500 px-4 py-3 rounded-lg mb-6">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-5">
            {/* Username Field */}
            <div>
              <label htmlFor="username" className="block text-sm font-medium mb-2">
                Username
              </label>
              <div className="relative">
                <User className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                <input
                  type="text"
                  id="username"
                  name="username"
                  value={formData.username}
                  onChange={handleChange}
                  className="w-full bg-gray-800 border border-gray-700 rounded-lg pl-11 pr-4 py-3 text-white placeholder-gray-500 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition"
                  placeholder="ProGamer123"
                  required
                  minLength={3}
                />
              </div>
            </div>

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
                  minLength={6}
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

            {/* Confirm Password Field */}
            <div>
              <label htmlFor="confirmPassword" className="block text-sm font-medium mb-2">
                Confirm Password
              </label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                <input
                  type={showConfirmPassword ? 'text' : 'password'}
                  id="confirmPassword"
                  name="confirmPassword"
                  value={formData.confirmPassword}
                  onChange={handleChange}
                  className="w-full bg-gray-800 border border-gray-700 rounded-lg pl-11 pr-12 py-3 text-white placeholder-gray-500 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition"
                  placeholder="••••••••"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-300 transition"
                >
                  {showConfirmPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                </button>
              </div>
            </div>

            {/* Terms Checkbox */}
            <div>
              <label className="flex items-start space-x-3 cursor-pointer">
                <input
                  type="checkbox"
                  name="terms"
                  checked={formData.terms}
                  onChange={handleChange}
                  className="w-4 h-4 mt-1 bg-gray-800 border-gray-700 rounded text-blue-600 focus:ring-blue-500 focus:ring-offset-gray-900"
                  required
                />
                <span className="text-sm text-gray-300">
                  I agree to the{' '}
                  <a href="#" className="text-blue-400 hover:text-blue-300 transition">
                    Terms of Service
                  </a>{' '}
                  and{' '}
                  <a href="#" className="text-blue-400 hover:text-blue-300 transition">
                    Privacy Policy
                  </a>
                </span>
              </label>
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={loading || !formData.terms}
              className="w-full bg-gradient-to-r from-blue-600 to-green-600 py-3 rounded-lg font-semibold hover:from-blue-700 hover:to-green-700 transition shadow-lg shadow-blue-500/30 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? 'Creating Account...' : 'Create Account'}
            </button>
          </form>

          {/* Sign In Link */}
          <p className="text-center text-sm text-gray-400 mt-8">
            Already have an account?{' '}
            <Link to="/signin" className="text-blue-400 hover:text-blue-300 font-semibold transition">
              Sign in
            </Link>
          </p>
        </div>
      </div>

      {/* Verification Prompt Modal */}
      {showVerificationPrompt && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4">
          <div className="bg-gray-900 p-8 rounded-2xl w-full max-w-md relative border border-gray-800">
            <div className="text-center">
              <div className="w-16 h-16 bg-blue-500/20 rounded-full flex items-center justify-center mx-auto mb-4">
                <Mail className="w-8 h-8 text-blue-400" />
              </div>
              <h2 className="text-2xl font-bold mb-4">Check Your Email!</h2>
              <p className="text-gray-400 mb-6">
                We've sent a verification link to <span className="text-blue-400">{formData.email}</span>.
                Please click the link in the email to verify your account.
              </p>
              <div className="space-y-3">
                <button
                  onClick={() => {
                    setShowVerificationPrompt(false);
                    navigate('/signin');
                  }}
                  className="w-full bg-gradient-to-r from-blue-600 to-green-600 py-3 rounded-lg font-semibold hover:from-blue-700 hover:to-green-700 transition"
                >
                  Go to Sign In
                </button>
                <button
                  onClick={() => setShowVerificationPrompt(false)}
                  className="w-full bg-gray-800 hover:bg-gray-700 py-3 rounded-lg font-semibold transition"
                >
                  Close
                </button>
              </div>
              <p className="text-sm text-gray-500 mt-6">
                Didn't receive the email? Check your spam folder or{' '}
                <button
                  onClick={handleResendVerification}
                  className="text-blue-400 hover:text-blue-300 ml-1"
                >
                  resend verification email
                </button>
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}