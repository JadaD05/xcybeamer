const express = require('express');
const router = express.Router();
const Product = require('../models/Product');

async function getAllProductStats() {
    // Fetch all products from DB
    const products = await Product.find({});

    // Map to stats array
    const stats = products.map(p => ({
        productId: p._id.toString(),
        purchases: p.purchases || 0,
    }));

    console.log("getAllProductStats:", stats);
    return stats;
}

// Broadcast stats via Socket.IO
async function broadcastStats(io) {
    const stats = await getAllProductStats();
    // Only send productId and purchases
    const formattedStats = stats.map(s => ({
        productId: s.productId,
        purchases: s.purchases
    }));
    io.emit('updateStats', formattedStats);
}

module.exports = {
    router,
    broadcastStats,
    getAllProductStats
};
