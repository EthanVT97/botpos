const express = require('express');
const router = express.Router();
const { pool, query, getClient, supabase } = require('../config/database');

// Get all orders
router.get('/', async (req, res) => {
  try {
    const result = await query(`
      SELECT 
        o.*,
        json_build_object('name', c.name, 'phone', c.phone) as customers,
        (
          SELECT json_agg(
            json_build_object(
              'id', oi.id,
              'quantity', oi.quantity,
              'price', oi.price,
              'subtotal', oi.subtotal,
              'products', json_build_object(
                'name', p.name,
                'name_mm', p.name_mm,
                'price', p.price
              )
            )
          )
          FROM order_items oi
          LEFT JOIN products p ON oi.product_id = p.id
          WHERE oi.order_id = o.id
        ) as order_items
      FROM orders o
      LEFT JOIN customers c ON o.customer_id = c.id
      ORDER BY o.created_at DESC
    `);
    
    res.json({ success: true, data: result.rows });
  } catch (error) {
    console.error('Error fetching orders:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// Get order by ID
router.get('/:id', async (req, res) => {
  try {
    const result = await query(`
      SELECT 
        o.*,
        json_build_object(
          'name', c.name, 
          'phone', c.phone, 
          'address', c.address
        ) as customers,
        (
          SELECT json_agg(
            json_build_object(
              'id', oi.id,
              'quantity', oi.quantity,
              'price', oi.price,
              'subtotal', oi.subtotal,
              'products', json_build_object(
                'name', p.name,
                'name_mm', p.name_mm,
                'price', p.price,
                'image_url', p.image_url
              )
            )
          )
          FROM order_items oi
          LEFT JOIN products p ON oi.product_id = p.id
          WHERE oi.order_id = o.id
        ) as order_items
      FROM orders o
      LEFT JOIN customers c ON o.customer_id = c.id
      WHERE o.id = $1
    `, [req.params.id]);

    if (result.rows.length === 0) {
      return res.status(404).json({ success: false, error: 'Order not found' });
    }
    
    res.json({ success: true, data: result.rows[0] });
  } catch (error) {
    console.error('Error fetching order:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// Create order with transaction support (FIXED: Race condition)
router.post('/', async (req, res) => {
  const client = await getClient();
  
  try {
    const { customer_id, store_id, items, total_amount, discount, tax, payment_method, notes, source } = req.body;
    
    // Validate input
    if (!customer_id || !items || !Array.isArray(items) || items.length === 0) {
      return res.status(400).json({ 
        success: false, 
        error: 'Invalid order data: customer_id and items are required' 
      });
    }

    // Validate all items have required fields
    for (const item of items) {
      if (!item.product_id || !item.quantity || !item.price) {
        return res.status(400).json({ 
          success: false, 
          error: 'Invalid item data: product_id, quantity, and price are required' 
        });
      }
      if (item.quantity <= 0) {
        return res.status(400).json({ 
          success: false, 
          error: 'Item quantity must be greater than 0' 
        });
      }
    }

    // Start transaction
    await client.query('BEGIN');

    // Check if customer exists
    const customerResult = await client.query(
      'SELECT id FROM customers WHERE id = $1',
      [customer_id]
    );

    if (customerResult.rows.length === 0) {
      await client.query('ROLLBACK');
      return res.status(404).json({ 
        success: false, 
        error: 'Customer not found' 
      });
    }

    // Lock products for update and check stock atomically
    const productIds = items.map(item => item.product_id);
    const lockQuery = `
      SELECT id, name, stock_quantity 
      FROM products 
      WHERE id = ANY($1)
      FOR UPDATE
    `;
    const productsResult = await client.query(lockQuery, [productIds]);
    const products = productsResult.rows;

    if (products.length !== productIds.length) {
      await client.query('ROLLBACK');
      return res.status(404).json({ 
        success: false, 
        error: 'One or more products not found' 
      });
    }

    // Check stock availability with locked rows
    const stockIssues = [];
    for (const item of items) {
      const product = products.find(p => p.id === item.product_id);
      if (!product || product.stock_quantity < item.quantity) {
        stockIssues.push({
          product_id: item.product_id,
          product_name: product?.name || 'Unknown',
          available: product?.stock_quantity || 0,
          requested: item.quantity
        });
      }
    }

    if (stockIssues.length > 0) {
      await client.query('ROLLBACK');
      return res.status(400).json({ 
        success: false, 
        error: 'Insufficient stock for one or more products',
        details: stockIssues
      });
    }

    // Create order
    const orderResult = await client.query(`
      INSERT INTO orders (customer_id, store_id, total_amount, discount, tax, payment_method, notes, source, status)
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
      RETURNING *
    `, [customer_id, store_id, total_amount, discount || 0, tax || 0, payment_method, notes, source || 'pos', 'pending']);

    const order = orderResult.rows[0];

    // Insert order items and update stock atomically
    for (const item of items) {
      // Insert order item
      await client.query(`
        INSERT INTO order_items (order_id, product_id, quantity, price, subtotal, uom_id)
        VALUES ($1, $2, $3, $4, $5, $6)
      `, [order.id, item.product_id, item.quantity, item.price, item.quantity * item.price, item.uom_id || null]);
      
      // Update stock atomically
      await client.query(`
        UPDATE products 
        SET stock_quantity = stock_quantity - $1,
            updated_at = NOW()
        WHERE id = $2
      `, [item.quantity, item.product_id]);
    }

    // Commit transaction
    await client.query('COMMIT');

    // Fetch complete order with items (outside transaction)
    const completeOrderResult = await query(`
      SELECT 
        o.*,
        json_build_object('name', c.name, 'phone', c.phone) as customer,
        (
          SELECT json_agg(
            json_build_object(
              'id', oi.id,
              'quantity', oi.quantity,
              'price', oi.price,
              'subtotal', oi.subtotal,
              'product', json_build_object('name', p.name, 'name_mm', p.name_mm)
            )
          )
          FROM order_items oi
          JOIN products p ON oi.product_id = p.id
          WHERE oi.order_id = o.id
        ) as items
      FROM orders o
      LEFT JOIN customers c ON o.customer_id = c.id
      WHERE o.id = $1
    `, [order.id]);

    res.json({ 
      success: true, 
      data: completeOrderResult.rows[0] || order
    });
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('Order creation error:', error);
    res.status(500).json({ 
      success: false, 
      error: process.env.NODE_ENV === 'development' ? error.message : 'Failed to create order'
    });
  } finally {
    client.release();
  }
});

// Update order status
router.patch('/:id/status', async (req, res) => {
  try {
    const { status } = req.body;
    
    const { data, error } = await supabase
      .from('orders')
      .update({ status })
      .eq('id', req.params.id)
      .select()
      .single();

    if (error) throw error;
    res.json({ success: true, data });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// Delete order
router.delete('/:id', async (req, res) => {
  try {
    const { error } = await supabase
      .from('orders')
      .delete()
      .eq('id', req.params.id);

    if (error) throw error;
    res.json({ success: true, message: 'Order deleted successfully' });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

module.exports = router;
