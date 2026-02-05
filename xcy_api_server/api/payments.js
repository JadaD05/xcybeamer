const express = require('express');
const mongoose = require('mongoose');
const router = express.Router();
const Stripe = require('stripe');
const stripe = Stripe(process.env.STRIPE_SECRET_KEY);

const Order = require('../models/Order');
const User = require('../models/User');
const Product = require('../models/Product');
const ProductKey = require('../models/ProductKey');
const PromoCode = require('../models/PromoCode');

const FRONTEND_URL = process.env.FRONTEND_URL;

const VALID_KEY_TYPES = ['1day', '1week', '1month'];

// =========================
// CREATE CHECKOUT SESSION
// =========================
router.post('/create-session', async (req, res) => {
    try {
        const { items, userEmail, promoCode, subtotal, discount, total } = req.body;

        console.log('Full request body:', req.body);
        console.log('Subtotal:', subtotal, 'Discount:', discount, 'Total:', total);

        if (!items || !Array.isArray(items) || items.length === 0) {
            return res.status(400).json({ success: false, message: 'No items provided' });
        }

        if (total < 0.50) {
            return res.status(400).json({
                success: false,
                message: 'Order total must be at least $0.50'
            });
        }

        // Validate keyTypes early
        for (const item of items) {
            if (!VALID_KEY_TYPES.includes(item.keyType)) {
                return res.status(400).json({
                    success: false,
                    message: `Invalid key type: ${item.keyType}`
                });
            }
        }

        const line_items = items.map(item => ({
            price_data: {
                currency: 'aud',
                product_data: {
                    name: item.name,
                    images: [
                        typeof item.image === 'string' &&
                            (item.image.startsWith('http') || item.image.startsWith('/'))
                            ? `${FRONTEND_URL}${item.image.startsWith('/') ? '' : '/'}${item.image}`
                            : `${FRONTEND_URL}/images/default.png`
                    ]
                },
                unit_amount: Math.round(item.price * 100)
            },
            quantity: item.quantity || 1
        }));

        const session = await stripe.checkout.sessions.create({
            line_items,
            mode: 'payment',
            customer_email: userEmail,
            payment_method_types: ['card'],
            success_url: `${FRONTEND_URL}/client`,
            cancel_url: `${FRONTEND_URL}/cart`,
            metadata: {
                promoCode: promoCode || '',
                subtotal: (subtotal || 0).toFixed(2),
                discount: (discount || 0).toFixed(2),
                total: (total || 0).toFixed(2)
            }
        });

        const user = await User.findOne({ email: userEmail });
        if (!user) {
            return res.status(404).json({ success: false, message: 'User not found' });
        }

        const itemsWithId = await Promise.all(items.map(async (item) => {
            const product = await Product.findById(item.productId);
            if (!product) throw new Error(`Product ${item.productId} not found`);

            return {
                productId: product._id,
                name: product.name,
                game: product.game,
                price: item.price,
                quantity: item.quantity || 1,
                keyType: item.keyType
            };
        }));

        await Order.create({
            userEmail,
            userId: user._id,
            items: itemsWithId,
            subtotal,
            discount,
            promoCode: promoCode || null,
            total,
            sessionId: session.id,
            paid: false
        });

        res.json({ success: true, url: session.url });
    } catch (error) {
        console.error('Stripe session error:', error);
        res.status(500).json({ success: false, message: 'Payment session creation failed' });
    }
});

// =========================
// STRIPE WEBHOOK
// =========================
router.post(
    '/webhook',
    express.raw({ type: 'application/json' }),
    async (req, res) => {
        const sig = req.headers['stripe-signature'];
        let event;

        try {
            event = stripe.webhooks.constructEvent(
                req.body,
                sig,
                process.env.STRIPE_WEBHOOK_SECRET
            );
        } catch (err) {
            console.error('Webhook signature verification failed:', err.message);
            return res.status(400).send(`Webhook Error: ${err.message}`);
        }

        if (event.type === 'checkout.session.completed') {
            const session = event.data.object;

            try {
                const order = await Order.findOne({ sessionId: session.id });
                if (!order) return res.status(404).send('Order not found');

                order.paid = true;

                for (const item of order.items) {
                    if (!VALID_KEY_TYPES.includes(item.keyType)) {
                        console.error('Invalid keyType in order:', item.keyType);
                        continue;
                    }

                    const product = await Product.findById(item.productId);
                    if (!product) continue;

                    const quantity = item.quantity || 1;
                    const assignedKeyIds = [];
                    const now = new Date();

                    for (let i = 0; i < quantity; i++) {
                        const key = await ProductKey.findOne({
                            productId: item.productId,
                            keyType: item.keyType,
                            isSold: false
                        });

                        if (!key) {
                            console.warn(`No ${item.keyType} keys left for ${product.name}`);
                            break;
                        }

                        if (item.keyType === '1day') {
                            key.expiresAt = new Date(now.getTime() + 86400000);
                        } else if (item.keyType === '1week') {
                            key.expiresAt = new Date(now.getTime() + 604800000);
                        } else if (item.keyType === '1month') {
                            key.expiresAt = new Date(now.getTime() + 2592000000); // 30 days
                        } else {
                            key.expiresAt = null; // For any other key types
                        }

                        key.isSold = true;
                        key.soldTo = order.userId;
                        key.soldAt = now;
                        key.orderId = order._id;
                        await key.save();

                        assignedKeyIds.push({
                            id: key._id,
                            key: key.key,
                            keyType: key.keyType,
                            expiresAt: key.expiresAt
                        });
                    }

                    item.productKeys = assignedKeyIds;

                    product.purchases = (product.purchases || 0) + quantity;
                    await product.save();
                }

                order.markModified('items');
                await order.save();

                if (order.promoCode) {
                    await PromoCode.findOneAndUpdate(
                        { code: order.promoCode.toUpperCase() },
                        { $inc: { usedCount: 1 } }
                    );
                }
            } catch (err) {
                console.error('Order fulfillment error:', err);
            }
        }

        res.status(200).json({ received: true });
    }
);

module.exports = router;
