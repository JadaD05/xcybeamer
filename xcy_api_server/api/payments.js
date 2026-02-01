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
const { broadcastStats, getAllProductStats } = require('./stats');

const FRONTEND_URL = process.env.FRONTEND_URL;

// =========================
// CREATE CHECKOUT SESSION
// =========================
router.post('/create-session', async (req, res) => {
    try {
        const { items, userEmail, promoCode, subtotal, discount, total } = req.body;

        console.log('Items:', items, 'Email:', userEmail, 'Promo:', promoCode);

        if (!items || items.length === 0) {
            return res.status(400).json({ success: false, message: 'No items provided' });
        }

        // Stripe minimum
        if (total < 0.50) {
            return res.status(400).json({
                success: false,
                message: 'Order total must be at least $0.50'
            });
        }

        // Create Stripe line items (prices already discounted)
        const line_items = items.map(item => ({
            price_data: {
                currency: 'aud',
                product_data: {
                    name: item.name,
                    images: [
                        typeof item.image === "string" &&
                            (item.image.startsWith("http") || item.image.startsWith("/"))
                            ? `${FRONTEND_URL}${item.image.startsWith("/") ? "" : "/"}${item.image}`
                            : `${FRONTEND_URL}/images/default.png`
                    ],
                },
                unit_amount: Math.round(item.price * 100), // already includes discount
            },
            quantity: item.quantity || 1,
        }));

        const session = await stripe.checkout.sessions.create({
            line_items,
            mode: 'payment',
            customer_email: userEmail,
            payment_method_types: ['card'],
            success_url: `${FRONTEND_URL}/products`,
            cancel_url: `${FRONTEND_URL}/cart`,
            metadata: {
                promoCode: promoCode || '',
                subtotal: subtotal.toFixed(2),
                discount: discount.toFixed(2),
                total: total.toFixed(2)
            }
        });

        const user = await User.findOne({ email: userEmail });
        if (!user) {
            return res.status(404).json({ success: false, message: 'User not found' });
        }

        // Save order (NO backend price math)
        const itemsWithId = await Promise.all(items.map(async (item) => {
            const product = await Product.findById(item.productId);
            if (!product) throw new Error(`Product ${item.productId} not found`);

            return {
                productId: product._id,
                name: product.name,
                game: product.game,
                price: item.price, // ⭐ FIX: save what the customer actually paid
                quantity: item.quantity || 1,
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
            paid: false,
        });

        res.json({ success: true, url: session.url });
    } catch (error) {
        console.error('Stripe error:', error);
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
                    const product = await Product.findById(item.productId);
                    if (!product) {
                        console.warn(`Product ${item.productId} not found`);
                        continue;
                    }

                    // Find an unused key from ProductKey collection
                    const availableKey = await ProductKey.findOne({
                        productId: item.productId,
                        isSold: false
                    });

                    if (!availableKey) {
                        console.warn(`No available keys for product ${product.name}`);
                        continue;
                    }

                    availableKey.isSold = true;
                    availableKey.soldTo = order.userId;
                    availableKey.soldAt = new Date();
                    availableKey.orderId = order._id;
                    await availableKey.save();

                    // Mark the key as used and assign it to order
                    availableKey.used = true;
                    await availableKey.save();

                    item.productKeyId = availableKey._id;

                    // Increment product purchases
                    product.purchases = (product.purchases || 0) + item.quantity;
                    await product.save();
                }

                await order.save();

                // Increment promo code usage if one was used
                if (order.promoCode) {
                    await PromoCode.findOneAndUpdate(
                        { code: order.promoCode.toUpperCase() },
                        { $inc: { usedCount: 1 } }
                    );
                    console.log('Promo code usage incremented:', order.promoCode);
                }

                await broadcastStats(req.app.get('io'));
            } catch (dbErr) {
                console.error('Database update error:', dbErr);
            }
        }

        res.status(200).json({ received: true });
    }
);

module.exports = router;