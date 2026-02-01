const mongoose = require('mongoose');

const featureListSchema = new mongoose.Schema({
  productId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Product',
    required: true,
    unique: true
  },
  sections: [{
    title: {
      type: String,
      required: true
    },
    features: [{
      type: String,
      required: true
    }]
  }],
  updatedAt: {
    type: Date,
    default: Date.now
  }
}, {
  timestamps: true
});

module.exports = mongoose.model('FeatureList', featureListSchema);