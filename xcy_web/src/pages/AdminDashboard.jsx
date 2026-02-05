/* eslint-disable no-unused-vars */
import React, { useState, useEffect, useMemo } from "react";
import { Link, useNavigate } from "react-router-dom";
import { isAuthenticated, getUser, logout, isAdmin } from "../utils/auth";
import { productAPI, categoryAPI, guideAPI, featureListAPI, promoCodeAPI, userAPI, productKeyAPI, statsAPI } from "../utils/api";
import { Plus, Trash2, Edit, Gamepad2, X, Shield, Key, User as UserIcon, AlertCircle, MessageCircle } from "lucide-react";

export default function AdminDashboard() {
    const navigate = useNavigate();
    const user = isAuthenticated() ? getUser() : null;
    const rolePriority = ["dev", "admin", "user"];
    const [products, setProducts] = useState([]);
    const [productStats, setProductStats] = useState([]);
    const [loading, setLoading] = useState(true);
    const [showAddModal, setShowAddModal] = useState(false);
    const [purchaseStats, setPurchaseStats] = useState([]);
    const [newProduct, setNewProduct] = useState({
        name: "",
        game: "",
        category: "FPS",
        price: "",
        pricing: {
            '1day': "",
            '1week': ""
        },
        downloadUrl: "",
        image: "",
        features: "",
        status: "Undetected",
    });
    const [categories, setCategories] = useState([]);
    const [showAddCategoryModal, setShowAddCategoryModal] = useState(false);
    const [newCategory, setNewCategory] = useState({
        name: "",
        image: "",
        game: ""
    });
    const [editingProduct, setEditingProduct] = useState(null);
    const [editingCategory, setEditingCategory] = useState(null);
    const [guides, setGuides] = useState([]);
    const [showAddGuideModal, setShowAddGuideModal] = useState(false);
    const [editingGuide, setEditingGuide] = useState(null);
    const [newGuide, setNewGuide] = useState({
        game: "",
        title: "",
        content: ""
    });
    const [featureLists, setFeatureLists] = useState([]);
    const [showAddFeatureListModal, setShowAddFeatureListModal] = useState(false);
    const [editingFeatureList, setEditingFeatureList] = useState(null);
    const [newFeatureList, setNewFeatureList] = useState({
        productId: "",
        sections: [{ title: "", features: [""] }]
    });
    const [promoCodes, setPromoCodes] = useState([]);
    const [showAddPromoModal, setShowAddPromoModal] = useState(false);
    const [editingPromo, setEditingPromo] = useState(null);
    const [newPromo, setNewPromo] = useState({
        code: "",
        discountType: "percentage",
        discountValue: "",
        applicableGames: [],
        minPurchaseAmount: "",
        maxUses: "",
        expiresAt: ""
    });
    const [users, setUsers] = useState([]);
    const [showUserModal, setShowUserModal] = useState(false);
    const [selectedUser, setSelectedUser] = useState(null);
    const [userOrders, setUserOrders] = useState([]);
    const [showOrdersModal, setShowOrdersModal] = useState(false);
    const [showPasswordModal, setShowPasswordModal] = useState(false);
    const [newPassword, setNewPassword] = useState('');
    const [editUserData, setEditUserData] = useState({
        username: '',
        email: '',
        isAdmin: false
    });
    const [revenueStats, setRevenueStats] = useState({
        totalRevenue: 0,
        totalOrders: 0
    });
    const [selectedProductForKeys, setSelectedProductForKeys] = useState('');
    const [productKeys, setProductKeys] = useState([]);
    const [keyStats, setKeyStats] = useState(null);
    const [showAddKeysModal, setShowAddKeysModal] = useState(false);
    const [bulkKeys, setBulkKeys] = useState('');
    const [keyNotes, setKeyNotes] = useState('');
    const [loadingKeys, setLoadingKeys] = useState(false);
    const [keyType, setKeyType] = useState('1day');
    const [isBulk, setIsBulk] = useState(false);
    const [singleKey, setSingleKey] = useState('');

    const KEY_TYPE_META = {
        '1day': {
            label: '1 Day',
            classes: 'bg-orange-500/20 text-orange-400'
        },
        '1week': {
            label: '1 Week',
            classes: 'bg-blue-500/20 text-blue-400'
        },
        '1month': {
            label: '1 Month',
            classes: 'bg-purple-500/20 text-purple-400'
        }
    };

    const getPrimaryRole = (user) => {
        const roles = Array.isArray(user.roles) ? user.roles : user.role ? [user.role] : ["user"];
        return rolePriority.find((r) => roles.includes(r)) || "user";
    };

    const canManageUser = (targetUser) => {
        if (!user) return false;

        const targetPrimaryRole = getPrimaryRole(targetUser);
        const currentUserPrimaryRole = getPrimaryRole(user);

        // Admins cannot manage devs (even if they are also admin)
        if (currentUserPrimaryRole === "admin" && targetPrimaryRole === "dev") {
            return false;
        }

        return true;
    };

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
        const fetchStats = async () => {
            try {
                const res = await statsAPI.getAllProductStats();
                setProductStats(res.data);
            } catch (err) {
                console.error('Failed to fetch product stats', err);
            }
        };

        fetchStats();
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
                const res = await categoryAPI.getAll();
                setCategories(res.data.categories || []);
            } catch (err) {
                console.error('Error fetching categories:', err);
            }
        };

        fetchCategories();
    }, []);

    useEffect(() => {
        const fetchGuides = async () => {
            try {
                const res = await guideAPI.getAll();
                setGuides(res.data.guides || []);
            } catch (err) {
                console.error('Error fetching guides:', err);
            }
        };

        fetchGuides();
    }, []);

    useEffect(() => {
        const fetchFeatureLists = async () => {
            try {
                // Fetch all products first, then get their feature lists
                const lists = await Promise.all(
                    products.map(async (product) => {
                        try {
                            const res = await featureListAPI.get(product._id);
                            if (res.data.featureList && res.data.featureList.sections) {  // ADD SECTIONS CHECK
                                return {
                                    ...res.data.featureList,
                                    productName: product.name,
                                    productGame: product.game
                                };
                            }
                            return null;
                        } catch (err) {
                            return null;
                        }
                    })
                );
                setFeatureLists(lists.filter(l => l !== null && l.sections)); // FILTER OUT NULL AND ITEMS WITHOUT SECTIONS
            } catch (err) {
                console.error('Error fetching feature lists:', err);
            }
        };

        if (products.length > 0) {
            fetchFeatureLists();
        }
    }, [products]);

    useEffect(() => {
        const fetchPromoCodes = async () => {
            try {
                const res = await promoCodeAPI.getAll();
                const promoCodes = res.data.promoCodes || [];
                // Ensure all promo codes have applicableGames array
                const validPromoCodes = promoCodes.map(promo => ({
                    ...promo,
                    applicableGames: Array.isArray(promo.applicableGames) ? promo.applicableGames : []
                }));
                setPromoCodes(validPromoCodes);
            } catch (err) {
                console.error('Error fetching promo codes:', err);
            }
        };

        fetchPromoCodes();
    }, []);

    useEffect(() => {
        const fetchUsers = async () => {
            try {
                const res = await userAPI.getAll();
                setUsers(res.data.users || []);
            } catch (err) {
                console.error('Error fetching users:', err);
            }
        };

        fetchUsers();
    }, []);

    useEffect(() => {
        const fetchRevenue = async () => {
            try {
                const res = await userAPI.getRevenue();
                setRevenueStats({
                    totalRevenue: res.data.revenue || 0,
                    totalOrders: res.data.orders || 0
                });
            } catch (err) {
                console.error('Error fetching revenue:', err);
            }
        };

        fetchRevenue();
    }, []);

    const getStatsForProduct = (productId) => {
        const id = String(productId);

        return productStats.find(
            s => s.productId === id
        ) ?? { purchases: 0 };
    };

    const totalPurchases = useMemo(() => {
        return productStats.reduce((sum, stat) => sum + (stat.purchases || 0), 0);
    }, [productStats]);

    const handleAddProduct = async () => {
        try {
            const featuresArray = newProduct.features
                .split(',')
                .map(f => f.trim())
                .filter(f => f.length > 0);

            const productData = {
                ...newProduct,
                features: featuresArray,
                price: parseFloat(newProduct.price),
                rating: parseFloat(newProduct.rating),
                pricing: {
                    '1day': newProduct.pricing['1day'] ? parseFloat(newProduct.pricing['1day']) : null,
                    '1week': newProduct.pricing['1week'] ? parseFloat(newProduct.pricing['1week']) : null
                }
            };

            const res = await productAPI.create(productData);
            setProducts([...products, res.data.product]);
            setShowAddModal(false);
            setNewProduct({
                name: "",
                game: "",
                category: "FPS",
                price: "",
                pricing: { '1day': "", '1week': "" },
                downloadUrl: "",
                image: "",
                features: "",
                status: "Undetected",
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
            const res = await categoryAPI.create(newCategory);
            setCategories([...categories, res.data.category]);
            setShowAddCategoryModal(false);
            setNewCategory({ name: "", image: "", game: "" });
            alert('Category added successfully!');
        } catch (err) {
            console.error('Error adding category:', err);
            alert(err.response?.data?.message || "Error adding category");
        }
    };

    const handleUpdateProduct = async () => {
        try {
            const featuresArray = newProduct.features
                .split(",")
                .map(f => f.trim())
                .filter(Boolean);

            const productData = {
                ...newProduct,
                features: featuresArray,
                price: parseFloat(newProduct.price),
                pricing: {
                    '1day': newProduct.pricing['1day'] ? parseFloat(newProduct.pricing['1day']) : null,
                    '1week': newProduct.pricing['1week'] ? parseFloat(newProduct.pricing['1week']) : null
                }
            };

            const res = await productAPI.update(editingProduct._id, productData);

            setProducts(products.map(p =>
                p._id === editingProduct._id ? res.data.product : p
            ));

            setShowAddModal(false);
            setEditingProduct(null);
            alert("Product updated successfully!");
        } catch (err) {
            alert(err.response?.data?.message || "Error updating product");
        }
    };


    const handleUpdateCategory = async () => {
        if (!newCategory.name || !newCategory.game) {
            alert('Please provide category name and game');
            return;
        }

        try {
            const res = await categoryAPI.update(editingCategory._id, newCategory);
            setCategories(categories.map(c => c._id === editingCategory._id ? res.data.category : c));
            setShowAddCategoryModal(false);
            setEditingCategory(null);
            setNewCategory({ name: "", image: "", game: "" });
            alert('Category updated successfully!');
        } catch (err) {
            console.error('Error updating category:', err);
            alert(err.response?.data?.message || "Error updating category");
        }
    };


    const handleRemoveCategory = async (id) => {
        if (!window.confirm("Are you sure you want to remove this category?")) return;

        try {
            await categoryAPI.delete(id);
            setCategories(categories.filter((c) => c._id !== id));
            alert('Category removed successfully!');
        } catch (err) {
            console.error('Error removing category:', err);
            alert(err.response?.data?.message || "Error removing category");
        }
    };

    const handleAddGuide = async () => {
        if (!newGuide.game || !newGuide.title || !newGuide.content) {
            alert('Please fill in all fields');
            return;
        }

        try {
            const res = await guideAPI.create(newGuide);
            setGuides([...guides, res.data.guide]);
            setShowAddGuideModal(false);
            setNewGuide({ game: "", title: "", content: "" });
            alert('Installation guide added successfully!');
        } catch (err) {
            console.error('Error adding guide:', err);
            alert(err.response?.data?.message || "Error adding guide");
        }
    };

    const handleUpdateGuide = async () => {
        if (!newGuide.game || !newGuide.title || !newGuide.content) {
            alert('Please fill in all fields');
            return;
        }

        try {
            const res = await guideAPI.update(editingGuide._id, newGuide);
            setGuides(guides.map(g => g._id === editingGuide._id ? res.data.guide : g));
            setShowAddGuideModal(false);
            setEditingGuide(null);
            setNewGuide({ game: "", title: "", content: "" });
            alert('Installation guide updated successfully!');
        } catch (err) {
            console.error('Error updating guide:', err);
            alert(err.response?.data?.message || "Error updating guide");
        }
    };

    const handleRemoveGuide = async (id) => {
        if (!window.confirm("Are you sure you want to remove this guide?")) return;

        try {
            await guideAPI.delete(id);
            setGuides(guides.filter((g) => g._id !== id));
            alert('Installation guide removed successfully!');
        } catch (err) {
            console.error('Error removing guide:', err);
            alert(err.response?.data?.message || "Error removing guide");
        }
    };

    const addFeatureSection = () => {
        setNewFeatureList({
            ...newFeatureList,
            sections: [...newFeatureList.sections, { title: "", features: [""] }]
        });
    };

    const removeFeatureSection = (sectionIndex) => {
        const newSections = newFeatureList.sections.filter((_, i) => i !== sectionIndex);
        setNewFeatureList({ ...newFeatureList, sections: newSections });
    };

    const updateFeatureSectionTitle = (sectionIndex, title) => {
        const newSections = [...newFeatureList.sections];
        newSections[sectionIndex].title = title;
        setNewFeatureList({ ...newFeatureList, sections: newSections });
    };

    const addFeatureItem = (sectionIndex) => {
        const newSections = [...newFeatureList.sections];
        newSections[sectionIndex].features.push("");
        setNewFeatureList({ ...newFeatureList, sections: newSections });
    };

    const removeFeatureItem = (sectionIndex, featureIndex) => {
        const newSections = [...newFeatureList.sections];
        newSections[sectionIndex].features.splice(featureIndex, 1);
        setNewFeatureList({ ...newFeatureList, sections: newSections });
    };

    const updateFeatureItem = (sectionIndex, featureIndex, value) => {
        const newSections = [...newFeatureList.sections];
        newSections[sectionIndex].features[featureIndex] = value;
        setNewFeatureList({ ...newFeatureList, sections: newSections });
    };

    const handleAddFeatureList = async () => {
        if (!newFeatureList.productId) {
            alert('Please select a product');
            return;
        }

        try {
            // Filter out empty sections and features
            const cleanedSections = newFeatureList.sections
                .filter(s => s.title.trim())
                .map(s => ({
                    title: s.title,
                    features: s.features.filter(f => f.trim())
                }))
                .filter(s => s.features.length > 0);

            if (cleanedSections.length === 0) {
                alert('Please add at least one section with features');
                return;
            }

            await featureListAPI.create({
                productId: newFeatureList.productId,
                sections: cleanedSections
            });

            // Refresh feature lists
            const product = products.find(p => p._id === newFeatureList.productId);
            const res = await featureListAPI.get(newFeatureList.productId);
            setFeatureLists([...featureLists, {
                ...res.data.featureList,
                productName: product.name,
                productGame: product.game
            }]);

            setShowAddFeatureListModal(false);
            setNewFeatureList({
                productId: "",
                sections: [{ title: "", features: [""] }]
            });
            alert('Feature list added successfully!');
        } catch (err) {
            console.error('Error adding feature list:', err);
            alert(err.response?.data?.message || "Error adding feature list");
        }
    };

    const handleUpdateFeatureList = async () => {
        try {
            const cleanedSections = newFeatureList.sections
                .filter(s => s.title.trim())
                .map(s => ({
                    title: s.title,
                    features: s.features.filter(f => f.trim())
                }))
                .filter(s => s.features.length > 0);

            if (cleanedSections.length === 0) {
                alert('Please add at least one section with features');
                return;
            }

            await featureListAPI.create({
                productId: editingFeatureList.productId,
                sections: cleanedSections
            });

            // Refresh feature lists
            const product = products.find(p => p._id === editingFeatureList.productId);
            const res = await featureListAPI.get(editingFeatureList.productId);
            setFeatureLists(featureLists.map(fl =>
                fl.productId === editingFeatureList.productId
                    ? { ...res.data.featureList, productName: product.name, productGame: product.game }
                    : fl
            ));

            setShowAddFeatureListModal(false);
            setEditingFeatureList(null);
            setNewFeatureList({
                productId: "",
                sections: [{ title: "", features: [""] }]
            });
            alert('Feature list updated successfully!');
        } catch (err) {
            console.error('Error updating feature list:', err);
            alert(err.response?.data?.message || "Error updating feature list");
        }
    };

    const handleRemoveFeatureList = async (productId) => {
        if (!window.confirm("Are you sure you want to remove this feature list?")) return;

        try {
            await featureListAPI.delete(productId);
            setFeatureLists(featureLists.filter((fl) => fl.productId !== productId));
            alert('Feature list removed successfully!');
        } catch (err) {
            console.error('Error removing feature list:', err);
            alert(err.response?.data?.message || "Error removing feature list");
        }
    };

    const handleAddPromo = async () => {
        if (!newPromo.code || !newPromo.discountValue) {
            alert('Please provide code and discount value');
            return;
        }

        try {
            const promoData = {
                code: newPromo.code,
                discountType: newPromo.discountType,
                discountValue: parseFloat(newPromo.discountValue),
                applicableGames: newPromo.applicableGames,
                minPurchaseAmount: newPromo.minPurchaseAmount ? parseFloat(newPromo.minPurchaseAmount) : 0,
                maxUses: newPromo.maxUses ? parseInt(newPromo.maxUses) : null,
                expiresAt: newPromo.expiresAt || null
            };

            const res = await promoCodeAPI.create(promoData);
            setPromoCodes([...promoCodes, res.data.promoCode]);
            setShowAddPromoModal(false);
            setNewPromo({
                code: "",
                discountType: "percentage",
                discountValue: "",
                applicableGames: [],
                minPurchaseAmount: "",
                maxUses: "",
                expiresAt: ""
            });
            alert('Promo code added successfully!');
        } catch (err) {
            console.error('Error adding promo code:', err);
            alert(err.response?.data?.message || "Error adding promo code");
        }
    };

    const handleUpdatePromo = async () => {
        if (!newPromo.code || !newPromo.discountValue) {
            alert('Please provide code and discount value');
            return;
        }

        try {
            const promoData = {
                code: newPromo.code,
                discountType: newPromo.discountType,
                discountValue: parseFloat(newPromo.discountValue),
                applicableGames: newPromo.applicableGames,
                minPurchaseAmount: newPromo.minPurchaseAmount ? parseFloat(newPromo.minPurchaseAmount) : 0,
                maxUses: newPromo.maxUses ? parseInt(newPromo.maxUses) : null,
                expiresAt: newPromo.expiresAt || null,
                isActive: newPromo.isActive
            };

            const res = await promoCodeAPI.update(editingPromo._id, promoData);
            setPromoCodes(promoCodes.map(p => p._id === editingPromo._id ? res.data.promoCode : p));
            setShowAddPromoModal(false);
            setEditingPromo(null);
            setNewPromo({
                code: "",
                discountType: "percentage",
                discountValue: "",
                applicableGames: [],
                minPurchaseAmount: "",
                maxUses: "",
                expiresAt: ""
            });
            alert('Promo code updated successfully!');
        } catch (err) {
            console.error('Error updating promo code:', err);
            alert(err.response?.data?.message || "Error updating promo code");
        }
    };

    const handleRemovePromo = async (id) => {
        if (!window.confirm("Are you sure you want to remove this promo code?")) return;

        try {
            await promoCodeAPI.delete(id);
            setPromoCodes(promoCodes.filter((p) => p._id !== id));
            alert('Promo code removed successfully!');
        } catch (err) {
            console.error('Error removing promo code:', err);
            alert(err.response?.data?.message || "Error removing promo code");
        }
    };

    const toggleGameSelection = (game) => {
        const games = [...newPromo.applicableGames];
        const index = games.indexOf(game);

        if (index > -1) {
            games.splice(index, 1);
        } else {
            games.push(game);
        }

        setNewPromo({ ...newPromo, applicableGames: games });
    };

    const handleViewOrders = async (user) => {
        try {
            const res = await userAPI.getOrders(user._id);
            setUserOrders(res.data.orders || []);
            setSelectedUser(user);
            setShowOrdersModal(true);
        } catch (err) {
            console.error('Error fetching user orders:', err);
            alert('Error fetching orders');
        }
    };

    const handleEditUser = (user) => {
        setSelectedUser(user);
        setEditUserData({
            username: user.username,
            email: user.email,
            isAdmin: user.isAdmin || false
        });
        setShowUserModal(true);
    };

    const handleUpdateUser = async () => {
        if (!editUserData.username || !editUserData.email) {
            alert('Please provide username and email');
            return;
        }

        try {
            const res = await userAPI.update(selectedUser._id, editUserData);
            setUsers(users.map(u => u._id === selectedUser._id ? res.data.user : u));
            setShowUserModal(false);
            setSelectedUser(null);
            alert('User updated successfully!');
        } catch (err) {
            console.error('Error updating user:', err);
            alert(err.response?.data?.message || "Error updating user");
        }
    };

    const handleResetPassword = async () => {
        if (!newPassword || newPassword.length < 6) {
            alert('Password must be at least 6 characters');
            return;
        }

        try {
            await userAPI.resetPassword(selectedUser._id, newPassword);
            setShowPasswordModal(false);
            setNewPassword('');
            setSelectedUser(null);
            alert('Password reset successfully!');
        } catch (err) {
            console.error('Error resetting password:', err);
            alert(err.response?.data?.message || "Error resetting password");
        }
    };

    const handleDeleteUser = async (userId) => {
        if (!window.confirm("Are you sure you want to delete this user? This action cannot be undone.")) return;

        try {
            await userAPI.delete(userId);
            setUsers(users.filter((u) => u._id !== userId));
            alert('User deleted successfully!');
        } catch (err) {
            console.error('Error deleting user:', err);
            alert(err.response?.data?.message || "Error deleting user");
        }
    };

    const fetchProductKeys = async (productId) => {
        setLoadingKeys(true);
        try {
            const res = await productKeyAPI.getAll(productId, 1, 100, 'all');
            setProductKeys(res.data.keys || []);
        } catch (err) {
            console.error('Error fetching keys:', err);
        } finally {
            setLoadingKeys(false);
        }
    };

    const fetchKeyStats = async (productId) => {
        try {
            const res = await productKeyAPI.getStats(productId);
            setKeyStats(res.data.stats || null);
        } catch (err) {
            console.error('Error fetching stats:', err);
        }
    };

    const handleProductSelectForKeys = (productId) => {
        setSelectedProductForKeys(productId);
        if (productId) {
            fetchProductKeys(productId);
            fetchKeyStats(productId);
        } else {
            setProductKeys([]);
            setKeyStats(null);
        }
    };

    const handleAddKeys = async () => {
        if (!selectedProductForKeys) {
            alert('Please select a product');
            return;
        }

        try {
            if (isBulk) {
                const keysArray = bulkKeys
                    .split('\n')
                    .map(k => k.trim())
                    .filter(k => k.length > 0);

                if (keysArray.length === 0) {
                    alert('Please enter at least one key');
                    return;
                }

                const res = await productKeyAPI.addBulk(selectedProductForKeys, keysArray, keyNotes, keyType);
                alert(res.data.message);
            } else {
                if (!singleKey.trim()) {
                    alert('Please enter a key');
                    return;
                }

                const res = await productKeyAPI.addSingle(selectedProductForKeys, singleKey, keyNotes, keyType);
                alert(res.data.message);
            }

            // Reset
            setShowAddKeysModal(false);
            setSingleKey('');
            setBulkKeys('');
            setKeyNotes('');
            setKeyType('1day');
            setIsBulk(false);

            // Refresh
            fetchProductKeys(selectedProductForKeys);
            fetchKeyStats(selectedProductForKeys);
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
            fetchProductKeys(selectedProductForKeys);
            fetchKeyStats(selectedProductForKeys);
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
                                XCY BEAMER - Admin
                            </span>
                        </Link>

                        <div className="hidden md:flex space-x-8">
                            <Link to="/" className="hover:text-blue-400 transition">Home</Link>
                            <Link to="/products" className="hover:text-blue-400 transition">Products</Link>
                            <Link to="/status" className="hover:text-blue-400 transition">Status</Link>
                            <Link to="/support" className="hover:text-blue-400 transition">Support</Link>
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
                        <h2 className="text-lg font-semibold mb-2 text-gray-400">Total Orders</h2>
                        <p className="text-3xl font-bold text-green-400">{revenueStats.totalOrders.toLocaleString()}</p>
                    </div>
                    <div className="bg-gradient-to-br from-gray-900 to-gray-800 p-6 rounded-xl border border-gray-700">
                        <h2 className="text-lg font-semibold mb-2 text-gray-400">Total Revenue</h2>
                        <p className="text-3xl font-bold text-purple-400">${revenueStats.totalRevenue.toFixed(2)}</p>
                    </div>
                </div>

                <button
                    className="flex items-center gap-2 bg-gradient-to-r from-blue-600 to-green-600 px-6 py-3 rounded-lg mb-6 hover:from-blue-700 hover:to-green-700 transition font-semibold"
                    onClick={() => {
                        setEditingProduct(null);
                        setNewProduct({
                            name: "",
                            game: "",
                            category: "FPS",
                            price: "",
                            pricing: {
                                "1day": "",
                                "1week": ""
                            },
                            downloadUrl: "",
                            image: "",
                            features: "",
                            status: "Undetected",
                        });
                        setShowAddModal(true);
                    }}
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
                                            <td className="p-4 text-gray-400">{getStatsForProduct(p._id).purchases || 0}</td>
                                            <td className="p-4 text-yellow-400">⭐ {p.rating}</td>
                                            <td className="p-4">
                                                <span className={`px-2 py-1 rounded text-sm ${p.status === 'Undetected' ? 'bg-green-500/20 text-green-400' :
                                                    p.status === 'Detected' ? 'bg-yellow-500/20 text-yellow-400' :
                                                        'bg-blue-500/20 text-blue-400'
                                                    }`}>
                                                    {p.status}
                                                </span>
                                            </td>
                                            <td className="p-4">
                                                <div className="flex gap-3">
                                                    <button
                                                        onClick={() => {
                                                            setEditingProduct(p);
                                                            setNewProduct({
                                                                ...p,
                                                                features: Array.isArray(p.features) ? p.features.join(", ") : "",
                                                                pricing: {
                                                                    '1day': p.pricing?.['1day'] || "",
                                                                    '1week': p.pricing?.['1week'] || ""
                                                                }
                                                            });
                                                            setShowAddModal(true);
                                                        }}
                                                        className="text-blue-400 hover:text-blue-300 flex items-center gap-1"
                                                    >
                                                        <Edit className="w-4 h-4" /> Edit
                                                    </button>

                                                    <button
                                                        onClick={() => handleRemoveProduct(p._id)}
                                                        className="text-red-500 hover:text-red-400 flex items-center gap-1"
                                                    >
                                                        <Trash2 className="w-4 h-4" /> Remove
                                                    </button>
                                                </div>
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
            <div className="pt-8 px-8">

                {/* Add Category Button */}
                <button
                    className="flex items-center gap-2 bg-gradient-to-r from-blue-600 to-green-600 px-6 py-3 rounded-lg mb-6 hover:from-blue-700 hover:to-green-700 transition font-semibold"
                    onClick={() => setShowAddCategoryModal(true)}
                >
                    <Plus className="w-5 h-5" /> Add Category
                </button>

                <div className="bg-gradient-to-br from-gray-900 to-gray-800 border border-gray-700 rounded-2xl overflow-hidden">

                    {/* Table Header */}
                    <div className="grid grid-cols-5 px-6 py-4 text-sm font-semibold text-gray-300 border-b border-gray-700">
                        <div className="text-left">Icon</div>
                        <div className="text-left">Name</div>
                        <div className="text-left">Game</div>
                        <div className="text-center">Status</div>
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
                            <div className="text-left">
                                {cat.image && cat.image.startsWith("http") ? (
                                    // It's a URL, render as image
                                    <img
                                        src={cat.image}
                                        alt={cat.name}
                                        className="w-8 h-8 object-cover rounded-full"
                                    />
                                ) : (
                                    // Otherwise, treat it as an emoji
                                    <span className="text-2xl">{cat.image || "🎮"}</span>
                                )}
                            </div>

                            {/* Name */}
                            <div className="text-left font-semibold text-white">
                                {cat.name}
                            </div>

                            {/* Game */}
                            <div className="text-left text-gray-400">
                                {cat.game}
                            </div>

                            {/* Status */}
                            <div className="text-center">
                                <span className="bg-green-500/20 text-green-400 px-3 py-1 rounded-full text-xs font-semibold">
                                    Undetected
                                </span>
                            </div>

                            {/* Actions */}
                            <div className="flex gap-3">
                                <button
                                    onClick={() => {
                                        setEditingCategory(cat);
                                        setNewCategory({
                                            name: cat.name,
                                            game: cat.game,
                                            image: cat.image || "",
                                        });
                                        setShowAddCategoryModal(true);
                                    }}
                                    className="text-blue-400 hover:text-blue-300 flex items-center gap-1"
                                >
                                    <Edit className="w-4 h-4" />
                                    Edit
                                </button>

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

            {/* Installation Guides Management */}
            <div className="pt-8 px-8 pb-8">
                <h2 className="text-2xl font-bold mb-6">Installation Guides</h2>

                {/* Add Guide Button */}
                <button
                    className="flex items-center gap-2 bg-gradient-to-r from-blue-600 to-green-600 px-6 py-3 rounded-lg mb-6 hover:from-blue-700 hover:to-green-700 transition font-semibold"
                    onClick={() => {
                        setEditingGuide(null);
                        setNewGuide({ game: "", title: "", content: "" });
                        setShowAddGuideModal(true);
                    }}
                >
                    <Plus className="w-5 h-5" /> Add Installation Guide
                </button>

                <div className="bg-gradient-to-br from-gray-900 to-gray-800 border border-gray-700 rounded-2xl overflow-hidden">
                    {/* Table Header */}
                    <div className="grid grid-cols-5 px-6 py-4 text-sm font-semibold text-gray-300 border-b border-gray-700">
                        <div className="text-left">Game</div>
                        <div className="text-left col-span-2">Title</div>
                        <div className="text-center">Status</div>
                        <div className="text-right">Actions</div>
                    </div>

                    {/* Table Rows */}
                    {guides.length === 0 ? (
                        <div className="px-6 py-8 text-center text-gray-400">
                            No installation guides yet. Add one to get started.
                        </div>
                    ) : (
                        guides.map((guide) => (
                            <div
                                key={guide._id}
                                className="grid grid-cols-5 px-6 py-4 items-center border-b border-gray-700/50 hover:bg-gray-800/50 transition"
                            >
                                {/* Game */}
                                <div className="text-left font-semibold text-blue-400">
                                    {guide.game}
                                </div>

                                {/* Title */}
                                <div className="text-left col-span-2 text-white">
                                    {guide.title}
                                </div>

                                {/* Status */}
                                <div className="text-center">
                                    <span className="bg-green-500/20 text-green-400 px-3 py-1 rounded-full text-xs font-semibold">
                                        Published
                                    </span>
                                </div>

                                {/* Actions */}
                                <div className="text-right">
                                    <div className="flex gap-3 justify-end">
                                        <button
                                            onClick={() => {
                                                setEditingGuide(guide);
                                                setNewGuide({
                                                    game: guide.game,
                                                    title: guide.title,
                                                    content: guide.content
                                                });
                                                setShowAddGuideModal(true);
                                            }}
                                            className="text-blue-400 hover:text-blue-300 flex items-center gap-1"
                                        >
                                            <Edit className="w-4 h-4" />
                                            Edit
                                        </button>

                                        <button
                                            onClick={() => handleRemoveGuide(guide._id)}
                                            className="text-red-500 hover:text-red-400 flex items-center gap-1"
                                        >
                                            <Trash2 className="w-4 h-4" />
                                            Remove
                                        </button>
                                    </div>
                                </div>
                            </div>
                        ))
                    )}
                </div>
            </div>

            {/* Feature Lists Management */}
            <div className="pt-8 px-8 pb-8">
                <h2 className="text-2xl font-bold mb-6">Product Feature Lists</h2>

                {/* Add Feature List Button */}
                <button
                    className="flex items-center gap-2 bg-gradient-to-r from-blue-600 to-green-600 px-6 py-3 rounded-lg mb-6 hover:from-blue-700 hover:to-green-700 transition font-semibold"
                    onClick={() => {
                        setEditingFeatureList(null);
                        setNewFeatureList({
                            productId: "",
                            sections: [{ title: "", features: [""] }]
                        });
                        setShowAddFeatureListModal(true);
                    }}
                >
                    <Plus className="w-5 h-5" /> Add Feature List
                </button>

                <div className="bg-gradient-to-br from-gray-900 to-gray-800 border border-gray-700 rounded-2xl overflow-hidden">
                    {/* Table Header */}
                    <div className="grid grid-cols-5 px-6 py-4 text-sm font-semibold text-gray-300 border-b border-gray-700">
                        <div className="text-left">Game</div>
                        <div className="text-left col-span-2">Product</div>
                        <div className="text-center">Sections</div>
                        <div className="text-right">Actions</div>
                    </div>

                    {/* Table Rows */}
                    {featureLists.length === 0 ? (
                        <div className="px-6 py-8 text-center text-gray-400">
                            No feature lists yet. Add one to get started.
                        </div>
                    ) : (
                        featureLists.map((featureList) => (
                            <div
                                key={featureList.productId}
                                className="grid grid-cols-5 px-6 py-4 items-center border-b border-gray-700/50 hover:bg-gray-800/50 transition"
                            >
                                {/* Game */}
                                <div className="text-left font-semibold text-blue-400">
                                    {featureList.productGame}
                                </div>

                                {/* Product Name */}
                                <div className="text-left col-span-2 text-white">
                                    {featureList.productName}
                                </div>

                                {/* Sections Count */}
                                <div className="text-center">
                                    <span className="bg-green-500/20 text-green-400 px-3 py-1 rounded-full text-xs font-semibold">
                                        {featureList.sections.length} sections
                                    </span>
                                </div>

                                {/* Actions */}
                                <div className="text-right">
                                    <div className="flex gap-3 justify-end">
                                        <button
                                            onClick={() => {
                                                setEditingFeatureList(featureList);
                                                setNewFeatureList({
                                                    productId: featureList.productId,
                                                    sections: featureList.sections
                                                });
                                                setShowAddFeatureListModal(true);
                                            }}
                                            className="text-blue-400 hover:text-blue-300 flex items-center gap-1"
                                        >
                                            <Edit className="w-4 h-4" />
                                            Edit
                                        </button>

                                        <button
                                            onClick={() => handleRemoveFeatureList(featureList.productId)}
                                            className="text-red-500 hover:text-red-400 flex items-center gap-1"
                                        >
                                            <Trash2 className="w-4 h-4" />
                                            Remove
                                        </button>
                                    </div>
                                </div>
                            </div>
                        ))
                    )}
                </div>
            </div>

            {/* Promo Codes Management */}
            <div className="pt-8 px-8 pb-8">
                <h2 className="text-2xl font-bold mb-6">Promo Codes</h2>

                {/* Add Promo Code Button */}
                <button
                    className="flex items-center gap-2 bg-gradient-to-r from-blue-600 to-green-600 px-6 py-3 rounded-lg mb-6 hover:from-blue-700 hover:to-green-700 transition font-semibold"
                    onClick={() => {
                        setEditingPromo(null);
                        setNewPromo({
                            code: "",
                            discountType: "percentage",
                            discountValue: "",
                            applicableGames: [],
                            minPurchaseAmount: "",
                            maxUses: "",
                            expiresAt: ""
                        });
                        setShowAddPromoModal(true);
                    }}
                >
                    <Plus className="w-5 h-5" /> Add Promo Code
                </button>

                <div className="bg-gradient-to-br from-gray-900 to-gray-800 border border-gray-700 rounded-2xl overflow-hidden">
                    {/* Table Header */}
                    <div className="grid grid-cols-7 px-6 py-4 text-sm font-semibold text-gray-300 border-b border-gray-700">
                        <div className="text-left">Code</div>
                        <div className="text-left">Discount</div>
                        <div className="text-left">Games</div>
                        <div className="text-center">Used</div>
                        <div className="text-center">Expires</div>
                        <div className="text-center">Status</div>
                        <div className="text-right">Actions</div>
                    </div>

                    {/* Table Rows */}
                    {promoCodes.length === 0 ? (
                        <div className="px-6 py-8 text-center text-gray-400">
                            No promo codes yet. Add one to get started.
                        </div>
                    ) : (
                        promoCodes.map((promo) => (
                            <div
                                key={promo._id}
                                className="grid grid-cols-7 px-6 py-4 items-center border-b border-gray-700/50 hover:bg-gray-800/50 transition"
                            >
                                {/* Code */}
                                <div className="text-left font-bold text-yellow-400">
                                    {promo.code}
                                </div>

                                {/* Discount */}
                                <div className="text-left text-white">
                                    {promo.discountType === 'percentage'
                                        ? `${promo.discountValue}%`
                                        : `$${promo.discountValue}`}
                                </div>

                                {/* Games */}
                                <div className="text-left text-gray-400 text-sm">
                                    {promo.applicableGames.length === 0
                                        ? 'All Games'
                                        : promo.applicableGames.length > 2
                                            ? `${promo.applicableGames.slice(0, 2).join(', ')}...`
                                            : promo.applicableGames.join(', ')}
                                </div>

                                {/* Usage */}
                                <div className="text-center text-gray-300">
                                    {promo.usedCount}
                                    {promo.maxUses ? `/${promo.maxUses}` : ''}
                                </div>

                                {/* Expiration */}
                                <div className="text-center text-gray-400 text-sm">
                                    {promo.expiresAt
                                        ? new Date(promo.expiresAt).toLocaleDateString()
                                        : 'Never'}
                                </div>

                                {/* Status */}
                                <div className="text-center">
                                    <span className={`px-3 py-1 rounded-full text-xs font-semibold ${promo.isActive
                                        ? 'bg-green-500/20 text-green-400'
                                        : 'bg-red-500/20 text-red-400'
                                        }`}>
                                        {promo.isActive ? 'Active' : 'Inactive'}
                                    </span>
                                </div>

                                {/* Actions */}
                                <div className="text-right">
                                    <div className="flex gap-3 justify-end">
                                        <button
                                            onClick={() => {
                                                setEditingPromo(promo);
                                                setNewPromo({
                                                    code: promo.code,
                                                    discountType: promo.discountType,
                                                    discountValue: promo.discountValue.toString(),
                                                    applicableGames: promo.applicableGames,
                                                    minPurchaseAmount: promo.minPurchaseAmount.toString(),
                                                    maxUses: promo.maxUses?.toString() || "",
                                                    expiresAt: promo.expiresAt ? new Date(promo.expiresAt).toISOString().split('T')[0] : "",
                                                    isActive: promo.isActive
                                                });
                                                setShowAddPromoModal(true);
                                            }}
                                            className="text-blue-400 hover:text-blue-300 flex items-center gap-1"
                                        >
                                            <Edit className="w-4 h-4" />
                                            Edit
                                        </button>

                                        <button
                                            onClick={() => handleRemovePromo(promo._id)}
                                            className="text-red-500 hover:text-red-400 flex items-center gap-1"
                                        >
                                            <Trash2 className="w-4 h-4" />
                                            Remove
                                        </button>
                                    </div>
                                </div>
                            </div>
                        ))
                    )}
                </div>
            </div>

            {/* User Management */}
            <div className="pt-8 px-8 pb-8">
                <h2 className="text-2xl font-bold mb-6">User Management</h2>

                <div className="bg-gradient-to-br from-gray-900 to-gray-800 border border-gray-700 rounded-2xl overflow-hidden">
                    {/* Table Header */}
                    <div className="grid grid-cols-6 px-6 py-4 text-sm font-semibold text-gray-300 border-b border-gray-700">
                        <div className="text-left">Username</div>
                        <div className="text-left">Email</div>
                        <div className="text-center">Role</div>
                        <div className="text-center">Orders</div>
                        <div className="text-center">Joined</div>
                        <div className="text-right">Actions</div>
                    </div>

                    {/* Table Rows */}
                    {users.length === 0 ? (
                        <div className="px-6 py-8 text-center text-gray-400">
                            No users found.
                        </div>
                    ) : (
                        [...users]
                            .sort((a, b) => {
                                const roleOrder = { dev: 0, admin: 1, user: 2 };
                                const aRole = getPrimaryRole(a);
                                const bRole = getPrimaryRole(b);
                                return (roleOrder[aRole] ?? 3) - (roleOrder[bRole] ?? 3);
                            })
                            .map((targetUser) => {
                                const primaryRole = getPrimaryRole(targetUser);
                                const disabled = !canManageUser(targetUser);

                                return (
                                    <div
                                        key={targetUser._id}
                                        className="grid grid-cols-6 px-6 py-4 items-center border-b border-gray-700/50 hover:bg-gray-800/50 transition"
                                    >
                                        {/* Username */}
                                        <div className="text-left font-semibold text-white flex items-center gap-2">
                                            <UserIcon className="w-4 h-4 text-blue-400" />
                                            {targetUser.username}
                                        </div>

                                        {/* Email */}
                                        <div className="text-left text-gray-400 text-sm">
                                            {targetUser.email}
                                        </div>

                                        {/* Role */}
                                        <div className="text-center">
                                            <span
                                                className={`px-3 py-1 rounded-full text-xs font-semibold ${primaryRole === "dev"
                                                    ? "bg-red-500/20 text-red-400"
                                                    : primaryRole === "admin"
                                                        ? "bg-purple-500/20 text-purple-400"
                                                        : "bg-gray-500/20 text-gray-400"
                                                    }`}
                                            >
                                                {primaryRole.toUpperCase()}
                                            </span>
                                        </div>

                                        {/* Orders */}
                                        <div className="text-center">
                                            <button
                                                onClick={() => handleViewOrders(targetUser)}
                                                className="text-blue-400 hover:text-blue-300 font-semibold"
                                            >
                                                View Orders
                                            </button>
                                        </div>

                                        {/* Joined */}
                                        <div className="text-center text-gray-400 text-sm">
                                            {new Date(targetUser.createdAt).toLocaleDateString()}
                                        </div>

                                        {/* Actions */}
                                        <div className="text-right">
                                            <div className="flex gap-2 justify-end">
                                                <button
                                                    onClick={() => handleEditUser(targetUser)}
                                                    disabled={disabled}
                                                    className={`flex items-center gap-1 text-sm ${disabled
                                                        ? "text-gray-600 cursor-not-allowed"
                                                        : "text-blue-400 hover:text-blue-300"
                                                        }`}
                                                    title={disabled ? "You cannot manage developers" : "Edit User"}
                                                >
                                                    <Edit className="w-4 h-4" />
                                                </button>

                                                <button
                                                    onClick={() => {
                                                        setSelectedUser(targetUser);
                                                        setShowPasswordModal(true);
                                                    }}
                                                    disabled={disabled}
                                                    className={`flex items-center gap-1 text-sm ${disabled
                                                        ? "text-gray-600 cursor-not-allowed"
                                                        : "text-yellow-400 hover:text-yellow-300"
                                                        }`}
                                                    title={disabled ? "You cannot manage developers" : "Reset Password"}
                                                >
                                                    <Key className="w-4 h-4" />
                                                </button>

                                                <button
                                                    onClick={() => handleDeleteUser(targetUser._id)}
                                                    disabled={disabled}
                                                    className={`flex items-center gap-1 text-sm ${disabled
                                                        ? "text-gray-600 cursor-not-allowed"
                                                        : "text-red-500 hover:text-red-400"
                                                        }`}
                                                    title={disabled ? "You cannot manage developers" : "Delete User"}
                                                >
                                                    <Trash2 className="w-4 h-4" />
                                                </button>
                                            </div>
                                        </div>
                                    </div>
                                );
                            })
                    )}
                </div>
            </div>

            {/* Product Key Management */}
            <div className="pt-8 px-8 pb-8">
                <h2 className="text-2xl font-bold mb-6">Product Key Management</h2>

                {/* Product Selector */}
                <div className="mb-6">
                    <label className="block text-sm font-medium mb-2">Select Product</label>
                    <select
                        value={selectedProductForKeys}
                        onChange={(e) => handleProductSelectForKeys(e.target.value)}
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

                {selectedProductForKeys && keyStats && (
                    <>
                        {/* Statistics */}
                        <div className="grid md:grid-cols-3 gap-6 mb-4">
                            <div className="bg-gradient-to-br from-gray-900 to-gray-800 p-6 rounded-xl border border-gray-700">
                                <h3 className="text-sm text-gray-400 mb-2">Total Keys</h3>
                                <p className="text-3xl font-bold text-blue-400">{keyStats.total}</p>
                            </div>
                            <div className="bg-gradient-to-br from-gray-900 to-gray-800 p-6 rounded-xl border border-gray-700">
                                <h3 className="text-sm text-gray-400 mb-2">Available</h3>
                                <p className="text-3xl font-bold text-green-400">{keyStats.available}</p>
                            </div>
                            <div className="bg-gradient-to-br from-gray-900 to-gray-800 p-6 rounded-xl border border-gray-700">
                                <h3 className="text-sm text-gray-400 mb-2">Sold</h3>
                                <p className="text-3xl font-bold text-purple-400">{keyStats.sold}</p>
                            </div>
                        </div>

                        {/* Key Type Breakdown */}
                        <div className="grid md:grid-cols-3 gap-4 mb-6">
                            {/* 1 Day */}
                            <div className="bg-gray-900 border border-gray-700 rounded-xl p-4 flex items-center justify-between">
                                <div className="flex items-center gap-3">
                                    <span className="bg-orange-500/20 text-orange-400 px-3 py-1 rounded-full text-xs font-semibold">
                                        1 Day
                                    </span>
                                    <span className="text-sm text-gray-400">Keys</span>
                                </div>
                                <div className="text-right">
                                    <span className="text-green-400 font-bold">
                                        {keyStats.byType?.["1day"]?.available || 0}
                                    </span>
                                    <span className="text-gray-500">
                                        {" "} / {keyStats.byType?.["1day"]?.total || 0}
                                    </span>
                                    <span className="text-gray-500 text-xs ml-2">available</span>
                                </div>
                            </div>

                            {/* 1 Week */}
                            <div className="bg-gray-900 border border-gray-700 rounded-xl p-4 flex items-center justify-between">
                                <div className="flex items-center gap-3">
                                    <span className="bg-blue-500/20 text-blue-400 px-3 py-1 rounded-full text-xs font-semibold">
                                        1 Week
                                    </span>
                                    <span className="text-sm text-gray-400">Keys</span>
                                </div>
                                <div className="text-right">
                                    <span className="text-green-400 font-bold">
                                        {keyStats.byType?.["1week"]?.available || 0}
                                    </span>
                                    <span className="text-gray-500">
                                        {" "} / {keyStats.byType?.["1week"]?.total || 0}
                                    </span>
                                    <span className="text-gray-500 text-xs ml-2">available</span>
                                </div>
                            </div>

                            {/* 1 Month */}
                            <div className="bg-gray-900 border border-gray-700 rounded-xl p-4 flex items-center justify-between">
                                <div className="flex items-center gap-3">
                                    <span className="bg-green-500/20 text-green-400 px-3 py-1 rounded-full text-xs font-semibold">
                                        1 Month
                                    </span>
                                    <span className="text-sm text-gray-400">Keys</span>
                                </div>
                                <div className="text-right">
                                    <span className="text-green-400 font-bold">
                                        {keyStats.byType?.["1month"]?.available || 0}
                                    </span>
                                    <span className="text-gray-500">
                                        {" "} / {keyStats.byType?.["1month"]?.total || 0}
                                    </span>
                                    <span className="text-gray-500 text-xs ml-2">available</span>
                                </div>
                            </div>
                        </div>

                        {/* Low Stock Warning (time-limited keys only) */}
                        {(() => {
                            const nonAvailable =
                                (keyStats.byType?.["1day"]?.available || 0) +
                                (keyStats.byType?.["1week"]?.available || 0);
                            (keyStats.byType?.["1month"]?.available || 0);

                            return nonAvailable < 10 ? (
                                <div className="bg-yellow-500/10 border border-yellow-500 rounded-lg p-4 mb-6 flex items-center gap-3">
                                    <AlertCircle className="w-6 h-6 text-yellow-500" />
                                    <div>
                                        <p className="font-semibold text-yellow-500">Low Stock Warning</p>
                                        <p className="text-sm text-gray-300">
                                            Only {nonAvailable} time-limited keys remaining
                                        </p>
                                    </div>
                                </div>
                            ) : null;
                        })()}

                        {/* Add Keys Button */}
                        <button
                            onClick={() => setShowAddKeysModal(true)}
                            className="flex items-center gap-2 bg-gradient-to-r from-blue-600 to-green-600 px-6 py-3 rounded-lg mb-6 hover:from-blue-700 hover:to-green-700 transition font-semibold"
                        >
                            <Plus className="w-5 h-5" /> Add Keys
                        </button>

                        {/* Keys Table */}
                        <div className="bg-gradient-to-br from-gray-900 to-gray-800 border border-gray-700 rounded-2xl overflow-hidden">
                            <div className="overflow-x-auto">
                                <table className="w-full">
                                    <thead className="bg-gray-800 border-b border-gray-700">
                                        <tr>
                                            <th className="p-4 text-left font-semibold text-gray-300">Key</th>
                                            <th className="p-4 text-left font-semibold text-gray-300">Type</th>
                                            <th className="p-4 text-left font-semibold text-gray-300">Status</th>
                                            <th className="p-4 text-left font-semibold text-gray-300">Sold To</th>
                                            <th className="p-4 text-left font-semibold text-gray-300">Expires</th>
                                            <th className="p-4 text-left font-semibold text-gray-300">Added</th>
                                            <th className="p-4 text-left font-semibold text-gray-300">Actions</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {loadingKeys ? (
                                            <tr>
                                                <td colSpan="7" className="p-8 text-center text-gray-400">
                                                    Loading keys...
                                                </td>
                                            </tr>
                                        ) : productKeys.length === 0 ? (
                                            <tr>
                                                <td colSpan="7" className="p-8 text-center text-gray-400">
                                                    No keys found. Add some keys to get started.
                                                </td>
                                            </tr>
                                        ) : (
                                            productKeys.map((k) => (
                                                <tr
                                                    key={k._id}
                                                    className="border-t border-gray-700/50 hover:bg-gray-800/50 transition"
                                                >
                                                    <td className="p-4 font-mono text-green-400">{k.key}</td>

                                                    <td className="p-4">
                                                        <span
                                                            className={`px-3 py-1 rounded-full text-xs font-semibold ${KEY_TYPE_META[k.keyType]?.classes ||
                                                                "bg-gray-500/20 text-gray-400"
                                                                }`}
                                                        >
                                                            {KEY_TYPE_META[k.keyType]?.label || "Unknown"}
                                                        </span>
                                                    </td>

                                                    <td className="p-4">
                                                        <span
                                                            className={`px-3 py-1 rounded-full text-xs font-semibold ${k.isSold
                                                                ? "bg-red-500/20 text-red-400"
                                                                : "bg-green-500/20 text-green-400"
                                                                }`}
                                                        >
                                                            {k.isSold ? "Sold" : "Available"}
                                                        </span>
                                                    </td>

                                                    <td className="p-4 text-gray-400">
                                                        {k.soldTo ? k.soldTo.username : "-"}
                                                    </td>

                                                    <td className="p-4 text-gray-400">
                                                        {k.expiresAt
                                                            ? new Date(k.expiresAt).toLocaleString()
                                                            : "-"}
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

            {/* Add Product Modal */}
            {showAddModal && (
                <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4">
                    <div className="bg-gray-900 p-8 rounded-2xl w-full max-w-2xl relative border border-gray-800 max-h-[90vh] overflow-y-auto">
                        <h2 className="text-2xl font-bold mb-6">{editingProduct ? "Edit Product" : "Add New Product"}</h2>
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
                                <label className="block text-sm font-medium text-gray-400 mb-2">1 Month Price (Default)</label>
                                <input
                                    type="number"
                                    placeholder="29.99"
                                    value={newProduct.price}
                                    onChange={(e) => setNewProduct({ ...newProduct, price: e.target.value })}
                                    className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-3 text-white placeholder-gray-600 focus:outline-none focus:border-blue-500"
                                />
                            </div>

                            <div className="grid grid-cols-2 gap-3 mt-3">
                                <div>
                                    <label className="block text-sm font-medium text-orange-400 mb-2">1 Day Price</label>
                                    <input
                                        type="number"
                                        placeholder="4.99"
                                        value={newProduct.pricing['1day']}
                                        onChange={(e) => setNewProduct({ ...newProduct, pricing: { ...newProduct.pricing, '1day': e.target.value } })}
                                        className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-3 text-white placeholder-gray-600 focus:outline-none focus:border-orange-500"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-blue-400 mb-2">1 Week Price</label>
                                    <input
                                        type="number"
                                        placeholder="14.99"
                                        value={newProduct.pricing['1week']}
                                        onChange={(e) => setNewProduct({ ...newProduct, pricing: { ...newProduct.pricing, '1week': e.target.value } })}
                                        className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-3 text-white placeholder-gray-600 focus:outline-none focus:border-blue-500"
                                    />
                                </div>
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
                                    <option value="Undetected">Undetected</option>
                                    <option value="Detected">Detected</option>
                                    <option value="Coming Soon">Coming Soon</option>
                                </select>
                            </div>
                        </div>

                        <button
                            className="w-full bg-gradient-to-r from-blue-600 to-green-600 px-6 py-3 rounded-lg mt-6 font-semibold"
                            onClick={editingProduct ? handleUpdateProduct : handleAddProduct}
                        >
                            {editingProduct ? "Update Product" : "Add Product"}
                        </button>
                    </div>
                </div>
            )}

            {/* Add Category Modal */}
            {showAddCategoryModal && (
                <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4">
                    <div className="bg-gray-900 p-8 rounded-2xl w-full max-w-md relative border border-gray-800">
                        <h2 className="text-2xl font-bold mb-6">{editingCategory ? "Edit Category" : "Add New Category"}</h2>
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
                            className="w-full bg-gradient-to-r from-blue-600 to-green-600 px-6 py-3 rounded-lg mt-6 font-semibold"
                            onClick={editingCategory ? handleUpdateCategory : handleAddCategory}
                        >
                            {editingCategory ? "Update Category" : "Add Category"}
                        </button>
                    </div>
                </div>
            )}

            {/* Add/Edit Installation Guide Modal */}
            {showAddGuideModal && (
                <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4">
                    <div className="bg-gray-900 p-8 rounded-2xl w-full max-w-4xl relative border border-gray-800 max-h-[90vh] overflow-y-auto">
                        <h2 className="text-2xl font-bold mb-6">
                            {editingGuide ? "Edit Installation Guide" : "Add Installation Guide"}
                        </h2>
                        <button
                            className="absolute top-6 right-6 text-gray-400 hover:text-white transition"
                            onClick={() => {
                                setShowAddGuideModal(false);
                                setEditingGuide(null);
                                setNewGuide({ game: "", title: "", content: "" });
                            }}
                        >
                            <X className="w-6 h-6" />
                        </button>

                        <div className="space-y-4">
                            <div className="grid md:grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-medium mb-2">Game *</label>
                                    <input
                                        type="text"
                                        placeholder="CS2, Valorant, Fortnite, etc."
                                        value={newGuide.game}
                                        onChange={(e) => setNewGuide({ ...newGuide, game: e.target.value })}
                                        className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-2 text-white focus:outline-none focus:border-blue-500"
                                    />
                                    <p className="text-xs text-gray-400 mt-1">Must match exactly with product game name</p>
                                </div>

                                <div>
                                    <label className="block text-sm font-medium mb-2">Title *</label>
                                    <input
                                        type="text"
                                        placeholder="Installation Guide"
                                        value={newGuide.title}
                                        onChange={(e) => setNewGuide({ ...newGuide, title: e.target.value })}
                                        className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-2 text-white focus:outline-none focus:border-blue-500"
                                    />
                                </div>
                            </div>

                            <div>
                                <label className="block text-sm font-medium mb-2">Content *</label>
                                <textarea
                                    placeholder="Enter installation instructions here...&#10;&#10;You can use:&#10;- Numbered steps&#10;- Section headers&#10;- Line breaks for formatting"
                                    value={newGuide.content}
                                    onChange={(e) => setNewGuide({ ...newGuide, content: e.target.value })}
                                    rows="20"
                                    className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-3 text-white font-mono text-sm focus:outline-none focus:border-blue-500"
                                />
                                <p className="text-xs text-gray-400 mt-1">
                                    Write your installation guide here. Format will be preserved.
                                </p>
                            </div>

                            {/* Preview Section */}
                            {newGuide.content && (
                                <div className="border-t border-gray-700 pt-4">
                                    <h3 className="text-lg font-semibold mb-3">Preview:</h3>
                                    <div className="bg-black border border-gray-800 rounded-lg p-6 max-h-96 overflow-y-auto">
                                        <h4 className="text-xl font-bold text-blue-400 mb-4">{newGuide.title || "Guide Title"}</h4>
                                        <pre className="whitespace-pre-wrap text-gray-300 font-mono text-sm leading-relaxed">
                                            {newGuide.content}
                                        </pre>
                                    </div>
                                </div>
                            )}
                        </div>

                        <button
                            className="w-full bg-gradient-to-r from-blue-600 to-green-600 px-6 py-3 rounded-lg mt-6 hover:from-blue-700 hover:to-green-700 transition font-semibold"
                            onClick={editingGuide ? handleUpdateGuide : handleAddGuide}
                        >
                            {editingGuide ? "Update Guide" : "Add Guide"}
                        </button>
                    </div>
                </div>
            )}

            {/* Add/Edit Feature List Modal */}
            {showAddFeatureListModal && (
                <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4">
                    <div className="bg-gray-900 p-8 rounded-2xl w-full max-w-5xl relative border border-gray-800 max-h-[90vh] overflow-y-auto">
                        <h2 className="text-2xl font-bold mb-6">
                            {editingFeatureList ? "Edit Feature List" : "Add Feature List"}
                        </h2>
                        <button
                            className="absolute top-6 right-6 text-gray-400 hover:text-white transition"
                            onClick={() => {
                                setShowAddFeatureListModal(false);
                                setEditingFeatureList(null);
                                setNewFeatureList({
                                    productId: "",
                                    sections: [{ title: "", features: [""] }]
                                });
                            }}
                        >
                            <X className="w-6 h-6" />
                        </button>

                        {/* Product Selection */}
                        <div className="mb-6">
                            <label className="block text-sm font-medium mb-2">Select Product *</label>
                            <select
                                value={newFeatureList.productId}
                                onChange={(e) => setNewFeatureList({ ...newFeatureList, productId: e.target.value })}
                                disabled={!!editingFeatureList}
                                className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-2 text-white focus:outline-none focus:border-blue-500 disabled:opacity-50"
                            >
                                <option value="">Choose a product...</option>
                                {products.map(product => (
                                    <option key={product._id} value={product._id}>
                                        {product.game} - {product.name}
                                    </option>
                                ))}
                            </select>
                        </div>

                        {/* Sections */}
                        <div className="space-y-6">
                            {newFeatureList.sections.map((section, sectionIndex) => (
                                <div key={sectionIndex} className="bg-gray-800 border border-gray-700 rounded-xl p-6">
                                    {/* Section Header */}
                                    <div className="flex items-center gap-4 mb-4">
                                        <Shield className="w-5 h-5 text-blue-400" />
                                        <input
                                            type="text"
                                            placeholder="Section Title (e.g., Combat, Aimbot, Visuals)"
                                            value={section.title}
                                            onChange={(e) => updateFeatureSectionTitle(sectionIndex, e.target.value)}
                                            className="flex-1 bg-gray-900 border border-gray-600 rounded-lg px-4 py-2 text-white font-semibold text-lg focus:outline-none focus:border-blue-500"
                                        />
                                        <button
                                            onClick={() => removeFeatureSection(sectionIndex)}
                                            className="text-red-500 hover:text-red-400"
                                        >
                                            <Trash2 className="w-5 h-5" />
                                        </button>
                                    </div>

                                    {/* Features */}
                                    <div className="space-y-2 ml-4">
                                        {section.features.map((feature, featureIndex) => (
                                            <div key={featureIndex} className="flex items-center gap-2">
                                                <span className="text-gray-500">•</span>
                                                <input
                                                    type="text"
                                                    placeholder="Feature name"
                                                    value={feature}
                                                    onChange={(e) => updateFeatureItem(sectionIndex, featureIndex, e.target.value)}
                                                    className="flex-1 bg-gray-900 border border-gray-600 rounded px-3 py-1.5 text-white text-sm focus:outline-none focus:border-blue-500"
                                                />
                                                <button
                                                    onClick={() => removeFeatureItem(sectionIndex, featureIndex)}
                                                    className="text-red-500 hover:text-red-400"
                                                >
                                                    <Trash2 className="w-4 h-4" />
                                                </button>
                                            </div>
                                        ))}

                                        <button
                                            onClick={() => addFeatureItem(sectionIndex)}
                                            className="text-blue-400 hover:text-blue-300 text-sm flex items-center gap-1 ml-4 mt-2"
                                        >
                                            <Plus className="w-4 h-4" /> Add Feature
                                        </button>
                                    </div>
                                </div>
                            ))}
                        </div>

                        {/* Add Section Button */}
                        <button
                            onClick={addFeatureSection}
                            className="mt-6 flex items-center gap-2 bg-gray-800 hover:bg-gray-700 px-6 py-3 rounded-lg transition"
                        >
                            <Plus className="w-5 h-5" /> Add Section
                        </button>

                        {/* Save Button */}
                        <button
                            onClick={editingFeatureList ? handleUpdateFeatureList : handleAddFeatureList}
                            className="w-full bg-gradient-to-r from-blue-600 to-green-600 px-6 py-4 rounded-lg mt-6 hover:from-blue-700 hover:to-green-700 transition font-semibold text-lg"
                        >
                            {editingFeatureList ? "Update Feature List" : "Add Feature List"}
                        </button>
                    </div>
                </div>
            )}

            {/* Add/Edit Promo Code Modal */}
            {showAddPromoModal && (
                <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4">
                    <div className="bg-gray-900 p-8 rounded-2xl w-full max-w-2xl relative border border-gray-800 max-h-[90vh] overflow-y-auto">
                        <h2 className="text-2xl font-bold mb-6">
                            {editingPromo ? "Edit Promo Code" : "Add Promo Code"}
                        </h2>
                        <button
                            className="absolute top-6 right-6 text-gray-400 hover:text-white transition"
                            onClick={() => {
                                setShowAddPromoModal(false);
                                setEditingPromo(null);
                            }}
                        >
                            <X className="w-6 h-6" />
                        </button>

                        <div className="space-y-4">
                            <div className="grid md:grid-cols-2 gap-4">
                                {/* Code */}
                                <div>
                                    <label className="block text-sm font-medium mb-2">Promo Code *</label>
                                    <input
                                        type="text"
                                        placeholder="SUMMER2026"
                                        value={newPromo.code}
                                        onChange={(e) => setNewPromo({ ...newPromo, code: e.target.value.toUpperCase() })}
                                        className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-2 text-white uppercase focus:outline-none focus:border-blue-500"
                                    />
                                </div>

                                {/* Discount Type */}
                                <div>
                                    <label className="block text-sm font-medium mb-2">Discount Type *</label>
                                    <select
                                        value={newPromo.discountType}
                                        onChange={(e) => setNewPromo({ ...newPromo, discountType: e.target.value })}
                                        className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-2 text-white focus:outline-none focus:border-blue-500"
                                    >
                                        <option value="percentage">Percentage (%)</option>
                                        <option value="fixed">Fixed Amount ($)</option>
                                    </select>
                                </div>

                                {/* Discount Value */}
                                <div>
                                    <label className="block text-sm font-medium mb-2">
                                        Discount Value * {newPromo.discountType === 'percentage' ? '(%)' : '($)'}
                                    </label>
                                    <input
                                        type="number"
                                        placeholder={newPromo.discountType === 'percentage' ? '10' : '5.00'}
                                        step={newPromo.discountType === 'percentage' ? '1' : '0.01'}
                                        value={newPromo.discountValue}
                                        onChange={(e) => setNewPromo({ ...newPromo, discountValue: e.target.value })}
                                        className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-2 text-white focus:outline-none focus:border-blue-500"
                                    />
                                </div>

                                {/* Min Purchase */}
                                <div>
                                    <label className="block text-sm font-medium mb-2">Min Purchase ($)</label>
                                    <input
                                        type="number"
                                        step="0.01"
                                        placeholder="0"
                                        value={newPromo.minPurchaseAmount}
                                        onChange={(e) => setNewPromo({ ...newPromo, minPurchaseAmount: e.target.value })}
                                        className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-2 text-white focus:outline-none focus:border-blue-500"
                                    />
                                </div>

                                {/* Max Uses */}
                                <div>
                                    <label className="block text-sm font-medium mb-2">Max Uses (blank = unlimited)</label>
                                    <input
                                        type="number"
                                        placeholder="Unlimited"
                                        value={newPromo.maxUses}
                                        onChange={(e) => setNewPromo({ ...newPromo, maxUses: e.target.value })}
                                        className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-2 text-white focus:outline-none focus:border-blue-500"
                                    />
                                </div>

                                {/* Expiration */}
                                <div>
                                    <label className="block text-sm font-medium mb-2">Expires At (blank = never)</label>
                                    <input
                                        type="date"
                                        value={newPromo.expiresAt}
                                        onChange={(e) => setNewPromo({ ...newPromo, expiresAt: e.target.value })}
                                        className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-2 text-white focus:outline-none focus:border-blue-500"
                                    />
                                </div>
                            </div>

                            {/* Applicable Games */}
                            <div>
                                <label className="block text-sm font-medium mb-2">
                                    Applicable Games (leave empty for all games)
                                </label>
                                <div className="bg-gray-800 border border-gray-700 rounded-lg p-4">
                                    <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                                        {[...new Set(products.map(p => p.game))].map(game => (
                                            <label key={game} className="flex items-center gap-2 cursor-pointer">
                                                <input
                                                    type="checkbox"
                                                    checked={newPromo.applicableGames.includes(game)}
                                                    onChange={() => toggleGameSelection(game)}
                                                    className="w-4 h-4"
                                                />
                                                <span className="text-sm">{game}</span>
                                            </label>
                                        ))}
                                    </div>
                                    {newPromo.applicableGames.length === 0 && (
                                        <p className="text-xs text-yellow-400 mt-2">
                                            ⚠️ No games selected - code will work for ALL games
                                        </p>
                                    )}
                                </div>
                            </div>

                            {/* Active Status (only for editing) */}
                            {editingPromo && (
                                <div>
                                    <label className="flex items-center gap-2 cursor-pointer">
                                        <input
                                            type="checkbox"
                                            checked={newPromo.isActive}
                                            onChange={(e) => setNewPromo({ ...newPromo, isActive: e.target.checked })}
                                            className="w-4 h-4"
                                        />
                                        <span className="text-sm font-medium">Active</span>
                                    </label>
                                </div>
                            )}
                        </div>

                        <button
                            className="w-full bg-gradient-to-r from-blue-600 to-green-600 px-6 py-3 rounded-lg mt-6 hover:from-blue-700 hover:to-blue-700 transition font-semibold"
                            onClick={editingPromo ? handleUpdatePromo : handleAddPromo}
                        >
                            {editingPromo ? "Update Promo Code" : "Add Promo Code"}
                        </button>
                    </div>
                </div>
            )}

            {/* Edit User Modal */}
            {showUserModal && selectedUser && (
                <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4">
                    <div className="bg-gray-900 p-8 rounded-2xl w-full max-w-md relative border border-gray-800">
                        <h2 className="text-2xl font-bold mb-6">Edit User</h2>
                        <button
                            className="absolute top-6 right-6 text-gray-400 hover:text-white transition"
                            onClick={() => {
                                setShowUserModal(false);
                                setSelectedUser(null);
                            }}
                        >
                            <X className="w-6 h-6" />
                        </button>

                        <div className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium mb-2">Username *</label>
                                <input
                                    type="text"
                                    value={editUserData.username}
                                    onChange={(e) => setEditUserData({ ...editUserData, username: e.target.value })}
                                    className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-2 text-white focus:outline-none focus:border-blue-500"
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium mb-2">Email *</label>
                                <input
                                    type="email"
                                    value={editUserData.email}
                                    onChange={(e) => setEditUserData({ ...editUserData, email: e.target.value })}
                                    className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-2 text-white focus:outline-none focus:border-blue-500"
                                />
                            </div>

                            <div>
                                <label className="flex items-center gap-2 cursor-pointer">
                                    <input
                                        type="checkbox"
                                        checked={editUserData.isAdmin}
                                        onChange={(e) => setEditUserData({ ...editUserData, isAdmin: e.target.checked })}
                                        className="w-4 h-4"
                                    />
                                    <span className="text-sm font-medium">Admin Permissions</span>
                                </label>
                                <p className="text-xs text-gray-400 mt-1 ml-6">
                                    Admins have full access to the dashboard
                                </p>
                            </div>
                        </div>

                        <button
                            className="w-full bg-gradient-to-r from-blue-600 to-green-600 px-6 py-3 rounded-lg mt-6 hover:from-blue-700 hover:to-green-700 transition font-semibold"
                            onClick={handleUpdateUser}
                        >
                            Update User
                        </button>
                    </div>
                </div>
            )}

            {/* Reset Password Modal */}
            {showPasswordModal && selectedUser && (
                <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4">
                    <div className="bg-gray-900 p-8 rounded-2xl w-full max-w-md relative border border-gray-800">
                        <h2 className="text-2xl font-bold mb-6">Reset Password</h2>
                        <button
                            className="absolute top-6 right-6 text-gray-400 hover:text-white transition"
                            onClick={() => {
                                setShowPasswordModal(false);
                                setSelectedUser(null);
                                setNewPassword('');
                            }}
                        >
                            <X className="w-6 h-6" />
                        </button>

                        <p className="text-gray-400 mb-4">
                            Resetting password for: <span className="text-white font-semibold">{selectedUser.username}</span>
                        </p>

                        <div className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium mb-2">New Password *</label>
                                <input
                                    type="password"
                                    placeholder="Minimum 6 characters"
                                    value={newPassword}
                                    onChange={(e) => setNewPassword(e.target.value)}
                                    className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-2 text-white focus:outline-none focus:border-blue-500"
                                />
                            </div>
                        </div>

                        <button
                            className="w-full bg-gradient-to-r from-yellow-600 to-orange-600 px-6 py-3 rounded-lg mt-6 hover:from-yellow-700 hover:to-orange-700 transition font-semibold"
                            onClick={handleResetPassword}
                        >
                            Reset Password
                        </button>
                    </div>
                </div>
            )}

            {/* View Orders Modal */}
            {showOrdersModal && selectedUser && (
                <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4">
                    <div className="bg-gray-900 p-8 rounded-2xl w-full max-w-5xl relative border border-gray-800 max-h-[90vh] overflow-y-auto">
                        <h2 className="text-2xl font-bold mb-2">Orders for {selectedUser.username}</h2>
                        <p className="text-gray-400 mb-6">{selectedUser.email}</p>
                        <button
                            className="absolute top-6 right-6 text-gray-400 hover:text-white transition"
                            onClick={() => {
                                setShowOrdersModal(false);
                                setSelectedUser(null);
                                setUserOrders([]);
                            }}
                        >
                            <X className="w-6 h-6" />
                        </button>

                        {userOrders.length === 0 ? (
                            <div className="text-center py-12">
                                <p className="text-gray-400">No orders found</p>
                            </div>
                        ) : (
                            <div className="space-y-4">
                                {userOrders.map((order) => (
                                    <div
                                        key={order._id}
                                        className="bg-gray-800 border border-gray-700 rounded-lg p-6"
                                    >
                                        {/* Order Header */}
                                        <div className="flex justify-between items-start mb-4 pb-4 border-b border-gray-700">
                                            <div>
                                                <h3 className="font-bold text-lg mb-1">
                                                    Order #{order._id.slice(-8)}
                                                </h3>
                                                <p className="text-sm text-gray-400">
                                                    {new Date(order.createdAt).toLocaleString()}
                                                </p>
                                            </div>
                                            <div className="text-right">
                                                <p className="font-bold text-green-400 text-xl mb-1">
                                                    ${order.total?.toFixed(2) || '0.00'}
                                                </p>
                                                <span className={`text-xs px-3 py-1 rounded-full ${order.paid
                                                    ? 'bg-green-500/20 text-green-400'
                                                    : 'bg-yellow-500/20 text-yellow-400'
                                                    }`}>
                                                    {order.paid ? 'Paid' : 'Pending'}
                                                </span>
                                            </div>
                                        </div>

                                        {/* Order Items */}
                                        <div className="space-y-3">
                                            <h4 className="font-semibold text-sm text-gray-400 mb-2">Items:</h4>
                                            {order.items && order.items.length > 0 ? (
                                                order.items.map((item, idx) => (
                                                    <div
                                                        key={idx}
                                                        className="bg-gray-900/50 rounded-lg p-4 flex justify-between items-center"
                                                    >
                                                        <div className="flex-1">
                                                            <p className="font-semibold text-white">
                                                                {item.name}
                                                            </p>
                                                            <p className="text-sm text-gray-400">
                                                                {item.game}
                                                            </p>
                                                            {item.quantity > 1 && (
                                                                <p className="text-xs text-gray-500 mt-1">
                                                                    Quantity: {item.quantity}
                                                                </p>
                                                            )}
                                                        </div>
                                                        <div className="text-right">
                                                            <p className="font-semibold text-green-400">
                                                                ${(item.price * item.quantity).toFixed(2)}
                                                            </p>
                                                            {item.quantity > 1 && (
                                                                <p className="text-xs text-gray-500">
                                                                    ${item.price} each
                                                                </p>
                                                            )}
                                                        </div>
                                                    </div>
                                                ))
                                            ) : (
                                                <p className="text-gray-500 text-sm">No items in this order</p>
                                            )}
                                        </div>

                                        {/* Session Info */}
                                        <div className="mt-4 pt-4 border-t border-gray-700">
                                            <p className="text-xs text-gray-500">
                                                Session ID: {order.sessionId}
                                            </p>
                                        </div>
                                    </div>
                                ))}

                                {/* Summary */}
                                <div className="bg-gradient-to-br from-blue-900/20 to-green-900/20 border border-blue-700/30 rounded-lg p-6 mt-6">
                                    <h3 className="font-bold text-lg mb-4">Order Summary</h3>
                                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-center">
                                        <div>
                                            <p className="text-gray-400 text-sm mb-1">Total Orders</p>
                                            <p className="text-2xl font-bold text-white">{userOrders.length}</p>
                                        </div>
                                        <div>
                                            <p className="text-gray-400 text-sm mb-1">Total Spent</p>
                                            <p className="text-2xl font-bold text-green-400">
                                                ${userOrders.reduce((sum, order) => sum + (order.total || 0), 0).toFixed(2)}
                                            </p>
                                        </div>
                                        <div>
                                            <p className="text-gray-400 text-sm mb-1">Paid Orders</p>
                                            <p className="text-2xl font-bold text-blue-400">
                                                {userOrders.filter(o => o.paid).length}
                                            </p>
                                        </div>
                                        <div>
                                            <p className="text-gray-400 text-sm mb-1">Total Items</p>
                                            <p className="text-2xl font-bold text-purple-400">
                                                {userOrders.reduce((sum, order) =>
                                                    sum + (order.items?.reduce((itemSum, item) => itemSum + (item.quantity || 1), 0) || 0), 0
                                                )}
                                            </p>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            )}

            {/* ADD KEYS MODAL */}
            {showAddKeysModal && (
                <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50">
                    <div className="bg-gray-900 border border-gray-700 rounded-2xl p-8 w-full max-w-lg mx-4">
                        <div className="flex items-center justify-between mb-6">
                            <h3 className="text-xl font-bold">Add Product Keys</h3>
                            <button onClick={() => setShowAddKeysModal(false)} className="text-gray-400 hover:text-white">
                                <X className="w-6 h-6" />
                            </button>
                        </div>

                        {/* Key Type Selector */}
                        <div className="mb-5">
                            <label className="block text-sm font-medium text-gray-400 mb-2">Key Type</label>
                            <div className="grid grid-cols-3 gap-3">
                                <button
                                    onClick={() => setKeyType('1day')}
                                    className={`p-4 rounded-xl border text-left transition ${keyType === '1day'
                                        ? 'border-orange-500 bg-orange-500/10'
                                        : 'border-gray-700 bg-gray-800 hover:border-gray-600'
                                        }`}
                                >
                                    <p className={`font-bold ${keyType === '1day' ? 'text-orange-400' : 'text-white'}`}>1 Day</p>
                                    <p className="text-xs text-gray-400 mt-1">Expires 24hrs after use</p>
                                </button>
                                <button
                                    onClick={() => setKeyType('1week')}
                                    className={`p-4 rounded-xl border text-left transition ${keyType === '1week'
                                        ? 'border-blue-500 bg-blue-500/10'
                                        : 'border-gray-700 bg-gray-800 hover:border-gray-600'
                                        }`}
                                >
                                    <p className={`font-bold ${keyType === '1week' ? 'text-blue-400' : 'text-white'}`}>1 Week</p>
                                    <p className="text-xs text-gray-400 mt-1">Expires 7 days after use</p>
                                </button>
                                <button
                                    onClick={() => setKeyType('1month')}
                                    className={`p-4 rounded-xl border text-left transition ${keyType === '1month'
                                        ? 'border-green-500 bg-green-500/10'
                                        : 'border-gray-700 bg-gray-800 hover:border-gray-600'
                                        }`}
                                >
                                    <p className={`font-bold ${keyType === '1month' ? 'text-green-400' : 'text-white'}`}>1 Month</p>
                                    <p className="text-xs text-gray-400 mt-1">Expires 30 days after use</p>
                                </button>
                            </div>
                        </div>

                        {/* Single / Bulk Toggle */}
                        <div className="mb-5">
                            <label className="block text-sm font-medium text-gray-400 mb-2">Add Mode</label>
                            <div className="flex gap-3">
                                <button
                                    onClick={() => setIsBulk(false)}
                                    className={`flex-1 py-2 rounded-lg border text-sm font-semibold transition ${!isBulk
                                        ? 'border-blue-500 bg-blue-500/10 text-blue-400'
                                        : 'border-gray-700 bg-gray-800 text-gray-300 hover:border-gray-600'
                                        }`}
                                >
                                    Single Key
                                </button>
                                <button
                                    onClick={() => setIsBulk(true)}
                                    className={`flex-1 py-2 rounded-lg border text-sm font-semibold transition ${isBulk
                                        ? 'border-blue-500 bg-blue-500/10 text-blue-400'
                                        : 'border-gray-700 bg-gray-800 text-gray-300 hover:border-gray-600'
                                        }`}
                                >
                                    Bulk (one per line)
                                </button>
                            </div>
                        </div>

                        {/* Key Input */}
                        <div className="mb-5">
                            <label className="block text-sm font-medium text-gray-400 mb-2">
                                {isBulk ? 'Keys (one per line)' : 'Key'}
                            </label>
                            {isBulk ? (
                                <textarea
                                    value={bulkKeys}
                                    onChange={(e) => setBulkKeys(e.target.value)}
                                    placeholder={"KEY-AAAA-1111\nKEY-BBBB-2222\nKEY-CCCC-3333"}
                                    rows={5}
                                    className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-3 text-white placeholder-gray-600 focus:outline-none focus:border-blue-500 font-mono text-sm"
                                />
                            ) : (
                                <input
                                    type="text"
                                    value={singleKey}
                                    onChange={(e) => setSingleKey(e.target.value)}
                                    placeholder="KEY-AAAA-1111"
                                    className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-3 text-white placeholder-gray-600 focus:outline-none focus:border-blue-500 font-mono"
                                />
                            )}
                        </div>

                        {/* Notes */}
                        <div className="mb-6">
                            <label className="block text-sm font-medium text-gray-400 mb-2">Notes (optional)</label>
                            <input
                                type="text"
                                value={keyNotes}
                                onChange={(e) => setKeyNotes(e.target.value)}
                                placeholder="e.g. Batch from supplier"
                                className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-3 text-white placeholder-gray-600 focus:outline-none focus:border-blue-500"
                            />
                        </div>

                        {/* Buttons */}
                        <div className="flex gap-3">
                            <button
                                onClick={() => setShowAddKeysModal(false)}
                                className="flex-1 bg-gray-800 hover:bg-gray-700 px-6 py-3 rounded-lg font-semibold transition"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={handleAddKeys}
                                className="flex-1 bg-gradient-to-r from-blue-600 to-green-600 px-6 py-3 rounded-lg font-semibold hover:from-blue-700 hover:to-green-700 transition"
                            >
                                Add {isBulk ? 'Keys' : 'Key'}
                            </button>
                        </div>
                    </div>
                </div>
            )}

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
