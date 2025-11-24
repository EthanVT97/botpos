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

    // Get sales summary
    const summaryResult = await query(`
      SELECT 
        COALESCE(SUM(total_amount), 0) as total_sales,
        COUNT(*) as total_orders,
        COALESCE(AVG(total_amount), 0) as avg_order_value,
        COALESCE(SUM(total_amount - COALESCE(discount, 0)), 0) as total_profit,
        COALESCE(SUM(discount), 0) as total_discount,
        COUNT(DISTINCT customer_id) as unique_customers
      FROM orders
      WHERE status = 'completed'
        AND created_at >= $1
        AND created_at <= $2
    `, [startDate, endDate + ' 23:59:59']);

    // Get sales trend (daily)
    const trendResult = await query(`
      SELECT 
        DATE(created_at) as period,
        COALESCE(SUM(total_amount), 0) as total_sales,
        COUNT(*) as order_count
      FROM orders
      WHERE status = 'completed'
        AND created_at >= $1
        AND created_at <= $2
      GROUP BY DATE(created_at)
      ORDER BY period ASC
    `, [startDate, endDate + ' 23:59:59']);

    // Get top products
    const topProductsResult = await query(`
      SELECT 
        p.name as product_name,
        p.name_mm as product_name_mm,
        SUM(oi.quantity) as quantity_sold,
        SUM(oi.subtotal) as revenue
      FROM order_items oi
      JOIN products p ON oi.product_id = p.id
      JOIN orders o ON oi.order_id = o.id
      WHERE o.status = 'completed'
        AND o.created_at >= $1
        AND o.created_at <= $2
      GROUP BY p.id, p.name, p.name_mm
      ORDER BY quantity_sold DESC
      LIMIT 5
    `, [startDate, endDate + ' 23:59:59']);

    // Get payment methods
    const paymentResult = await query(`
      SELECT 
        payment_method,
        COUNT(*) as transaction_count,
        SUM(total_amount) as total_amount
      FROM orders
      WHERE status = 'completed'
        AND created_at >= $1
        AND created_at <= $2
      GROUP BY payment_method
      ORDER BY total_amount DESC
    `, [startDate, endDate + ' 23:59:59']);

    // Get top categories
    const categoryResult = await query(`
      SELECT 
        c.name,
        c.name_mm,
        COUNT(DISTINCT p.id) as product_count,
        SUM(oi.quantity) as total_quantity_sold,
        SUM(oi.subtotal) as total_revenue,
        SUM(oi.subtotal - (oi.quantity * p.cost)) as total_profit
      FROM order_items oi
      JOIN products p ON oi.product_id = p.id
      JOIN categories c ON p.category_id = c.id
      JOIN orders o ON oi.order_id = o.id
      WHERE o.status = 'completed'
        AND o.created_at >= $1
        AND o.created_at <= $2
      GROUP BY c.id, c.name, c.name_mm
      ORDER BY total_revenue DESC
      LIMIT 5
    `, [startDate, endDate + ' 23:59:59']);

    // Get hourly sales pattern
    const hourlyResult = await query(`
      SELECT 
        EXTRACT(HOUR FROM created_at) as hour_of_day,
        COUNT(*) as order_count,
        SUM(total_amount) as total_sales
      FROM orders
      WHERE status = 'completed'
        AND created_at >= $1
        AND created_at <= $2
      GROUP BY EXTRACT(HOUR FROM created_at)
      ORDER BY hour_of_day ASC
    `, [startDate, endDate + ' 23:59:59']);

    res.json({
      success: true,
      data: {
        summary: summaryResult.rows[0] || {
          total_sales: 0,
          total_orders: 0,
          avg_order_value: 0,
          total_profit: 0,
          total_discount: 0,
          unique_customers: 0
        },
        sales_trend: trendResult.rows || [],
        top_products: topProductsResult.rows || [],
        payment_methods: paymentResult.rows || [],
        top_categories: categoryResult.rows || [],
        hourly_sales: hourlyResult.rows || []
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

/**
 * @route   POST /api/analytics/export/pdf
 * @desc    Export analytics as PDF
 * @access  Private (reports.view)
 */
router.post('/export/pdf', async (req, res) => {
  try {
    const PDFDocument = require('pdfkit');
    const { data, dateRange } = req.body;

    // Create PDF document
    const doc = new PDFDocument({ margin: 50 });
    
    // Set response headers
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename=analytics-report-${new Date().toISOString().split('T')[0]}.pdf`);
    
    // Pipe PDF to response
    doc.pipe(res);

    // Add title
    doc.fontSize(20).text('Myanmar POS - Analytics Report', { align: 'center' });
    doc.moveDown();
    doc.fontSize(12).text(`Date Range: ${dateRange?.start || 'N/A'} to ${dateRange?.end || 'N/A'}`, { align: 'center' });
    doc.moveDown(2);

    // Add summary section
    if (data?.summary) {
      doc.fontSize(16).text('Summary', { underline: true });
      doc.moveDown();
      doc.fontSize(12);
      doc.text(`Total Sales: ${data.summary.total_sales || 0} Ks`);
      doc.text(`Total Orders: ${data.summary.total_orders || 0}`);
      doc.text(`Average Order Value: ${data.summary.avg_order_value || 0} Ks`);
      doc.text(`Total Customers: ${data.summary.total_customers || 0}`);
      doc.moveDown(2);
    }

    // Add top products section
    if (data?.topProducts && data.topProducts.length > 0) {
      doc.fontSize(16).text('Top Products', { underline: true });
      doc.moveDown();
      doc.fontSize(12);
      
      data.topProducts.forEach((product, index) => {
        doc.text(`${index + 1}. ${product.name || 'N/A'} - Qty: ${product.quantity || 0}, Revenue: ${product.revenue || 0} Ks`);
      });
    }

    // Finalize PDF
    doc.end();
  } catch (error) {
    console.error('Error exporting PDF:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * @route   POST /api/analytics/export/excel
 * @desc    Export analytics as Excel
 * @access  Private (reports.view)
 */
router.post('/export/excel', async (req, res) => {
  try {
    const XLSX = require('xlsx');
    const { data, dateRange } = req.body;

    // Create workbook
    const workbook = XLSX.utils.book_new();

    // Summary sheet
    const summaryData = [
      ['Myanmar POS - Analytics Report'],
      [`Date Range: ${dateRange?.start || 'N/A'} to ${dateRange?.end || 'N/A'}`],
      [],
      ['Metric', 'Value'],
      ['Total Sales', `${data?.summary?.total_sales || 0} Ks`],
      ['Total Orders', data?.summary?.total_orders || 0],
      ['Average Order Value', `${data?.summary?.avg_order_value || 0} Ks`],
      ['Total Customers', data?.summary?.total_customers || 0]
    ];

    const summarySheet = XLSX.utils.aoa_to_sheet(summaryData);
    XLSX.utils.book_append_sheet(workbook, summarySheet, 'Summary');

    // Top products sheet
    if (data?.topProducts && data.topProducts.length > 0) {
      const productsData = [
        ['Top Products'],
        [],
        ['Rank', 'Product Name', 'Quantity Sold', 'Revenue (Ks)'],
        ...data.topProducts.map((product, index) => [
          index + 1,
          product.name || 'N/A',
          product.quantity || 0,
          product.revenue || 0
        ])
      ];

      const productsSheet = XLSX.utils.aoa_to_sheet(productsData);
      XLSX.utils.book_append_sheet(workbook, productsSheet, 'Top Products');
    }

    // Generate buffer
    const buffer = XLSX.write(workbook, { type: 'buffer', bookType: 'xlsx' });

    // Set response headers
    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.setHeader('Content-Disposition', `attachment; filename=analytics-report-${new Date().toISOString().split('T')[0]}.xlsx`);
    
    // Send buffer
    res.send(buffer);
  } catch (error) {
    console.error('Error exporting Excel:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

module.exports = router;
