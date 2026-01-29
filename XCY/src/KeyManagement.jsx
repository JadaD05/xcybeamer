import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Gamepad2, Key, Upload, Plus, Trash2, AlertCircle, X } from 'lucide-react';
import { isAuthenticated, getUser, logout, isAdmin } from './utils/auth';
import { productAPI, productKeyAPI } from './utils/api';

export default function KeyManagement() {
  const navigate = useNavigate();
  const user = isAuthenticated() ? getUser() : null;
  const [isAuthorized, setIsAuthorized] = useState(false);
  const [products, setProducts] = useState([]);
  const [selectedProduct, setSelectedProduct] = useState('');
  const [keys, setKeys] = useState([]);
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(false);
  const [showAddModal, setShowAddModal] = useState(false);
  const [bulkKeys, setBulkKeys] = useState('');
  const [notes, setNotes] = useState('');

  useEffect(() => {
    if (!isAuthenticated() || !isAdmin()) {
      navigate('/', { replace: true });
    } else {
      setIsAuthorized(true); // Only set authorized if checks pass
    }
  }, []);

  useEffect(() => {
    fetchProducts();
  }, []);

  useEffect(() => {
    if (selectedProduct) {
      fetchKeys();
      fetchStats();
    }
  }, [selectedProduct]);

  const handleLogout = () => {
    logout();
  };

  const fetchProducts = async () => {
    try {
      const res = await productAPI.getAll();
      setProducts(res.data.products);
    } catch (err) {
      console.error('Error fetching products:', err);
    }
  };

  const fetchKeys = async () => {
    setLoading(true);
    try {
      const res = await productKeyAPI.getAll(selectedProduct, 1, 100, 'all');
      setKeys(res.data.keys);
    } catch (err) {
      console.error('Error fetching keys:', err);
    } finally {
      setLoading(false);
    }
  };

  const fetchStats = async () => {
    try {
      const res = await productKeyAPI.getStats(selectedProduct);
      setStats(res.data.stats);
    } catch (err) {
      console.error('Error fetching stats:', err);
    }
  };

  const handleAddBulkKeys = async () => {
    if (!selectedProduct || !bulkKeys.trim()) {
      alert('Please select a product and enter keys');
      return;
    }

    const keyArray = bulkKeys
      .split('\n')
      .map(k => k.trim())
      .filter(k => k.length > 0);

    if (keyArray.length === 0) {
      alert('No valid keys found');
      return;
    }

    try {
      const res = await productKeyAPI.addBulk(selectedProduct, keyArray, notes);
      alert(res.data.message);
      setBulkKeys('');
      setNotes('');
      setShowAddModal(false);
      fetchKeys();
      fetchStats();
    } catch (err) {
      console.error('Error adding keys:', err);
      alert(err.response?.data?.message || 'Error adding keys');
    }
  };

  const handleDeleteKey = async (keyId) => {
    if (!window.confirm('Are you sure you want to delete this key?')) return;

    try {
      await productKeyAPI.delete(keyId);
      alert('Key deleted successfully');
      fetchKeys();
      fetchStats();
    } catch (err) {
      console.error('Error deleting key:', err);
      alert(err.response?.data?.message || 'Error deleting key');
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
                XCY BEAMER - Keys
              </span>
            </Link>

            <div className="hidden md:flex space-x-8">
              <Link to="/" className="hover:text-blue-400 transition">Home</Link>
              <Link to="/admin" className="hover:text-blue-400 transition">Admin</Link>
              <Link to="/key-management" className="text-blue-400">Key Management</Link>
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
      <div className="pt-24 px-8 pb-20">
        <div className="max-w-7xl mx-auto">
          <h1 className="text-4xl font-bold mb-8 bg-gradient-to-r from-blue-400 via-green-500 to-blue-600 bg-clip-text text-transparent">
            Product Key Management
          </h1>

          {/* Product Selector */}
          <div className="mb-8">
            <label className="block text-sm font-medium mb-2">Select Product</label>
            <select
              value={selectedProduct}
              onChange={(e) => setSelectedProduct(e.target.value)}
              className="bg-gray-900 border border-gray-800 rounded-lg px-4 py-3 text-white w-full md:w-96 focus:outline-none focus:border-blue-500"
            >
              <option value="">-- Select a Product --</option>
              {products.map((p) => (
                <option key={p._id} value={p._id}>
                  {p.name} ({p.game})
                </option>
              ))}
            </select>
          </div>

          {selectedProduct && stats && (
            <>
              {/* Statistics */}
              <div className="grid md:grid-cols-3 gap-6 mb-8">
                <div className="bg-gradient-to-br from-gray-900 to-gray-800 p-6 rounded-xl border border-gray-700">
                  <h3 className="text-sm text-gray-400 mb-2">Total Keys</h3>
                  <p className="text-3xl font-bold text-blue-400">{stats.total}</p>
                </div>
                <div className="bg-gradient-to-br from-gray-900 to-gray-800 p-6 rounded-xl border border-gray-700">
                  <h3 className="text-sm text-gray-400 mb-2">Available</h3>
                  <p className="text-3xl font-bold text-green-400">{stats.available}</p>
                </div>
                <div className="bg-gradient-to-br from-gray-900 to-gray-800 p-6 rounded-xl border border-gray-700">
                  <h3 className="text-sm text-gray-400 mb-2">Sold</h3>
                  <p className="text-3xl font-bold text-purple-400">{stats.sold}</p>
                </div>
              </div>

              {/* Low Stock Warning */}
              {stats.available < 10 && (
                <div className="bg-yellow-500/10 border border-yellow-500 rounded-lg p-4 mb-8 flex items-center gap-3">
                  <AlertCircle className="w-6 h-6 text-yellow-500" />
                  <div>
                    <p className="font-semibold text-yellow-500">Low Stock Warning</p>
                    <p className="text-sm text-gray-300">Only {stats.available} keys remaining for this product</p>
                  </div>
                </div>
              )}

              {/* Add Keys Button */}
              <button
                onClick={() => setShowAddModal(true)}
                className="flex items-center gap-2 bg-gradient-to-r from-blue-600 to-green-600 px-6 py-3 rounded-lg mb-6 hover:from-blue-700 hover:to-green-700 transition font-semibold"
              >
                <Plus className="w-5 h-5" /> Add Keys
              </button>

              {/* Keys Table */}
              <div className="bg-gray-900 rounded-xl border border-gray-800 overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead className="bg-gray-800">
                      <tr>
                        <th className="p-4 text-left font-semibold">Key</th>
                        <th className="p-4 text-left font-semibold">Status</th>
                        <th className="p-4 text-left font-semibold">Sold To</th>
                        <th className="p-4 text-left font-semibold">Sold At</th>
                        <th className="p-4 text-left font-semibold">Added</th>
                        <th className="p-4 text-left font-semibold">Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {loading ? (
                        <tr>
                          <td colSpan="6" className="p-8 text-center text-gray-400">
                            Loading keys...
                          </td>
                        </tr>
                      ) : keys.length === 0 ? (
                        <tr>
                          <td colSpan="6" className="p-8 text-center text-gray-400">
                            No keys found. Add some keys to get started.
                          </td>
                        </tr>
                      ) : (
                        keys.map((k) => (
                          <tr key={k._id} className="border-t border-gray-800 hover:bg-gray-800/50 transition">
                            <td className="p-4 font-mono text-green-400">{k.key}</td>
                            <td className="p-4">
                              <span className={`px-2 py-1 rounded text-sm ${k.isSold ? 'bg-red-500/20 text-red-400' : 'bg-green-500/20 text-green-400'
                                }`}>
                                {k.isSold ? 'Sold' : 'Available'}
                              </span>
                            </td>
                            <td className="p-4 text-gray-400">
                              {k.soldTo ? k.soldTo.username : '-'}
                            </td>
                            <td className="p-4 text-gray-400">
                              {k.soldAt ? new Date(k.soldAt).toLocaleDateString() : '-'}
                            </td>
                            <td className="p-4 text-gray-400">
                              {new Date(k.addedAt).toLocaleDateString()}
                            </td>
                            <td className="p-4">
                              {!k.isSold && (
                                <button
                                  onClick={() => handleDeleteKey(k._id)}
                                  className="text-red-500 hover:text-red-400 flex items-center gap-1"
                                >
                                  <Trash2 className="w-4 h-4" /> Delete
                                </button>
                              )}
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </>
          )}
        </div>
      </div>

      {/* Add Keys Modal */}
      {showAddModal && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4">
          <div className="bg-gray-900 p-8 rounded-2xl w-full max-w-2xl relative border border-gray-800">
            <h2 className="text-2xl font-bold mb-6">Add Product Keys</h2>
            <button
              onClick={() => setShowAddModal(false)}
              className="absolute top-6 right-6 text-gray-400 hover:text-white"
            >
              <X className="w-6 h-6" />
            </button>

            <div className="mb-4">
              <label className="block text-sm font-medium mb-2">
                Keys (one per line)
              </label>
              <textarea
                value={bulkKeys}
                onChange={(e) => setBulkKeys(e.target.value)}
                placeholder="XXXX-XXXX-XXXX-XXXX&#10;YYYY-YYYY-YYYY-YYYY&#10;ZZZZ-ZZZZ-ZZZZ-ZZZZ"
                rows="10"
                className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-3 text-white font-mono text-sm focus:outline-none focus:border-blue-500"
              />
              <p className="text-xs text-gray-400 mt-2">
                Enter keys purchased from the supplier, one per line
              </p>
            </div>

            <div className="mb-6">
              <label className="block text-sm font-medium mb-2">
                Notes (Optional)
              </label>
              <input
                type="text"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="e.g., Batch #123, Supplier: XYZ"
                className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-3 text-white focus:outline-none focus:border-blue-500"
              />
            </div>

            <button
              onClick={handleAddBulkKeys}
              className="w-full bg-gradient-to-r from-blue-600 to-green-600 px-6 py-3 rounded-lg hover:from-blue-700 hover:to-green-700 transition font-semibold"
            >
              Add Keys
            </button>
          </div>
        </div>
      )}
    </div>
  );
}