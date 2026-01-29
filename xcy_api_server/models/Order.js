const mongoose = require('mongoose');

const orderItemSchema = new mongoose.Schema({
    productId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Product',
        // remove required for now
    },
    productKeyId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Product.keys',
        // remove required for now
    },
    name: { type: String, required: true },
    price: { type: Number, /* required: true */ }, // remove required
    quantity: { type: Number, default: 1 },
});

const orderSchema = new mongoose.Schema({
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    userEmail: { type: String, required: true },
    items: [orderItemSchema],
    total: { type: Number, required: true },
    sessionId: { type: String, required: true },
    paid: { type: Boolean, default: false },
    createdAt: { type: Date, default: Date.now },
});

module.exports = mongoose.model('Order', orderSchema);