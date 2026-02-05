const mongoose = require('mongoose');

const productSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    trim: true
  },
  game: {
    type: String,
    required: true
  },
  category: {
    type: String,
    required: true,
    enum: ['FPS', 'Battle Royale', 'MOBA', 'Survival']
  },
  price: {
    type: Number,
    required: true  // This is now the 1 Month price
  },
  pricing: {
    '1month': { type: Number, default: null },  // Falls back to `price` if null
    '1day': { type: Number, default: null },
    '1week': { type: Number, default: null }
  },
  downloadUrl: {
    type: String,
    required: false
  },
  image: {
    type: String,
    default: '🎮'
  },
  features: [{
    type: String
  }],
  purchases: {
    type: Number,
    default: 0
  },
  rating: {
    type: Number,
    default: 5.0,
    min: 0,
    max: 5
  },
  status: {
    type: String,
    enum: ['Undetected', 'Detected', 'Coming Soon'],
    default: 'Undetected'
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
});

// Helper to get price for a key type, falls back to base price
productSchema.methods.getPriceForKeyType = function(keyType) {
  if (this.pricing && this.pricing[keyType]) {
    return this.pricing[keyType];
  }
  return this.price; // fallback to 1 Month/base price
};

module.exports = mongoose.model('Product', productSchema);