import React, { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import {
    Gamepad2,
    Key,
    BookOpen,
    Menu,
    X,
    Copy,
    CheckCircle,
    User,
    MessageCircle
} from "lucide-react";
import { isAuthenticated, getUser, logout } from "../utils/auth";
import { orderAPI } from "../utils/api";

export default function Client() {
    const [user, setUser] = useState(null);
    const [scrolled, setScrolled] = useState(false);
    const [isMenuOpen, setIsMenuOpen] = useState(false);
    const [keys, setKeys] = useState([]);
    const [copiedKey, setCopiedKey] = useState(null);
    const [loading, setLoading] = useState(true);
    const navigate = useNavigate();

    /* =========================
       AUTH + SCROLL
    ========================= */
    useEffect(() => {
        if (!isAuthenticated()) {
            navigate("/signin");
            return;
        }
        setUser(getUser());
        const handleScroll = () => setScrolled(window.scrollY > 20);
        window.addEventListener("scroll", handleScroll);
        return () => window.removeEventListener("scroll", handleScroll);
    }, [navigate]);

    /* =========================
       FETCH LICENSE KEYS
    ========================= */
    useEffect(() => {
        const fetchKeys = async () => {
            if (!user) return;
            try {
                setLoading(true);
                const res = await orderAPI.getMyKeys();
                console.log('Keys response:', res.data);
                if (res.data.success) {
                    setKeys(res.data.keys);
                } else {
                    console.warn('No keys found:', res.data.message);
                    setKeys([]);
                }
            } catch (err) {
                console.error('Failed to load keys:', err);
                console.error('Error response:', err.response?.data);
                setKeys([]);
            } finally {
                setLoading(false);
            }
        };
        fetchKeys();
    }, [user]);

    const handleLogout = () => {
        logout();
        navigate("/");
    };

    const copyKey = (key) => {
        navigator.clipboard.writeText(key);
        setCopiedKey(key);
        setTimeout(() => setCopiedKey(null), 2000);
    };

    return (
        <div className="min-h-screen bg-gray-950 text-white overflow-x-hidden">
            {/* NAV */}
            <nav
                className={`fixed w-full z-50 transition-all duration-300 ${scrolled ? "bg-gray-900/95 backdrop-blur-lg shadow-lg" : "bg-transparent"
                    }`}
            >
                <div className="w-full px-8 lg:px-16">
                    <div className="flex justify-between items-center h-16">
                        <div className="flex items-center space-x-2">
                            <Gamepad2 className="w-8 h-8 text-blue-500" />
                            <span className="text-xl font-bold bg-gradient-to-r from-blue-400 to-green-600 bg-clip-text text-transparent">
                                XCY BEAMER
                            </span>
                        </div>
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
                            <Link to="/client" className="text-blue-400">Client</Link>
                        </div>
                        <div className="hidden md:block">
                            <div className="flex items-center gap-4">
                                <span className="text-gray-300">
                                    Welcome, <span className="text-blue-400 font-semibold">{user?.username}</span>
                                </span>
                                <button
                                    onClick={handleLogout}
                                    className="bg-gradient-to-r from-red-600 to-red-700 px-6 py-2 rounded-lg font-semibold"
                                >
                                    Logout
                                </button>
                            </div>
                        </div>
                        <button className="md:hidden" onClick={() => setIsMenuOpen(!isMenuOpen)}>
                            {isMenuOpen ? <X /> : <Menu />}
                        </button>
                    </div>
                </div>
            </nav>

            {/* CONTENT */}
            <section className="pt-32 pb-20 px-4">
                <div className="max-w-6xl mx-auto">
                    <h1 className="text-4xl md:text-5xl font-bold mb-4 bg-gradient-to-r from-blue-400 to-green-500 bg-clip-text text-transparent">
                        Client Dashboard
                    </h1>
                    <p className="text-gray-400 mb-12">
                        Manage your licenses and access installation guides
                    </p>

                    {/* ACTION BUTTONS - UPDATED WITH PROFILE BUTTON */}
                    <div className="flex flex-wrap gap-4 mb-10">
                        <Link
                            to="/documents"
                            className="bg-gradient-to-r from-blue-600 to-green-600 px-6 py-3 rounded-lg font-semibold flex items-center gap-2 hover:from-blue-700 hover:to-green-700 transition"
                        >
                            <BookOpen className="w-5 h-5" />
                            Installation Guides
                        </Link>

                        <Link
                            to="/profile"
                            className="bg-gradient-to-r from-blue-600 to-green-600 px-6 py-3 rounded-lg font-semibold flex items-center gap-2 hover:from-purple-700 hover:to-pink-700 transition"
                        >
                            <User className="w-5 h-5" />
                            My Profile
                        </Link>
                    </div>

                    {/* MY KEYS */}
                    <div className="bg-gray-900/50 border border-gray-800 rounded-xl p-6">
                        <div className="flex items-center gap-2 mb-6">
                            <Key className="text-green-400" />
                            <h2 className="text-2xl font-bold">My License Keys</h2>
                        </div>
                        {loading ? (
                            <p className="text-gray-400">Loading keys...</p>
                        ) : keys.length === 0 ? (
                            <p className="text-gray-400">
                                No license keys found. Purchase a product to receive access.
                            </p>
                        ) : (
                            <div className="space-y-6">
                                {/* Group keys by order */}
                                {(() => {
                                    const orderGroups = {};
                                    keys.forEach(item => {
                                        if (!orderGroups[item.orderId]) {
                                            orderGroups[item.orderId] = [];
                                        }
                                        orderGroups[item.orderId].push(item);
                                    });
                                    return Object.entries(orderGroups).map(([orderId, orderKeys]) => {
                                        const firstKey = orderKeys[0];
                                        return (
                                            <div
                                                key={orderId}
                                                className="bg-black border border-gray-800 rounded-lg p-5"
                                            >
                                                {/* Order Header */}
                                                <div className="mb-4 pb-3 border-b border-gray-700">
                                                    <div className="flex items-center justify-between">
                                                        <div>
                                                            <p className="text-sm text-gray-400">Order #{orderId.slice(-8)}</p>
                                                            {firstKey.soldAt && (
                                                                <p className="text-xs text-gray-500 mt-1">
                                                                    {new Date(firstKey.soldAt).toLocaleDateString()}
                                                                </p>
                                                            )}
                                                        </div>
                                                        <div className="text-right">
                                                            <p className="text-sm text-blue-400 font-semibold">
                                                                {orderKeys.length} {orderKeys.length === 1 ? 'Key' : 'Keys'}
                                                            </p>
                                                        </div>
                                                    </div>
                                                </div>
                                                {/* Keys for this order */}
                                                <div className="space-y-3">
                                                    {orderKeys.map((keyItem, keyIdx) => (
                                                        <div
                                                            key={keyIdx}
                                                            className="bg-gray-900 border border-gray-700 rounded-lg p-4"
                                                        >
                                                            <div className="flex items-center justify-between mb-2">
                                                                <div>
                                                                    <p className="font-semibold">{keyItem.productName}</p>
                                                                    <p className="text-sm text-gray-400">{keyItem.game}</p>
                                                                    {/* Key Type Badge */}
                                                                    <span
                                                                        className={`inline-block mt-1 px-2 py-1 rounded text-xs font-semibold ${keyItem.keyType === "1day"
                                                                            ? "bg-orange-500/20 text-orange-400"
                                                                            : keyItem.keyType === "1week"
                                                                                ? "bg-blue-500/20 text-blue-400"
                                                                                : "bg-green-500/20 text-green-400"
                                                                            }`}
                                                                    >
                                                                        {keyItem.keyType === "1day"
                                                                            ? "1 Day"
                                                                            : keyItem.keyType === "1week"
                                                                                ? "1 Week"
                                                                                : "1 Month"}
                                                                    </span>
                                                                    {/* Expiry Date */}
                                                                    {keyItem.expiresAt && (
                                                                        <p className="text-xs text-yellow-400 mt-1">
                                                                            Expires: {new Date(keyItem.expiresAt).toLocaleString()}
                                                                        </p>
                                                                    )}
                                                                </div>
                                                            </div>
                                                            <div className="flex items-center justify-between bg-black rounded-lg p-3 mt-2">
                                                                <p className="font-mono text-sm text-green-400">
                                                                    {keyItem.licenseKey}
                                                                </p>
                                                                <button
                                                                    onClick={() => copyKey(keyItem.licenseKey)}
                                                                    className="ml-4 flex items-center gap-2 bg-gray-800 hover:bg-gray-700 px-3 py-2 rounded-lg transition"
                                                                >
                                                                    {copiedKey === keyItem.licenseKey ? (
                                                                        <>
                                                                            <CheckCircle className="w-4 h-4 text-green-400" />
                                                                            <span className="text-sm">Copied</span>
                                                                        </>
                                                                    ) : (
                                                                        <>
                                                                            <Copy className="w-4 h-4" />
                                                                            <span className="text-sm">Copy</span>
                                                                        </>
                                                                    )}
                                                                </button>
                                                            </div>
                                                        </div>
                                                    ))}
                                                </div>
                                            </div>
                                        );
                                    });
                                })()}
                            </div>
                        )}
                    </div>
                </div>
            </section>

            {/* FOOTER */}
            <footer className="bg-gray-900 border-t border-gray-800 py-12 px-4">
                <div className="max-w-7xl mx-auto text-center">
                    <div className="flex items-center justify-center space-x-2 mb-4">
                        <Gamepad2 className="w-8 h-8 text-blue-500" />
                        <span className="text-xl font-bold">XCY BEAMER</span>
                    </div>
                    <p className="text-gray-500 text-sm">© 2026 XCY BEAMER</p>
                </div>
            </footer>
        </div>
    );
}