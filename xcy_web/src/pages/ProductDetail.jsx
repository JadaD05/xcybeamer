import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { Gamepad2, ChevronLeft, Check, Star, Users, Shield, ShoppingCart, MessageCircle } from 'lucide-react';
import { isAuthenticated, getUser, logout, isAdmin } from '../utils/auth';
import { useCart } from '../context/CartContext';
import { featureListAPI } from '../utils/api';
import axios from 'axios';

export default function ProductDetail() {
    const { id } = useParams();
    const [product, setProduct] = useState(null);
    const [featureList, setFeatureList] = useState(null);
    const [loading, setLoading] = useState(true);
    const [selectedKeyType, setSelectedKeyType] = useState('1day');
    const [keyAvailability, setKeyAvailability] = useState({});
    const user = isAuthenticated() ? getUser() : null;
    const { addToCart, getCartCount } = useCart();

    useEffect(() => {
        const fetchData = async () => {
            try {
                setLoading(true);

                // Fetch product
                const productRes = await axios.get(`${import.meta.env.VITE_API_URL}/products/get/${id}`);
                setProduct(productRes.data.product);

                // Fetch feature list
                const featureRes = await featureListAPI.get(id);
                if (featureRes.data.featureList) {
                    setFeatureList(featureRes.data.featureList);
                }

                // Fetch key availability
                const keysRes = await axios.get(`${import.meta.env.VITE_API_URL}/product-keys/${id}/stats`);
                setKeyAvailability(keysRes.data.stats?.byType || { '1day': { available: 0 }, '1week': { available: 0 }, '1month': { available: 0 } });
            } catch (err) {
                console.error('Failed to fetch product', err);
            } finally {
                setLoading(false);
            }
        };

        fetchData();
    }, [id]);

    const handleLogout = () => {
        logout();
    };

    const handleAddToCart = () => {
        if (product.status !== "Undetected") {
            alert(`❌ This product cannot be purchased while status is "${product.status}".`);
            return;
        }

        if ((keyAvailability[selectedKeyType]?.available || 0) === 0) {
            alert('⚠️ No keys available for this license type.');
            return;
        }

        const price = selectedKeyType === '1day' ? product.pricing?.['1day'] :
            selectedKeyType === '1week' ? product.pricing?.['1week'] :
                product.price;

        const result = addToCart({
            ...product,
            productId: product._id,
            keyType: selectedKeyType,
            price
        });

        if (result.success) {
            alert('✅ Added to cart!');
        } else {
            alert(result.message);
        }
    };

    if (loading) {
        return (
            <div className="min-h-screen w-full bg-gray-950 text-white flex items-center justify-center">
                <div className="text-center">
                    <div className="text-6xl mb-4">⏳</div>
                    <p className="text-gray-400">Loading product...</p>
                </div>
            </div>
        );
    }

    if (!product) {
        return (
            <div className="min-h-screen w-full bg-gray-950 text-white flex items-center justify-center">
                <div className="text-center">
                    <div className="text-6xl mb-4">❌</div>
                    <h2 className="text-2xl font-bold mb-4">Product Not Found</h2>
                    <Link to="/products" className="text-blue-400 hover:underline">
                        ← Back to Products
                    </Link>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen w-full bg-gray-950 text-white overflow-x-hidden">
            <style>{`
            .custom-scrollbar::-webkit-scrollbar { width: 8px; }
            .custom-scrollbar::-webkit-scrollbar-track { background: rgba(31,41,55,0.5); border-radius: 4px; }
            .custom-scrollbar::-webkit-scrollbar-thumb { background: rgba(59,130,246,0.5); border-radius: 4px; }
            .custom-scrollbar::-webkit-scrollbar-thumb:hover { background: rgba(59,130,246,0.7); }
            `}</style>

            {/* Navigation - UPDATED SECTION */}
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
                            <Link to={isAdmin() ? "/admin" : "/client"} className="hover:text-blue-400 transition">
                                {isAdmin() ? "Admin" : "Client"}
                            </Link>
                        </div>
                        <div className="hidden md:flex items-center gap-4">
                            {/* Cart Icon - ADDED HERE */}
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

            {/* Back Button */}
            <div className="pt-24 px-8 max-w-7xl mx-auto">
                <Link to="/products" className="inline-flex items-center gap-2 text-blue-400 hover:text-blue-300 mb-8">
                    <ChevronLeft className="w-5 h-5" />
                    Back to Products
                </Link>
            </div>

            {/* Product Detail */}
            <section className="px-8 pb-20">
                <div className="max-w-7xl mx-auto">
                    <div className="grid md:grid-cols-2 gap-12">
                        {/* Left Column - Product Image & Purchase */}
                        <div className="bg-gradient-to-br from-gray-900 to-gray-800 rounded-2xl border border-gray-700 p-8">
                            <div className="bg-gradient-to-br from-blue-900/30 to-green-900/30 rounded-xl p-8 text-center mb-6">
                                {typeof product.image === "string" && (product.image.startsWith("http") || product.image.endsWith(".jpg") || product.image.endsWith(".png")) ? (
                                    <img src={product.image} alt={product.name} className="w-full h-64 object-cover rounded-lg" />
                                ) : (
                                    <div className="text-9xl">{product.image}</div>
                                )}
                            </div>

                            {/* Status Badge */}
                            <div className="flex items-center justify-center gap-2 text-green-400 mb-6">
                                <div className="w-3 h-3 bg-green-400 rounded-full animate-pulse"></div>
                                <span className="font-semibold">{product.status}</span>
                            </div>

                            {/* Stats */}
                            <div className="grid grid-cols-2 gap-4 mb-6">
                                <div className="bg-gray-800/50 rounded-lg p-4 text-center">
                                    <div className="flex items-center justify-center gap-1 text-yellow-400 mb-1">
                                        <Star className="w-5 h-5 fill-current" />
                                        <span className="font-bold text-lg">{product.rating}</span>
                                    </div>
                                    <p className="text-xs text-gray-400">Rating</p>
                                </div>
                                <div className="bg-gray-800/50 rounded-lg p-4 text-center">
                                    <div className="flex items-center justify-center gap-1 text-blue-400 mb-1">
                                        <Users className="w-5 h-5" />
                                        <span className="font-bold text-lg">{product.users}</span>
                                    </div>
                                    <p className="text-xs text-gray-400">Active Users</p>
                                </div>
                            </div>

                            {/* Key Type Selector */}
                            <div className="flex gap-2 mb-4">
                                {['1day', '1week', '1month'].map(type => (
                                    <button
                                        key={type}
                                        onClick={() => setSelectedKeyType(type)}
                                        className={`flex-1 py-1.5 rounded-lg text-xs font-semibold border transition ${selectedKeyType === type ? 'border-blue-500 bg-blue-500/10 text-blue-400' : 'border-gray-600 bg-gray-800 text-gray-300 hover:border-gray-500'}`}
                                    >
                                        {type === '1day' ? '1 Day' : type === '1week' ? '1 Week' : '1month'}
                                    </button>
                                ))}
                            </div>

                            {/* Price & Buy Button */}
                            <div className="bg-gradient-to-r from-blue-600/20 to-green-600/20 border border-blue-500/30 rounded-xl p-6">
                                <div className="flex items-center justify-between mb-4">
                                    <span className="text-gray-400">Price</span>
                                    <span className="text-4xl font-bold text-white">
                                        ${selectedKeyType === '1day' ? product.pricing?.['1day']?.toFixed(2) :
                                            selectedKeyType === '1week' ? product.pricing?.['1week']?.toFixed(2) :
                                                product.price.toFixed(2)}
                                    </span>
                                </div>
                                <button
                                    onClick={handleAddToCart}
                                    className="w-full bg-gradient-to-r from-blue-600 to-green-600 px-8 py-4 rounded-lg font-bold text-lg hover:from-blue-700 hover:to-green-700 transition shadow-lg flex items-center justify-center gap-3 disabled:opacity-50 disabled:cursor-not-allowed"
                                    disabled={product.status !== "Undetected" || (keyAvailability[selectedKeyType]?.available || 0) === 0}
                                >
                                    <ShoppingCart className="w-6 h-6" />
                                    Add to Cart
                                </button>
                                {product.status !== "Undetected" ? (
                                    <p className="text-xs text-red-400 mt-2">Purchasing disabled while status is "{product.status}"</p>
                                ) : (keyAvailability[selectedKeyType]?.available || 0) === 0 && (
                                    <p className="text-xs text-yellow-400 mt-2">No keys available for this license type.</p>
                                )}
                                <Link to="/cart" className="block text-center text-sm text-blue-400 hover:text-blue-300 mt-3">
                                    View Cart →
                                </Link>
                            </div>
                        </div>

                        {/* Right Column - Product Info (KEEP ORIGINAL CONTENT) */}
                        <div>
                            {/* Header */}
                            <div className="mb-8">
                                <div className="flex items-center gap-3 mb-4">
                                    <span className="bg-blue-500/20 text-blue-300 px-3 py-1 rounded text-sm font-semibold">
                                        {product.category}
                                    </span>
                                    <span className="text-gray-400">{product.game}</span>
                                </div>
                                <h1 className="text-5xl font-bold mb-4 bg-gradient-to-r from-blue-400 to-green-500 bg-clip-text text-transparent">
                                    {product.name}
                                </h1>
                                <p className="text-gray-400 text-lg">
                                    Premium gaming enhancement for {product.game}
                                </p>
                            </div>

                            {/* Feature List */}
                            {featureList && featureList.sections.length > 0 ? (
                                <div className="bg-gradient-to-br from-gray-900 to-gray-800 rounded-2xl border border-gray-700 p-8">
                                    <div className="flex items-center gap-2 mb-6">
                                        <Shield className="w-6 h-6 text-blue-400" />
                                        <h2 className="text-2xl font-bold">Complete Feature List</h2>
                                    </div>

                                    <div className="max-h-[350px] overflow-y-auto pr-2 custom-scrollbar">
                                        <div className="space-y-6">
                                            {featureList.sections.map((section, idx) => (
                                                <div key={idx}>
                                                    <h3 className="text-xl font-bold text-blue-400 mb-3 sticky top-0 bg-gray-900/95 backdrop-blur-sm py-2 z-10">
                                                        {section.title}
                                                    </h3>
                                                    <div className="space-y-2">
                                                        {section.features.map((feature, fIdx) => (
                                                            <div key={fIdx} className="flex items-start gap-3 bg-gray-800/50 rounded-lg p-3 hover:bg-gray-800 transition">
                                                                <Check className="w-5 h-5 text-green-400 flex-shrink-0 mt-0.5" />
                                                                <span className="text-gray-200">{feature}</span>
                                                            </div>
                                                        ))}
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                </div>
                            ) : (
                                <div className="bg-gradient-to-br from-gray-900 to-gray-800 rounded-2xl border border-gray-700 p-8">
                                    <div className="flex items-center gap-2 mb-6">
                                        <Shield className="w-6 h-6 text-blue-400" />
                                        <h2 className="text-2xl font-bold">Features</h2>
                                    </div>

                                    <div className="space-y-3">
                                        {product.features && product.features.length > 0 ? (
                                            product.features.map((feature, idx) => (
                                                <div key={idx} className="flex items-start gap-3 bg-gray-800/50 rounded-lg p-4 hover:bg-gray-800 transition">
                                                    <Check className="w-5 h-5 text-green-400 flex-shrink-0 mt-0.5" />
                                                    <span className="text-gray-200">{feature}</span>
                                                </div>
                                            ))
                                        ) : (
                                            <p className="text-gray-400">No features listed</p>
                                        )}
                                    </div>
                                </div>
                            )}

                            {/* Trust Badges */}
                            <div className="grid grid-cols-3 gap-4 mt-8">
                                <div className="bg-gray-800/50 rounded-lg p-4 text-center">
                                    <Shield className="w-8 h-8 text-blue-400 mx-auto mb-2" />
                                    <p className="text-xs text-gray-400">Secure</p>
                                </div>
                                <div className="bg-gray-800/50 rounded-lg p-4 text-center">
                                    <Check className="w-8 h-8 text-green-400 mx-auto mb-2" />
                                    <p className="text-xs text-gray-400">Verified</p>
                                </div>
                                <div className="bg-gray-800/50 rounded-lg p-4 text-center">
                                    <Users className="w-8 h-8 text-purple-400 mx-auto mb-2" />
                                    <p className="text-xs text-gray-400">24/7 Support</p>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </section>
        </div>
    );
}
