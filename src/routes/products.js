const express = require('express');
const router = express.Router();
const { pool, query, supabase } = require('../config/database');

// Get all products
router.get('/', async (req, res) => {
  try {
    const { data, error } = await supabase
      .from('products')
      .select('*, categories(name)')
      .order('created_at', { ascending: false });

    if (error) throw error;
    res.json({ success: true, data });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// Get product by ID
router.get('/:id', async (req, res) => {
  try {
    const { data, error } = await supabase
      .from('products')
      .select('*, categories(name)')
      .eq('id', req.params.id)
      .single();

    if (error) throw error;
    res.json({ success: true, data });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// Create product
router.post('/', async (req, res) => {
  try {
    let { name, name_mm, description, price, cost, category_id, sku, barcode, stock_quantity, image_url, base_uom_id } = req.body;
    
    // Convert empty strings to null for UUID fields
    category_id = category_id && category_id.trim() !== '' ? category_id : null;
    base_uom_id = base_uom_id && base_uom_id.trim() !== '' ? base_uom_id : null;
    
    // Validate required fields
    if (!name || name.trim() === '') {
      return res.status(400).json({ 
        success: false, 
        error: 'Product name is required' 
      });
    }

    if (price === undefined || price === null || price < 0) {
      return res.status(400).json({ 
        success: false, 
        error: 'Valid price is required' 
      });
    }

    // Validate category exists if provided
    if (category_id) {
      const { data: category } = await supabase
        .from('categories')
        .select('id')
        .eq('id', category_id)
        .single();
      
      if (!category) {
        return res.status(404).json({ 
          success: false, 
          error: 'Category not found' 
        });
      }
    }

    // Check for duplicate SKU if provided
    if (sku) {
      const { data: existingProduct } = await supabase
        .from('products')
        .select('id')
        .eq('sku', sku)
        .single();
      
      if (existingProduct) {
        return res.status(409).json({ 
          success: false, 
          error: 'Product with this SKU already exists' 
        });
      }
    }
    
    const { data, error } = await supabase
      .from('products')
      .insert([{
        name: name.trim(),
        name_mm: name_mm?.trim(),
        description,
        price: parseFloat(price),
        cost: cost ? parseFloat(cost) : null,
        category_id: category_id || null,
        sku: sku?.trim() || null,
        barcode: barcode?.trim() || null,
        stock_quantity: stock_quantity || 0,
        image_url: image_url || null,
        base_uom_id: base_uom_id || null
      }])
      .select()
      .single();

    if (error) throw error;
    res.json({ success: true, data });
  } catch (error) {
    console.error('Error creating product:', error);
    res.status(500).json({ 
      success: false, 
      error: process.env.NODE_ENV === 'development' ? error.message : 'Failed to create product'
    });
  }
});

// Update product
router.put('/:id', async (req, res) => {
  try {
    // Allow updating all fields including base_uom_id
    const updateData = { ...req.body };
    
    // Convert empty strings to null for UUID fields
    if (updateData.category_id === '') updateData.category_id = null;
    if (updateData.base_uom_id === '') updateData.base_uom_id = null;
    
    // Clean up other fields
    if (updateData.sku === '') updateData.sku = null;
    if (updateData.barcode === '') updateData.barcode = null;
    if (updateData.image_url === '') updateData.image_url = null;
    
    const { data, error } = await supabase
      .from('products')
      .update(updateData)
      .eq('id', req.params.id)
      .select()
      .single();

    if (error) throw error;
    res.json({ success: true, data });
  } catch (error) {
    console.error('Error updating product:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// Delete product
router.delete('/:id', async (req, res) => {
  try {
    const { error } = await supabase
      .from('products')
      .delete()
      .eq('id', req.params.id);

    if (error) throw error;
    res.json({ success: true, message: 'Product deleted successfully' });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// Search products
router.get('/search/:query', async (req, res) => {
  try {
    const { data, error } = await supabase
      .from('products')
      .select('*, categories(name)')
      .or(`name.ilike.%${req.params.query}%,name_mm.ilike.%${req.params.query}%,sku.ilike.%${req.params.query}%,barcode.eq.${req.params.query}`);

    if (error) throw error;
    res.json({ success: true, data });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

module.exports = router;
