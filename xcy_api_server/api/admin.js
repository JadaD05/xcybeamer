const express = require('express');
const router = express.Router();
const Order = require('../models/Order');

// GET: real purchases per product
router.get('/product-stats', async (req, res) => {
    try {
        const orders = await Order.find({ paid: true });

        const stats = {};

        for (const order of orders) {
            for (const item of order.items) {
                if (!stats[item.id]) {
                    stats[item.id] = {
                        productId: item.id,
                        name: item.name,
                        purchases: 0,
                    };
                }

                const qty = item.quantity || 1;

                stats[item.id].purchases += qty;
            }
        }

        res.json({
            success: true,
            stats: Object.values(stats)
        });
    } catch (err) {
        console.error('Admin stats error:', err);
        res.status(500).json({
            success: false,
            message: 'Failed to load product analytics'
        });
    }
});

module.exports = router;