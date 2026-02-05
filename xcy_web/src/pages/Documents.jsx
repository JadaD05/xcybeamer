import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import {
    Menu,
    X,
    Gamepad2,
    BookOpen,
    ChevronRight,
    FileText,
    Lock,
    MessageCircle
} from "lucide-react";
import { isAuthenticated, getUser, logout, isAdmin } from "../utils/auth";
import { orderAPI, guideAPI } from "../utils/api";

export default function Documents() {
    const [isMenuOpen, setIsMenuOpen] = useState(false);
    const [scrolled, setScrolled] = useState(false);
    const [user, setUser] = useState(null);
    const [selectedGame, setSelectedGame] = useState(null);
    const [selectedDoc, setSelectedDoc] = useState(null);
    const [purchasedProducts, setPurchasedProducts] = useState([]);
    const [loading, setLoading] = useState(true);
    const [allDocs, setAllDocs] = useState({});


    useEffect(() => {
        const handleScroll = () => setScrolled(window.scrollY > 20);
        window.addEventListener("scroll", handleScroll);
        return () => window.removeEventListener("scroll", handleScroll);
    }, []);

    useEffect(() => {
        if (!isAuthenticated()) {
            window.location.href = '/signin';
            return;
        }
        setUser(getUser());
        fetchPurchasedProducts();
    }, []);

    const fetchPurchasedProducts = async () => {
        try {
            setLoading(true);
            const res = await orderAPI.getUserPurchasedProducts();
            console.log("Purchased games:", res.data.games); // debug
            setPurchasedProducts(res.data.games || []);
        } catch (err) {
            console.error('Error fetching purchased products:', err);
        } finally {
            setLoading(false);
        }
    };

    const handleLogout = () => {
        logout();
    };

    // All available installation guides organized by game
    useEffect(() => {
        const fetchGuides = async () => {
            try {
                const res = await guideAPI.getAll();
                const guides = res.data.guides || [];

                // Group guides by game
                const groupedGuides = {};
                guides.forEach(guide => {
                    if (!groupedGuides[guide.game]) {
                        groupedGuides[guide.game] = [];
                    }
                    groupedGuides[guide.game].push({
                        title: guide.title,
                        content: guide.content
                    });
                });

                setAllDocs(groupedGuides);
            } catch (err) {
                console.error('Error fetching guides:', err);
            }
        };

        fetchGuides();
    }, []);

    // Filter docs to only show games the user has purchased
    const getAvailableDocs = () => {
        // Admins see all guides
        if (isAdmin()) {
            return allDocs;
        }

        // Clients: only purchased games
        const available = {};
        purchasedProducts.forEach(product => {
            const game = product.game;
            if (allDocs[game]) {
                available[game] = allDocs[game];
            }
        });

        return available;
    };

    const availableDocs = getAvailableDocs();
    const hasAccess = Object.keys(availableDocs).length > 0;

    return (
        <div className="min-h-screen bg-gray-950 text-white overflow-x-hidden">
            {/* NAV */}
            <nav
                className={`fixed w-full z-50 transition-all duration-300 ${scrolled
                    ? "bg-gray-900/95 backdrop-blur-lg shadow-lg"
                    : "bg-transparent"
                    }`}
            >
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
                            <Link to="/support" className="text-blue-400">Support</Link>
                            <a
                                href="https://discord.gg/R95AHqwm5X"
                                target="_blank"
                                rel="noopener noreferrer"
                                className="flex items-center gap-2 hover:text-blue-400 transition"
                            >
                                Discord
                            </a>
                            <Link
                                to={isAdmin() ? "/admin" : "/client"}
                                className="hover:text-blue-400 transition"
                            >
                                {isAdmin() ? "Admin" : "Client"}
                            </Link>
                        </div>

                        <div className="hidden md:block">
                            {user ? (
                                <div className="flex items-center gap-4">
                                    <span className="text-gray-300">
                                        Welcome,{" "}
                                        <span className="text-blue-400 font-semibold">
                                            {user.username}
                                        </span>
                                    </span>
                                    <button
                                        onClick={handleLogout}
                                        className="bg-gradient-to-r from-red-600 to-red-700 px-6 py-2 rounded-lg font-semibold hover:from-red-700 hover:to-red-800 transition"
                                    >
                                        Logout
                                    </button>
                                </div>
                            ) : (
                                <Link
                                    to="/signin"
                                    className="bg-gradient-to-r from-blue-600 to-green-600 px-6 py-2 rounded-lg font-semibold hover:from-blue-700 hover:to-green-700 transition"
                                >
                                    Sign In
                                </Link>
                            )}
                        </div>

                        <button
                            className="md:hidden"
                            onClick={() => setIsMenuOpen(!isMenuOpen)}
                        >
                            {isMenuOpen ? <X /> : <Menu />}
                        </button>
                    </div>
                </div>
            </nav>

            {/* CONTENT */}
            <section className="pt-32 pb-20 px-4">
                <div className="max-w-6xl mx-auto">
                    <h1 className="text-4xl md:text-5xl font-bold mb-4 bg-gradient-to-r from-blue-400 to-green-500 bg-clip-text text-transparent">
                        Installation Guides
                    </h1>
                    <p className="text-gray-400 mb-10">
                        Access installation guides for your purchased products
                    </p>

                    {loading ? (
                        <div className="text-center py-20">
                            <div className="text-6xl mb-4">⏳</div>
                            <p className="text-gray-400">Loading your products...</p>
                        </div>
                    ) : !hasAccess ? (
                        <div className="text-center py-20">
                            <Lock className="w-20 h-20 mx-auto mb-4 text-gray-600" />
                            <h2 className="text-2xl font-bold mb-2">No Products Found</h2>
                            <p className="text-gray-400 mb-6">
                                You don't have access to any installation guides yet.
                            </p>
                            <Link
                                to="/products"
                                className="inline-block bg-gradient-to-r from-blue-600 to-green-600 px-8 py-3 rounded-lg font-semibold hover:from-blue-700 hover:to-green-700 transition"
                            >
                                Browse Products
                            </Link>
                        </div>
                    ) : (
                        <>
                            {/* GAME SELECT */}
                            {!selectedGame && (
                                <div className="grid md:grid-cols-3 gap-6">
                                    {Object.keys(availableDocs).map((game) => (
                                        <button
                                            key={game}
                                            onClick={() => setSelectedGame(game)}
                                            className="bg-gray-800/50 border border-gray-700 hover:border-blue-500 p-6 rounded-xl text-left transition group"
                                        >
                                            <BookOpen className="text-blue-400 mb-3 group-hover:scale-110 transition-transform" />
                                            <h3 className="text-xl font-bold">{game}</h3>
                                            <p className="text-gray-400 text-sm mt-1">
                                                {availableDocs[game].length} guide
                                                {availableDocs[game].length !== 1 ? "s" : ""}{" "}
                                                available
                                            </p>
                                        </button>
                                    ))}
                                </div>
                            )}

                            {/* DOC LIST */}
                            {selectedGame && !selectedDoc && (
                                <>
                                    <button
                                        onClick={() => setSelectedGame(null)}
                                        className="text-blue-400 mb-6 hover:underline flex items-center gap-2"
                                    >
                                        ← Back to Games
                                    </button>

                                    <div className="grid md:grid-cols-2 gap-6">
                                        {availableDocs[selectedGame].map((doc, i) => (
                                            <button
                                                key={i}
                                                onClick={() => setSelectedDoc(doc)}
                                                className="bg-gray-800/50 border border-gray-700 hover:border-green-500 p-6 rounded-xl text-left transition group"
                                            >
                                                <FileText className="text-green-400 mb-2 group-hover:scale-110 transition-transform" />
                                                <h3 className="font-bold text-lg">{doc.title}</h3>
                                                <p className="text-gray-400 text-sm mt-2">
                                                    Click to view installation guide
                                                </p>
                                            </button>
                                        ))}
                                    </div>
                                </>
                            )}

                            {/* DOC CONTENT */}
                            {selectedDoc && (
                                <>
                                    <button
                                        onClick={() => setSelectedDoc(null)}
                                        className="text-blue-400 mb-6 hover:underline flex items-center gap-2"
                                    >
                                        ← Back to Guides
                                    </button>

                                    <div className="bg-gray-900 border border-gray-800 rounded-xl p-8">
                                        <h2 className="text-3xl font-bold mb-6 text-blue-400">
                                            {selectedDoc.title}
                                        </h2>
                                        <pre className="whitespace-pre-wrap text-gray-300 font-mono text-sm leading-relaxed">
                                            {selectedDoc.content}
                                        </pre>
                                    </div>
                                </>
                            )}
                        </>
                    )}
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