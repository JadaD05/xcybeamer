import React, { useState, useEffect } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { Gamepad2, Key, Eye, EyeOff, CheckCircle } from 'lucide-react';
import { authAPI } from '../utils/api';

export default function ResetPassword() {
    const [searchParams] = useSearchParams();
    const navigate = useNavigate();
    const [loading, setLoading] = useState(false);
    const [success, setSuccess] = useState(false);
    const [error, setError] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const [showConfirmPassword, setShowConfirmPassword] = useState(false);

    const token = searchParams.get('token');
    const userId = searchParams.get('userId');

    const [formData, setFormData] = useState({
        newPassword: '',
        confirmPassword: ''
    });

    useEffect(() => {
        if (!token || !userId) {
            setError('Invalid reset link');
        }
    }, [token, userId]);

    const handleSubmit = async (e) => {
        e.preventDefault();

        if (!formData.newPassword || !formData.confirmPassword) {
            setError('Please fill in all fields');
            return;
        }

        if (formData.newPassword !== formData.confirmPassword) {
            setError('Passwords do not match');
            return;
        }

        if (formData.newPassword.length < 6) {
            setError('Password must be at least 6 characters');
            return;
        }

        setLoading(true);
        setError('');

        try {
            const res = await authAPI.resetPassword(userId, token, formData.newPassword, formData.confirmPassword);
            if (res.data.success) {
                setSuccess(true);
            }
        } catch (err) {
            setError(err.response?.data?.message || 'Failed to reset password');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen w-full bg-gray-950 text-white overflow-x-hidden flex items-center justify-center p-4">
            {/* Background Effects */}
            <div className="absolute inset-0 bg-gradient-to-br from-blue-900/20 to-green-900/20"></div>
            <div className="absolute inset-0" style={{
                backgroundImage: 'radial-gradient(circle at 2px 2px, rgba(147, 51, 234, 0.1) 1px, transparent 0)',
                backgroundSize: '40px 40px'
            }}></div>

            {/* Card */}
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
                    {success ? (
                        <div className="text-center">
                            <div className="w-16 h-16 bg-green-500/20 rounded-full flex items-center justify-center mx-auto mb-4">
                                <CheckCircle className="w-8 h-8 text-green-400" />
                            </div>
                            <h1 className="text-3xl font-bold mb-2">Password Reset!</h1>
                            <p className="text-gray-400 mb-6">
                                Your password has been successfully reset. You can now login with your new password.
                            </p>
                            <Link
                                to="/signin"
                                className="block w-full bg-gradient-to-r from-blue-600 to-green-600 py-3 rounded-lg font-semibold hover:from-blue-700 hover:to-green-700 transition"
                            >
                                Sign In
                            </Link>
                        </div>
                    ) : (
                        <>
                            <div className="flex items-center justify-center mb-6">
                                <div className="w-16 h-16 bg-blue-500/20 rounded-full flex items-center justify-center">
                                    <Key className="w-8 h-8 text-blue-400" />
                                </div>
                            </div>

                            <h1 className="text-3xl font-bold mb-2 text-center">Reset Password</h1>
                            <p className="text-gray-400 text-center mb-8">
                                Enter your new password
                            </p>

                            {error && (
                                <div className="bg-red-500/10 border border-red-500 text-red-500 px-4 py-3 rounded-lg mb-6">
                                    {error}
                                </div>
                            )}

                            <form onSubmit={handleSubmit} className="space-y-6">
                                <div>
                                    <label className="block text-sm font-medium mb-2">New Password</label>
                                    <div className="relative">
                                        <input
                                            type={showPassword ? 'text' : 'password'}
                                            value={formData.newPassword}
                                            onChange={(e) => setFormData({ ...formData, newPassword: e.target.value })}
                                            className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-3 pr-10 text-white focus:outline-none focus:border-blue-500"
                                            placeholder="••••••••"
                                            required
                                        />
                                        <button
                                            type="button"
                                            onClick={() => setShowPassword(!showPassword)}
                                            className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-300"
                                        >
                                            {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                                        </button>
                                    </div>
                                </div>

                                <div>
                                    <label className="block text-sm font-medium mb-2">Confirm New Password</label>
                                    <div className="relative">
                                        <input
                                            type={showConfirmPassword ? 'text' : 'password'}
                                            value={formData.confirmPassword}
                                            onChange={(e) => setFormData({ ...formData, confirmPassword: e.target.value })}
                                            className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-3 pr-10 text-white focus:outline-none focus:border-blue-500"
                                            placeholder="••••••••"
                                            required
                                        />
                                        <button
                                            type="button"
                                            onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                                            className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-300"
                                        >
                                            {showConfirmPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                                        </button>
                                    </div>
                                </div>

                                <button
                                    type="submit"
                                    disabled={loading || !token || !userId}
                                    className="w-full bg-gradient-to-r from-blue-600 to-green-600 py-3 rounded-lg font-semibold hover:from-blue-700 hover:to-green-700 transition disabled:opacity-50"
                                >
                                    {loading ? 'Resetting...' : 'Reset Password'}
                                </button>
                            </form>

                            <div className="mt-6 text-center">
                                <Link to="/signin" className="text-blue-400 hover:text-blue-300 text-sm">
                                    Back to Sign In
                                </Link>
                            </div>
                        </>
                    )}
                </div>
            </div>
        </div>
    );
}