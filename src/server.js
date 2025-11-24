const express = require('express');
const http = require('http');
const cors = require('cors');
const bodyParser = require('body-parser');
const helmet = require('helmet');
const morgan = require('morgan');
const { WebSocketServer } = require('ws');
require('dotenv').config();

const app = express();
const server = http.createServer(app);
const PORT = process.env.PORT || 3001;

// Trust proxy - required for Render and other reverse proxies
app.set('trust proxy', 1);

// Initialize Socket.IO
const { initializeSocket } = require('./config/socket');
const io = initializeSocket(server);

// Initialize native WebSocket server for /ws path (Render compatibility)
const wss = new WebSocketServer({ noServer: true });

// WebSocket upgrade handler - MUST be before routes
server.on('upgrade', (req, socket, head) => {
  if (req.url === '/ws') {
    wss.handleUpgrade(req, socket, head, (ws) => {
      wss.emit('connection', ws, req);
    });
  } else {
    socket.destroy();
  }
});

// WebSocket heartbeat (Render requirement - keeps connection alive)
setInterval(() => {
  wss.clients.forEach((client) => {
    if (client.readyState === 1) { // 1 = OPEN
      client.ping();
    }
  });
}, 25000); // Every 25 seconds

// WebSocket connection handler
wss.on('connection', (ws, req) => {
  console.log('✅ Native WebSocket Connected from:', req.socket.remoteAddress);

  // Handle pong response
  ws.on('pong', () => {
    // Client is alive
  });

  // Handle messages
  ws.on('message', (data) => {
    try {
      const message = JSON.parse(data.toString());
      console.log('📨 WS Message received:', message);
      
      // Echo back for testing
      ws.send(JSON.stringify({ 
        type: 'ack', 
        message: 'Message received',
        timestamp: new Date().toISOString()
      }));
    } catch (error) {
      console.error('WS Message parse error:', error);
    }
  });

  // Handle close
  ws.on('close', (code, reason) => {
    console.log('❌ WebSocket closed:', code, reason.toString());
  });

  // Handle errors
  ws.on('error', (error) => {
    console.error('WebSocket error:', error);
  });

  // Send welcome message
  ws.send(JSON.stringify({ 
    type: 'connected', 
    message: 'WebSocket connection established',
    timestamp: new Date().toISOString()
  }));
});

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
      socketio: io ? 'active' : 'inactive',
      websocket: wss ? 'active' : 'inactive',
      ws_clients: wss.clients.size,
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

// Manual webhook registration endpoint
app.post('/api/webhooks/register', async (req, res) => {
  try {
    const { autoRegisterWebhooks } = require('./utils/webhookSetup');
    await autoRegisterWebhooks();
    res.json({ 
      success: true, 
      message: 'Webhook registration triggered' 
    });
  } catch (error) {
    res.status(500).json({ 
      success: false, 
      error: error.message 
    });
  }
});

// Error handling
const { errorHandler, notFoundHandler } = require('./middleware/errorHandler');
app.use(notFoundHandler);
app.use(errorHandler);

server.listen(PORT, async () => {
  console.log(`🚀 Server running on port ${PORT}`);
  console.log(`📱 Bot webhooks ready`);
  console.log(`🔌 Socket.IO server active on /socket.io/`);
  console.log(`🔌 Native WebSocket server active on /ws`);
  console.log(`🌐 Health check: http://localhost:${PORT}/health`);
  
  // Auto-register webhooks if configured
  if (process.env.NODE_ENV === 'production' || process.env.AUTO_REGISTER_WEBHOOKS === 'true') {
    const { autoRegisterWebhooks } = require('./utils/webhookSetup');
    setTimeout(() => {
      autoRegisterWebhooks();
    }, 3000); // Wait 3 seconds for server to be fully ready
  }
});

module.exports = { app, server, io };
