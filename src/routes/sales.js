const express = require('express');
const router = express.Router();
const { pool, query, supabase } = require('../config/database');

// Get sales summary
router.get('/summary', async (req, res) => {
  try {
    const { start_date, end_date } = req.query;
    
    let query = supabase
      .from('orders')
      .select('total_amount, discount, tax, created_at, payment_method')
      .eq('status', 'completed');

    if (start_date) query = query.gte('created_at', start_date);
    if (end_date) query = query.lte('created_at', end_date);

    const { data, error } = await query;

    if (error) throw error;

    const summary = {
      total_sales: data.reduce((sum, order) => sum + order.total_amount, 0),
      total_discount: data.reduce((sum, order) => sum + order.discount, 0),
      total_tax: data.reduce((sum, order) => sum + order.tax, 0),
      order_count: data.length,
      payment_methods: {}
    };

    data.forEach(order => {
      if (!summary.payment_methods[order.payment_method]) {
        summary.payment_methods[order.payment_method] = 0;
      }
      summary.payment_methods[order.payment_method] += order.total_amount;
    });

    res.json({ success: true, data: summary });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// Get top selling products
router.get('/top-products', async (req, res) => {
  try {
    const { limit = 10 } = req.query;
    
    const { data, error } = await supabase
      .from('order_items')
      .select('product_id, quantity, products(name, name_mm, price)')
      .order('quantity', { ascending: false })
      .limit(limit);

    if (error) throw error;
    res.json({ success: true, data });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

module.exports = router;
