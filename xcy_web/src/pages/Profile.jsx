import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
    User, Mail, Key, Shield, Save, Eye, EyeOff,
    Gamepad2, LogOut, AlertCircle, CheckCircle, Download, MessageCircle
} from 'lucide-react';
import { authAPI } from '../utils/api';
import { isAuthenticated, getUser, logout } from '../utils/auth';

export default function Profile() {
    const navigate = useNavigate();
    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');
    const [showPasswordModal, setShowPasswordModal] = useState(false);
    const [show2FAModal, setShow2FAModal] = useState(false);
    const [showBackupCodes, setShowBackupCodes] = useState(false);
    const [backupCodes, setBackupCodes] = useState([]);
    const [twoFASetupData, setTwoFASetupData] = useState(null);
    const [twoFAToken, setTwoFAToken] = useState('');
    const [step, setStep] = useState(1); // 1: Setup, 2: Verify, 3: Complete

    // Form states
    const [formData, setFormData] = useState({
        username: '',
        email: '',
        currentPassword: '',
        newPassword: '',
        confirmPassword: ''
    });
    const [showCurrentPassword, setShowCurrentPassword] = useState(false);
    const [showNewPassword, setShowNewPassword] = useState(false);
    const [showConfirmPassword, setShowConfirmPassword] = useState(false);

    useEffect(() => {
        if (!isAuthenticated()) {
            navigate('/signin');
            return;
        }
        fetchUserData();
    }, [navigate]);

    const fetchUserData = async () => {
        try {
            const currentUser = getUser();
            console.log('Current user from localStorage:', currentUser); // Add this
            console.log('twoFactorEnabled value:', currentUser.twoFactorEnabled); // Add this
            setUser(currentUser);
            setFormData({
                username: currentUser.username || '',
                email: currentUser.email || '',
                currentPassword: '',
                newPassword: '',
                confirmPassword: ''
            });

            // Fetch 2FA status if enabled
            if (currentUser.twoFactorEnabled) {
                try {
                    const res = await authAPI.getBackupCodes();
                    setBackupCodes(res.data.backupCodes || []);
                } catch (err) {
                    console.error('Failed to fetch backup codes:', err);
                }
            }
        } catch (err) {
            setError('Failed to load user data');
        } finally {
            setLoading(false);
        }
    };

    const handleUpdateProfile = async (e) => {
        e.preventDefault();
        setSaving(true);
        setError('');
        setSuccess('');

        try {
            // Call the API to update profile
            const res = await authAPI.updateProfile({
                username: formData.username,
                email: formData.email
            });

            if (res.data.success) {
                setSuccess('Profile updated successfully');

                // Update local user data with the response from server
                const updatedUser = res.data.user;
                setUser(updatedUser);
                localStorage.setItem('user', JSON.stringify(updatedUser));

                // Update form data
                setFormData(prev => ({
                    ...prev,
                    username: updatedUser.username,
                    email: updatedUser.email
                }));
            }
        } catch (err) {
            setError(err.response?.data?.message || 'Failed to update profile');
        } finally {
            setSaving(false);
        }
    };

    const handleChangePassword = async () => {
        if (!formData.currentPassword || !formData.newPassword || !formData.confirmPassword) {
            setError('Please fill in all password fields');
            return;
        }

        if (formData.newPassword !== formData.confirmPassword) {
            setError('New passwords do not match');
            return;
        }

        if (formData.newPassword.length < 6) {
            setError('Password must be at least 6 characters');
            return;
        }

        setSaving(true);
        setError('');
        setSuccess('');

        try {
            // Call API to change password
            const res = await authAPI.changePassword({
                currentPassword: formData.currentPassword,
                newPassword: formData.newPassword
            });

            if (res.data.success) {
                setSuccess('Password changed successfully');
                setShowPasswordModal(false);

                // Clear password fields
                setFormData(prev => ({
                    ...prev,
                    currentPassword: '',
                    newPassword: '',
                    confirmPassword: ''
                }));
            }
        } catch (err) {
            setError(err.response?.data?.message || 'Failed to change password');
        } finally {
            setSaving(false);
        }
    };

    const handleSetup2FA = async () => {
        setStep(1);
        setTwoFASetupData(null);
        setTwoFAToken('');
        setError('');
        setShow2FAModal(true);

        try {
            const res = await authAPI.setup2FA();
            setTwoFASetupData(res.data);
            setStep(2);
        } catch (err) {
            setError(err.response?.data?.message || 'Failed to setup 2FA');
            setShow2FAModal(false);
        }
    };

    const handleVerify2FA = async () => {
        if (!twoFAToken || twoFAToken.length !== 6) {
            setError('Please enter a valid 6-digit code');
            return;
        }

        setSaving(true);
        setError('');

        try {
            await authAPI.verify2FA(twoFAToken);
            setStep(3);
            setSuccess('2FA enabled successfully');

            // Update user data
            const updatedUser = { ...user, twoFactorEnabled: true };
            setUser(updatedUser);
            localStorage.setItem('user', JSON.stringify(updatedUser));

            // Fetch backup codes
            const res = await authAPI.getBackupCodes();
            setBackupCodes(res.data.backupCodes || []);
        } catch (err) {
            setError(err.response?.data?.message || 'Invalid verification code');
        } finally {
            setSaving(false);
        }
    };

    const handleDisable2FA = async () => {
        const token = prompt('Enter your current 2FA code to disable:');
        if (!token) return;

        setSaving(true);
        setError('');
        setSuccess('');

        try {
            await authAPI.disable2FA(token);
            setSuccess('2FA disabled successfully');

            // Update user data
            const updatedUser = { ...user, twoFactorEnabled: false };
            setUser(updatedUser);
            localStorage.setItem('user', JSON.stringify(updatedUser));
            setBackupCodes([]);
        } catch (err) {
            setError(err.response?.data?.message || 'Failed to disable 2FA');
        } finally {
            setSaving(false);
        }
    };

    const handleRegenerateBackupCodes = async () => {
        const token = prompt('Enter your current 2FA code to regenerate backup codes:');
        if (!token) return;

        setSaving(true);
        setError('');

        try {
            const res = await authAPI.regenerateBackupCodes(token);
            setBackupCodes(res.data.backupCodes || []);
            setSuccess('Backup codes regenerated successfully');
            setShowBackupCodes(true);
        } catch (err) {
            setError(err.response?.data?.message || 'Failed to regenerate backup codes');
        } finally {
            setSaving(false);
        }
    };

    const handleLogout = () => {
        logout();
        navigate('/signin');
    };

    const downloadBackupCodes = () => {
        const codesText = backupCodes.join('\n');
        const blob = new Blob([codesText], { type: 'text/plain' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = '2fa-backup-codes.txt';
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
    };

    if (loading) {
        return (
            <div className="min-h-screen w-full bg-gray-950 text-white flex items-center justify-center">
                <div className="text-center">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto"></div>
                    <p className="mt-4 text-gray-400">Loading profile...</p>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen w-full bg-gray-950 text-white overflow-x-hidden">
            {/* Navigation */}
            <nav className="fixed w-full z-50 bg-gray-900/95 backdrop-blur-lg shadow-lg">
                <div className="w-full px-8 lg:px-16">
                    <div className="flex justify-between items-center h-16">
                        <Link to="/" className="flex items-center space-x-2">
                            <Gamepad2 className="w-8 h-8 text-blue-500" />
                            <span className="text-xl font-bold bg-gradient-to-r from-blue-400 to-green-600 bg-clip-text text-transparent">
                                XCY BEAMER
                            </span>
                        </Link>
                        <div className="hidden md:flex space-x-8">
                            <Link to="/" className="hover:text-blue-400 transition">Home</Link>
                            <Link to="/products" className="hover:text-blue-400 transition">Products</Link>
                            <Link to="/status" className="hover:text-blue-400 transition">Status</Link>
                            <Link to="/support" className="hover:text-blue-400 transition">Support</Link>
                            <a
                                href="https://discord.gg/R95AHqwm5X"
                                target="_blank"
                                rel="noopener noreferrer"
                                className="flex items-center gap-2 hover:text-blue-400 transition"
                            >
                                Discord
                            </a>
                            <Link to="/profile" className="text-blue-400">Profile</Link>
                        </div>
                        <div className="hidden md:block">
                            <div className="flex items-center gap-4">
                                <span className="text-gray-300">
                                    Welcome, <span className="font-semibold text-blue-400">{user?.username}</span>!
                                </span>
                                <button
                                    onClick={handleLogout}
                                    className="bg-gradient-to-r from-red-600 to-red-700 px-6 py-2 rounded-lg font-semibold hover:from-red-700 hover:to-red-800 transition"
                                >
                                    Logout
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            </nav>

            {/* Main Content */}
            <div className="pt-24 px-8 pb-8">
                <div className="max-w-6xl mx-auto">
                    {/* Header */}
                    <div className="mb-8">
                        <h1 className="text-4xl font-bold mb-2 bg-gradient-to-r from-blue-400 via-green-500 to-blue-600 bg-clip-text text-transparent">
                            Profile Settings
                        </h1>
                        <p className="text-gray-400">Manage your account settings and security</p>
                    </div>

                    {/* Messages */}
                    {error && (
                        <div className="mb-6 p-4 bg-red-500/10 border border-red-500 rounded-lg flex items-center gap-3">
                            <AlertCircle className="w-5 h-5 text-red-400" />
                            <p className="text-red-400">{error}</p>
                        </div>
                    )}

                    {success && (
                        <div className="mb-6 p-4 bg-green-500/10 border border-green-500 rounded-lg flex items-center gap-3">
                            <CheckCircle className="w-5 h-5 text-green-400" />
                            <p className="text-green-400">{success}</p>
                        </div>
                    )}

                    <div className="grid md:grid-cols-3 gap-8">
                        {/* Left Column - Profile Info */}
                        <div className="md:col-span-2 space-y-8">
                            {/* Profile Information Card */}
                            <div className="bg-gradient-to-br from-gray-900 to-gray-800 border border-gray-700 rounded-2xl p-6">
                                <div className="flex items-center gap-4 mb-6">
                                    <div className="w-16 h-16 bg-gradient-to-br from-blue-600 to-green-600 rounded-full flex items-center justify-center">
                                        <User className="w-8 h-8 text-white" />
                                    </div>
                                    <div>
                                        <h2 className="text-2xl font-bold">{user?.username}</h2>
                                        <p className="text-gray-400">{user?.email}</p>
                                        <p className="text-sm text-gray-500">
                                            Member since {new Date(user?.createdAt).toLocaleDateString()}
                                        </p>
                                    </div>
                                </div>

                                <form onSubmit={handleUpdateProfile} className="space-y-6">
                                    <h3 className="text-xl font-semibold mb-4">Personal Information</h3>

                                    <div className="grid md:grid-cols-2 gap-4">
                                        <div>
                                            <label className="block text-sm font-medium mb-2">
                                                <div className="flex items-center gap-2">
                                                    <User className="w-4 h-4" />
                                                    Username
                                                </div>
                                            </label>
                                            <input
                                                type="text"
                                                value={formData.username}
                                                onChange={(e) => setFormData({ ...formData, username: e.target.value })}
                                                className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-3 text-white focus:outline-none focus:border-blue-500"
                                            />
                                        </div>

                                        <div>
                                            <label className="block text-sm font-medium mb-2">
                                                <div className="flex items-center gap-2">
                                                    <Mail className="w-4 h-4" />
                                                    Email Address
                                                </div>
                                            </label>
                                            <input
                                                type="email"
                                                value={formData.email}
                                                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                                                className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-3 text-white focus:outline-none focus:border-blue-500"
                                            />
                                        </div>
                                    </div>

                                    <div className="flex justify-end">
                                        <button
                                            type="submit"
                                            disabled={saving}
                                            className="flex items-center gap-2 bg-gradient-to-r from-blue-600 to-green-600 px-6 py-3 rounded-lg font-semibold hover:from-blue-700 hover:to-green-700 transition disabled:opacity-50"
                                        >
                                            <Save className="w-5 h-5" />
                                            {saving ? 'Saving...' : 'Save Changes'}
                                        </button>
                                    </div>
                                </form>
                            </div>

                            {/* Security Card */}
                            <div className="bg-gradient-to-br from-gray-900 to-gray-800 border border-gray-700 rounded-2xl p-6">
                                <h3 className="text-xl font-semibold mb-6">Security</h3>

                                <div className="space-y-6">
                                    {/* Password Change */}
                                    <div className="flex items-center justify-between p-4 bg-gray-800/50 rounded-lg">
                                        <div>
                                            <h4 className="font-semibold">Password</h4>
                                            <p className="text-sm text-gray-400">Change your account password</p>
                                        </div>
                                        <button
                                            onClick={() => setShowPasswordModal(true)}
                                            className="bg-gradient-to-r from-blue-600 to-green-600 px-4 py-2 rounded-lg font-semibold hover:from-blue-700 hover:to-green-700 transition text-sm"
                                        >
                                            Change Password
                                        </button>
                                    </div>

                                    {/* 2FA */}
                                    <div className="flex items-center justify-between p-4 bg-gray-800/50 rounded-lg">
                                        <div>
                                            <div className="flex items-center gap-2 mb-1">
                                                <Shield className="w-5 h-5 text-blue-400" />
                                                <h4 className="font-semibold">Two-Factor Authentication</h4>
                                                <span className={`px-2 py-1 rounded text-xs ${user?.twoFactorEnabled ? 'bg-green-500/20 text-green-400' : 'bg-yellow-500/20 text-yellow-400'}`}>
                                                    {user?.twoFactorEnabled ? 'Enabled' : 'Not Enabled'}
                                                </span>
                                            </div>
                                            <p className="text-sm text-gray-400">
                                                Add an extra layer of security to your account
                                            </p>
                                        </div>
                                        <div className="flex gap-2">
                                            {user?.twoFactorEnabled ? (
                                                <>
                                                    <button
                                                        onClick={() => setShowBackupCodes(true)}
                                                        className="bg-gray-700 hover:bg-gray-600 px-4 py-2 rounded-lg font-semibold transition text-sm"
                                                    >
                                                        View Backup Codes
                                                    </button>
                                                    <button
                                                        onClick={handleDisable2FA}
                                                        className="bg-gradient-to-r from-red-600 to-orange-600 px-4 py-2 rounded-lg font-semibold hover:from-red-700 hover:to-orange-700 transition text-sm"
                                                    >
                                                        Disable 2FA
                                                    </button>
                                                </>
                                            ) : (
                                                <button
                                                    onClick={handleSetup2FA}
                                                    className="bg-gradient-to-r from-blue-600 to-green-600 px-4 py-2 rounded-lg font-semibold hover:from-blue-700 hover:to-green-700 transition text-sm"
                                                >
                                                    Enable 2FA
                                                </button>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Right Column - Stats & Actions */}
                        <div className="space-y-8">
                            {/* Account Stats */}
                            <div className="bg-gradient-to-br from-gray-900 to-gray-800 border border-gray-700 rounded-2xl p-6">
                                <h3 className="text-xl font-semibold mb-6">Account Status</h3>

                                <div className="space-y-4">
                                    <div className="flex items-center justify-between">
                                        <span className="text-gray-400">Account Type</span>
                                        <span className="font-semibold text-blue-400">
                                            {user?.roles?.includes('admin') ? 'Administrator' : 'Standard User'}
                                        </span>
                                    </div>

                                    <div className="flex items-center justify-between">
                                        <span className="text-gray-400">2FA Status</span>
                                        <span className={`font-semibold ${user?.twoFactorEnabled ? 'text-green-400' : 'text-yellow-400'}`}>
                                            {user?.twoFactorEnabled ? 'Active' : 'Inactive'}
                                        </span>
                                    </div>

                                    <div className="flex items-center justify-between">
                                        <span className="text-gray-400">Email Verified</span>
                                        <span className="font-semibold text-green-400">Verified</span>
                                    </div>

                                    <div className="flex items-center justify-between">
                                        <span className="text-gray-400">Last Login</span>
                                        <span className="text-sm text-gray-400">Recently</span>
                                    </div>
                                </div>
                            </div>

                            {/* Quick Actions */}
                            <div className="bg-gradient-to-br from-gray-900 to-gray-800 border border-gray-700 rounded-2xl p-6">
                                <h3 className="text-xl font-semibold mb-6">Quick Actions</h3>

                                <div className="space-y-3">
                                    <button
                                        onClick={() => navigate('/orders')}
                                        className="w-full text-left p-3 bg-gray-800 hover:bg-gray-700 rounded-lg transition flex items-center justify-between"
                                    >
                                        <span>View Orders</span>
                                        <span className="text-blue-400">→</span>
                                    </button>

                                    <button
                                        onClick={() => navigate('/keys')}
                                        className="w-full text-left p-3 bg-gray-800 hover:bg-gray-700 rounded-lg transition flex items-center justify-between"
                                    >
                                        <span>My Product Keys</span>
                                        <span className="text-blue-400">→</span>
                                    </button>

                                    <button
                                        onClick={() => navigate('/downloads')}
                                        className="w-full text-left p-3 bg-gray-800 hover:bg-gray-700 rounded-lg transition flex items-center justify-between"
                                    >
                                        <span>Downloads</span>
                                        <span className="text-blue-400">→</span>
                                    </button>

                                    <button
                                        onClick={handleLogout}
                                        className="w-full text-left p-3 bg-red-500/10 hover:bg-red-500/20 rounded-lg transition flex items-center justify-between text-red-400"
                                    >
                                        <span>Logout</span>
                                        <LogOut className="w-4 h-4" />
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Password Change Modal */}
            {showPasswordModal && (
                <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4">
                    <div className="bg-gray-900 p-8 rounded-2xl w-full max-w-md relative border border-gray-800">
                        <h2 className="text-2xl font-bold mb-6">Change Password</h2>
                        <button
                            className="absolute top-6 right-6 text-gray-400 hover:text-white transition"
                            onClick={() => setShowPasswordModal(false)}
                        >
                            ×
                        </button>

                        <div className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium mb-2">Current Password</label>
                                <div className="relative">
                                    <input
                                        type={showCurrentPassword ? 'text' : 'password'}
                                        value={formData.currentPassword}
                                        onChange={(e) => setFormData({ ...formData, currentPassword: e.target.value })}
                                        className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-3 pr-10 text-white focus:outline-none focus:border-blue-500"
                                    />
                                    <button
                                        type="button"
                                        onClick={() => setShowCurrentPassword(!showCurrentPassword)}
                                        className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-300"
                                    >
                                        {showCurrentPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                                    </button>
                                </div>
                            </div>

                            <div>
                                <label className="block text-sm font-medium mb-2">New Password</label>
                                <div className="relative">
                                    <input
                                        type={showNewPassword ? 'text' : 'password'}
                                        value={formData.newPassword}
                                        onChange={(e) => setFormData({ ...formData, newPassword: e.target.value })}
                                        className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-3 pr-10 text-white focus:outline-none focus:border-blue-500"
                                    />
                                    <button
                                        type="button"
                                        onClick={() => setShowNewPassword(!showNewPassword)}
                                        className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-300"
                                    >
                                        {showNewPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
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
                        </div>

                        <button
                            onClick={handleChangePassword}
                            disabled={saving}
                            className="w-full bg-gradient-to-r from-blue-600 to-green-600 px-6 py-3 rounded-lg mt-6 font-semibold hover:from-blue-700 hover:to-green-700 transition disabled:opacity-50"
                        >
                            {saving ? 'Changing Password...' : 'Change Password'}
                        </button>
                    </div>
                </div>
            )}

            {/* 2FA Setup Modal */}
            {show2FAModal && (
                <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4">
                    <div className="bg-gray-900 p-8 rounded-2xl w-full max-w-md relative border border-gray-800 max-h-[90vh] overflow-y-auto">
                        {step === 1 && (
                            <div className="text-center">
                                <div className="w-16 h-16 bg-blue-500/20 rounded-full flex items-center justify-center mx-auto mb-4">
                                    <Shield className="w-8 h-8 text-blue-400" />
                                </div>
                                <h2 className="text-2xl font-bold mb-4">Setting up 2FA...</h2>
                                <p className="text-gray-400">Please wait while we prepare your 2FA setup.</p>
                            </div>
                        )}

                        {step === 2 && twoFASetupData && (
                            <>
                                <h2 className="text-2xl font-bold mb-6">Setup Two-Factor Authentication</h2>
                                <button
                                    className="absolute top-6 right-6 text-gray-400 hover:text-white transition"
                                    onClick={() => setShow2FAModal(false)}
                                >
                                    ×
                                </button>

                                <div className="space-y-6">
                                    <div className="text-center">
                                        <p className="text-gray-400 mb-4">
                                            Scan this QR code with your authenticator app (Google Authenticator, Authy, etc.)
                                        </p>
                                        <div className="bg-white p-4 rounded-lg mb-4 flex justify-center">
                                            <img src={twoFASetupData.qrCode} alt="QR Code" className="w-48 h-48" />
                                        </div>

                                        <div className="mb-6">
                                            <p className="text-sm text-gray-400 mb-2">Or enter this secret manually:</p>
                                            <div className="bg-gray-800 p-3 rounded-lg font-mono text-sm break-all">
                                                {twoFASetupData.secret}
                                            </div>
                                        </div>

                                        <div>
                                            <label className="block text-sm font-medium mb-2">
                                                Enter verification code from your app
                                            </label>
                                            <input
                                                type="text"
                                                value={twoFAToken}
                                                onChange={(e) => setTwoFAToken(e.target.value.replace(/\D/g, '').slice(0, 6))}
                                                placeholder="000000"
                                                className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-3 text-center text-2xl font-mono tracking-widest focus:outline-none focus:border-blue-500"
                                                maxLength={6}
                                            />
                                        </div>
                                    </div>

                                    <button
                                        onClick={handleVerify2FA}
                                        disabled={saving || twoFAToken.length !== 6}
                                        className="w-full bg-gradient-to-r from-blue-600 to-green-600 px-6 py-3 rounded-lg font-semibold hover:from-blue-700 hover:to-green-700 transition disabled:opacity-50"
                                    >
                                        {saving ? 'Verifying...' : 'Verify & Enable'}
                                    </button>
                                </div>
                            </>
                        )}

                        {step === 3 && (
                            <div className="text-center">
                                <div className="w-16 h-16 bg-green-500/20 rounded-full flex items-center justify-center mx-auto mb-4">
                                    <CheckCircle className="w-8 h-8 text-green-400" />
                                </div>
                                <h2 className="text-2xl font-bold mb-4">2FA Enabled Successfully!</h2>
                                <p className="text-gray-400 mb-6">
                                    Two-factor authentication is now enabled for your account.
                                </p>

                                <div className="mb-6">
                                    <h4 className="font-semibold mb-3 text-yellow-400">⚠️ Save Your Backup Codes</h4>
                                    <p className="text-sm text-gray-400 mb-3">
                                        These codes can be used to access your account if you lose your authenticator device.
                                    </p>
                                    <div className="bg-gray-800 border border-gray-700 rounded-lg p-4">
                                        <div className="grid grid-cols-2 gap-2">
                                            {twoFASetupData?.backupCodes?.map((code, index) => (
                                                <div key={index} className="bg-gray-900 p-2 rounded text-center font-mono text-sm">
                                                    {code}
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                    <p className="text-xs text-gray-500 mt-3">
                                        Each code can only be used once.
                                    </p>
                                </div>

                                <div className="flex gap-3">
                                    <button
                                        onClick={() => setShow2FAModal(false)}
                                        className="flex-1 bg-gray-800 hover:bg-gray-700 px-6 py-3 rounded-lg font-semibold transition"
                                    >
                                        Close
                                    </button>
                                    <button
                                        onClick={downloadBackupCodes}
                                        className="flex-1 bg-gradient-to-r from-blue-600 to-green-600 px-6 py-3 rounded-lg font-semibold hover:from-blue-700 hover:to-green-700 transition flex items-center justify-center gap-2"
                                    >
                                        <Download className="w-5 h-5" />
                                        Download Codes
                                    </button>
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            )}

            {/* Backup Codes Modal */}
            {showBackupCodes && (
                <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4">
                    <div className="bg-gray-900 p-8 rounded-2xl w-full max-w-md relative border border-gray-800">
                        <h2 className="text-2xl font-bold mb-6">Backup Codes</h2>
                        <button
                            className="absolute top-6 right-6 text-gray-400 hover:text-white transition"
                            onClick={() => setShowBackupCodes(false)}
                        >
                            ×
                        </button>

                        <div className="mb-6">
                            <p className="text-gray-400 mb-4">
                                Save these codes in a secure place. Each code can only be used once.
                            </p>

                            <div className="bg-gray-800 border border-gray-700 rounded-lg p-4">
                                <div className="grid grid-cols-2 gap-2">
                                    {backupCodes.map((code, index) => (
                                        <div key={index} className="bg-gray-900 p-2 rounded text-center font-mono text-sm">
                                            {code}
                                        </div>
                                    ))}
                                </div>
                            </div>

                            <p className="text-xs text-gray-500 mt-3 text-center">
                                {backupCodes.length} codes remaining
                            </p>
                        </div>

                        <div className="flex gap-3">
                            <button
                                onClick={handleRegenerateBackupCodes}
                                className="flex-1 bg-gradient-to-r from-blue-600 to-green-600 px-6 py-3 rounded-lg font-semibold hover:from-blue-700 hover:to-green-700 transition"
                            >
                                Regenerate Codes
                            </button>
                            <button
                                onClick={downloadBackupCodes}
                                className="flex-1 bg-gray-800 hover:bg-gray-700 px-6 py-3 rounded-lg font-semibold transition flex items-center justify-center gap-2"
                            >
                                <Download className="w-5 h-5" />
                                Download
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Footer */}
            <footer className="bg-gray-900 border-t border-gray-800 py-12 px-4">
                <div className="max-w-7xl mx-auto text-center">
                    <div className="flex items-center justify-center space-x-2 mb-4">
                        <Gamepad2 className="w-8 h-8 text-blue-500" />
                        <span className="text-xl font-bold">XCY BEAMER</span>
                    </div>
                    <p className="text-gray-400 mb-4">Elevating gaming experiences worldwide</p>
                    <div className="flex justify-center gap-6 text-sm text-gray-400">
                        <a href="#" className="hover:text-blue-400 transition">Terms</a>
                        <a href="#" className="hover:text-blue-400 transition">Privacy</a>
                        <a href="#" className="hover:text-blue-400 transition">Contact</a>
                    </div>
                    <p className="text-gray-500 mt-6 text-sm">© 2026 XCY BEAMER. All rights reserved.</p>
                </div>
            </footer>
        </div>
    );
}