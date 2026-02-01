const express = require('express');
const router = express.Router();
const FeatureList = require('../models/FeatureList');
const { authenticateToken, isAdmin } = require('../middleware/auth');

// @route   GET /api/feature-lists/:productId
// @desc    Get feature list for a product
// @access  Public
router.get('/:productId', async (req, res) => {
  try {
    const featureList = await FeatureList.findOne({ productId: req.params.productId });
    
    if (!featureList) {
      return res.json({
        success: true,
        featureList: null
      });
    }
    
    res.json({
      success: true,
      featureList
    });
  } catch (error) {
    console.error('Get feature list error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
});

// @route   POST /api/feature-lists/create
// @desc    Create or update feature list
// @access  Admin only
router.post('/create', authenticateToken, isAdmin, async (req, res) => {
  try {
    const { productId, sections } = req.body;

    if (!productId || !sections) {
      return res.status(400).json({
        success: false,
        message: 'Product ID and sections are required'
      });
    }

    // Check if feature list already exists
    let featureList = await FeatureList.findOne({ productId });

    if (featureList) {
      // Update existing
      featureList.sections = sections;
      featureList.updatedAt = Date.now();
      await featureList.save();
    } else {
      // Create new
      featureList = new FeatureList({
        productId,
        sections
      });
      await featureList.save();
    }

    res.json({
      success: true,
      message: 'Feature list saved successfully',
      featureList
    });
  } catch (error) {
    console.error('Create/Update feature list error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
});

// @route   DELETE /api/feature-lists/:productId
// @desc    Delete feature list
// @access  Admin only
router.delete('/:productId', authenticateToken, isAdmin, async (req, res) => {
  try {
    const featureList = await FeatureList.findOneAndDelete({ productId: req.params.productId });
    
    if (!featureList) {
      return res.status(404).json({
        success: false,
        message: 'Feature list not found'
      });
    }

    res.json({
      success: true,
      message: 'Feature list deleted successfully'
    });
  } catch (error) {
    console.error('Delete feature list error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
});

module.exports = router;