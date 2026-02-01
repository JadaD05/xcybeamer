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
    required: true
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

module.exports = mongoose.model('Product', productSchema);