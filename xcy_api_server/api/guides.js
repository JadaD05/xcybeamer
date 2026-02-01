const express = require('express');
const router = express.Router();
const Guide = require('../models/Guide');
const { authenticateToken, isAdmin } = require('../middleware/auth');

// @route   GET /api/guides/get
// @desc    Get all guides
// @access  Public (users need to see guides they have access to)
router.get('/get', async (req, res) => {
  try {
    const guides = await Guide.find().sort({ game: 1, createdAt: -1 });
    
    res.json({
      success: true,
      guides
    });
  } catch (error) {
    console.error('Error fetching guides:', error);
    res.status(500).json({
      success: false,
      message: 'Server error fetching guides'
    });
  }
});

// @route   GET /api/guides/game/:game
// @desc    Get guides for a specific game
// @access  Public
router.get('/game/:game', async (req, res) => {
  try {
    const guides = await Guide.find({ game: req.params.game }).sort({ createdAt: -1 });
    
    res.json({
      success: true,
      guides
    });
  } catch (error) {
    console.error('Error fetching guides for game:', error);
    res.status(500).json({
      success: false,
      message: 'Server error fetching guides'
    });
  }
});

// @route   POST /api/guides/create
// @desc    Create a new guide
// @access  Admin only
router.post('/create', authenticateToken, isAdmin, async (req, res) => {
  try {
    const { game, title, content } = req.body;

    // Validation
    if (!game || !title || !content) {
      return res.status(400).json({
        success: false,
        message: 'Game, title, and content are required'
      });
    }

    // Create guide
    const guide = new Guide({
      game,
      title,
      content
    });

    await guide.save();

    res.status(201).json({
      success: true,
      message: 'Installation guide created successfully',
      guide
    });
  } catch (error) {
    console.error('Error creating guide:', error);
    res.status(500).json({
      success: false,
      message: 'Server error creating guide'
    });
  }
});

// @route   PUT /api/guides/:id
// @desc    Update a guide
// @access  Admin only
router.put('/:id', authenticateToken, isAdmin, async (req, res) => {
  try {
    const { game, title, content } = req.body;

    if (!game || !title || !content) {
      return res.status(400).json({
        success: false,
        message: 'Game, title, and content are required'
      });
    }

    const guide = await Guide.findByIdAndUpdate(
      req.params.id,
      { game, title, content, updatedAt: Date.now() },
      { new: true, runValidators: true }
    );

    if (!guide) {
      return res.status(404).json({
        success: false,
        message: 'Guide not found'
      });
    }

    res.json({
      success: true,
      message: 'Installation guide updated successfully',
      guide
    });
  } catch (error) {
    console.error('Error updating guide:', error);
    res.status(500).json({
      success: false,
      message: 'Server error updating guide'
    });
  }
});

// @route   DELETE /api/guides/:id
// @desc    Delete a guide
// @access  Admin only
router.delete('/:id', authenticateToken, isAdmin, async (req, res) => {
  try {
    const guide = await Guide.findByIdAndDelete(req.params.id);
    
    if (!guide) {
      return res.status(404).json({
        success: false,
        message: 'Guide not found'
      });
    }

    res.json({
      success: true,
      message: 'Installation guide deleted successfully'
    });
  } catch (error) {
    console.error('Error deleting guide:', error);
    res.status(500).json({
      success: false,
      message: 'Server error deleting guide'
    });
  }
});

module.exports = router;