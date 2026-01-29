import React, { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { isAuthenticated, getUser, logout, isAdmin } from "../utils/auth";
import { productAPI } from "../utils/api";
import { Plus, Trash2, Edit, Gamepad2, X } from "lucide-react";
import { io } from 'socket.io-client';
import axios from "axios";

export default function AdminDashboard() {
    const navigate = useNavigate();
    const user = isAuthenticated() ? getUser() : null;
    const [products, setProducts] = useState([]);
    const [loading, setLoading] = useState(true);
    const [showAddModal, setShowAddModal] = useState(false);
    const [purchaseStats, setPurchaseStats] = useState([]);
    const [newProduct, setNewProduct] = useState({
        name: "",
        game: "",
        category: "FPS",
        price: "",
        downloadUrl: "",
        image: "",
        features: "",
        status: "Active",
    });
    const [categories, setCategories] = useState([]);
    const [showAddCategoryModal, setShowAddCategoryModal] = useState(false);
    const [newCategory, setNewCategory] = useState({
        name: "",
        image: "",
        game: ""
    });

    useEffect(() => {
        if (!isAuthenticated() || !isAdmin()) {
            navigate('/', { replace: true });
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    const handleLogout = () => {
        logout();
    };

    useEffect(() => {
        const socket = io(import.meta.env.VITE_API_URL); // your server URL

        socket.on('updateStats', (stats) => {
            console.log("Received socket stats:", stats);
            setPurchaseStats(stats);
        });

        return () => {
            socket.disconnect();
        };
    }, []);

    // Fetch products from API
    useEffect(() => {
        const fetchProducts = async () => {
            try {
                const res = await productAPI.getAll();
                setProducts(res.data.products);
                setLoading(false);
            } catch (err) {
                console.error('Error fetching products:', err);
                setLoading(false);
            }
        };

        fetchProducts();
    }, []);

    useEffect(() => {
        const fetchCategories = async () => {
            try {
                const res = await axios.get(`${import.meta.env.VITE_API_URL}/categories/get`);
                setCategories(res.data.categories || []);
            } catch (err) {
                console.error('Error fetching categories:', err);
            }
        };

        fetchCategories();
    }, []);

    const getStatsForProduct = (productId) => {
        const stat = purchaseStats.find(p => p.productId === productId.toString());
        console.log("Matching stats for productId", productId, stat);
        return stat || { purchases: 0 };
    };

    const totalPurchases = purchaseStats.reduce(
        (sum, p) => sum + p.purchases,
        0
    );

    const totalRevenue = purchaseStats.reduce(
        (sum, p) => sum + p.revenue,
        0
    );

    const handleAddProduct = async () => {
        try {
            // Convert features string to array
            const featuresArray = newProduct.features
                .split(',')
                .map(f => f.trim())
                .filter(f => f.length > 0);

            const productData = {
                ...newProduct,
                features: featuresArray,
                price: parseFloat(newProduct.price),
                rating: parseFloat(newProduct.rating),
            };

            const res = await productAPI.create(productData);
            setProducts([...products, res.data.product]);
            setShowAddModal(false);
            setNewProduct({
                name: "",
                game: "",
                category: "FPS",
                price: "",
                downloadUrl: "",
                image: "",
                features: "",
                status: "Active",
            });
            alert('Product added successfully!');
        } catch (err) {
            console.error('Error adding product:', err);
            alert(err.response?.data?.message || "Error adding product");
        }
    };

    const handleRemoveProduct = async (id) => {
        if (!window.confirm("Are you sure you want to remove this product?")) return;

        try {
            await productAPI.delete(id);
            setProducts(products.filter((p) => p._id !== id));
            alert('Product removed successfully!');
        } catch (err) {
            console.error('Error removing product:', err);
            alert(err.response?.data?.message || "Error removing product");
        }
    };

    const handleAddCategory = async () => {
        if (!newCategory.name || !newCategory.game) {
            alert('Please provide category name and game');
            return;
        }

        try {
            const res = await axios.post(
                `${import.meta.env.VITE_API_URL}/categories/create`,
                newCategory,
                {
                    headers: {
                        Authorization: `Bearer ${user.token}`
                    }
                }
            );
            setCategories([...categories, res.data.category]);
            setShowAddCategoryModal(false);
            setNewCategory({ name: "", image: "", game: "" });
            alert('Category added successfully!');
        } catch (err) {
            console.error('Error adding category:', err);
            alert(err.response?.data?.message || "Error adding category");
        }
    };

    const handleRemoveCategory = async (id) => {
        if (!window.confirm("Are you sure you want to remove this category?")) return;

        try {
            await axios.delete(
                `${import.meta.env.VITE_API_URL}/categories/${id}`,
                {
                    headers: {
                        Authorization: `Bearer ${user.token}`
                    }
                }
            );
            setCategories(categories.filter((c) => c._id !== id));
            alert('Category removed successfully!');
        } catch (err) {
            console.error('Error removing category:', err);
            alert(err.response?.data?.message || "Error removing category");
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
                                XCY BEAMER - Admin
                            </span>
                        </Link>

                        <div className="hidden md:flex space-x-8">
                            <Link to="/" className="hover:text-blue-400 transition">Home</Link>
                            <Link to="/products" className="hover:text-blue-400 transition">Products</Link>
                            <Link to="/admin" className="text-blue-400">Admin</Link>
                        </div>

                        <div className="hidden md:block">
                            {user && (
                                <div className="flex items-center gap-4">
                                    <span className="text-gray-300">Welcome, <span className="font-semibold text-blue-400">{user.username}</span>!</span>
                                    <button
                                        onClick={handleLogout}
                                        className="bg-gradient-to-r from-red-600 to-red-700 px-6 py-2 rounded-lg font-semibold hover:from-red-700 hover:to-red-800 transition"
                                    >
                                        Logout
                                    </button>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </nav>

            {/* Main Content */}
            <div className="pt-24 px-8">
                <h1 className="text-4xl font-bold mb-8 bg-gradient-to-r from-blue-400 via-green-500 to-blue-600 bg-clip-text text-transparent">
                    Admin Dashboard
                </h1>

                {/* Analytics */}
                <div className="mb-8 grid md:grid-cols-3 gap-6">
                    <div className="bg-gradient-to-br from-gray-900 to-gray-800 p-6 rounded-xl border border-gray-700">
                        <h2 className="text-lg font-semibold mb-2 text-gray-400">Total Products</h2>
                        <p className="text-3xl font-bold text-blue-400">{products.length}</p>
                    </div>
                    <div className="bg-gradient-to-br from-gray-900 to-gray-800 p-6 rounded-xl border border-gray-700">
                        <h2 className="text-lg font-semibold mb-2 text-gray-400">Total Users</h2>
                        <p className="text-3xl font-bold text-green-400">{totalPurchases.toLocaleString()}</p>
                    </div>
                    <div className="bg-gradient-to-br from-gray-900 to-gray-800 p-6 rounded-xl border border-gray-700">
                        <h2 className="text-lg font-semibold mb-2 text-gray-400">Estimated Revenue</h2>
                        <p className="text-3xl font-bold text-purple-400">${totalRevenue.toFixed(2)}</p>
                    </div>
                </div>

                {/* Add Product Button */}
                <button
                    className="flex items-center gap-2 bg-gradient-to-r from-blue-600 to-green-600 px-6 py-3 rounded-lg mb-6 hover:from-blue-700 hover:to-green-700 transition font-semibold"
                    onClick={() => setShowAddModal(true)}
                >
                    <Plus className="w-5 h-5" /> Add Product
                </button>

                {/* Products Table */}
                {loading ? (
                    <div className="text-center py-20">
                        <div className="text-6xl mb-4">⏳</div>
                        <p className="text-gray-400">Loading products...</p>
                    </div>
                ) : (
                    <div className="bg-gray-900 rounded-xl border border-gray-800 overflow-hidden">
                        <div className="overflow-x-auto">
                            <table className="w-full">
                                <thead className="bg-gray-800">
                                    <tr>
                                        <th className="p-4 text-left font-semibold">Image</th>
                                        <th className="p-4 text-left font-semibold">Name</th>
                                        <th className="p-4 text-left font-semibold">Game</th>
                                        <th className="p-4 text-left font-semibold">Category</th>
                                        <th className="p-4 text-left font-semibold">Price</th>
                                        <th className="p-4 text-left font-semibold">Purchases</th>

                                        <th className="p-4 text-left font-semibold">Rating</th>
                                        <th className="p-4 text-left font-semibold">Status</th>
                                        <th className="p-4 text-left font-semibold">Actions</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {products.map((p) => (
                                        <tr key={p._id} className="border-t border-gray-800 hover:bg-gray-800/50 transition">
                                            <td className="p-4">
                                                {p.image && (p.image.startsWith('http') || p.image.endsWith('.jpg') || p.image.endsWith('.png')) ? (
                                                    <img src={p.image} alt={p.name} className="w-12 h-12 object-cover rounded" />
                                                ) : (
                                                    <div className="text-2xl">{p.image || '🎮'}</div>
                                                )}
                                            </td>
                                            <td className="p-4 font-semibold">{p.name}</td>
                                            <td className="p-4 text-gray-400">{p.game}</td>
                                            <td className="p-4">
                                                <span className="bg-blue-500/20 text-blue-300 px-2 py-1 rounded text-sm">
                                                    {p.category}
                                                </span>
                                            </td>
                                            <td className="p-4 font-semibold text-green-400">${p.price}</td>
                                            <td className="p-4 text-gray-400">{getStatsForProduct(p._id).purchases}</td>
                                            <td className="p-4 text-yellow-400">⭐ {p.rating}</td>
                                            <td className="p-4">
                                                <span className={`px-2 py-1 rounded text-sm ${p.status === 'Active' ? 'bg-green-500/20 text-green-400' :
                                                    p.status === 'Maintenance' ? 'bg-yellow-500/20 text-yellow-400' :
                                                        'bg-gray-500/20 text-gray-400'
                                                    }`}>
                                                    {p.status}
                                                </span>
                                            </td>
                                            <td className="p-4">
                                                <button
                                                    className="text-red-500 hover:text-red-400 flex items-center gap-1 transition"
                                                    onClick={() => handleRemoveProduct(p._id)}
                                                >
                                                    <Trash2 className="w-4 h-4" /> Remove
                                                </button>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>
                )}
            </div>

            {/* Category Management */}
            <div className="mb-8">
                <div className="flex justify-between items-center mb-4">
                    <button
                        className="flex items-center gap-2 bg-gradient-to-r from-blue-600 to-green-600 px-6 py-3 rounded-lg mb-6 hover:from-blue-700 hover:to-green-700 transition font-semibold"
                        onClick={() => setShowAddCategoryModal(true)}
                    >
                        <Plus className="w-5 h-5" /> Add Category
                    </button>
                </div>

                <div className="bg-gradient-to-br from-gray-900 to-gray-800 border border-gray-700 rounded-2xl overflow-hidden">

                    {/* Table Header */}
                    <div className="grid grid-cols-5 px-6 py-4 text-sm font-semibold text-gray-300 border-b border-gray-700">
                        <div>Icon</div>
                        <div>Name</div>
                        <div>Game</div>
                        <div>Status</div>
                        <div className="text-right">Actions</div>
                    </div>

                    {/* Table Rows */}
                    {categories.map((cat) => (
                        <div
                            key={cat._id}
                            className="grid grid-cols-5 px-6 py-4 items-center
                       border-b border-gray-700/50
                       hover:bg-gray-800/50 transition"
                        >
                            {/* Icon */}
                            <div className="text-2xl">
                                {cat.image || "🎮"}
                            </div>

                            {/* Name */}
                            <div className="font-semibold text-white">
                                {cat.name}
                            </div>

                            {/* Game */}
                            <div className="text-gray-400">
                                {cat.game}
                            </div>

                            {/* Status */}
                            <div>
                                <span className="bg-green-500/20 text-green-400 px-3 py-1 rounded-full text-xs font-semibold">
                                    Active
                                </span>
                            </div>

                            {/* Actions */}
                            <div className="flex justify-end">
                                <button
                                    onClick={() => handleRemoveCategory(cat._id)}
                                    className="text-red-500 hover:text-red-400 flex items-center gap-1"
                                >
                                    <Trash2 className="w-4 h-4" />
                                    Remove
                                </button>
                            </div>
                        </div>
                    ))}
                </div>
            </div>

            {/* Add Product Modal */}
            {showAddModal && (
                <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4">
                    <div className="bg-gray-900 p-8 rounded-2xl w-full max-w-2xl relative border border-gray-800 max-h-[90vh] overflow-y-auto">
                        <h2 className="text-2xl font-bold mb-6">Add New Product</h2>
                        <button
                            className="absolute top-6 right-6 text-gray-400 hover:text-white transition"
                            onClick={() => setShowAddModal(false)}
                        >
                            <X className="w-6 h-6" />
                        </button>

                        <div className="grid md:grid-cols-2 gap-4">
                            <div>
                                <label className="block text-sm font-medium mb-2">Product Name *</label>
                                <input
                                    type="text"
                                    placeholder="Valorant Elite"
                                    value={newProduct.name}
                                    onChange={(e) => setNewProduct({ ...newProduct, name: e.target.value })}
                                    className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-2 text-white focus:outline-none focus:border-blue-500"
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium mb-2">Game *</label>
                                <input
                                    type="text"
                                    placeholder="Valorant"
                                    value={newProduct.game}
                                    onChange={(e) => setNewProduct({ ...newProduct, game: e.target.value })}
                                    className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-2 text-white focus:outline-none focus:border-blue-500"
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium mb-2">Category *</label>
                                <select
                                    value={newProduct.category}
                                    onChange={(e) => setNewProduct({ ...newProduct, category: e.target.value })}
                                    className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-2 text-white focus:outline-none focus:border-blue-500"
                                >
                                    <option value="FPS">FPS</option>
                                    <option value="Battle Royale">Battle Royale</option>
                                    <option value="MOBA">MOBA</option>
                                    <option value="Survival">Survival</option>
                                </select>
                            </div>

                            <div>
                                <label className="block text-sm font-medium mb-2">Price *</label>
                                <input
                                    type="number"
                                    step="0.01"
                                    placeholder="29.99"
                                    value={newProduct.price}
                                    onChange={(e) => setNewProduct({ ...newProduct, price: e.target.value })}
                                    className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-2 text-white focus:outline-none focus:border-blue-500"
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium mb-2">Download URL *</label>
                                <input
                                    type="text"
                                    placeholder="/downloads/product.zip"
                                    value={newProduct.downloadUrl}
                                    onChange={(e) => setNewProduct({ ...newProduct, downloadUrl: e.target.value })}
                                    className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-2 text-white focus:outline-none focus:border-blue-500"
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium mb-2">Image (URL or Emoji)</label>
                                <input
                                    type="text"
                                    placeholder="🎮 or https://..."
                                    value={newProduct.image}
                                    onChange={(e) => setNewProduct({ ...newProduct, image: e.target.value })}
                                    className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-2 text-white focus:outline-none focus:border-blue-500"
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium mb-2">Status</label>
                                <select
                                    value={newProduct.status}
                                    onChange={(e) => setNewProduct({ ...newProduct, status: e.target.value })}
                                    className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-2 text-white focus:outline-none focus:border-blue-500"
                                >
                                    <option value="Active">Active</option>
                                    <option value="Maintenance">Maintenance</option>
                                    <option value="Coming Soon">Coming Soon</option>
                                </select>
                            </div>

                            <div className="md:col-span-2">
                                <label className="block text-sm font-medium mb-2">Features (comma separated)</label>
                                <input
                                    type="text"
                                    placeholder="Aimbot, ESP, No Recoil, Radar"
                                    value={newProduct.features}
                                    onChange={(e) => setNewProduct({ ...newProduct, features: e.target.value })}
                                    className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-2 text-white focus:outline-none focus:border-blue-500"
                                />
                            </div>
                        </div>

                        <button
                            className="w-full bg-gradient-to-r from-blue-600 to-green-600 px-6 py-3 rounded-lg mt-6 hover:from-blue-700 hover:to-green-700 transition font-semibold"
                            onClick={handleAddProduct}
                        >
                            Add Product
                        </button>
                    </div>
                </div>
            )}

            {/* Add Category Modal */}
            {showAddCategoryModal && (
                <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4">
                    <div className="bg-gray-900 p-8 rounded-2xl w-full max-w-md relative border border-gray-800">
                        <h2 className="text-2xl font-bold mb-6">Add New Category</h2>
                        <button
                            className="absolute top-6 right-6 text-gray-400 hover:text-white transition"
                            onClick={() => setShowAddCategoryModal(false)}
                        >
                            <X className="w-6 h-6" />
                        </button>

                        <div className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium mb-2">Game Name *</label>
                                <input
                                    type="text"
                                    placeholder="Valorant"
                                    value={newCategory.game}
                                    onChange={(e) => setNewCategory({ ...newCategory, game: e.target.value })}
                                    className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-2 text-white focus:outline-none focus:border-blue-500"
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium mb-2">Category Name *</label>
                                <input
                                    type="text"
                                    placeholder="Premium Cheats"
                                    value={newCategory.name}
                                    onChange={(e) => setNewCategory({ ...newCategory, name: e.target.value })}
                                    className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-2 text-white focus:outline-none focus:border-blue-500"
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium mb-2">Image (Emoji or URL)</label>
                                <input
                                    type="text"
                                    placeholder="🎮 or https://..."
                                    value={newCategory.image}
                                    onChange={(e) => setNewCategory({ ...newCategory, image: e.target.value })}
                                    className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-2 text-white focus:outline-none focus:border-blue-500"
                                />
                            </div>
                        </div>

                        <button
                            className="w-full bg-gradient-to-r from-purple-600 to-pink-600 px-6 py-3 rounded-lg mt-6 hover:from-purple-700 hover:to-pink-700 transition font-semibold"
                            onClick={handleAddCategory}
                        >
                            Add Category
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
}
