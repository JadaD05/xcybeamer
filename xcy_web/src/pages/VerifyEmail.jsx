import React, { useState, useEffect } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { Gamepad2, CheckCircle, XCircle, Mail } from 'lucide-react';
import { authAPI } from '../utils/api';

export default function VerifyEmail() {
    const [searchParams] = useSearchParams();
    const navigate = useNavigate();
    const [loading, setLoading] = useState(true);
    const [success, setSuccess] = useState(false);
    const [error, setError] = useState('');
    const [resending, setResending] = useState(false);

    const token = searchParams.get('token');
    const userId = searchParams.get('userId');

    useEffect(() => {
        if (token && userId) {
            verifyEmail();
        } else {
            setLoading(false);
            setError('Invalid verification link');
        }
    }, [token, userId]);

    const verifyEmail = async () => {
        try {
            const res = await authAPI.verifyEmail(userId, token);
            if (res.data.success) {
                setSuccess(true);
                // Update local storage if user is logged in
                const currentUser = JSON.parse(localStorage.getItem('user') || '{}');
                if (currentUser.id === userId) {
                    currentUser.emailVerified = true;
                    localStorage.setItem('user', JSON.stringify(currentUser));
                }
            }
        } catch (err) {
            setError(err.response?.data?.message || 'Verification failed');
        } finally {
            setLoading(false);
        }
    };

    const handleResendVerification = async () => {
        const email = prompt('Please enter your email address:');
        if (!email) return;

        setResending(true);
        setError('');

        try {
            const res = await authAPI.resendVerification(email);
            if (res.data.success) {
                alert('Verification email sent! Please check your inbox.');
            }
        } catch (err) {
            setError(err.response?.data?.message || 'Failed to resend verification email');
        } finally {
            setResending(false);
        }
    };

    if (loading) {
        return (
            <div className="min-h-screen w-full bg-gray-950 text-white flex items-center justify-center p-4">
                <div className="text-center">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto"></div>
                    <p className="mt-4 text-gray-400">Verifying your email...</p>
                </div>
            </div>
        );
    }

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
                            <h1 className="text-3xl font-bold mb-2">Email Verified!</h1>
                            <p className="text-gray-400 mb-6">
                                Your email has been successfully verified. Your account is now fully activated.
                            </p>
                            <div className="space-y-4">
                                <Link
                                    to="/signin"
                                    className="block w-full bg-gradient-to-r from-blue-600 to-green-600 py-3 rounded-lg font-semibold hover:from-blue-700 hover:to-green-700 transition"
                                >
                                    Sign In
                                </Link>
                                <Link
                                    to="/"
                                    className="block w-full bg-gray-800 hover:bg-gray-700 py-3 rounded-lg font-semibold transition"
                                >
                                    Go to Homepage
                                </Link>
                            </div>
                        </div>
                    ) : (
                        <div className="text-center">
                            <div className="w-16 h-16 bg-red-500/20 rounded-full flex items-center justify-center mx-auto mb-4">
                                <XCircle className="w-8 h-8 text-red-400" />
                            </div>
                            <h1 className="text-3xl font-bold mb-2">Verification Failed</h1>
                            <p className="text-gray-400 mb-6">{error}</p>
                            <div className="space-y-4">
                                <button
                                    onClick={handleResendVerification}
                                    disabled={resending}
                                    className="w-full bg-gradient-to-r from-blue-600 to-green-600 py-3 rounded-lg font-semibold hover:from-blue-700 hover:to-green-700 transition disabled:opacity-50 flex items-center justify-center gap-2"
                                >
                                    <Mail className="w-5 h-5" />
                                    {resending ? 'Sending...' : 'Resend Verification Email'}
                                </button>
                                <Link
                                    to="/signin"
                                    className="block w-full bg-gray-800 hover:bg-gray-700 py-3 rounded-lg font-semibold transition"
                                >
                                    Back to Sign In
                                </Link>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}