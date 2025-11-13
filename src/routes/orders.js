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

// Create order
router.post('/', async (req, res) => {
  try {
    const { customer_id, items, total_amount, discount, tax, payment_method, notes, source } = req.body;
    
    // Create order
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
      subtotal: item.quantity * item.price
    }));

    const { error: itemsError } = await supabase
      .from('order_items')
      .insert(orderItems);

    if (itemsError) throw itemsError;

    // Update product stock
    for (const item of items) {
      const { error: stockError } = await supabase.rpc('update_product_stock', {
        product_id: item.product_id,
        quantity_change: -item.quantity
      });
      if (stockError) console.error('Stock update error:', stockError);
    }

    res.json({ success: true, data: order });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
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
