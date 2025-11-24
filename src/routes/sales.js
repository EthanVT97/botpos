const express = require('express');
const router = express.Router();
const { pool, query, supabase } = require('../config/database');

// Get sales summary
router.get('/summary', async (req, res) => {
  try {
    const { start_date, end_date } = req.query;
    
    let queryText = `
      SELECT 
        total_amount, 
        COALESCE(discount, 0) as discount, 
        COALESCE(tax, 0) as tax, 
        created_at, 
        payment_method
      FROM orders
      WHERE status = 'completed'
    `;
    
    const params = [];
    let paramCount = 1;
    
    if (start_date) {
      queryText += ` AND created_at >= $${paramCount}`;
      params.push(start_date);
      paramCount++;
    }
    
    if (end_date) {
      queryText += ` AND created_at <= $${paramCount}`;
      params.push(end_date + ' 23:59:59');
      paramCount++;
    }

    const result = await query(queryText, params);
    const data = result.rows;

    const summary = {
      total_sales: data.reduce((sum, order) => sum + parseFloat(order.total_amount || 0), 0),
      total_discount: data.reduce((sum, order) => sum + parseFloat(order.discount || 0), 0),
      total_tax: data.reduce((sum, order) => sum + parseFloat(order.tax || 0), 0),
      order_count: data.length,
      payment_methods: {}
    };

    data.forEach(order => {
      if (!summary.payment_methods[order.payment_method]) {
        summary.payment_methods[order.payment_method] = 0;
      }
      summary.payment_methods[order.payment_method] += parseFloat(order.total_amount || 0);
    });

    res.json({ success: true, data: summary });
  } catch (error) {
    console.error('Error fetching sales summary:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// Get top selling products
router.get('/top-products', async (req, res) => {
  try {
    const { limit = 10 } = req.query;
    
    const result = await query(`
      SELECT 
        oi.product_id,
        SUM(oi.quantity) as quantity,
        json_build_object(
          'name', p.name,
          'name_mm', p.name_mm,
          'price', p.price
        ) as products
      FROM order_items oi
      JOIN products p ON oi.product_id = p.id
      JOIN orders o ON oi.order_id = o.id
      WHERE o.status = 'completed'
      GROUP BY oi.product_id, p.name, p.name_mm, p.price
      ORDER BY quantity DESC
      LIMIT $1
    `, [parseInt(limit)]);

    res.json({ success: true, data: result.rows });
  } catch (error) {
    console.error('Error fetching top products:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

module.exports = router;
