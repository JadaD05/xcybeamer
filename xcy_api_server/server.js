const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const cors = require('cors');
const dotenv = require('dotenv');
const connectDB = require('./config/db');

dotenv.config();

const app = express();

// Create HTTP server for Socket.IO
const server = http.createServer(app);

// Initialize Socket.IO
const io = new Server(server, {
  cors: { origin: '*' },
  methods: ["GET", "POST"]
});

// Make io globally accessible in routes
app.set('io', io);

// Connect to MongoDB
connectDB();

// CORS
app.use(cors({
  origin: ['http://localhost:5173', 'http://192.168.15.90:5173', 'https://xcybeamer.com', 'https://*.xcybeamer.com'], // your LAN IP + localhost
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

// Routes
app.use('/auth', require('./api/auth'));
app.use('/payments', require('./api/payments'));
app.use('/orders', require('./api/orders'));
app.use('/products', require('./api/products'));
app.use('/admin', require('./api/admin'));
app.use('/admin', statsRoutes.router);
app.use('/product-keys', require('./api/productKeys'));
app.use('/categories', categoryRoutes);

app.get('/', (req, res) => {
  res.json({ message: 'XCY BEAMER API is running' });
});

// Socket.IO connection handler
io.on('connection', (socket) => {
  console.log('New admin client connected:', socket.id);

  socket.on('disconnect', () => {
    console.log('Admin client disconnected:', socket.id);
  });
});

const PORT = process.env.PORT || 5000;

// Use server.listen() instead of app.listen()
server.listen(PORT, '0.0.0.0', () => {
  console.log(`Server running on port ${PORT}`);
});
