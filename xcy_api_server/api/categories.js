const express = require('express');
const router = express.Router();
const Category = require('../models/Category');
const { authenticateToken, isAdmin } = require('../middleware/auth');

// Get all categories
router.get('/get', async (req, res) => {
  try {
    const categories = await Category.find().sort({ createdAt: -1 });
    res.json({
      success: true,
      categories
    });
  } catch (error) {
    console.error('Error fetching categories:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
});

// Create category (admin only)
router.post('/create', authenticateToken, isAdmin, async (req, res) => {
  try {
    const { name, game, image, description } = req.body;

    if (!name || !game) {
      return res.status(400).json({
        success: false,
        message: 'Name and game are required'
      });
    }

    const category = new Category({
      name,
      game,
      image: image || '🎮',
      description: description || ''
    });

    await category.save();

    res.status(201).json({
      success: true,
      message: 'Category created successfully',
      category
    });
  } catch (error) {
    console.error('Error creating category:', error);
    if (error.code === 11000) {
      return res.status(400).json({
        success: false,
        message: 'Category name already exists'
      });
    }
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
});

// Delete category (admin only)
router.delete('/:id', authenticateToken, isAdmin, async (req, res) => {
  try {
    const category = await Category.findByIdAndDelete(req.params.id);
    
    if (!category) {
      return res.status(404).json({
        success: false,
        message: 'Category not found'
      });
    }

    res.json({
      success: true,
      message: 'Category deleted successfully'
    });
  } catch (error) {
    console.error('Error deleting category:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
});

module.exports = router;