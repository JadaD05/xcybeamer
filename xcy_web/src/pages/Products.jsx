import React, { useState, useEffect } from 'react';
import { Gamepad2, Shield, Zap, Users, Star, Search, Filter, ChevronRight, Check, ShoppingCart, MessageCircle } from 'lucide-react';
import { Link } from 'react-router-dom';
import { isAuthenticated, getUser, logout } from '../utils/auth';
import { useCart } from '../context/CartContext';
import axios from 'axios';

const hasRole = (user, role) =>
    Array.isArray(user?.roles) && user.roles.includes(role);

const isAdminUser = (user) =>
    hasRole(user, "admin") || hasRole(user, "dev");

export default function Products() {
    const [selectedGame, setSelectedGame] = useState(null);
    const [products, setProducts] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [user, setUser] = useState(null);
    const [categories, setCategories] = useState([]);
    const { addToCart, getCartCount } = useCart();
    const [keyAvailability, setKeyAvailability] = useState({});
    const [selectedKeyTypes, setSelectedKeyTypes] = useState({});

    useEffect(() => {
        if (isAuthenticated()) {
            const u = getUser();
            setUser({
                ...u,
                isAdmin: isAdminUser(u),
            });
        }
    }, []);

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

    useEffect(() => {
        const fetchKeyAvailability = async () => {
            if (!selectedGame) return;

            const filtered = products.filter(p => p.game === selectedGame);
            const availability = {};

            await Promise.all(filtered.map(async (product) => {
                try {
                    const res = await axios.get(`${import.meta.env.VITE_API_URL}/product-keys/${product._id}/stats`);
                    availability[product._id] = res.data.stats?.byType || { '1day': { available: 0 }, '1week': { available: 0 } };
                } catch (err) {
                    availability[product._id] = { '1day': { available: 0 }, '1week': { available: 0 } };
                }
            }));

            setKeyAvailability(availability);
        };

        fetchKeyAvailability();
    }, [selectedGame, products]);

    const handleLogout = () => {
        logout();
    };

    const handleAddToCart = (e, product) => {
        e.preventDefault();

        // 🚫 Block anything that isn't Undetected
        if (product.status !== "Undetected") {
            alert(`❌ This product cannot be purchased while status is "${product.status}".`);
            return;
        }

        const keyType = selectedKeyTypes[product._id] || '1day';

        const price =
            keyType === '1day' && product.pricing?.['1day'] ? product.pricing['1day'] :
                keyType === '1week' && product.pricing?.['1week'] ? product.pricing['1week'] :
                    product.price;

        const result = addToCart({
            ...product,
            productId: product._id,
            keyType,
            price
        });

        if (result.success) {
            alert('✅ Added to cart!');
        } else {
            alert(result.message);
        }
    };

    const handleBackToGames = () => {
        setSelectedGame(null);
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
                            <Link
                                to={user?.isAdmin ? "/admin" : "/client"}
                                className="hover:text-blue-400 transition"
                            >
                                {user?.isAdmin ? "Admin" : "Client"}
                            </Link>
                        </div>

                        <div className="hidden md:flex items-center gap-4">
                            {/* Cart Icon */}
                            <Link to="/cart" className="relative">
                                <ShoppingCart className="w-6 h-6 text-gray-300 hover:text-blue-400 transition" />
                                {getCartCount() > 0 && (
                                    <span className="absolute -top-2 -right-2 bg-blue-500 text-white text-xs font-bold rounded-full w-5 h-5 flex items-center justify-center">
                                        {getCartCount()}
                                    </span>
                                )}
                            </Link>

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
                                        className="relative bg-gray-800/50 border border-gray-700 hover:border-blue-500 rounded-xl overflow-hidden transition group"
                                    >
                                        {/* Image dictates the card size */}
                                        {category.image && (
                                            category.image.startsWith('http') || category.image.endsWith('.jpg') || category.image.endsWith('.png') ? (
                                                <img
                                                    src={category.image}
                                                    className="w-full h-auto brightness-50 group-hover:brightness-75 transition"
                                                />
                                            ) : (
                                                <div className="flex items-center justify-center text-8xl py-16 opacity-30 group-hover:opacity-40 transition">
                                                    {category.image}
                                                </div>
                                            )
                                        )}

                                        {/* Gradient Overlay */}
                                        <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/50 to-transparent pointer-events-none" />

                                        {/* Text Content */}
                                        <div className="absolute bottom-0 left-0 right-0 p-6 text-left">
                                            <h3 className="text-2xl font-bold text-white mb-1 drop-shadow-lg">{category.game}</h3>
                                            <p className="text-gray-200 text-sm drop-shadow-lg">
                                                {category.name}
                                            </p>
                                        </div>
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

                        {/* Back Button — GOES HERE */}
                        <button
                            onClick={handleBackToGames}
                            className="mb-6 inline-flex items-center gap-2 text-blue-400 hover:text-blue-300 font-semibold transition"
                        >
                            ← Back to Games
                        </button>
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
                                        <Link to={`/products/${product._id}`}>
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
                                        </Link>

                                        {/* Product Info */}
                                        <div className="p-6">
                                            <Link to={`/products/${product._id}`}>
                                                <div className="flex items-start justify-between mb-2">
                                                    <div>
                                                        <h3 className="text-xl font-bold mb-1">{product.name}</h3>
                                                        <p className="text-gray-400 text-sm">{product.game}</p>
                                                    </div>
                                                    <span className="bg-blue-500/20 text-blue-300 px-2 py-1 rounded text-xs font-semibold">
                                                        {product.category}
                                                    </span>
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
                                            </Link>

                                            {/* Price & Buttons */}
                                            <div className="pt-4 border-t border-gray-700">
                                                <div className="flex items-center justify-between mb-3">
                                                    <span className="text-2xl font-bold">
                                                        ${(() => {
                                                            const type = selectedKeyTypes[product._id] || '1day';
                                                            if (type === '1day' && product.pricing?.['1day']) return product.pricing['1day'].toFixed(2);
                                                            if (type === '1week' && product.pricing?.['1week']) return product.pricing['1week'].toFixed(2);
                                                            return parseFloat(product.price).toFixed(2);
                                                        })()}
                                                    </span>
                                                    <span className="text-xs text-gray-500">
                                                        {(selectedKeyTypes[product._id] || '1day') === '1day' ? '1 Day' : '1 Week'}
                                                    </span>
                                                </div>

                                                {/* Key Type Selector */}
                                                <div className="flex gap-2 mb-3">
                                                    <button
                                                        onClick={(e) => {
                                                            e.preventDefault();
                                                            setSelectedKeyTypes(prev => ({ ...prev, [product._id]: '1day' }));
                                                        }}
                                                        className={`flex-1 py-1.5 rounded-lg text-xs font-semibold border transition ${(selectedKeyTypes[product._id] || '1day') === '1day'
                                                            ? 'border-orange-500 bg-orange-500/10 text-orange-400'
                                                            : 'border-gray-600 bg-gray-800 text-gray-300 hover:border-gray-500'
                                                            }`}
                                                    >
                                                        1 Day
                                                    </button>
                                                    <button
                                                        onClick={(e) => {
                                                            e.preventDefault();
                                                            setSelectedKeyTypes(prev => ({ ...prev, [product._id]: '1week' }));
                                                        }}
                                                        className={`flex-1 py-1.5 rounded-lg text-xs font-semibold border transition ${(selectedKeyTypes[product._id] || '1day') === '1week'
                                                            ? 'border-blue-500 bg-blue-500/10 text-blue-400'
                                                            : 'border-gray-600 bg-gray-800 text-gray-300 hover:border-gray-500'
                                                            }`}
                                                    >
                                                        1 Week
                                                    </button>
                                                    <button
                                                        onClick={(e) => {
                                                            e.preventDefault();
                                                            setSelectedKeyTypes(prev => ({ ...prev, [product._id]: '1month' }));
                                                        }}
                                                        className={`flex-1 py-1.5 rounded-lg text-xs font-semibold border transition ${(selectedKeyTypes[product._id] || '1day') === '1month'
                                                            ? 'border-green-500 bg-green-500/10 text-green-400'
                                                            : 'border-gray-600 bg-gray-800 text-gray-300 hover:border-gray-500'
                                                            }`}
                                                    >
                                                        1 Month
                                                    </button>
                                                </div>

                                                <div className="flex gap-2">
                                                    <Link
                                                        to={`/products/${product._id}`}
                                                        className="flex-1 bg-gray-700 hover:bg-gray-600 px-4 py-2 rounded-lg font-semibold transition text-center"
                                                    >
                                                        View
                                                    </Link>
                                                    <button
                                                        onClick={(e) => handleAddToCart(e, product)}
                                                        disabled={
                                                            product.status !== "Undetected" ||
                                                            (keyAvailability[product._id]?.[(selectedKeyTypes[product._id] || '1day')]?.available || 0) === 0
                                                        }
                                                        className="flex-1 bg-gradient-to-r from-blue-600 to-green-600 px-4 py-2 rounded-lg font-semibold hover:from-blue-700 hover:to-green-700 transition flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                                                    >
                                                        <ShoppingCart className="w-4 h-4" />
                                                        Add
                                                    </button>
                                                </div>
                                                {product.status !== "Undetected" ? (
                                                    <p className="text-xs text-red-400 mt-2">
                                                        Purchasing disabled while status is "{product.status}"
                                                    </p>
                                                ) : (
                                                    (keyAvailability[product._id]?.[(selectedKeyTypes[product._id] || '1day')]?.available || 0) === 0 && (
                                                        <p className="text-xs text-yellow-400 mt-2">
                                                            No keys available for this license type.
                                                        </p>
                                                    )
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}

                        {/* No Results */}
                        {!loading && !error && gameProducts.length === 0 && (
                            <div className="text-center py-20">
                                <div className="text-6xl mb-4">🔍</div>
                                <h3 className="text-2xl font-bold mb-2">No products found</h3>
                                <p className="text-gray-400">Try selecting a different game</p>
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