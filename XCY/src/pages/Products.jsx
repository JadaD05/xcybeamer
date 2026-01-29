import React, { useState, useEffect } from 'react';
import { Gamepad2, Shield, Zap, Users, Star, Search, Filter, ChevronRight, Check } from 'lucide-react';
import { Link } from 'react-router-dom';
import { isAuthenticated, getUser, logout } from '../utils/auth';
import { handleCheckout } from '../utils/stripe';
import axios from 'axios';

export default function Products() {
    const [selectedGame, setSelectedGame] = useState(null);
    const [products, setProducts] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const user = isAuthenticated() ? getUser() : null;
    const [categories, setCategories] = useState([]);

    // Fetch products from database
    useEffect(() => {
        const fetchProducts = async () => {
            try {
                setLoading(true);
                const res = await axios.get(`${import.meta.env.VITE_API_URL}/products/get`);
                setProducts(res.data.products);
                setError('');
            } catch (err) {
                console.error('Failed to fetch products', err);
                setError('Failed to load products');
            } finally {
                setLoading(false);
            }
        };

        fetchProducts();
    }, []);

    // Fetch categories
    useEffect(() => {
        const fetchCategories = async () => {
            try {
                const res = await axios.get(`${import.meta.env.VITE_API_URL}/categories/get`);
                setCategories(res.data.categories || []);
            } catch (err) {
                console.error('Failed to fetch categories', err);
            }
        };

        fetchCategories();
    }, []);

    const gameProducts = selectedGame
        ? products.filter(p => p.game === selectedGame)
        : [];

    const handleLogout = () => {
        logout();
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
                            <Link to="/products" className="text-blue-400">Products</Link>
                            <Link to="/support" className="hover:text-blue-400 transition">Support</Link>
                            <Link to="/client" className="hover:text-blue-400 transition">Client</Link>
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
                                    <Link
                                        to="/signin"
                                        className="text-blue-400 hover:text-blue-300 font-semibold transition"
                                    >
                                        Sign In
                                    </Link>
                                    <Link
                                        to="/signup"
                                        className="bg-gradient-to-r from-blue-600 to-green-600 px-6 py-2 rounded-lg font-semibold hover:from-blue-700 hover:to-green-700 transition"
                                    >
                                        Get Started
                                    </Link>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </nav>

            {/* Hero Section */}
            <section className="pt-32 pb-12 px-4 relative overflow-hidden">
                <div className="absolute inset-0 bg-gradient-to-br from-blue-900/20 to-green-900/20"></div>
                <div className="absolute inset-0" style={{
                    backgroundImage: 'radial-gradient(circle at 2px 2px, rgba(147, 51, 234, 0.1) 1px, transparent 0)',
                    backgroundSize: '40px 40px'
                }}></div>

                <div className="max-w-7xl mx-auto text-center relative z-10">
                    <h1 className="text-4xl md:text-6xl font-bold mb-4 bg-gradient-to-r from-blue-400 via-green-500 to-blue-600 bg-clip-text text-transparent">
                        Our Products
                    </h1>
                    <p className="text-lg md:text-xl text-gray-300 mb-8 max-w-2xl mx-auto">
                        Premium gaming enhancements for your favorite games
                    </p>
                </div>
            </section>

            {/* GAME SELECT */}
            {!selectedGame && (
                <section className="px-4 pb-20">
                    <div className="max-w-7xl mx-auto">
                        {loading ? (
                            <p className="text-center py-20 text-gray-400">Loading games...</p>
                        ) : error ? (
                            <p className="text-center py-20 text-red-500">{error}</p>
                        ) : categories.length === 0 ? (
                            <p className="text-center py-20 text-gray-400">No categories available</p>
                        ) : (
                            <div className="grid md:grid-cols-3 lg:grid-cols-4 gap-6">
                                {categories.map(category => (
                                    <button
                                        key={category._id}
                                        onClick={() => setSelectedGame(category.game)}
                                        className="bg-gray-800/50 border border-gray-700 hover:border-blue-500 p-6 rounded-xl text-left transition group"
                                    >
                                        {category.image && (
                                            <div className="text-5xl mb-3 group-hover:scale-110 transition-transform">
                                                {category.image}
                                            </div>
                                        )}
                                        <h3 className="text-xl font-bold">{category.game}</h3>
                                        <p className="text-gray-400 text-sm mt-1">
                                            {category.name}
                                        </p>
                                    </button>
                                ))}
                            </div>
                        )}
                    </div>
                </section>
            )}

            {/* Products Grid */}
            {selectedGame && (
                <section className="px-4 pb-20">
                    <div className="max-w-7xl mx-auto">
                        {loading ? (
                            <div className="text-center py-20">
                                <div className="text-6xl mb-4">⏳</div>
                                <p className="text-gray-400">Loading products...</p>
                            </div>
                        ) : error ? (
                            <div className="text-center py-20">
                                <div className="text-6xl mb-4">❌</div>
                                <h3 className="text-2xl font-bold mb-2">Error Loading Products</h3>
                                <p className="text-gray-400">{error}</p>
                            </div>
                        ) : (
                            <div className="grid md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                                {gameProducts.map((product) => (
                                    <div
                                        key={product._id}
                                        className="bg-gradient-to-br from-gray-900 to-gray-800 rounded-xl border border-gray-700 hover:border-blue-500 transition-all duration-300 overflow-hidden group"
                                    >
                                        {/* Product Image/Icon */}
                                        <div className="bg-gradient-to-br from-blue-900/30 to-green-900/30 p-4 text-center">
                                            {typeof product.image === "string" && (product.image.startsWith("http") || product.image.endsWith(".jpg") || product.image.endsWith(".png")) ? (
                                                <img
                                                    src={product.image}
                                                    alt={product.name}
                                                    className="w-full h-38 object-cover rounded-lg mb-2"
                                                />
                                            ) : (
                                                <div className="text-6xl mb-2">{product.image}</div>
                                            )}

                                            <div className="flex items-center justify-center gap-1 text-green-400 text-sm">
                                                <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
                                                {product.status}
                                            </div>
                                        </div>

                                        {/* Product Info */}
                                        <div className="p-6">
                                            <div className="flex items-start justify-between mb-2">
                                                <div>
                                                    <h3 className="text-xl font-bold mb-1">{product.name}</h3>
                                                    <p className="text-gray-400 text-sm">{product.game}</p>
                                                </div>
                                                <span className="bg-blue-500/20 text-blue-300 px-2 py-1 rounded text-xs font-semibold">
                                                    {product.category}
                                                </span>
                                            </div>

                                            {/* Rating & Users */}
                                            <div className="flex items-center gap-4 mb-4 text-sm">
                                                <div className="flex items-center gap-1 text-yellow-400">
                                                    <Star className="w-4 h-4 fill-current" />
                                                    <span className="font-semibold">{product.rating}</span>
                                                </div>
                                                <div className="flex items-center gap-1 text-gray-400">
                                                    <Users className="w-4 h-4" />
                                                    <span>{product.users} users</span>
                                                </div>
                                            </div>

                                            {/* Features */}
                                            <div className="mb-4">
                                                <p className="text-xs text-gray-400 mb-2 font-semibold">FEATURES</p>
                                                <div className="flex flex-wrap gap-1">
                                                    {product.features.slice(0, 3).map((feature, idx) => (
                                                        <span
                                                            key={idx}
                                                            className="bg-gray-800 text-gray-300 px-2 py-1 rounded text-xs"
                                                        >
                                                            {feature}
                                                        </span>
                                                    ))}
                                                    {product.features.length > 3 && (
                                                        <span className="bg-gray-800 text-gray-400 px-2 py-1 rounded text-xs">
                                                            +{product.features.length - 3} more
                                                        </span>
                                                    )}
                                                </div>
                                            </div>

                                            {/* Price & Button */}
                                            <div className="flex items-center justify-between pt-4 border-t border-gray-700">
                                                <div>
                                                    <span className="text-2xl font-bold">${product.price}</span>
                                                </div>

                                                {/* Buy Button */}
                                                <button
                                                    onClick={async () => {
                                                        if (!user?.token) {
                                                            alert('Please sign in to purchase');
                                                            return;
                                                        }

                                                        try {
                                                            // Check if keys are available first
                                                            const keyCheck = await axios.get(
                                                                `${import.meta.env.VITE_API_URL}/product-keys/${product._id}/available`
                                                            );

                                                            if (!keyCheck.data.success || keyCheck.data.availableKeys < 1) {
                                                                alert('Sorry, this product is currently out of stock.');
                                                                return;
                                                            }

                                                            // Prepare payload
                                                            const payload = {
                                                                items: [
                                                                    {
                                                                        productId: product._id,
                                                                        name: product.name,
                                                                        price: parseFloat(product.price),
                                                                        quantity: 1,
                                                                        image: typeof product.image === 'string' ? product.image : ''
                                                                    }
                                                                ],
                                                                userEmail: user.email
                                                            };

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
                                                                return;
                                                            }

                                                            // Redirect to Stripe checkout
                                                            window.location.href = data.url;

                                                        } catch (err) {
                                                            console.error('Buy button error:', err);
                                                            alert(err.response?.data?.message || err.message || 'Error starting checkout.');
                                                        }
                                                    }}
                                                    className="bg-gradient-to-r from-blue-600 to-green-600 px-4 py-2 rounded-lg font-semibold hover:from-blue-700 hover:to-green-700 transition flex items-center gap-2 group-hover:gap-3"
                                                >
                                                    Buy <ChevronRight className="w-4 h-4" />
                                                </button>
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}

                        {/* No Results */}
                        {!loading && !error && selectedGame.length === 0 && (
                            <div className="text-center py-20">
                                <div className="text-6xl mb-4">🔍</div>
                                <h3 className="text-2xl font-bold mb-2">No products found</h3>
                                <p className="text-gray-400">Try adjusting your search or filter criteria</p>
                            </div>
                        )}
                    </div>
                </section>
            )}

            {/* Trust Badges */}
            <section className="px-4 pb-20">
                <div className="max-w-7xl mx-auto">
                    <div className="bg-gradient-to-br from-gray-900 to-gray-800 rounded-2xl border border-gray-700 p-8">
                        <h2 className="text-2xl font-bold text-center mb-8">Why Choose Our Products?</h2>
                        <div className="grid md:grid-cols-3 gap-6">
                            <div className="text-center">
                                <Zap className="w-10 h-10 text-blue-500 mx-auto mb-3" />
                                <h3 className="font-semibold mb-1">Fast Support</h3>
                                <p className="text-sm text-gray-400">24/7 customer assistance</p>
                            </div>
                            <div className="text-center">
                                <Users className="w-10 h-10 text-blue-500 mx-auto mb-3" />
                                <h3 className="font-semibold mb-1">Active Community</h3>
                                <p className="text-sm text-gray-400">Join thousands of users</p>
                            </div>
                            <div className="text-center">
                                <Check className="w-10 h-10 text-blue-500 mx-auto mb-3" />
                                <h3 className="font-semibold mb-1">Easy Setup</h3>
                                <p className="text-sm text-gray-400">Get started in minutes</p>
                            </div>
                        </div>
                    </div>
                </div>
            </section>

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
                        <Link to="/contact" className="hover:text-blue-400 transition">Contact</Link>
                    </div>
                    <p className="text-gray-500 mt-6 text-sm">© 2026 XCY BEAMER. All rights reserved.</p>
                </div>
            </footer>
        </div>
    );
}