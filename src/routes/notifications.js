const express = require('express');
const router = express.Router();
const { pool, query, supabase } = require('../config/database');
const { authenticate, authorize } = require('../middleware/auth');
const notificationService = require('../services/notificationService');

// All notification routes require authentication
router.use(authenticate);

/**
 * @route   POST /api/notifications/test-email
 * @desc    Test email configuration
 * @access  Private (admin)
 */
router.post('/test-email', authorize('settings', 'edit'), async (req, res) => {
  try {
    const { email } = req.body;

    if (!email) {
      return res.status(400).json({
        success: false,
        error: 'Email address is required'
      });
    }

    const result = await notificationService.sendEmail({
      to: email,
      subject: 'Test Email - Myanmar POS',
      html: '<h1>Test Email</h1><p>Your email configuration is working correctly!</p>',
      text: 'Test Email - Your email configuration is working correctly!'
    });

    res.json(result);
  } catch (error) {
    console.error('Test email error:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * @route   POST /api/notifications/test-sms
 * @desc    Test SMS configuration
 * @access  Private (admin)
 */
router.post('/test-sms', authorize('settings', 'edit'), async (req, res) => {
  try {
    const { phone } = req.body;

    if (!phone) {
      return res.status(400).json({
        success: false,
        error: 'Phone number is required'
      });
    }

    const result = await notificationService.sendSMS({
      to: phone,
      message: 'Test SMS from Myanmar POS - Your SMS configuration is working!'
    });

    res.json(result);
  } catch (error) {
    console.error('Test SMS error:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * @route   POST /api/notifications/order-confirmation
 * @desc    Send order confirmation
 * @access  Private
 */
router.post('/order-confirmation', async (req, res) => {
  try {
    const { orderId } = req.body;

    // Get order with customer
    const result = await query(`
      SELECT 
        o.*,
        json_build_object(
          'id', c.id,
          'name', c.name,
          'email', c.email,
          'phone', c.phone
        ) as customers
      FROM orders o
      LEFT JOIN customers c ON o.customer_id = c.id
      WHERE o.id = $1
    `, [orderId]);

    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        error: 'Order not found'
      });
    }

    const order = result.rows[0];

    const results = await notificationService.sendOrderConfirmation(
      order,
      order.customers
    );

    res.json({
      success: true,
      results
    });
  } catch (error) {
    console.error('Order confirmation error:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * @route   POST /api/notifications/order-status
 * @desc    Send order status update
 * @access  Private
 */
router.post('/order-status', async (req, res) => {
  try {
    const { orderId, status } = req.body;

    // Get order with customer
    const result = await query(`
      SELECT 
        o.*,
        json_build_object(
          'id', c.id,
          'name', c.name,
          'email', c.email,
          'phone', c.phone
        ) as customers
      FROM orders o
      LEFT JOIN customers c ON o.customer_id = c.id
      WHERE o.id = $1
    `, [orderId]);

    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        error: 'Order not found'
      });
    }

    const order = result.rows[0];

    const results = await notificationService.sendOrderStatusUpdate(
      order,
      order.customers,
      status
    );

    res.json({
      success: true,
      results
    });
  } catch (error) {
    console.error('Order status notification error:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * @route   POST /api/notifications/low-stock
 * @desc    Send low stock alert
 * @access  Private (admin)
 */
router.post('/low-stock', authorize('settings', 'edit'), async (req, res) => {
  try {
    // Get low stock products
    const { data: products } = await supabase
      .from('products')
      .select('*')
      .lt('stock_quantity', 20)
      .order('stock_quantity', { ascending: true });

    if (!products || products.length === 0) {
      return res.json({
        success: true,
        message: 'No low stock products'
      });
    }

    // Get admin email from settings
    const { data: settings } = await supabase
      .from('settings')
      .select('*')
      .eq('key', 'admin_email')
      .single();

    const adminEmail = settings?.value || process.env.ADMIN_EMAIL;

    if (!adminEmail) {
      return res.status(400).json({
        success: false,
        error: 'Admin email not configured'
      });
    }

    const result = await notificationService.sendLowStockAlert(
      products,
      adminEmail
    );

    res.json(result);
  } catch (error) {
    console.error('Low stock alert error:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * @route   POST /api/notifications/daily-report
 * @desc    Send daily sales report
 * @access  Private (admin)
 */
router.post('/daily-report', authorize('settings', 'edit'), async (req, res) => {
  try {
    // Get today's sales summary
    const today = new Date().toISOString().split('T')[0];
    
    const { data: summary } = await supabase.rpc('get_sales_summary', {
      p_start_date: today,
      p_end_date: today
    });

    // Get admin email
    const { data: settings } = await supabase
      .from('settings')
      .select('*')
      .eq('key', 'admin_email')
      .single();

    const adminEmail = settings?.value || process.env.ADMIN_EMAIL;

    if (!adminEmail) {
      return res.status(400).json({
        success: false,
        error: 'Admin email not configured'
      });
    }

    const result = await notificationService.sendDailySalesReport(
      summary?.[0] || {},
      adminEmail
    );

    res.json(result);
  } catch (error) {
    console.error('Daily report error:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * @route   GET /api/notifications/settings
 * @desc    Get notification settings
 * @access  Private (admin)
 */
router.get('/settings', authorize('settings', 'view'), async (req, res) => {
  try {
    const { data: settings } = await supabase
      .from('settings')
      .select('*')
      .in('key', [
        'admin_email',
        'notification_email_enabled',
        'notification_sms_enabled',
        'notification_order_confirmation',
        'notification_order_status',
        'notification_low_stock',
        'notification_daily_report'
      ]);

    const settingsMap = {};
    settings?.forEach(s => {
      settingsMap[s.key] = s.value;
    });

    res.json({
      success: true,
      data: settingsMap
    });
  } catch (error) {
    console.error('Get notification settings error:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * @route   POST /api/notifications/settings
 * @desc    Update notification settings
 * @access  Private (admin)
 */
router.post('/settings', authorize('settings', 'edit'), async (req, res) => {
  try {
    const settings = req.body;

    for (const [key, value] of Object.entries(settings)) {
      await supabase
        .from('settings')
        .upsert({
          key,
          value: value?.toString()
        }, {
          onConflict: 'key'
        });
    }

    res.json({
      success: true,
      message: 'Notification settings updated'
    });
  } catch (error) {
    console.error('Update notification settings error:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

module.exports = router;
