const mongoose = require('mongoose');

const productKeySchema = new mongoose.Schema({
  key: {
    type: String,
    required: true,
    unique: true,
    trim: true,
    uppercase: true
  },
  productId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Product',
    required: true
  },
  keyType: {
    type: String,
    enum: ['1day', '1week', '1month'],
    required: true
  },
  isSold: {
    type: Boolean,
    default: false
  },
  soldTo: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    default: null
  },
  soldAt: {
    type: Date,
    default: null
  },
  expiresAt: {
    type: Date,
    default: null  // Set when key is sold
  },
  orderId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Order',
    default: null
  },
  addedAt: {
    type: Date,
    default: Date.now
  },
  notes: {
    type: String,
    default: ''
  }
});

// Index for faster queries
productKeySchema.index({ productId: 1, isSold: 1 });
productKeySchema.index({ productId: 1, keyType: 1, isSold: 1 });

module.exports = mongoose.model('ProductKey', productKeySchema);