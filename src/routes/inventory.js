const express = require('express');
const router = express.Router();
const { pool, query } = require('../config/database');

// Get all inventory movements
router.get('/movements', async (req, res) => {
  try {
    const { data, error } = await supabase
      .from('inventory_movements')
      .select('*, products(name, name_mm)')
      .order('created_at', { ascending: false });

    if (error) throw error;
    res.json({ success: true, data });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// Add inventory movement
router.post('/movements', async (req, res) => {
  try {
    const { product_id, quantity, type, notes } = req.body;
    
    // Create movement record
    const { data: movement, error: movementError } = await supabase
      .from('inventory_movements')
      .insert([{ product_id, quantity, type, notes }])
      .select()
      .single();

    if (movementError) throw movementError;

    // Update product stock
    let quantityChange = 0;
    if (type === 'in') {
      quantityChange = quantity;
    } else if (type === 'out') {
      quantityChange = -quantity;
    } else if (type === 'adjustment') {
      quantityChange = quantity;
    }

    const { error: stockError } = await supabase.rpc('update_product_stock', {
      product_id,
      quantity_change: quantityChange
    });

    if (stockError) throw stockError;

    res.json({ success: true, data: movement });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// Get low stock products
router.get('/low-stock', async (req, res) => {
  try {
    const threshold = req.query.threshold || 10;
    
    const { data, error } = await supabase
      .from('products')
      .select('*')
      .lte('stock_quantity', threshold)
      .order('stock_quantity', { ascending: true });

    if (error) throw error;
    res.json({ success: true, data });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

module.exports = router;
