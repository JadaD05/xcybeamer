const express = require('express');
const router = express.Router();
const PromoCode = require('../models/PromoCode');
const { authenticateToken, isAdmin } = require('../middleware/auth');

// @route   GET /api/promo-codes/get
// @desc    Get all promo codes (admin only)
// @access  Admin
router.get('/get', authenticateToken, isAdmin, async (req, res) => {
  try {
    const promoCodes = await PromoCode.find().sort({ createdAt: -1 });
    
    res.json({
      success: true,
      promoCodes
    });
  } catch (error) {
    console.error('Get promo codes error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
});

// @route   POST /api/promo-codes/validate
// @desc    Validate promo code
// @access  Private
router.post('/validate', authenticateToken, async (req, res) => {
  try {
    const { code, games, totalAmount } = req.body;

    const promoCode = await PromoCode.findOne({ 
      code: code.toUpperCase(),
      isActive: true
    });

    if (!promoCode) {
      return res.status(404).json({
        success: false,
        message: 'Invalid promo code'
      });
    }

    // Check expiration
    if (promoCode.expiresAt && new Date() > promoCode.expiresAt) {
      return res.status(400).json({
        success: false,
        message: 'Promo code has expired'
      });
    }

    // Check max uses
    if (promoCode.maxUses && promoCode.usedCount >= promoCode.maxUses) {
      return res.status(400).json({
        success: false,
        message: 'Promo code has reached maximum uses'
      });
    }

    // Check minimum purchase amount
    if (totalAmount < promoCode.minPurchaseAmount) {
      return res.status(400).json({
        success: false,
        message: `Minimum purchase amount of $${promoCode.minPurchaseAmount} required`
      });
    }

    // Check applicable games
    if (promoCode.applicableProducts.length > 0) {
      const hasApplicableGame = games.some(game => 
        promoCode.applicableProducts.includes(game)
      );
      
      if (!hasApplicableGame) {
        return res.status(400).json({
          success: false,
          message: 'Promo code not applicable to selected products'
        });
      }
    }

    // Calculate discount
    let discount = 0;
    if (promoCode.discountType === 'percentage') {
      discount = (totalAmount * promoCode.discountValue) / 100;
    } else {
      discount = promoCode.discountValue;
    }

    // Don't let discount exceed total
    discount = Math.min(discount, totalAmount);

    res.json({
      success: true,
      promoCode: {
        code: promoCode.code,
        discountType: promoCode.discountType,
        discountValue: promoCode.discountValue,
        discount: discount.toFixed(2)
      }
    });
  } catch (error) {
    console.error('Validate promo code error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
});

// @route   POST /api/promo-codes/create
// @desc    Create promo code
// @access  Admin
router.post('/create', authenticateToken, isAdmin, async (req, res) => {
  try {
    const { 
      code, 
      discountType, 
      discountValue, 
      applicableProducts,
      minPurchaseAmount,
      maxUses,
      expiresAt
    } = req.body;

    if (!code || !discountType || !discountValue) {
      return res.status(400).json({
        success: false,
        message: 'Code, discount type, and discount value are required'
      });
    }

    const promoCode = new PromoCode({
      code: code.toUpperCase(),
      discountType,
      discountValue,
      applicableProducts: applicableProducts || [],
      minPurchaseAmount: minPurchaseAmount || 0,
      maxUses: maxUses || null,
      expiresAt: expiresAt || null
    });

    await promoCode.save();

    res.status(201).json({
      success: true,
      message: 'Promo code created successfully',
      promoCode
    });
  } catch (error) {
    console.error('Create promo code error:', error);
    if (error.code === 11000) {
      return res.status(400).json({
        success: false,
        message: 'Promo code already exists'
      });
    }
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
});

// @route   PUT /api/promo-codes/:id
// @desc    Update promo code
// @access  Admin
router.put('/:id', authenticateToken, isAdmin, async (req, res) => {
  try {
    const promoCode = await PromoCode.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true, runValidators: true }
    );

    if (!promoCode) {
      return res.status(404).json({
        success: false,
        message: 'Promo code not found'
      });
    }

    res.json({
      success: true,
      message: 'Promo code updated successfully',
      promoCode
    });
  } catch (error) {
    console.error('Update promo code error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
});

// @route   DELETE /api/promo-codes/:id
// @desc    Delete promo code
// @access  Admin
router.delete('/:id', authenticateToken, isAdmin, async (req, res) => {
  try {
    const promoCode = await PromoCode.findByIdAndDelete(req.params.id);
    
    if (!promoCode) {
      return res.status(404).json({
        success: false,
        message: 'Promo code not found'
      });
    }

    res.json({
      success: true,
      message: 'Promo code deleted successfully'
    });
  } catch (error) {
    console.error('Delete promo code error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
});

// @route   POST /api/promo-codes/increment-usage
// @desc    Increment promo code usage (called after successful payment)
// @access  Private
router.post('/increment-usage', authenticateToken, async (req, res) => {
  try {
    const { code } = req.body;

    const promoCode = await PromoCode.findOneAndUpdate(
      { code: code.toUpperCase() },
      { $inc: { usedCount: 1 } },
      { new: true }
    );

    if (!promoCode) {
      return res.status(404).json({
        success: false,
        message: 'Promo code not found'
      });
    }

    res.json({
      success: true,
      message: 'Usage incremented'
    });
  } catch (error) {
    console.error('Increment usage error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
});

module.exports = router;