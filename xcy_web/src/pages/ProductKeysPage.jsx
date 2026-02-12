import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
    Key, Copy, CheckCircle, Gamepad2,
    ChevronLeft, AlertCircle, Shield,
    Calendar, Download, Eye, RefreshCw,
    Clock, Check, XCircle, ExternalLink
} from 'lucide-react';
import { isAuthenticated, getUser, logout } from '../utils/auth';
import { orderAPI } from '../utils/api';

export default function ProductKeysPage() {
    const [user, setUser] = useState(null);
    const [keys, setKeys] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [copiedKey, setCopiedKey] = useState(null);
    const [filter, setFilter] = useState('all'); // all, active, expired, used

    useEffect(() => {
        if (!isAuthenticated()) {
            window.location.href = '/signin';
            return;
        }
        setUser(getUser());
        fetchKeys();
    }, []);

    const fetchKeys = async () => {
        try {
            setLoading(true);
            setError('');
            // Using orderAPI.getMyKeys() from the context [1]
            const res = await orderAPI.getMyKeys();
            if (res.data.success) {
                setKeys(res.data.keys || []);
            }
        } catch (err) {
            console.error('Failed to fetch keys:', err);
            setError('Failed to load product keys. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    const handleLogout = () => {
        logout();
        window.location.href = '/signin';
    };

    const copyKey = (licenseKey) => {
        navigator.clipboard.writeText(licenseKey);
        setCopiedKey(licenseKey);
        setTimeout(() => setCopiedKey(null), 2000);
    };

    const formatDate = (dateString) => {
        if (!dateString) return 'Never';
        return new Date(dateString).toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'short',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        });
    };

    const getKeyStatus = (key) => {
        if (!key.expiresAt) return 'active';
        const now = new Date();
        const expires = new Date(key.expiresAt);
        return expires < now ? 'expired' : 'active';
    };

    const getStatusBadge = (key) => {
        const status = getKeyStatus(key);
        const statusConfig = {
            'active': { color: 'bg-green-500/20 text-green-400', icon: <CheckCircle className="w-4 h-4" />, text: 'Active' },
            'expired': { color: 'bg-red-500/20 text-red-400', icon: <XCircle className="w-4 h-4" />, text: 'Expired' },
            'used': { color: 'bg-gray-500/20 text-gray-400', icon: <Clock className="w-4 h-4" />, text: 'Used' }
        };

        const config = statusConfig[status] || statusConfig.active;
        return (
            <span className={`px-3 py-1 rounded-full text-xs font-semibold flex items-center gap-1 ${config.color}`}>
                {config.icon}
                {config.text}
            </span>
        );
    };

    const filteredKeys = keys.filter(key => {
        if (filter === 'all') return true;
        return getKeyStatus(key) === filter;
    });

    const downloadKeys = () => {
        const keysText = keys.map(k =>
            `Product: ${k.productName}\nGame: ${k.game}\nKey: ${k.licenseKey}\nType: ${k.keyType}\nStatus: ${getKeyStatus(k)}\nExpires: ${formatDate(k.expiresAt)}\nSold: ${formatDate(k.soldAt)}\nOrder ID: ${k.orderId}\n\n`
        ).join('---\n');

        const blob = new Blob([keysText], { type: 'text/plain' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = 'xcy-beamer-product-keys.txt';
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
    };

    const refreshKeys = () => {
        fetchKeys();
    };

    if (loading) {
        return (
            <div className="min-h-screen w-full bg-gray-950 text-white flex items-center justify-center">
                <div className="text-center">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto"></div>
                    <p className="mt-4 text-gray-400">Loading product keys...</p>
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
                            <Link to="/orders" className="hover:text-blue-400 transition">Orders</Link>
                            <Link to="/keys" className="text-blue-400">My Keys</Link>
                            <Link to="/profile" className="hover:text-blue-400 transition">Profile</Link>
                        </div>
                        <div className="hidden md:block">
                            {user ? (
                                <div className="flex items-center gap-4">
                                    <span className="text-gray-300">Welcome, <span className="font-semibold text-blue-400">{user.username}</span>!</span>
                                    <button onClick={handleLogout} className="bg-gradient-to-r from-red-600 to-red-700 px-6 py-2 rounded-lg font-semibold hover:from-red-700 hover:to-red-800 transition">
                                        Logout
                                    </button>
                                </div>
                            ) : (
                                <div className="flex items-center gap-3">
                                    <Link to="/signin" className="text-blue-400 hover:text-blue-300 font-semibold transition">Sign In</Link>
                                    <Link to="/signup" className="bg-gradient-to-r from-blue-600 to-green-600 px-6 py-2 rounded-lg font-semibold hover:from-blue-700 hover:to-green-700 transition">Get Started</Link>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </nav>

            {/* Main Content */}
            <div className="pt-24 px-8 pb-8">
                <div className="max-w-7xl mx-auto">
                    {/* Header */}
                    <div className="mb-8">
                        <div className="flex items-center justify-between">
                            <div>
                                <h1 className="text-4xl font-bold mb-2 bg-gradient-to-r from-blue-400 via-green-500 to-blue-600 bg-clip-text text-transparent">
                                    My Product Keys
                                </h1>
                                <p className="text-gray-400">Manage and access your purchased license keys</p>
                            </div>
                            <Link to="/products" className="flex items-center gap-2 text-blue-400 hover:text-blue-300">
                                <ChevronLeft className="w-5 h-5" />
                                Back to Products
                            </Link>
                        </div>
                    </div>

                    {/* Error Message */}
                    {error && (
                        <div className="mb-6 p-4 bg-red-500/10 border border-red-500 rounded-lg flex items-center gap-3">
                            <AlertCircle className="w-5 h-5 text-red-400" />
                            <p className="text-red-400">{error}</p>
                        </div>
                    )}

                    {/* Stats and Actions */}
                    <div className="grid md:grid-cols-4 gap-6 mb-8">
                        <div className="bg-gradient-to-br from-gray-900 to-gray-800 rounded-xl border border-gray-700 p-6">
                            <div className="flex items-center justify-between">
                                <div>
                                    <p className="text-gray-400 text-sm">Total Keys</p>
                                    <p className="text-3xl font-bold">{keys.length}</p>
                                </div>
                                <Key className="w-10 h-10 text-blue-400" />
                            </div>
                        </div>
                        <div className="bg-gradient-to-br from-gray-900 to-gray-800 rounded-xl border border-gray-700 p-6">
                            <div className="flex items-center justify-between">
                                <div>
                                    <p className="text-gray-400 text-sm">Active Keys</p>
                                    <p className="text-3xl font-bold">{keys.filter(k => getKeyStatus(k) === 'active').length}</p>
                                </div>
                                <CheckCircle className="w-10 h-10 text-green-400" />
                            </div>
                        </div>
                        <div className="bg-gradient-to-br from-gray-900 to-gray-800 rounded-xl border border-gray-700 p-6">
                            <div className="flex items-center justify-between">
                                <div>
                                    <p className="text-gray-400 text-sm">Expired Keys</p>
                                    <p className="text-3xl font-bold">{keys.filter(k => getKeyStatus(k) === 'expired').length}</p>
                                </div>
                                <XCircle className="w-10 h-10 text-red-400" />
                            </div>
                        </div>
                        <div className="bg-gradient-to-br from-gray-900 to-gray-800 rounded-xl border border-gray-700 p-6">
                            <div className="flex items-center justify-between">
                                <div>
                                    <p className="text-gray-400 text-sm">Unique Games</p>
                                    <p className="text-3xl font-bold">{[...new Set(keys.map(k => k.game))].length}</p>
                                </div>
                                <Gamepad2 className="w-10 h-10 text-purple-400" />
                            </div>
                        </div>
                    </div>

                    {/* Filter and Actions Bar */}
                    <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-6">
                        <div className="flex gap-2">
                            <button
                                onClick={() => setFilter('all')}
                                className={`px-4 py-2 rounded-lg font-semibold transition ${filter === 'all' ? 'bg-blue-500/20 text-blue-400 border border-blue-500' : 'bg-gray-800 text-gray-300 hover:bg-gray-700'}`}
                            >
                                All Keys ({keys.length})
                            </button>
                            <button
                                onClick={() => setFilter('active')}
                                className={`px-4 py-2 rounded-lg font-semibold transition ${filter === 'active' ? 'bg-green-500/20 text-green-400 border border-green-500' : 'bg-gray-800 text-gray-300 hover:bg-gray-700'}`}
                            >
                                Active ({keys.filter(k => getKeyStatus(k) === 'active').length})
                            </button>
                            <button
                                onClick={() => setFilter('expired')}
                                className={`px-4 py-2 rounded-lg font-semibold transition ${filter === 'expired' ? 'bg-red-500/20 text-red-400 border border-red-500' : 'bg-gray-800 text-gray-300 hover:bg-gray-700'}`}
                            >
                                Expired ({keys.filter(k => getKeyStatus(k) === 'expired').length})
                            </button>
                        </div>
                        <div className="flex gap-3">
                            <button
                                onClick={refreshKeys}
                                className="flex items-center gap-2 bg-gray-800 hover:bg-gray-700 px-4 py-2 rounded-lg font-semibold transition"
                            >
                                <RefreshCw className="w-4 h-4" />
                                Refresh
                            </button>
                            <button
                                onClick={downloadKeys}
                                className="flex items-center gap-2 bg-gradient-to-r from-blue-600 to-green-600 px-4 py-2 rounded-lg font-semibold hover:from-blue-700 hover:to-green-700 transition"
                            >
                                <Download className="w-4 h-4" />
                                Download All
                            </button>
                        </div>
                    </div>

                    {/* Keys List */}
                    <div className="bg-gradient-to-br from-gray-900 to-gray-800 rounded-2xl border border-gray-700 overflow-hidden">
                        {filteredKeys.length === 0 ? (
                            <div className="p-12 text-center">
                                <Key className="w-16 h-16 text-gray-600 mx-auto mb-4" />
                                <h3 className="text-xl font-bold mb-2">No Product Keys Found</h3>
                                <p className="text-gray-400 mb-6">
                                    {filter === 'all'
                                        ? "You haven't purchased any products yet."
                                        : `No ${filter} keys found.`}
                                </p>
                                {filter === 'all' && (
                                    <Link to="/products" className="bg-gradient-to-r from-blue-600 to-green-600 px-6 py-3 rounded-lg font-semibold hover:from-blue-700 hover:to-green-700 transition inline-flex items-center gap-2">
                                        <Gamepad2 className="w-5 h-5" />
                                        Browse Products
                                    </Link>
                                )}
                            </div>
                        ) : (
                            <div className="overflow-x-auto">
                                <table className="w-full">
                                    <thead>
                                        <tr className="border-b border-gray-700">
                                            <th className="text-left p-6 text-gray-400 font-semibold">Product</th>
                                            <th className="text-left p-6 text-gray-400 font-semibold">License Key</th>
                                            <th className="text-left p-6 text-gray-400 font-semibold">Type</th>
                                            <th className="text-left p-6 text-gray-400 font-semibold">Status</th>
                                            <th className="text-left p-6 text-gray-400 font-semibold">Expires</th>
                                            <th className="text-left p-6 text-gray-400 font-semibold">Actions</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {filteredKeys.map((key, index) => (
                                            <tr key={index} className="border-b border-gray-800 hover:bg-gray-800/50 transition">
                                                <td className="p-6">
                                                    <div>
                                                        <div className="font-semibold">{key.productName}</div>
                                                        <div className="text-sm text-gray-400">{key.game}</div>
                                                    </div>
                                                </td>
                                                <td className="p-6">
                                                    <div className="flex items-center gap-2">
                                                        <code className="bg-gray-900 px-3 py-1 rounded font-mono text-sm">
                                                            {key.licenseKey}
                                                        </code>
                                                        <button
                                                            onClick={() => copyKey(key.licenseKey)}
                                                            className="p-1.5 bg-gray-700 hover:bg-gray-600 rounded transition"
                                                            title="Copy key"
                                                        >
                                                            {copiedKey === key.licenseKey ? (
                                                                <CheckCircle className="w-4 h-4 text-green-400" />
                                                            ) : (
                                                                <Copy className="w-4 h-4" />
                                                            )}
                                                        </button>
                                                    </div>
                                                </td>
                                                <td className="p-6">
                                                    <span className="px-3 py-1 bg-blue-500/20 text-blue-400 rounded-full text-xs font-semibold">
                                                        {key.keyType || 'Standard'}
                                                    </span>
                                                </td>
                                                <td className="p-6">{getStatusBadge(key)}</td>
                                                <td className="p-6 text-gray-300">
                                                    {key.expiresAt ? formatDate(key.expiresAt) : 'Never'}
                                                </td>
                                                <td className="p-6">
                                                    <div className="flex gap-2">
                                                        <button
                                                            onClick={() => copyKey(key.licenseKey)}
                                                            className="p-2 bg-gray-700 hover:bg-gray-600 rounded-lg transition"
                                                            title="Copy key"
                                                        >
                                                            {copiedKey === key.licenseKey ? (
                                                                <CheckCircle className="w-4 h-4 text-green-400" />
                                                            ) : (
                                                                <Copy className="w-4 h-4" />
                                                            )}
                                                        </button>
                                                        <button
                                                            className="p-2 bg-blue-500/20 hover:bg-blue-500/30 text-blue-400 rounded-lg transition"
                                                            title="View details"
                                                        >
                                                            <Eye className="w-4 h-4" />
                                                        </button>
                                                        <Link
                                                            to={`/orders/${key.orderId}`}
                                                            className="p-2 bg-green-500/20 hover:bg-green-500/30 text-green-400 rounded-lg transition"
                                                            title="View order"
                                                        >
                                                            <ExternalLink className="w-4 h-4" />
                                                        </Link>
                                                    </div>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        )}
                    </div>

                    {/* Security Notice */}
                    <div className="mt-8 p-6 bg-gradient-to-r from-blue-900/20 to-green-900/20 border border-blue-500/30 rounded-xl">
                        <div className="flex items-start gap-4">
                            <Shield className="w-6 h-6 text-blue-400 flex-shrink-0 mt-0.5" />
                            <div>
                                <h3 className="font-bold text-lg mb-2">Security Notice</h3>
                                <p className="text-gray-300 mb-3">
                                    Your product keys are sensitive information. Please follow these security guidelines:
                                </p>
                                <ul className="text-gray-400 space-y-2 text-sm">
                                    <li className="flex items-start gap-2">
                                        <CheckCircle className="w-4 h-4 text-green-400 flex-shrink-0 mt-0.5" />
                                        <span>Never share your license keys publicly or with unauthorized users</span>
                                    </li>
                                    <li className="flex items-start gap-2">
                                        <CheckCircle className="w-4 h-4 text-green-400 flex-shrink-0 mt-0.5" />
                                        <span>Keys are tied to your account and cannot be transferred</span>
                                    </li>
                                    <li className="flex items-start gap-2">
                                        <CheckCircle className="w-4 h-4 text-green-400 flex-shrink-0 mt-0.5" />
                                        <span>Download and store your keys securely for backup purposes</span>
                                    </li>
                                    <li className="flex items-start gap-2">
                                        <CheckCircle className="w-4 h-4 text-green-400 flex-shrink-0 mt-0.5" />
                                        <span>Report any suspicious activity immediately to support</span>
                                    </li>
                                </ul>
                            </div>
                        </div>
                    </div>

                    {/* Footer */}
                    <footer className="mt-12 pt-8 border-t border-gray-800">
                        <div className="flex flex-col md:flex-row justify-between items-center">
                            <div className="flex items-center gap-2 mb-4 md:mb-0">
                                <Gamepad2 className="w-6 h-6 text-blue-500" />
                                <span className="font-bold">XCY BEAMER</span>
                            </div>
                            <div className="text-gray-400 text-sm">
                                <p>© {new Date().getFullYear()} XCY BEAMER. All rights reserved.</p>
                                <p className="mt-1">Need help? <Link to="/support" className="text-blue-400 hover:text-blue-300">Contact Support</Link></p>
                            </div>
                        </div>
                    </footer>
                </div>
            </div>
        </div>
    );
}
