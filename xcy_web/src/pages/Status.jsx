import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { productAPI } from "../utils/api";
import {
  ShieldCheck,
  AlertTriangle,
  Clock,
  Gamepad2,
  Shield,
  Zap,
  Users,
  Star,
  Menu,
  X,
  ChevronRight,
  MessageCircle
} from "lucide-react";
import { isAuthenticated, getUser, logout } from "../utils/auth";

const hasRole = (user, role) =>
  Array.isArray(user?.roles) && user.roles.includes(role);

const isAdminUser = (user) =>
  hasRole(user, "admin") || hasRole(user, "dev");

const STATUS_META = {
  Undetected: {
    label: "Undetected",
    color: "border-green-500 bg-green-500/10 text-green-400",
    icon: <ShieldCheck className="w-5 h-5 text-green-400" />,
  },
  Detected: {
    label: "Detected",
    color: "border-yellow-500 bg-yellow-500/10 text-yellow-400",
    icon: <AlertTriangle className="w-5 h-5 text-yellow-400" />,
  },
  "Coming Soon": {
    label: "Coming Soon",
    color: "border-blue-500 bg-blue-500/10 text-blue-400",
    icon: <Clock className="w-5 h-5 text-blue-400" />,
  },
};

const StatusCard = ({ product }) => {
  const meta = STATUS_META[product.status];

  return (
    <div className={`border rounded-xl p-4 ${meta.color}`}>
      <div className="flex items-center justify-between mb-2">
        <span className="font-semibold">{product.name}</span>
        <span className="text-sm opacity-80">{product.game}</span>
      </div>

      <div className="flex items-center gap-3">
        <div className="w-12 h-12 flex items-center justify-center">
          {product.image && product.image.startsWith("http") ? (
            <img
              src={product.image}
              alt={product.name}
              className="w-12 h-12 object-cover rounded-md"
            />
          ) : (
            <span className="text-2xl">{product.image || "🎮"}</span>
          )}
        </div>

        <div className="flex items-center gap-2 text-sm font-medium">
          {meta.icon}
          {meta.label}
        </div>
      </div>
    </div>
  );
};

export default function Status() {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const [user, setUser] = useState(null);

  useEffect(() => {
    if (isAuthenticated()) {
      const u = getUser();
      setUser({
        ...u,
        isAdmin: isAdminUser(u),
      });
    }
  }, []);

  // Fetch products
  useEffect(() => {
    const loadProducts = async () => {
      try {
        const res = await productAPI.getAll();
        setProducts(res.data.products || []);
      } catch (err) {
        console.error("Failed to load products", err);
      } finally {
        setLoading(false);
      }
    };
    loadProducts();
  }, []);

  // Scroll detection
  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const handleLogout = () => {
    logout();
    setUser(null);
  };

  return (
    <div className="min-h-screen w-full bg-gray-950 text-white overflow-x-hidden">
      {/* Navigation */}
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

            {/* Desktop Menu */}
            <div className="hidden md:flex space-x-8">
              <a href="/" className="hover:text-blue-400 transition">
                Home
              </a>
              <a href="/products" className="hover:text-blue-400 transition">
                Products
              </a>
              <a href="/status" className="hover:text-blue-400 transition">
                Status
              </a>
              <a href="/support" className="hover:text-blue-400 transition">
                Support
              </a>
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

            <div className="hidden md:block">
              {user ? (
                <div className="flex items-center gap-4">
                  <span className="text-gray-300">
                    Welcome,{" "}
                    <span className="font-semibold text-blue-400">{user.username}</span>!
                  </span>
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
            <button className="md:hidden" onClick={() => setIsMenuOpen(!isMenuOpen)}>
              {isMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
          </div>
        </div>

        {/* Mobile Menu */}
        {isMenuOpen && (
          <div className="md:hidden bg-gray-900 border-t border-gray-800">
            <div className="px-4 py-4 space-y-3">
              <a href="/" className="block hover:text-blue-400 transition">
                Home
              </a>
              <Link to="/products" className="block hover:text-blue-400 transition">
                Products
              </Link>
              <a href="/support" className="hover:text-blue-400 transition">
                Support
              </a>
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
        <div className="absolute inset-0 bg-gradient-to-br from-blue-900/20 to-green-900/20"></div>
        <div
          className="absolute inset-0"
          style={{
            backgroundImage:
              'radial-gradient(circle at 2px 2px, rgba(147, 51, 234, 0.1) 1px, transparent 0)',
            backgroundSize: '40px 40px',
          }}
        ></div>

        <div className="max-w-7xl mx-auto text-center relative z-10">
          <h1 className="text-5xl md:text-7xl font-bold mb-6 bg-gradient-to-r from-blue-400 via-green-500 to-blue-600 bg-clip-text text-transparent">
            {user ? `Welcome, ${user.username}!` : 'Product Status Overview'}
          </h1>
          <p className="text-xl md:text-2xl text-gray-300 mb-8 max-w-3xl mx-auto">
            View the current status of all our products.
          </p>
        </div>
      </section>

      {/* Status Content */}
      <div className="max-w-7xl mx-auto px-4 py-10">
        {loading ? (
          <div className="text-center py-20">
            <div className="text-6xl mb-4">⏳</div>
            <p className="text-gray-400">Loading status...</p>
          </div>
        ) : (
          Object.keys(STATUS_META).map((status) => {
            const filtered = products.filter((p) => p.status === status);
            if (filtered.length === 0) return null;

            return (
              <section key={status} className="mb-10">
                <h2 className="text-xl font-semibold mb-4">{STATUS_META[status].label}</h2>
                <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                  {filtered.map((product) => (
                    <StatusCard key={product._id} product={product} />
                  ))}
                </div>
              </section>
            );
          })
        )}
      </div>

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
