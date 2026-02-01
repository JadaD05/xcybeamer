import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Gamepad2, Trash2, ShoppingCart, Tag, X } from 'lucide-react';
import { isAuthenticated, getUser, logout } from '../utils/auth';
import { useCart } from '../context/CartContext';
import { promoCodeAPI } from '../utils/api';
import axios from 'axios';

export default function Cart() {
    const navigate = useNavigate();
    const user = isAuthenticated() ? getUser() : null;
    const { cart, removeFromCart, clearCart, getCartTotal } = useCart();
    const [promoCode, setPromoCode] = useState('');
    const [appliedPromo, setAppliedPromo] = useState(null);
    const [promoError, setPromoError] = useState('');
    const [loading, setLoading] = useState(false);

    const handleLogout = () => {
        logout();
    };

    const subtotal = getCartTotal();
    const discount = appliedPromo ? parseFloat(appliedPromo.discount) : 0;
    const total = subtotal - discount;

    const handleApplyPromo = async () => {
        if (!promoCode.trim()) {
            setPromoError('Please enter a promo code');
            return;
        }

        setLoading(true);
        setPromoError('');

        try {
            const games = cart.map(item => item.game);

            const res = await promoCodeAPI.validate({
                code: promoCode,
                games: games,
                totalAmount: subtotal
            });

            setAppliedPromo(res.data.promoCode);
            setPromoError('');
        } catch (err) {
            setPromoError(err.response?.data?.message || 'Invalid promo code');
            setAppliedPromo(null);
        } finally {
            setLoading(false);
        }
    };

    const handleRemovePromo = () => {
        setAppliedPromo(null);
        setPromoCode('');
        setPromoError('');
    };

    const handleCheckout = async () => {
        if (!user?.token) {
            alert('Please sign in to checkout');
            navigate('/signin');
            return;
        }

        if (cart.length === 0) {
            alert('Your cart is empty');
            return;
        }

        try {
            setLoading(true);

            // Check stock for all items
            for (const item of cart) {
                const keyCheck = await axios.get(
                    `${import.meta.env.VITE_API_URL}/product-keys/${item._id}/available`
                );

                if (!keyCheck.data.success || keyCheck.data.availableKeys < 1) {
                    alert(`Sorry, ${item.name} is currently out of stock.`);
                    setLoading(false);
                    return;
                }
            }

            const subtotal = getCartTotal(); // already in dollars
            const discount = appliedPromo ? parseFloat(appliedPromo.discount) : 0;
            const total = subtotal - discount;

            // Prepare payload
            const payload = {
                items: cart.map(item => {
                    // Base price
                    let itemPrice = parseFloat(item.price);

                    // Apply promo if exists
                    if (appliedPromo) {
                        if (appliedPromo.discountType === 'percentage') {
                            itemPrice = itemPrice * (1 - appliedPromo.discountValue / 100);
                        } else if (appliedPromo.discountType === 'fixed') {
                            // Distribute fixed discount proportionally across items
                            const totalBeforeDiscount = subtotal;
                            const itemShare = itemPrice / totalBeforeDiscount;
                            itemPrice = itemPrice - itemShare * appliedPromo.discountValue;
                        }
                    }

                    return {
                        productId: item._id,
                        name: item.name,
                        game: item.game,
                        price: parseFloat(itemPrice.toFixed(2)), // dollars
                        quantity: item.quantity || 1,
                        image: typeof item.image === 'string' ? item.image : ''
                    };
                }),
                subtotal: subtotal,
                discount: discount,
                total: total,
                userEmail: user.email,
                promoCode: appliedPromo ? appliedPromo.code : null
            };

            console.log(payload)

            const res = await axios.post(
                `${import.meta.env.VITE_API_URL}/payments/create-session`,
                payload,
                {
                    headers: {
                        'Content-Type': 'application/json',
                        Authorization: `Bearer ${user.token}`
                    }
                }
            );

            const data = res.data;

            if (!data.success) {
                alert(data.message || 'Failed to start checkout');
                setLoading(false);
                return;
            }

            // Clear cart and redirect to Stripe
            clearCart();

            // Open in a new tab - DEV ONLY
            window.open(data.url, '_blank');

            // PRODUCTION ONLY
            // window.location.href = data.url;

        } catch (err) {
            console.error('Checkout error:', err);
            alert(err.response?.data?.message || err.message || 'Error starting checkout.');
            setLoading(false);
        }
    };

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
                            <Link to="/cart" className="text-blue-400">Cart</Link>
                        </div>

                        <div className="hidden md:block">
                            {user ? (
                                <div className="flex items-center gap-4">
                                    <span className="text-gray-300">Welcome, <span className="font-semibold text-blue-400">{user.username}</span>!</span>
                                    <button
                                        onClick={handleLogout}
                                        className="bg-gradient-to-r from-red-600 to-red-700 px-6 py-2 rounded-lg font-semibold hover:from-red-700 hover:to-red-800 transition"
                                    >
                                        Logout
                                    </button>
                                </div>
                            ) : (
                                <div className="flex items-center gap-3">
                                    <Link to="/signin" className="text-blue-400 hover:text-blue-300 font-semibold transition">
                                        Sign In
                                    </Link>
                                    <Link to="/signup" className="bg-gradient-to-r from-blue-600 to-green-600 px-6 py-2 rounded-lg font-semibold hover:from-blue-700 hover:to-green-700 transition">
                                        Get Started
                                    </Link>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </nav>

            {/* Cart Content */}
            <div className="pt-24 px-8 pb-20">
                <div className="max-w-7xl mx-auto">
                    <h1 className="text-4xl font-bold mb-8 bg-gradient-to-r from-blue-400 via-green-500 to-blue-600 bg-clip-text text-transparent">
                        Shopping Cart
                    </h1>

                    {cart.length === 0 ? (
                        <div className="text-center py-20">
                            <ShoppingCart className="w-24 h-24 text-gray-600 mx-auto mb-4" />
                            <h2 className="text-2xl font-bold mb-2">Your cart is empty</h2>
                            <p className="text-gray-400 mb-6">Add some products to get started!</p>
                            <Link
                                to="/products"
                                className="inline-block bg-gradient-to-r from-blue-600 to-green-600 px-8 py-3 rounded-lg font-semibold hover:from-blue-700 hover:to-green-700 transition"
                            >
                                Browse Products
                            </Link>
                        </div>
                    ) : (
                        <div className="grid lg:grid-cols-3 gap-8">
                            {/* Cart Items */}
                            <div className="lg:col-span-2 space-y-4">
                                {cart.map((item) => (
                                    <div
                                        key={item._id}
                                        className="bg-gradient-to-br from-gray-900 to-gray-800 rounded-xl border border-gray-700 p-6 flex items-center gap-6"
                                    >
                                        {/* Product Image */}
                                        <div className="flex-shrink-0 w-24 h-24 bg-gradient-to-br from-blue-900/30 to-green-900/30 rounded-lg flex items-center justify-center">
                                            {typeof item.image === "string" && (item.image.startsWith("http") || item.image.endsWith(".jpg") || item.image.endsWith(".png")) ? (
                                                <img
                                                    src={item.image}
                                                    alt={item.name}
                                                    className="w-full h-full object-cover rounded-lg"
                                                />
                                            ) : (
                                                <div className="text-5xl">{item.image}</div>
                                            )}
                                        </div>

                                        {/* Product Info */}
                                        <div className="flex-1">
                                            <h3 className="text-xl font-bold mb-1">{item.name}</h3>
                                            <p className="text-gray-400 text-sm mb-2">{item.game}</p>
                                            <span className="bg-blue-500/20 text-blue-300 px-2 py-1 rounded text-xs font-semibold">
                                                {item.category}
                                            </span>
                                        </div>

                                        {/* Price */}
                                        <div className="text-right">
                                            <p className="text-2xl font-bold text-green-400">${item.price}</p>
                                        </div>

                                        {/* Remove Button */}
                                        <button
                                            onClick={() => removeFromCart(item._id)}
                                            className="text-red-500 hover:text-red-400 transition"
                                        >
                                            <Trash2 className="w-5 h-5" />
                                        </button>
                                    </div>
                                ))}
                            </div>

                            {/* Order Summary */}
                            <div className="lg:col-span-1">
                                <div className="bg-gradient-to-br from-gray-900 to-gray-800 rounded-xl border border-gray-700 p-6 sticky top-24">
                                    <h2 className="text-2xl font-bold mb-6">Order Summary</h2>

                                    {/* Promo Code */}
                                    <div className="mb-6">
                                        <label className="block text-sm font-medium mb-2">Promo Code</label>
                                        {appliedPromo ? (
                                            <div className="bg-green-500/20 border border-green-500/30 rounded-lg p-3 flex items-center justify-between">
                                                <div className="flex items-center gap-2">
                                                    <Tag className="w-4 h-4 text-green-400" />
                                                    <span className="text-green-400 font-semibold">{appliedPromo.code}</span>
                                                </div>
                                                <button
                                                    onClick={handleRemovePromo}
                                                    className="text-red-400 hover:text-red-300"
                                                >
                                                    <X className="w-4 h-4" />
                                                </button>
                                            </div>
                                        ) : (
                                            <div>
                                                <div className="flex gap-2">
                                                    <input
                                                        type="text"
                                                        placeholder="Enter code"
                                                        value={promoCode}
                                                        onChange={(e) => setPromoCode(e.target.value.toUpperCase())}
                                                        className="flex-1 bg-gray-800 border border-gray-700 rounded-lg px-4 py-2 text-white uppercase focus:outline-none focus:border-blue-500"
                                                    />
                                                    <button
                                                        onClick={handleApplyPromo}
                                                        disabled={loading}
                                                        className="bg-blue-600 hover:bg-blue-700 px-4 py-2 rounded-lg font-semibold transition disabled:opacity-50"
                                                    >
                                                        Apply
                                                    </button>
                                                </div>
                                                {promoError && (
                                                    <p className="text-red-400 text-sm mt-2">{promoError}</p>
                                                )}
                                            </div>
                                        )}
                                    </div>

                                    {/* Price Breakdown */}
                                    <div className="space-y-3 mb-6 pb-6 border-b border-gray-700">
                                        <div className="flex justify-between text-gray-400">
                                            <span>Subtotal</span>
                                            <span>${subtotal.toFixed(2)}</span>
                                        </div>
                                        {appliedPromo && (
                                            <div className="flex justify-between text-green-400">
                                                <span>Discount ({appliedPromo.discountType === 'percentage' ? `${appliedPromo.discountValue}%` : `$${appliedPromo.discountValue}`})</span>
                                                <span>-${discount.toFixed(2)}</span>
                                            </div>
                                        )}
                                    </div>

                                    {/* Total */}
                                    <div className="flex justify-between text-2xl font-bold mb-6">
                                        <span>Total</span>
                                        <span className="text-green-400">${total.toFixed(2)}</span>
                                    </div>

                                    {/* Checkout Button */}
                                    <button
                                        onClick={handleCheckout}
                                        disabled={loading}
                                        className="w-full bg-gradient-to-r from-blue-600 to-green-600 px-6 py-4 rounded-lg font-bold text-lg hover:from-blue-700 hover:to-green-700 transition disabled:opacity-50 disabled:cursor-not-allowed"
                                    >
                                        {loading ? 'Processing...' : 'Proceed to Checkout'}
                                    </button>

                                    <p className="text-xs text-gray-400 text-center mt-4">
                                        Secure checkout powered by Stripe
                                    </p>
                                </div>
                            </div>
                        </div>
                    )}
                </div>
            </div>

            {/* Footer */}
            <footer className="bg-gray-900 border-t border-gray-800 py-12 px-4">
                <div className="max-w-7xl mx-auto text-center">
                    <div className="flex items-center justify-center space-x-2 mb-4">
                        <Gamepad2 className="w-8 h-8 text-blue-500" />
                        <span className="text-xl font-bold">XCY BEAMER</span>
                    </div>
                    <p className="text-gray-400 mb-4">Elevating gaming experiences worldwide</p>
                    <p className="text-gray-500 text-sm">© 2026 XCY BEAMER. All rights reserved.</p>
                </div>
            </footer>
        </div>
    );
}