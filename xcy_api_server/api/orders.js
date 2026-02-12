const express = require('express');
const router = express.Router();
const Order = require('../models/Order');
const ProductKey = require('../models/ProductKey');
const User = require('../models/User');
const Product = require('../models/Product');
const { authenticateToken } = require('../middleware/auth');

// @route   POST /api/orders/create
// @desc    Create an order and assign a product key
// @access  Private
router.post('/create', authenticateToken, async (req, res) => {
  try {
    const { productId, stripeSessionId } = req.body;
    const userId = req.user.userId;

    // Find product
    const product = await Product.findById(productId);
    if (!product) return res.status(404).json({ success: false, message: 'Product not found' });

    // Check if user already owns it
    const existingOrder = await Order.findOne({ userId, paid: true, "items.game": product.game });
    if (existingOrder) return res.status(400).json({ success: false, message: 'You already own this product. Check your Client page.' });

    // Find available key
    const availableKey = await ProductKey.findOne({ productId, isSold: false });
    if (!availableKey) return res.status(400).json({ success: false, message: 'Product out of stock' });

    // Mark key as sold
    availableKey.isSold = true;
    availableKey.soldTo = userId;
    availableKey.soldAt = new Date();

    const user = await User.findById(userId);
    if (!user) return res.status(404).json({ success: false, message: 'User not found' });

    console.log("Creating order for product:", product);
    console.log("product.game =", product?.game);

    // Create order first
    const order = new Order({
      userId,
      userEmail: user.email,
      items: [
        {
          productId,
          productKeyId: availableKey._id,
          name: product.name,
          game: product.game,
          price: product.price,
          quantity: 1
        }
      ],
      total: product.price,
      sessionId: stripeSessionId,
      paid: true
    });

    await order.save();

    // Now update key & user in parallel, but don't break response if these fail
    availableKey.orderId = order._id;
    availableKey.save().catch(err => console.error('Failed to update key with orderId:', err));

    User.findById(userId).then(user => {
      if (user) {
        user.productKeys.push({ productId, key: availableKey.key, purchasedAt: new Date() });
        user.save().catch(err => console.error('Failed to push key to user:', err));
      }
    }).catch(err => console.error('Failed to fetch user for key update:', err));

    // Respond success immediately
    res.status(201).json({
      success: true,
      message: 'Order created successfully',
      order: {
        id: order._id,
        productKey: availableKey.key,
        product: { id: product._id, name: product.name, downloadUrl: product.downloadUrl }
      }
    });

  } catch (error) {
    console.error('Create order error:', error);
    res.status(500).json({ success: false, message: 'Server error while creating order' });
  }
});

// @route   GET /api/orders/my-orders
// @desc    Get current user's orders
// @access  Private
router.get('/my-orders', authenticateToken, async (req, res) => {
  try {
    const orders = await Order.find({ userId: req.user.userId })
      .sort({ createdAt: -1 });

    res.json({
      success: true,
      orders
    });
  } catch (error) {
    console.error('Get orders error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
});

// @route   GET /api/orders/my-keys
// @desc    Get current user's product keys
// @access  Private
router.get('/my-keys', authenticateToken, async (req, res) => {
  try {
    console.log('=== COLLECTION INFO ===');
    console.log('Order model name:', Order.modelName); // "Order"
    console.log('Order collection name:', Order.collection.collectionName); // "orders"
    console.log('Order collection namespace:', Order.collection.namespace); // "database_name.orders"
    // Populate all references to get full key details
    const orders = await Order.find({
      userId: req.user.userId,
      paid: true
    })
      .populate('items.productKeyId')  // Single key reference
      .populate('items.productKeyIds') // Multiple keys reference
      .populate({
        path: 'items.productId',
        select: 'name game' // Only get necessary fields from Product
      });

    const keys = [];

    for (const order of orders) {
      for (const item of order.items) {
        // 1. Check productKeys array (webhook format)
        if (item.productKeys && item.productKeys.length > 0) {
          item.productKeys.forEach(keyObj => {
            keys.push({
              productName: item.name,
              game: item.game,
              licenseKey: keyObj.key,
              keyType: keyObj.keyType || item.keyType,
              expiresAt: keyObj.expiresAt,
              soldAt: order.createdAt,
              orderId: order._id.toString(),
              source: 'productKeys array'
            });
          });
        }

        // 2. Check productKeyIds array (multiple keys)
        if (item.productKeyIds && item.productKeyIds.length > 0) {
          for (const keyDoc of item.productKeyIds) {
            if (keyDoc && keyDoc.key) {
              keys.push({
                productName: item.name,
                game: item.game,
                licenseKey: keyDoc.key,
                keyType: keyDoc.keyType || item.keyType,
                expiresAt: keyDoc.expiresAt,
                soldAt: order.createdAt,
                orderId: order._id.toString(),
                source: 'productKeyIds array'
              });
            }
          }
        }

        // 3. Check productKeyId (single key - backward compatibility)
        if (item.productKeyId && item.productKeyId.key) {
          keys.push({
            productName: item.name,
            game: item.game,
            licenseKey: item.productKeyId.key,
            keyType: item.productKeyId.keyType || item.keyType,
            expiresAt: item.productKeyId.expiresAt,
            soldAt: order.createdAt,
            orderId: order._id.toString(),
            source: 'productKeyId single'
          });
        }

        // 4. Check if key is directly on item (legacy format)
        if (item.licenseKey) {
          keys.push({
            productName: item.name,
            game: item.game,
            licenseKey: item.licenseKey,
            keyType: item.keyType,
            expiresAt: item.expiresAt,
            soldAt: order.createdAt,
            orderId: order._id.toString(),
            source: 'item.licenseKey'
          });
        }
      }
    }

    console.log(`Found ${keys.length} keys for user ${req.user.userId}`);

    res.json({
      success: true,
      keys: keys
    });
  } catch (err) {
    console.error('Error fetching keys:', err);
    res.status(500).json({
      success: false,
      message: 'Error fetching license keys'
    });
  }
});

// @route   GET /api/orders/user/products
// @desc    Get user's purchased games (for docs access)
// @access  Private
router.get('/user/products', authenticateToken, async (req, res) => {
  try {
    const userId = req.user.userId;

    // Find all paid orders for this user
    const orders = await Order.find({ userId, paid: true });

    // Extract unique games
    const gameMap = new Map();

    orders.forEach(order => {
      order.items.forEach(item => {
        if (!gameMap.has(item.game)) {
          gameMap.set(item.game, {
            game: item.game,
            purchasedAt: order.createdAt
          });
        }
      });
    });

    const purchasedGames = Array.from(gameMap.values());

    res.json({
      success: true,
      games: purchasedGames
    });
  } catch (error) {
    console.error('Error fetching user products:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
});

// @route   GET /api/orders/all (Admin only)
// @desc    Get all orders
// @access  Private
router.get('/all', authenticateToken, async (req, res) => {
  try {
    const orders = await Order.find()
      .populate('userId', 'username email')
      .sort({ createdAt: -1 });

    res.json({
      success: true,
      orders
    });
  } catch (error) {
    console.error('Get all orders error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
});

module.exports = router;