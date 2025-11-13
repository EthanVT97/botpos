const express = require('express');
const router = express.Router();
const { supabase } = require('../config/supabase');

// Daily sales report
router.get('/daily-sales', async (req, res) => {
  try {
    const { date } = req.query;
    const targetDate = date || new Date().toISOString().split('T')[0];
    
    const { data, error } = await supabase
      .from('orders')
      .select('total_amount, discount, tax, status')
      .gte('created_at', `${targetDate}T00:00:00`)
      .lte('created_at', `${targetDate}T23:59:59`);

    if (error) throw error;

    const completedOrders = data.filter(o => o.status === 'completed');
    
    const summary = {
      total_orders: completedOrders.length,
      total_revenue: completedOrders.reduce((sum, o) => sum + parseFloat(o.total_amount), 0),
      total_discount: completedOrders.reduce((sum, o) => sum + parseFloat(o.discount || 0), 0),
      total_tax: completedOrders.reduce((sum, o) => sum + parseFloat(o.tax || 0), 0)
    };

    res.json({ success: true, data: summary });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// Monthly sales report
router.get('/monthly-sales', async (req, res) => {
  try {
    const { month } = req.query;
    const targetMonth = month || new Date().toISOString().slice(0, 7);
    
    const { data, error } = await supabase
      .from('orders')
      .select('total_amount, discount, tax, status')
      .gte('created_at', `${targetMonth}-01T00:00:00`)
      .lt('created_at', `${targetMonth}-32T00:00:00`);

    if (error) throw error;

    const completedOrders = data.filter(o => o.status === 'completed');
    
    const summary = {
      total_orders: completedOrders.length,
      total_revenue: completedOrders.reduce((sum, o) => sum + parseFloat(o.total_amount), 0),
      total_discount: completedOrders.reduce((sum, o) => sum + parseFloat(o.discount || 0), 0),
      total_tax: completedOrders.reduce((sum, o) => sum + parseFloat(o.tax || 0), 0)
    };

    res.json({ success: true, data: summary });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// Product performance report
router.get('/product-performance', async (req, res) => {
  try {
    const { data: orderItems, error } = await supabase
      .from('order_items')
      .select(`
        product_id,
        quantity,
        price,
        products(name, name_mm, cost)
      `);

    if (error) throw error;

    // Aggregate by product
    const productMap = {};
    orderItems.forEach(item => {
      const pid = item.product_id;
      if (!productMap[pid]) {
        productMap[pid] = {
          product_id: pid,
          name: item.products?.name,
          name_mm: item.products?.name_mm,
          total_quantity: 0,
          total_revenue: 0,
          total_cost: 0
        };
      }
      productMap[pid].total_quantity += item.quantity;
      productMap[pid].total_revenue += item.quantity * parseFloat(item.price);
      productMap[pid].total_cost += item.quantity * parseFloat(item.products?.cost || 0);
    });

    const performance = Object.values(productMap).map(p => ({
      ...p,
      profit: p.total_revenue - p.total_cost
    })).sort((a, b) => b.total_revenue - a.total_revenue);

    res.json({ success: true, data: performance });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

module.exports = router;
