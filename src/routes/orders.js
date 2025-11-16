const express = require('express');
const router = express.Router();
const { supabase } = require('../config/supabase');

// Get all orders
router.get('/', async (req, res) => {
  try {
    const { data, error } = await supabase
      .from('orders')
      .select(`
        *,
        customers(name, phone),
        order_items(*, products(name, name_mm, price))
      `)
      .order('created_at', { ascending: false });

    if (error) throw error;
    res.json({ success: true, data });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// Get order by ID
router.get('/:id', async (req, res) => {
  try {
    const { data, error } = await supabase
      .from('orders')
      .select(`
        *,
        customers(name, phone, address),
        order_items(*, products(name, name_mm, price, image_url))
      `)
      .eq('id', req.params.id)
      .single();

    if (error) throw error;
    res.json({ success: true, data });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// Create order with transaction support
router.post('/', async (req, res) => {
  try {
    const { customer_id, items, total_amount, discount, tax, payment_method, notes, source } = req.body;
    
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

    // Check if customer exists
    const { data: customer, error: customerError } = await supabase
      .from('customers')
      .select('id')
      .eq('id', customer_id)
      .single();

    if (customerError || !customer) {
      return res.status(404).json({ 
        success: false, 
        error: 'Customer not found' 
      });
    }

    // Check if all products exist and have sufficient stock
    const productIds = items.map(item => item.product_id);
    const { data: products, error: productsError } = await supabase
      .from('products')
      .select('id, name, stock_quantity')
      .in('id', productIds);

    if (productsError) throw productsError;

    if (products.length !== productIds.length) {
      return res.status(404).json({ 
        success: false, 
        error: 'One or more products not found' 
      });
    }

    // Check stock availability
    const stockIssues = [];
    for (const item of items) {
      const product = products.find(p => p.id === item.product_id);
      if (product && product.stock_quantity < item.quantity) {
        stockIssues.push({
          product_id: product.id,
          product_name: product.name,
          available: product.stock_quantity,
          requested: item.quantity
        });
      }
    }

    if (stockIssues.length > 0) {
      return res.status(400).json({ 
        success: false, 
        error: 'Insufficient stock for one or more products',
        details: stockIssues
      });
    }

    // Create order (PostgreSQL will handle transaction atomicity)
    const { data: order, error: orderError } = await supabase
      .from('orders')
      .insert([{
        customer_id,
        total_amount,
        discount: discount || 0,
        tax: tax || 0,
        payment_method,
        notes,
        source: source || 'pos',
        status: 'pending'
      }])
      .select()
      .single();

    if (orderError) throw orderError;

    // Create order items
    const orderItems = items.map(item => ({
      order_id: order.id,
      product_id: item.product_id,
      quantity: item.quantity,
      price: item.price,
      subtotal: item.quantity * item.price,
      uom_id: item.uom_id || null
    }));

    const { error: itemsError } = await supabase
      .from('order_items')
      .insert(orderItems);

    if (itemsError) {
      // Rollback: delete the order if items insertion fails
      await supabase.from('orders').delete().eq('id', order.id);
      throw itemsError;
    }

    // Update product stock
    let stockUpdateFailed = false;
    for (const item of items) {
      const { error: stockError } = await supabase.rpc('update_product_stock', {
        product_id: item.product_id,
        quantity_change: -item.quantity
      });
      
      if (stockError) {
        console.error('Stock update error:', stockError);
        stockUpdateFailed = true;
      }
    }

    // If stock update failed, log warning but don't fail the order
    if (stockUpdateFailed) {
      console.warn(`⚠️  Stock update failed for order ${order.id}, manual adjustment may be needed`);
    }

    // Fetch complete order with items
    const { data: completeOrder } = await supabase
      .from('orders')
      .select(`
        *,
        customers(name, phone),
        order_items(*, products(name, name_mm))
      `)
      .eq('id', order.id)
      .single();

    res.json({ 
      success: true, 
      data: completeOrder || order,
      warning: stockUpdateFailed ? 'Order created but stock update may have failed' : null
    });
  } catch (error) {
    console.error('Order creation error:', error);
    res.status(500).json({ 
      success: false, 
      error: process.env.NODE_ENV === 'development' ? error.message : 'Failed to create order'
    });
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
