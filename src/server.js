const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 3001;

// Middleware
app.use(cors());
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

// Routes
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

// Bot Webhooks
app.use('/webhooks/viber', require('./routes/webhooks/viber'));
app.use('/webhooks/telegram', require('./routes/webhooks/telegram'));
app.use('/webhooks/messenger', require('./routes/webhooks/messenger'));

// Health check
app.get('/health', async (req, res) => {
  try {
    // Check database connection
    const { supabase } = require('./config/supabase');
    const { error } = await supabase.from('settings').select('key').limit(1);
    
    res.json({ 
      status: 'OK', 
      message: 'Myanmar POS System is running',
      database: error ? 'disconnected' : 'connected',
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    res.status(503).json({ 
      status: 'ERROR', 
      message: 'Service unavailable',
      error: error.message 
    });
  }
});

// Error handling
const { errorHandler, notFoundHandler } = require('./middleware/errorHandler');
app.use(notFoundHandler);
app.use(errorHandler);

app.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
  console.log(`📱 Bot webhooks ready`);
  console.log(`🌐 Health check: http://localhost:${PORT}/health`);
});

module.exports = app;
