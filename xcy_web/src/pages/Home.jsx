import React, { useState, useEffect } from 'react';
import { Link } from "react-router-dom";
import { Shield, Zap, Users, Star, Menu, X, ChevronRight, Gamepad2, CheckCircle } from 'lucide-react';
import { isAuthenticated, getUser, logout, isAdmin } from '../utils/auth';

export default function Home() {
    const [isMenuOpen, setIsMenuOpen] = useState(false);
    const [scrolled, setScrolled] = useState(false);
    const [user, setUser] = useState(null);

    useEffect(() => {
        const handleScroll = () => {
            setScrolled(window.scrollY > 20);
        };
        window.addEventListener('scroll', handleScroll);
        return () => window.removeEventListener('scroll', handleScroll);
    }, []);

    useEffect(() => {
        if (isAuthenticated()) {
            const u = getUser();
            setUser({ ...u, isAdmin: u.role === 'admin' });
        }
    }, []);

    const handleLogout = () => {
        logout();
        setUser(null);
    };

    const features = [
        {
            icon: <Shield className="w-8 h-8" />,
            title: "Secure & Private",
            description: "We guarantee your privacy and security"
        },
        {
            icon: <Zap className="w-8 h-8" />,
            title: "Regular Discounts",
            description: "We offer promotions and discounts"
        },
        {
            icon: <Users className="w-8 h-8" />,
            title: "24/7 Support",
            description: "Dedicated support available please remember to patient"
        },
        {
            icon: <Star className="w-8 h-8" />,
            title: "Premium Quality",
            description: "Top-tier services with regular updates and improvements"
        }
    ];

    const games = [
        { name: "Valorant", status: "Undetected", users: "2.5k" },
        { name: "CS2", status: "Undetected", users: "3.2k" },
        { name: "Apex Legends", status: "Undetected", users: "1.8k" },
        { name: "Fortnite", status: "Undetected", users: "4.1k" },
        { name: "Call of Duty", status: "Undetected", users: "2.9k" },
        { name: "Rust", status: "Undetected", users: "1.5k" }
    ];

    return (
        <div className="min-h-screen w-full bg-gray-950 text-white overflow-x-hidden">
            {/* Navigation */}
            <nav className={`fixed w-full z-50 transition-all duration-300 ${scrolled ? 'bg-gray-900/95 backdrop-blur-lg shadow-lg' : 'bg-transparent'}`}>
                <div className="w-full px-8 lg:px-16">
                    <div className="flex justify-between items-center h-16">
                        <div className="flex items-center space-x-2">
                            <Gamepad2 className="w-8 h-8 text-blue-500" />
                            <span className="text-xl font-bold bg-gradient-to-r from-blue-400 to-green-600 bg-clip-text text-transparent">
                                XCY BEAMER
                            </span>
                        </div>

                        {/* Desktop Menu */}
                        <div className="hidden md:flex space-x-8">
                            <a href="/" className="hover:text-blue-400 transition">Home</a>
                            <a href="/products" className="hover:text-blue-400 transition">Products</a>
                            <a href="/status" className="hover:text-blue-400 transition">Status</a>
                            <a href="/support" className="hover:text-blue-400 transition">Support</a>
                            <Link
                                to={user?.isAdmin ? "/admin" : "/client"}
                                className="hover:text-blue-400 transition"
                            >
                                {user?.isAdmin ? "Admin" : "Client"}
                            </Link>
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

                        {/* Mobile Menu Button */}
                        <button
                            className="md:hidden"
                            onClick={() => setIsMenuOpen(!isMenuOpen)}
                        >
                            {isMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
                        </button>
                    </div>
                </div>

                {/* Mobile Menu */}
                {isMenuOpen && (
                    <div className="md:hidden bg-gray-900 border-t border-gray-800">
                        <div className="px-4 py-4 space-y-3">
                            <a href="/" className="block hover:text-blue-400 transition">Home</a>
                            <Link to="/products" className="block hover:text-blue-400 transition">Products</Link>\
                            <a href="/status" className="hover:text-blue-400 transition">Status</a>
                            <a href="/support" className="hover:text-blue-400 transition">Support</a>
                            <Link
                                to={user?.isAdmin ? "/admin" : "/client"}
                                className="hover:text-blue-400 transition"
                            >
                                {user?.isAdmin ? "Admin" : "Client"}
                            </Link>
                            {user ? (
                                <>
                                    <p className="text-gray-400">Welcome, {user.username}!</p>
                                    <button
                                        onClick={handleLogout}
                                        className="w-full bg-gradient-to-r from-red-600 to-red-700 px-6 py-2 rounded-lg font-semibold"
                                    >
                                        Logout
                                    </button>
                                </>
                            ) : (
                                <>
                                    <Link
                                        to="/signin"
                                        className="block w-full text-center border-2 border-blue-500 px-6 py-2 rounded-lg font-semibold hover:bg-blue-500/10 transition"
                                    >
                                        Sign In
                                    </Link>
                                    <Link
                                        to="/signup"
                                        className="block w-full text-center bg-gradient-to-r from-blue-600 to-green-600 px-6 py-2 rounded-lg font-semibold"
                                    >
                                        Get Started
                                    </Link>
                                </>
                            )}
                        </div>
                    </div>
                )}
            </nav>
            {/* Hero Section */}
            <section
                id="home"
                className="pt-32 pb-20 px-4 relative overflow-hidden"
            >
                {/* Background Gradients */}
                <div className="absolute inset-0 bg-gradient-to-br from-blue-900/20 to-green-900/20"></div>
                <div
                    className="absolute inset-0"
                    style={{
                        backgroundImage:
                            'radial-gradient(circle at 2px 2px, rgba(147, 51, 234, 0.1) 1px, transparent 0)',
                        backgroundSize: '40px 40px',
                    }}
                ></div>

                {/* Content */}
                <div className="max-w-7xl mx-auto text-center relative z-10">
                    <h1 className="text-5xl md:text-7xl font-bold mb-6 bg-gradient-to-r from-blue-400 via-green-500 to-blue-600 bg-clip-text text-transparent">
                        {user ? `Welcome, ${user.username}!` : 'Elevate Your Gaming'}
                    </h1>
                    <p className="text-xl md:text-2xl text-gray-300 mb-8 max-w-3xl mx-auto">
                        {user
                            ? 'Ready to dominate? Check out our latest products and updates'
                            : 'Premium gaming enhancement services trusted by thousands of players worldwide'}
                    </p>

                    {/* Buttons */}
                    <div className="flex flex-col sm:flex-row gap-4 justify-center">
                        {user ? (
                            <>
                                <Link
                                    to="/products"
                                    className="bg-gradient-to-r from-blue-600 to-green-600 px-8 py-4 rounded-lg font-semibold text-lg hover:from-blue-700 hover:to-green-700 transition inline-flex items-center justify-center gap-2"
                                >
                                    Browse Products <ChevronRight className="w-5 h-5" />
                                </Link>

                                <a
                                    href="#games"
                                    className="border-2 border-green-500 px-8 py-4 rounded-lg font-semibold text-lg hover:bg-green-500/10 transition inline-flex items-center justify-center"
                                >
                                    View Supported Games
                                </a>
                            </>
                        ) : (
                            <>
                                <Link
                                    to="/signup"
                                    className="bg-gradient-to-r from-blue-600 to-green-600 px-8 py-4 rounded-lg font-semibold text-lg hover:from-blue-700 hover:to-green-700 transition inline-flex items-center justify-center gap-2"
                                >
                                    Get Started <ChevronRight className="w-5 h-5" />
                                </Link>
                                <Link
                                    to="/products"
                                    className="border-2 border-green-500 px-8 py-4 rounded-lg font-semibold text-lg hover:bg-green-500/10 transition inline-flex items-center justify-center"
                                >
                                    View Products
                                </Link>
                            </>
                        )}
                    </div>
                </div>
            </section>
            {/* Features Section */}
            <section id="features" className="py-20 px-4 bg-gray-900/50">
                <div className="max-w-7xl mx-auto">
                    <h2 className="text-4xl md:text-5xl font-bold text-center mb-16">Why Choose Us</h2>
                    <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
                        {features.map((feature, idx) => (
                            <div key={idx} className="bg-gray-800/50 p-6 rounded-xl border border-gray-700 hover:border-blue-500 transition group">
                                <div className="text-blue-500 mb-4 group-hover:scale-110 transition">
                                    {feature.icon}
                                </div>
                                <h3 className="text-xl font-bold mb-2">{feature.title}</h3>
                                <p className="text-gray-400">{feature.description}</p>
                            </div>
                        ))}
                    </div>
                </div>
            </section>

            {/* Games Section */}
            <section id="games" className="py-20 px-4">
                <div className="max-w-7xl mx-auto">
                    <h2 className="text-4xl md:text-5xl font-bold text-center mb-16">Supported Games</h2>
                    <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {games.map((game, idx) => (
                            <div key={idx} className="bg-gradient-to-br from-gray-800 to-gray-900 p-6 rounded-xl border border-gray-700 hover:border-blue-500 transition">
                                <div className="flex justify-between items-start mb-4">
                                    <h3 className="text-xl font-bold">{game.name}</h3>
                                    <span className="flex items-center gap-1 text-green-400 text-sm">
                                        <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
                                        {game.status}
                                    </span>
                                </div>
                                <div className="flex items-center gap-2 text-gray-400">
                                    <Users className="w-4 h-4" />
                                    <span>{game.users} active users</span>
                                </div>
                            </div>
                        ))}
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
                        <a href="#" className="hover:text-blue-400 transition">Contact</a>
                    </div>
                    <p className="text-gray-500 mt-6 text-sm">© 2026 XCY BEAMER. All rights reserved.</p>
                </div>
            </footer>
        </div>
    );
}