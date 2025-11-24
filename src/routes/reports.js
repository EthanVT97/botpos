const express = require('express');
const router = express.Router();
const { pool, query, supabase } = require('../config/database');

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
    const { start_date, end_date } = req.query;
    
    let query = supabase
      .from('order_items')
      .select(`
        product_id,
        quantity,
        price,
        created_at,
        products(name, name_mm, cost)
      `);

    if (start_date) {
      query = query.gte('created_at', `${start_date}T00:00:00`);
    }
    if (end_date) {
      query = query.lte('created_at', `${end_date}T23:59:59`);
    }

    const { data: orderItems, error } = await query;

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
      profit: p.total_revenue - p.total_cost,
      profit_margin: p.total_revenue > 0 ? ((p.total_revenue - p.total_cost) / p.total_revenue * 100).toFixed(2) : 0
    })).sort((a, b) => b.total_revenue - a.total_revenue);

    res.json({ success: true, data: performance });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// Profit and Loss report
router.get('/profit-loss', async (req, res) => {
  try {
    const { start_date, end_date } = req.query;
    const startDate = start_date || new Date(new Date().setDate(1)).toISOString().split('T')[0];
    const endDate = end_date || new Date().toISOString().split('T')[0];

    // Get completed orders
    const { data: orders, error: ordersError } = await supabase
      .from('orders')
      .select('id, total_amount, discount, tax, status')
      .eq('status', 'completed')
      .gte('created_at', `${startDate}T00:00:00`)
      .lte('created_at', `${endDate}T23:59:59`);

    if (ordersError) throw ordersError;

    // Get order items with cost
    const { data: orderItems, error: itemsError } = await supabase
      .from('order_items')
      .select(`
        order_id,
        quantity,
        price,
        products(cost)
      `)
      .in('order_id', orders.map(o => o.id));

    if (itemsError) throw itemsError;

    // Calculate totals
    const totalRevenue = orders.reduce((sum, o) => sum + parseFloat(o.total_amount), 0);
    const totalDiscount = orders.reduce((sum, o) => sum + parseFloat(o.discount || 0), 0);
    const totalTax = orders.reduce((sum, o) => sum + parseFloat(o.tax || 0), 0);
    
    const totalCost = orderItems.reduce((sum, item) => {
      return sum + (item.quantity * parseFloat(item.products?.cost || 0));
    }, 0);

    const grossProfit = totalRevenue - totalCost;
    const netProfit = grossProfit - totalDiscount;

    res.json({
      success: true,
      data: {
        period: { start_date: startDate, end_date: endDate },
        revenue: {
          total_revenue: totalRevenue,
          total_orders: orders.length,
          average_order_value: orders.length > 0 ? totalRevenue / orders.length : 0
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
    res.status(500).json({ success: false, error: error.message });
  }
});

module.exports = router;
