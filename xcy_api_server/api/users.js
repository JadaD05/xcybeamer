const express = require('express');
const router = express.Router();
const User = require('../models/User');
const Order = require('../models/Order');
const bcrypt = require('bcryptjs');
const { authenticateToken, isAdmin } = require('../middleware/auth');

// @route   GET /api/users/get
// @desc    Get all users
// @access  Admin
router.get('/get', authenticateToken, isAdmin, async (req, res) => {
    try {
        const users = await User.find().select('-password').sort({ createdAt: -1 });

        res.json({
            success: true,
            users
        });
    } catch (error) {
        console.error('Get users error:', error);
        res.status(500).json({
            success: false,
            message: 'Server error'
        });
    }
});

// @route   GET /api/users/:id/orders
// @desc    Get user orders (paid only)
// @access  Admin
router.get('/:id/orders', authenticateToken, isAdmin, async (req, res) => {
    try {
        const orders = await Order.find({
            userId: req.params.id,
            paid: true  // ADD THIS LINE - only show paid orders
        })
            .populate('items.productId')
            .sort({ createdAt: -1 });

        res.json({
            success: true,
            orders
        });
    } catch (error) {
        console.error('Get user orders error:', error);
        res.status(500).json({
            success: false,
            message: 'Server error'
        });
    }
});

// @route   PUT /api/users/:id
// @desc    Update user details
// @access  Admin
router.put('/:id', authenticateToken, isAdmin, async (req, res) => {
    try {
        const { username, email, isAdmin } = req.body;

        const updateData = {};
        if (username) updateData.username = username;
        if (email) updateData.email = email;
        if (typeof isAdmin !== 'undefined') updateData.isAdmin = isAdmin;

        const user = await User.findByIdAndUpdate(
            req.params.id,
            updateData,
            { new: true, runValidators: true }
        ).select('-password');

        if (!user) {
            return res.status(404).json({
                success: false,
                message: 'User not found'
            });
        }

        res.json({
            success: true,
            message: 'User updated successfully',
            user
        });
    } catch (error) {
        console.error('Update user error:', error);
        if (error.code === 11000) {
            return res.status(400).json({
                success: false,
                message: 'Username or email already exists'
            });
        }
        res.status(500).json({
            success: false,
            message: 'Server error'
        });
    }
});

// @route   PUT /api/users/:id/password
// @desc    Reset user password
// @access  Admin
router.put('/:id/password', authenticateToken, isAdmin, async (req, res) => {
    try {
        const { newPassword } = req.body;

        if (!newPassword || newPassword.length < 6) {
            return res.status(400).json({
                success: false,
                message: 'Password must be at least 6 characters'
            });
        }

        const hashedPassword = await bcrypt.hash(newPassword, 10);

        const user = await User.findByIdAndUpdate(
            req.params.id,
            { password: hashedPassword },
            { new: true }
        ).select('-password');

        if (!user) {
            return res.status(404).json({
                success: false,
                message: 'User not found'
            });
        }

        res.json({
            success: true,
            message: 'Password reset successfully'
        });
    } catch (error) {
        console.error('Reset password error:', error);
        res.status(500).json({
            success: false,
            message: 'Server error'
        });
    }
});

// @route   DELETE /api/users/:id
// @desc    Delete user
// @access  Admin
router.delete('/:id', authenticateToken, isAdmin, async (req, res) => {
    try {
        const user = await User.findByIdAndDelete(req.params.id);

        if (!user) {
            return res.status(404).json({
                success: false,
                message: 'User not found'
            });
        }

        // Optionally delete user's orders
        // await Order.deleteMany({ userId: req.params.id });

        res.json({
            success: true,
            message: 'User deleted successfully'
        });
    } catch (error) {
        console.error('Delete user error:', error);
        res.status(500).json({
            success: false,
            message: 'Server error'
        });
    }
});

// @route   GET /api/users/stats/revenue
// @desc    Get total revenue from paid orders
// @access  Admin
router.get('/stats/revenue', authenticateToken, isAdmin, async (req, res) => {
    try {
        const result = await Order.aggregate([
            {
                $match: { paid: true }
            },
            {
                $group: {
                    _id: null,
                    totalRevenue: { $sum: '$total' },
                    totalOrders: { $sum: 1 }
                }
            }
        ]);

        const stats = result[0] || { totalRevenue: 0, totalOrders: 0 };

        res.json({
            success: true,
            revenue: stats.totalRevenue,
            orders: stats.totalOrders
        });
    } catch (error) {
        console.error('Get revenue error:', error);
        res.status(500).json({
            success: false,
            message: 'Server error'
        });
    }
});

module.exports = router;