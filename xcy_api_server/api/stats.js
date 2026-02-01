const express = require("express");
const Order = require("../models/Order"); // adjust path if needed

const router = express.Router();

router.get('/products', async (req, res) => {
    try {
        const stats = await Order.aggregate([
            {
                $match: { paid: true }  // ADD THIS LINE - only count paid orders
            },
            {
                $unwind: '$items'
            },
            {
                $group: {
                    _id: '$items.productId',
                    purchases: { $sum: '$items.quantity' },
                    revenue: { $sum: { $multiply: ['$items.price', '$items.quantity'] } }
                }
            },
            {
                $project: {
                    productId: { $toString: '$_id' },
                    purchases: 1,
                    revenue: 1,
                    _id: 0
                }
            }
        ]);

        res.json(stats);
    } catch (error) {
        console.error('Stats error:', error);
        res.status(500).json({ message: 'Server error' });
    }
});

module.exports = router;
