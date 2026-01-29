const express = require('express');
const mongoose = require('mongoose');
const router = express.Router();
const ProductKey = require('../models/ProductKey');
const Product = require('../models/Product');
const { authenticateToken } = require('../middleware/auth');

// @route   POST /api/product-keys/add
// @desc    Add product keys (bulk) - Admin only
// @access  Private
router.post('/add', authenticateToken, async (req, res) => {
    try {
        const { productId, keys, notes } = req.body;

        if (!productId || !keys || !Array.isArray(keys) || keys.length === 0) {
            return res.status(400).json({
                success: false,
                message: 'Product ID and keys array are required'
            });
        }

        // Check if product exists
        const product = await Product.findById(productId);
        if (!product) {
            return res.status(404).json({
                success: false,
                message: 'Product not found'
            });
        }

        // Prepare keys for insertion
        const keysToInsert = keys.map(key => ({
            key: key.trim().toUpperCase(),
            productId,
            notes: notes || ''
        }));

        // Check for duplicates in database
        const existingKeys = await ProductKey.find({
            key: { $in: keysToInsert.map(k => k.key) }
        });

        if (existingKeys.length > 0) {
            return res.status(400).json({
                success: false,
                message: `${existingKeys.length} key(s) already exist in database`,
                duplicates: existingKeys.map(k => k.key)
            });
        }

        // Insert keys
        const insertedKeys = await ProductKey.insertMany(keysToInsert);

        res.status(201).json({
            success: true,
            message: `Successfully added ${insertedKeys.length} keys for ${product.name}`,
            count: insertedKeys.length
        });
    } catch (error) {
        console.error('Add keys error:', error);

        // Handle duplicate key error from MongoDB
        if (error.code === 11000) {
            return res.status(400).json({
                success: false,
                message: 'One or more keys already exist in the database'
            });
        }

        res.status(500).json({
            success: false,
            message: 'Server error while adding keys'
        });
    }
});

// @route   POST /api/product-keys/add-single
// @desc    Add a single product key - Admin only
// @access  Private
router.post('/add-single', authenticateToken, async (req, res) => {
    try {
        const { productId, key, notes } = req.body;

        if (!productId || !key) {
            return res.status(400).json({
                success: false,
                message: 'Product ID and key are required'
            });
        }

        // Check if product exists
        const product = await Product.findById(productId);
        if (!product) {
            return res.status(404).json({
                success: false,
                message: 'Product not found'
            });
        }

        // Check if key already exists
        const existingKey = await ProductKey.findOne({
            key: key.trim().toUpperCase()
        });

        if (existingKey) {
            return res.status(400).json({
                success: false,
                message: 'This key already exists in the database'
            });
        }

        // Create new key
        const newKey = new ProductKey({
            key: key.trim().toUpperCase(),
            productId,
            notes: notes || ''
        });

        await newKey.save();

        res.status(201).json({
            success: true,
            message: 'Key added successfully',
            key: newKey
        });
    } catch (error) {
        console.error('Add single key error:', error);
        res.status(500).json({
            success: false,
            message: 'Server error while adding key'
        });
    }
});

// @route   GET /api/product-keys/:productId/available
// @desc    Get available key count for a product
// @access  Public
router.get('/:productId/available', async (req, res) => {
    try {
        const count = await ProductKey.countDocuments({
            productId: req.params.productId,
            isSold: false
        });

        res.json({
            success: true,
            availableKeys: count
        });
    } catch (error) {
        console.error('Get available keys error:', error);
        res.status(500).json({
            success: false,
            message: 'Server error'
        });
    }
});

// @route   GET /api/product-keys/:productId/stats
// @desc    Get key statistics for a product - Admin only
// @access  Private
router.get('/:productId/stats', authenticateToken, async (req, res) => {
    try {
        const total = await ProductKey.countDocuments({
            productId: req.params.productId
        });

        const sold = await ProductKey.countDocuments({
            productId: req.params.productId,
            isSold: true
        });

        const available = await ProductKey.countDocuments({
            productId: req.params.productId,
            isSold: false
        });

        res.json({
            success: true,
            stats: {
                total,
                sold,
                available
            }
        });
    } catch (error) {
        console.error('Get stats error:', error);
        res.status(500).json({
            success: false,
            message: 'Server error'
        });
    }
});

// @route   GET /api/product-keys/:productId/all
// @desc    Get all keys for a product - Admin only
// @access  Private
router.get('/:productId/all', authenticateToken, async (req, res) => {
    try {
        const { page = 1, limit = 50, filter = 'all' } = req.query;

        const query = { productId: req.params.productId };

        if (filter === 'sold') {
            query.isSold = true;
        } else if (filter === 'available') {
            query.isSold = false;
        }

        const keys = await ProductKey.find(query)
            .populate('soldTo', 'username email')
            .populate('orderId')
            .sort({ addedAt: -1 })
            .limit(limit * 1)
            .skip((page - 1) * limit);

        const count = await ProductKey.countDocuments(query);

        res.json({
            success: true,
            keys,
            totalPages: Math.ceil(count / limit),
            currentPage: page,
            totalKeys: count
        });
    } catch (error) {
        console.error('Get all keys error:', error);
        res.status(500).json({
            success: false,
            message: 'Server error'
        });
    }
});

// @route   DELETE /api/product-keys/:keyId
// @desc    Delete a product key - Admin only
// @access  Private
router.delete('/:keyId', authenticateToken, async (req, res) => {
    try {
        const key = await ProductKey.findById(req.params.keyId);

        if (!key) {
            return res.status(404).json({
                success: false,
                message: 'Key not found'
            });
        }

        if (key.isSold) {
            return res.status(400).json({
                success: false,
                message: 'Cannot delete a key that has been sold'
            });
        }

        await ProductKey.findByIdAndDelete(req.params.keyId);

        res.json({
            success: true,
            message: 'Key deleted successfully'
        });
    } catch (error) {
        console.error('Delete key error:', error);
        res.status(500).json({
            success: false,
            message: 'Server error'
        });
    }
});

// @route   GET /api/product-keys/user/:userId
// @desc    Get all license keys purchased by a user
// @access  Private
router.get('/user', authenticateToken, async (req, res) => {
    console.log('➡️ /api/product-keys/user HIT');
    console.log('User from token:', req.user);

    try {
        const userId = req.user.userId; // This comes from authenticateToken

        const keys = await ProductKey.find({ soldTo: userId })
            .populate('productId', 'name game')
            .sort({ soldAt: -1 });

        const formattedKeys = keys.map(k => ({
            licenseKey: k.key,
            productName: k.productId ? k.productId.name : 'Unknown Product',
            productGame: k.productId ? k.productId.game : '',
            soldAt: k.soldAt
        }));

        console.log('Keys found:', formattedKeys);

        res.json({ success: true, keys: formattedKeys });
    } catch (error) {
        console.error('Get user keys error:', error);
        res.status(500).json({
            success: false,
            message: 'Server error fetching keys'
        });
    }
});

module.exports = router;