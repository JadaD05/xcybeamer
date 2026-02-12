import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
    ShoppingBag, Calendar, DollarSign, CheckCircle,
    Clock, XCircle, Package, Eye, Download,
    Gamepad2, ChevronLeft, AlertCircle
} from 'lucide-react';
import { isAuthenticated, getUser, logout } from '../utils/auth';
import { orderAPI } from '../utils/api';

export default function OrdersPage() {
    const [user, setUser] = useState(null);
    const [orders, setOrders] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');

    useEffect(() => {
        if (!isAuthenticated()) {
            window.location.href = '/signin';
            return;
        }
        setUser(getUser());
        fetchOrders();
    }, []);

    const fetchOrders = async () => {
        try {
            setLoading(true);
            setError('');
            const res = await orderAPI.getMyOrders();
            if (res.data.success) {
                setOrders(res.data.orders || []);
            }
        } catch (err) {
            console.error('Failed to fetch orders:', err);
            setError('Failed to load orders. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    const handleLogout = () => {
        logout();
        window.location.href = '/signin';
    };

    const formatDate = (dateString) => {
        return new Date(dateString).toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'short',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        });
    };

    const getStatusBadge = (status) => {
        const statusConfig = {
            'completed': { color: 'bg-green-500/20 text-green-400', icon: <CheckCircle className="w-4 h-4" /> },
            'pending': { color: 'bg-yellow-500/20 text-yellow-400', icon: <Clock className="w-4 h-4" /> },
            'failed': { color: 'bg-red-500/20 text-red-400', icon: <XCircle className="w-4 h-4" /> },
            'processing': { color: 'bg-blue-500/20 text-blue-400', icon: <Package className="w-4 h-4" /> }
        };

        const config = statusConfig[status] || statusConfig.pending;
        return (
            <span className={`px-3 py-1 rounded-full text-xs font-semibold flex items-center gap-1 ${config.color}`}>
                {config.icon}
                {status.charAt(0).toUpperCase() + status.slice(1)}
            </span>
        );
    };

    if (loading) {
        return (
            <div className="min-h-screen w-full bg-gray-950 text-white flex items-center justify-center">
                <div className="text-center">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto"></div>
                    <p className="mt-4 text-gray-400">Loading orders...</p>
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
                            <Link to="/orders" className="text-blue-400">Orders</Link>
                            <Link to="/keys" className="hover:text-blue-400 transition">My Keys</Link>
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
                                    My Orders
                                </h1>
                                <p className="text-gray-400">View your purchase history and order status</p>
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

                    {/* Orders List */}
                    <div className="bg-gradient-to-br from-gray-900 to-gray-800 rounded-2xl border border-gray-700 overflow-hidden">
                        {orders.length === 0 ? (
                            <div className="p-12 text-center">
                                <ShoppingBag className="w-16 h-16 text-gray-600 mx-auto mb-4" />
                                <h3 className="text-xl font-bold mb-2">No Orders Yet</h3>
                                <p className="text-gray-400 mb-6">You haven't made any purchases yet.</p>
                                <Link to="/products" className="bg-gradient-to-r from-blue-600 to-green-600 px-6 py-3 rounded-lg font-semibold hover:from-blue-700 hover:to-green-700 transition inline-flex items-center gap-2">
                                    <ShoppingBag className="w-5 h-5" />
                                    Browse Products
                                </Link>
                            </div>
                        ) : (
                            <div className="overflow-x-auto">
                                <table className="w-full">
                                    <thead>
                                        <tr className="border-b border-gray-700">
                                            <th className="text-left p-6 text-gray-400 font-semibold">Order ID</th>
                                            <th className="text-left p-6 text-gray-400 font-semibold">Product</th>
                                            <th className="text-left p-6 text-gray-400 font-semibold">Date</th>
                                            <th className="text-left p-6 text-gray-400 font-semibold">Amount</th>
                                            <th className="text-left p-6 text-gray-400 font-semibold">Status</th>
                                            <th className="text-left p-6 text-gray-400 font-semibold">Actions</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {orders.map((order) => (
                                            <tr key={order._id} className="border-b border-gray-800 hover:bg-gray-800/50 transition">
                                                <td className="p-6">
                                                    <div className="font-mono text-sm text-gray-300">{order._id.substring(0, 8)}...</div>
                                                </td>
                                                <td className="p-6">
                                                    <div className="flex items-center gap-3">
                                                        {order.productImage && (
                                                            <img src={order.productImage} alt={order.productName} className="w-10 h-10 rounded-lg" />
                                                        )}
                                                        <div>
                                                            <div className="font-semibold">{order.productName}</div>
                                                            <div className="text-sm text-gray-400">{order.keyType}</div>
                                                        </div>
                                                    </div>
                                                </td>
                                                <td className="p-6 text-gray-300">{formatDate(order.createdAt)}</td>
                                                <td className="p-6">
                                                    <div className="flex items-center gap-1">
                                                        <DollarSign className="w-4 h-4 text-green-400" />
                                                        <span className="font-bold">{order.amount?.toFixed(2) || '0.00'}</span>
                                                    </div>
                                                </td>
                                                <td className="p-6">{getStatusBadge(order.status)}</td>
                                                <td className="p-6">
                                                    <div className="flex gap-2">
                                                        <button className="p-2 bg-gray-700 hover:bg-gray-600 rounded-lg transition">
                                                            <Eye className="w-4 h-4" />
                                                        </button>
                                                        <button className="p-2 bg-blue-500/20 hover:bg-blue-500/30 text-blue-400 rounded-lg transition">
                                                            <Download className="w-4 h-4" />
                                                        </button>
                                                    </div>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        )}
                    </div>

                    {/* Stats */}
                    {orders.length > 0 && (
                        <div className="grid md:grid-cols-3 gap-6 mt-8">
                            <div className="bg-gray-800/50 rounded-xl p-6">
                                <div className="flex items-center justify-between">
                                    <div>
                                        <p className="text-gray-400 text-sm">Total Orders</p>
                                        <p className="text-3xl font-bold">{orders.length}</p>
                                    </div>
                                    <ShoppingBag className="w-10 h-10 text-blue-400" />
                                </div>
                            </div>
                            <div className="bg-gray-800/50 rounded-xl p-6">
                                <div className="flex items-center justify-between">
                                    <div>
                                        <p className="text-gray-400 text-sm">Total Spent</p>
                                        <p className="text-3xl font-bold">
                                            ${orders.reduce((sum, order) => sum + (order.amount || 0), 0).toFixed(2)}
                                        </p>
                                    </div>
                                    <DollarSign className="w-10 h-10 text-green-400" />
                                </div>
                            </div>
                            <div className="bg-gray-800/50 rounded-xl p-6">
                                <div className="flex items-center justify-between">
                                    <div>
                                        <p className="text-gray-400 text-sm">Completed Orders</p>
                                        <p className="text-3xl font-bold">
                                            {orders.filter(o => o.status === 'completed').length}
                                        </p>
                                    </div>
                                    <CheckCircle className="w-10 h-10 text-green-400" />
                                </div>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}