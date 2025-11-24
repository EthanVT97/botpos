const express = require('express');
const router = express.Router();
const { pool, query, supabase } = require('../config/database');

// Daily sales report
router.get('/daily-sales', async (req, res) => {
  try {
    const { date } = req.query;
    const targetDate = date || new Date().toISOString().split('T')[0];
    
    const result = await query(`
      SELECT 
        COUNT(*) as total_orders,
        COALESCE(SUM(total_amount), 0) as total_revenue,
        COALESCE(SUM(discount), 0) as total_discount,
        COALESCE(SUM(tax), 0) as total_tax
      FROM orders
      WHERE status = 'completed'
        AND created_at >= $1
        AND created_at <= $2
    `, [`${targetDate}T00:00:00`, `${targetDate}T23:59:59`]);

    const data = result.rows[0];
    const summary = {
      total_orders: parseInt(data.total_orders || 0),
      total_revenue: parseFloat(data.total_revenue || 0),
      total_discount: parseFloat(data.total_discount || 0),
      total_tax: parseFloat(data.total_tax || 0)
    };

    res.json({ success: true, data: summary });
  } catch (error) {
    console.error('Error fetching daily sales:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// Monthly sales report
router.get('/monthly-sales', async (req, res) => {
  try {
    const { month } = req.query;
    const targetMonth = month || new Date().toISOString().slice(0, 7);
    
    const result = await query(`
      SELECT 
        COUNT(*) as total_orders,
        COALESCE(SUM(total_amount), 0) as total_revenue,
        COALESCE(SUM(discount), 0) as total_discount,
        COALESCE(SUM(tax), 0) as total_tax
      FROM orders
      WHERE status = 'completed'
        AND created_at >= $1
        AND created_at < $2
    `, [`${targetMonth}-01T00:00:00`, `${targetMonth}-32T00:00:00`]);

    const data = result.rows[0];
    const summary = {
      total_orders: parseInt(data.total_orders || 0),
      total_revenue: parseFloat(data.total_revenue || 0),
      total_discount: parseFloat(data.total_discount || 0),
      total_tax: parseFloat(data.total_tax || 0)
    };

    res.json({ success: true, data: summary });
  } catch (error) {
    console.error('Error fetching monthly sales:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// Product performance report
router.get('/product-performance', async (req, res) => {
  try {
    const { start_date, end_date } = req.query;
    
    let queryText = `
      SELECT 
        oi.product_id,
        p.name,
        p.name_mm,
        SUM(oi.quantity) as total_quantity,
        SUM(oi.quantity * oi.price) as total_revenue,
        SUM(oi.quantity * COALESCE(p.cost, 0)) as total_cost
      FROM order_items oi
      JOIN products p ON oi.product_id = p.id
      JOIN orders o ON oi.order_id = o.id
      WHERE o.status = 'completed'
    `;
    
    const params = [];
    let paramCount = 1;
    
    if (start_date) {
      queryText += ` AND oi.created_at >= $${paramCount}`;
      params.push(`${start_date}T00:00:00`);
      paramCount++;
    }
    
    if (end_date) {
      queryText += ` AND oi.created_at <= $${paramCount}`;
      params.push(`${end_date}T23:59:59`);
      paramCount++;
    }
    
    queryText += `
      GROUP BY oi.product_id, p.name, p.name_mm
      ORDER BY total_revenue DESC
    `;

    const result = await query(queryText, params);

    const performance = result.rows.map(p => {
      const totalRevenue = parseFloat(p.total_revenue || 0);
      const totalCost = parseFloat(p.total_cost || 0);
      const profit = totalRevenue - totalCost;
      
      return {
        product_id: p.product_id,
        name: p.name,
        name_mm: p.name_mm,
        total_quantity: parseInt(p.total_quantity || 0),
        total_revenue: totalRevenue,
        total_cost: totalCost,
        profit: profit,
        profit_margin: totalRevenue > 0 ? ((profit / totalRevenue) * 100).toFixed(2) : 0
      };
    });

    res.json({ success: true, data: performance });
  } catch (error) {
    console.error('Error fetching product performance:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// Profit and Loss report
router.get('/profit-loss', async (req, res) => {
  try {
    const { start_date, end_date } = req.query;
    const startDate = start_date || new Date(new Date().setDate(1)).toISOString().split('T')[0];
    const endDate = end_date || new Date().toISOString().split('T')[0];

    // Get revenue and costs in one query
    const result = await query(`
      SELECT 
        COUNT(DISTINCT o.id) as total_orders,
        COALESCE(SUM(o.total_amount), 0) as total_revenue,
        COALESCE(SUM(o.discount), 0) as total_discount,
        COALESCE(SUM(o.tax), 0) as total_tax,
        COALESCE(SUM(oi.quantity * p.cost), 0) as total_cost
      FROM orders o
      LEFT JOIN order_items oi ON o.id = oi.order_id
      LEFT JOIN products p ON oi.product_id = p.id
      WHERE o.status = 'completed'
        AND o.created_at >= $1
        AND o.created_at <= $2
    `, [startDate + 'T00:00:00', endDate + 'T23:59:59']);

    const data = result.rows[0];
    const totalRevenue = parseFloat(data.total_revenue || 0);
    const totalCost = parseFloat(data.total_cost || 0);
    const totalDiscount = parseFloat(data.total_discount || 0);
    const totalTax = parseFloat(data.total_tax || 0);
    const totalOrders = parseInt(data.total_orders || 0);

    const grossProfit = totalRevenue - totalCost;
    const netProfit = grossProfit - totalDiscount;

    res.json({
      success: true,
      data: {
        period: { start_date: startDate, end_date: endDate },
        revenue: {
          total_revenue: totalRevenue,
          total_orders: totalOrders,
          average_order_value: totalOrders > 0 ? totalRevenue / totalOrders : 0
        },
        costs: {
          total_cost: totalCost,
          total_discount: totalDiscount,
          total_tax: totalTax
        },
        profit: {
          gross_profit: grossProfit,
          net_profit: netProfit,
          profit_margin: totalRevenue > 0 ? ((netProfit / totalRevenue) * 100).toFixed(2) : 0
        }
      }
    });
  } catch (error) {
    console.error('Error fetching profit-loss report:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

module.exports = router;
