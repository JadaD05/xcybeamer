const mongoose = require('mongoose');

const guideSchema = new mongoose.Schema({
  game: {
    type: String,
    required: [true, 'Game name is required'],
    trim: true
  },
  title: {
    type: String,
    required: [true, 'Title is required'],
    trim: true
  },
  content: {
    type: String,
    required: [true, 'Content is required']
  },
  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date,
    default: Date.now
  }
});

// Update the updatedAt timestamp before saving
// Remove the next() callback - just set the value
guideSchema.pre('save', function() {
  this.updatedAt = Date.now();
});

module.exports = mongoose.model('Guide', guideSchema);