const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');
const connectDB = require('./config/db');

dotenv.config();

const app = express();

// Connect to MongoDB
connectDB();

// CORS
app.use(cors({
  origin: ['http://localhost:5173', 'http://192.168.51.90:5173', 'https://xcybeamer.com', 'https://*.xcybeamer.com'], // your LAN IP + localhost
  methods: ["GET","POST","PUT","DELETE"],
  credentials: true
}));

/**
 * ⚠️ Stripe webhook must use raw body
 * and must be registered BEFORE express.json()
 */
app.use(
  '/payments/webhook',
  express.raw({ type: 'application/json' })
);

// JSON parser for all other routes
app.use(express.json());

// Import routes
const statsRoutes = require('./api/stats');
const categoryRoutes = require('./api/categories');
const guideRoutes = require('./api/guides');
const featureListRoutes = require('./api/featureLists');
const promoCodeRoutes = require('./api/promoCodes');
const userRoutes = require('./api/users');
const twoFactorRoutes = require('./api/twoFactorAuth');

// Routes
app.use('/auth', require('./api/auth'));
app.use('/payments', require('./api/payments'));
app.use('/orders', require('./api/orders'));
app.use('/products', require('./api/products'));
app.use('/admin', require('./api/admin'));
app.use('/product-keys', require('./api/productKeys'));
app.use('/categories', categoryRoutes);
app.use('/guides', guideRoutes);
app.use('/feature-lists', featureListRoutes);
app.use('/promo-codes', promoCodeRoutes);
app.use('/users', userRoutes);
app.use("/stats", statsRoutes);
app.use('/twofactor', twoFactorRoutes);

app.get('/', (req, res) => {
  res.json({ message: 'XCY BEAMER API is running' });
});

const PORT = process.env.PORT || 5000;

// Use server.listen() instead of app.listen()
app.listen(PORT, '0.0.0.0', () => {
  console.log(`Server running on port ${PORT}`);
});
