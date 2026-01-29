import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import {
    Menu,
    X,
    Gamepad2,
    BookOpen,
    ChevronRight,
    FileText
} from "lucide-react";
import { isAuthenticated, getUser, logout } from "../utils/auth";

export default function Documents() {
    const [isMenuOpen, setIsMenuOpen] = useState(false);
    const [scrolled, setScrolled] = useState(false);
    const [user, setUser] = useState(null);
    const [selectedGame, setSelectedGame] = useState(null);
    const [selectedDoc, setSelectedDoc] = useState(null);

    useEffect(() => {
        const handleScroll = () => setScrolled(window.scrollY > 20);
        window.addEventListener("scroll", handleScroll);
        return () => window.removeEventListener("scroll", handleScroll);
    }, []);

    useEffect(() => {
        if (isAuthenticated()) {
            setUser(getUser());
        }
    }, []);

    const handleLogout = () => {
        logout();
        setUser(null);
    };

    const docs = {
        CS2: [
            {
                title: "CS2 Mod Menu – Installation",
                content: `
1. Disable antivirus
2. Download the loader
3. Run as administrator
4. Launch CS2
5. Inject when prompted
        `
            }
        ],
        Valorant: [
            {
                title: "Valorant Tool – Setup",
                content: `
1. Restart PC
2. Disable secure boot
3. Run loader
4. Launch Valorant
        `
            }
        ],
        Fortnite: [
            {
                title: "Fortnite External – Guide",
                content: `
1. Launch Fortnite
2. Start the external tool
3. Configure settings
        `
            }
        ]
    };

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
                        <div className="flex items-center space-x-2">
                            <Gamepad2 className="w-8 h-8 text-blue-500" />
                            <span className="text-xl font-bold bg-gradient-to-r from-blue-400 to-green-600 bg-clip-text text-transparent">
                                XCY BEAMER
                            </span>
                        </div>

                        <div className="hidden md:flex space-x-8">
                            <Link to="/" className="hover:text-blue-400 transition">Home</Link>
                            <Link to="/products" className="hover:text-blue-400 transition">Products</Link>
                            <Link to="/support" className="text-blue-400">Support</Link>
                            <Link to="/client" className="hover:text-blue-400 transition">Client</Link>
                        </div>

                        <div className="hidden md:block">
                            {user ? (
                                <div className="flex items-center gap-4">
                                    <span className="text-gray-300">
                                        Welcome, <span className="text-blue-400 font-semibold">{user.username}</span>
                                    </span>
                                    <button
                                        onClick={handleLogout}
                                        className="bg-gradient-to-r from-red-600 to-red-700 px-6 py-2 rounded-lg font-semibold"
                                    >
                                        Logout
                                    </button>
                                </div>
                            ) : (
                                <Link
                                    to="/signin"
                                    className="bg-gradient-to-r from-blue-600 to-green-600 px-6 py-2 rounded-lg font-semibold"
                                >
                                    Sign In
                                </Link>
                            )}
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
                    <h1 className="text-4xl md:text-5xl font-bold mb-10 bg-gradient-to-r from-blue-400 to-green-500 bg-clip-text text-transparent">
                        Installation Guides
                    </h1>

                    {/* GAME SELECT */}
                    {!selectedGame && (
                        <div className="grid md:grid-cols-3 gap-6">
                            {Object.keys(docs).map(game => (
                                <button
                                    key={game}
                                    onClick={() => setSelectedGame(game)}
                                    className="bg-gray-800/50 border border-gray-700 hover:border-blue-500 p-6 rounded-xl text-left transition"
                                >
                                    <BookOpen className="text-blue-400 mb-3" />
                                    <h3 className="text-xl font-bold">{game}</h3>
                                    <p className="text-gray-400 text-sm mt-1">
                                        View installation guides
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
                                className="text-blue-400 mb-6 hover:underline"
                            >
                                ← Back
                            </button>

                            <div className="grid md:grid-cols-2 gap-6">
                                {docs[selectedGame].map((doc, i) => (
                                    <button
                                        key={i}
                                        onClick={() => setSelectedDoc(doc)}
                                        className="bg-gray-800/50 border border-gray-700 hover:border-green-500 p-6 rounded-xl text-left transition"
                                    >
                                        <FileText className="text-green-400 mb-2" />
                                        <h3 className="font-bold text-lg">{doc.title}</h3>
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
                                className="text-blue-400 mb-6 hover:underline"
                            >
                                ← Back to Guides
                            </button>

                            <div className="bg-black border border-gray-800 rounded-xl p-6">
                                <h2 className="text-2xl font-bold mb-4">{selectedDoc.title}</h2>
                                <pre className="whitespace-pre-wrap text-gray-300">
                                    {selectedDoc.content}
                                </pre>
                            </div>
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
