const express = require('express');
const router = express.Router();
const { pool, query, supabase } = require('../config/database');
const { authenticate, authorize } = require('../middleware/auth');
const moment = require('moment');

// All analytics routes require authentication and reports permission
router.use(authenticate);
router.use(authorize('reports', 'view'));

/**
 * @route   GET /api/analytics/summary
 * @desc    Get sales summary for date range
 * @access  Private (reports.view)
 */
router.get('/summary', async (req, res) => {
  try {
    const { start_date, end_date } = req.query;
    
    const startDate = start_date || moment().subtract(30, 'days').format('YYYY-MM-DD');
    const endDate = end_date || moment().format('YYYY-MM-DD');

    const { data, error } = await supabase.rpc('get_sales_summary', {
      p_start_date: startDate,
      p_end_date: endDate
    });

    if (error) throw error;

    res.json({
      success: true,
      data: data[0] || {
        total_sales: 0,
        total_orders: 0,
        avg_order_value: 0,
        total_profit: 0,
        total_discount: 0,
        unique_customers: 0
      },
      period: { start_date: startDate, end_date: endDate }
    });
  } catch (error) {
    console.error('Error fetching sales summary:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * @route   GET /api/analytics/sales-trend
 * @desc    Get sales trend (daily, weekly, monthly)
 * @access  Private (reports.view)
 */
router.get('/sales-trend', async (req, res) => {
  try {
    const { start_date, end_date, interval = 'day' } = req.query;
    
    const startDate = start_date || moment().subtract(30, 'days').format('YYYY-MM-DD');
    const endDate = end_date || moment().format('YYYY-MM-DD');

    const { data, error } = await supabase.rpc('get_sales_trend', {
      p_start_date: startDate,
      p_end_date: endDate,
      p_interval: interval
    });

    if (error) throw error;

    res.json({
      success: true,
      data: data || [],
      period: { start_date: startDate, end_date: endDate },
      interval
    });
  } catch (error) {
    console.error('Error fetching sales trend:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * @route   GET /api/analytics/top-products
 * @desc    Get top selling products
 * @access  Private (reports.view)
 */
router.get('/top-products', async (req, res) => {
  try {
    const { start_date, end_date, limit = 10 } = req.query;
    
    const startDate = start_date || moment().subtract(30, 'days').format('YYYY-MM-DD');
    const endDate = end_date || moment().format('YYYY-MM-DD');

    const { data, error } = await supabase.rpc('get_top_products', {
      p_start_date: startDate,
      p_end_date: endDate,
      p_limit: parseInt(limit)
    });

    if (error) throw error;

    res.json({
      success: true,
      data: data || [],
      period: { start_date: startDate, end_date: endDate }
    });
  } catch (error) {
    console.error('Error fetching top products:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * @route   GET /api/analytics/product-performance
 * @desc    Get detailed product performance
 * @access  Private (reports.view)
 */
router.get('/product-performance', async (req, res) => {
  try {
    const { data, error } = await supabase
      .from('v_product_performance')
      .select('*')
      .order('total_revenue', { ascending: false });

    if (error) throw error;

    res.json({
      success: true,
      data: data || []
    });
  } catch (error) {
    console.error('Error fetching product performance:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * @route   GET /api/analytics/customer-analytics
 * @desc    Get customer analytics
 * @access  Private (reports.view)
 */
router.get('/customer-analytics', async (req, res) => {
  try {
    const { data, error } = await supabase
      .from('v_customer_analytics')
      .select('*')
      .order('total_spent', { ascending: false });

    if (error) throw error;

    res.json({
      success: true,
      data: data || []
    });
  } catch (error) {
    console.error('Error fetching customer analytics:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * @route   GET /api/analytics/hourly-sales
 * @desc    Get hourly sales pattern
 * @access  Private (reports.view)
 */
router.get('/hourly-sales', async (req, res) => {
  try {
    const { data, error } = await supabase
      .from('v_hourly_sales')
      .select('*')
      .order('hour_of_day', { ascending: true });

    if (error) throw error;

    res.json({
      success: true,
      data: data || []
    });
  } catch (error) {
    console.error('Error fetching hourly sales:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * @route   GET /api/analytics/category-performance
 * @desc    Get category performance
 * @access  Private (reports.view)
 */
router.get('/category-performance', async (req, res) => {
  try {
    const { data, error } = await supabase
      .from('v_category_performance')
      .select('*')
      .order('total_revenue', { ascending: false });

    if (error) throw error;

    res.json({
      success: true,
      data: data || []
    });
  } catch (error) {
    console.error('Error fetching category performance:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * @route   GET /api/analytics/payment-methods
 * @desc    Get payment method analytics
 * @access  Private (reports.view)
 */
router.get('/payment-methods', async (req, res) => {
  try {
    const { data, error } = await supabase
      .from('v_payment_analytics')
      .select('*')
      .order('total_amount', { ascending: false });

    if (error) throw error;

    res.json({
      success: true,
      data: data || []
    });
  } catch (error) {
    console.error('Error fetching payment analytics:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * @route   GET /api/analytics/inventory-value
 * @desc    Get inventory valuation
 * @access  Private (reports.view)
 */
router.get('/inventory-value', async (req, res) => {
  try {
    const { data, error } = await supabase
      .from('v_inventory_value')
      .select('*')
      .order('inventory_retail_value', { ascending: false });

    if (error) throw error;

    // Calculate totals
    const totals = data.reduce((acc, item) => ({
      total_cost: acc.total_cost + parseFloat(item.inventory_cost_value || 0),
      total_retail: acc.total_retail + parseFloat(item.inventory_retail_value || 0),
      total_profit: acc.total_profit + parseFloat(item.potential_profit || 0)
    }), { total_cost: 0, total_retail: 0, total_profit: 0 });

    res.json({
      success: true,
      data: data || [],
      totals
    });
  } catch (error) {
    console.error('Error fetching inventory value:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * @route   GET /api/analytics/low-stock
 * @desc    Get low stock products with reorder recommendations
 * @access  Private (reports.view)
 */
router.get('/low-stock', async (req, res) => {
  try {
    const { data, error } = await supabase
      .from('v_low_stock_products')
      .select('*')
      .order('stock_quantity', { ascending: true });

    if (error) throw error;

    res.json({
      success: true,
      data: data || []
    });
  } catch (error) {
    console.error('Error fetching low stock products:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * @route   GET /api/analytics/sales-by-source
 * @desc    Get sales by source (POS vs Bot)
 * @access  Private (reports.view)
 */
router.get('/sales-by-source', async (req, res) => {
  try {
    const { data, error } = await supabase
      .from('v_sales_by_source')
      .select('*')
      .order('total_sales', { ascending: false });

    if (error) throw error;

    res.json({
      success: true,
      data: data || []
    });
  } catch (error) {
    console.error('Error fetching sales by source:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * @route   GET /api/analytics/dashboard
 * @desc    Get complete dashboard data
 * @access  Private (reports.view)
 */
router.get('/dashboard', async (req, res) => {
  try {
    const { start_date, end_date } = req.query;
    
    const startDate = start_date || moment().subtract(30, 'days').format('YYYY-MM-DD');
    const endDate = end_date || moment().format('YYYY-MM-DD');

    // Fetch all data in parallel
    const [
      summaryRes,
      trendRes,
      topProductsRes,
      paymentRes,
      categoryRes,
      hourlyRes
    ] = await Promise.all([
      supabase.rpc('get_sales_summary', {
        p_start_date: startDate,
        p_end_date: endDate
      }),
      supabase.rpc('get_sales_trend', {
        p_start_date: startDate,
        p_end_date: endDate,
        p_interval: 'day'
      }),
      supabase.rpc('get_top_products', {
        p_start_date: startDate,
        p_end_date: endDate,
        p_limit: 5
      }),
      supabase.from('v_payment_analytics').select('*'),
      supabase.from('v_category_performance').select('*').order('total_revenue', { ascending: false }).limit(5),
      supabase.from('v_hourly_sales').select('*')
    ]);

    res.json({
      success: true,
      data: {
        summary: summaryRes.data?.[0] || {},
        sales_trend: trendRes.data || [],
        top_products: topProductsRes.data || [],
        payment_methods: paymentRes.data || [],
        top_categories: categoryRes.data || [],
        hourly_sales: hourlyRes.data || []
      },
      period: { start_date: startDate, end_date: endDate }
    });
  } catch (error) {
    console.error('Error fetching dashboard data:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

module.exports = router;
