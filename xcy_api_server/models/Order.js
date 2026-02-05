const mongoose = require('mongoose');

const orderItemSchema = new mongoose.Schema({
    productId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Product',
    },
    productKeyId: {  // Keep for backward compatibility (single key)
        type: mongoose.Schema.Types.ObjectId,
        ref: 'ProductKey',
    },
    productKeyIds: [{  // NEW: Array of key IDs for multiple quantities
        type: mongoose.Schema.Types.ObjectId,
        ref: 'ProductKey'
    }],
    productKeys: [{  // NEW: Store full key details in webhook
        id: mongoose.Schema.Types.ObjectId,
        key: String,
        keyType: String,
        expiresAt: Date
    }],
    name: { type: String, required: true },
    game: { type: String, required: true, index: true },
    price: { type: Number },
    quantity: { type: Number, default: 1 },
    keyType: { type: String, enum: ['1day', '1week', '1month'], default: '1day' }, // ADD THIS
});

const orderSchema = new mongoose.Schema({
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    userEmail: { type: String, required: true },
    items: [orderItemSchema],
    subtotal: { type: Number, required: true },  
    discount: { type: Number, default: 0 },      
    promoCode: { type: String, default: null },
    total: { type: Number, required: true },
    sessionId: { type: String, required: true },
    paid: { type: Boolean, default: false },
    createdAt: { type: Date, default: Date.now },
});

module.exports = mongoose.model('Order', orderSchema);