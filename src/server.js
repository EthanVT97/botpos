const express = require('express');
const http = require('http');
const cors = require('cors');
const bodyParser = require('body-parser');
const helmet = require('helmet');
const morgan = require('morgan');
require('dotenv').config();

const app = express();
const server = http.createServer(app);
const PORT = process.env.PORT || 3001;

// Trust proxy - required for Render and other reverse proxies
app.set('trust proxy', 1);

// Initialize Socket.IO
const { initializeSocket } = require('./config/socket');
const io = initializeSocket(server);

// Security middleware
app.use(helmet());

// Logging middleware
app.use(morgan('combined'));

// CORS middleware
app.use(cors({
  origin: process.env.CLIENT_URL || 'http://localhost:3000',
  credentials: true
}));

// Body parser middleware
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

// Rate limiting
const { apiLimiter, webhookLimiter } = require('./middleware/rateLimiter');
app.use('/api', apiLimiter);
app.use('/webhooks', webhookLimiter);

// Make io accessible to routes
app.set('io', io);

// Routes
app.use('/api/auth', require('./routes/auth'));
app.use('/api/analytics', require('./routes/analytics'));
app.use('/api/print', require('./routes/print'));
app.use('/api/notifications', require('./routes/notifications'));
app.use('/api/products', require('./routes/products'));
app.use('/api/categories', require('./routes/categories'));
app.use('/api/customers', require('./routes/customers'));
app.use('/api/orders', require('./routes/orders'));
app.use('/api/inventory', require('./routes/inventory'));
app.use('/api/sales', require('./routes/sales'));
app.use('/api/reports', require('./routes/reports'));
app.use('/api/users', require('./routes/users'));
app.use('/api/settings', require('./routes/settings'));
app.use('/api/bots', require('./routes/bots'));
app.use('/api/chat', require('./routes/chat'));
app.use('/api/bot-flows', require('./routes/botFlows'));
app.use('/api/uom', require('./routes/uom'));
app.use('/api/selling-price', require('./routes/sellingPrice'));
app.use('/api/stores', require('./routes/stores'));
app.use('/api/store-transfers', require('./routes/storeTransfers'));

// Bot Webhooks
app.use('/webhooks/viber', require('./routes/webhooks/viber'));
app.use('/webhooks/telegram', require('./routes/webhooks/telegram'));
app.use('/webhooks/messenger', require('./routes/webhooks/messenger'));

// Health check
app.get('/health', async (req, res) => {
  try {
    // Check database connection
    const { pool } = require('./config/database');
    await pool.query('SELECT 1');
    
    res.json({ 
      status: 'OK', 
      message: 'Myanmar POS System is running',
      database: 'connected',
      websocket: io ? 'active' : 'inactive',
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    res.status(503).json({ 
      status: 'ERROR', 
      message: 'Service unavailable',
      database: 'disconnected',
      error: error.message 
    });
  }
});

// Error handling
const { errorHandler, notFoundHandler } = require('./middleware/errorHandler');
app.use(notFoundHandler);
app.use(errorHandler);

server.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
  console.log(`📱 Bot webhooks ready`);
  console.log(`🔌 WebSocket server active`);
  console.log(`🌐 Health check: http://localhost:${PORT}/health`);
});

module.exports = { app, server, io };
