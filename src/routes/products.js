const express = require('express');
const router = express.Router();
const { pool, query, supabase } = require('../config/database');
const { productValidation } = require('../middleware/validator');

// Get all products
router.get('/', async (req, res) => {
  try {
    const result = await query(`
      SELECT 
        p.*,
        json_build_object('name', c.name, 'name_mm', c.name_mm) as categories
      FROM products p
      LEFT JOIN categories c ON p.category_id = c.id
      ORDER BY p.created_at DESC
    `);
    
    res.json({ success: true, data: result.rows });
  } catch (error) {
    console.error('Error fetching products:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// Get product by ID
router.get('/:id', async (req, res) => {
  try {
    const result = await query(`
      SELECT 
        p.*,
        json_build_object('name', c.name, 'name_mm', c.name_mm) as categories
      FROM products p
      LEFT JOIN categories c ON p.category_id = c.id
      WHERE p.id = $1
    `, [req.params.id]);

    if (result.rows.length === 0) {
      return res.status(404).json({ success: false, error: 'Product not found' });
    }
    
    res.json({ success: true, data: result.rows[0] });
  } catch (error) {
    console.error('Error fetching product:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// Create product
router.post('/', productValidation.create, async (req, res) => {
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
      const categoryResult = await query('SELECT id FROM categories WHERE id = $1', [category_id]);
      if (categoryResult.rows.length === 0) {
        return res.status(404).json({ 
          success: false, 
          error: 'Category not found' 
        });
      }
    }

    // Check for duplicate SKU if provided
    if (sku) {
      const skuResult = await query('SELECT id FROM products WHERE sku = $1', [sku]);
      if (skuResult.rows.length > 0) {
        return res.status(409).json({ 
          success: false, 
          error: 'Product with this SKU already exists' 
        });
      }
    }
    
    const result = await query(`
      INSERT INTO products (
        name, name_mm, description, price, cost, category_id, 
        sku, barcode, stock_quantity, image_url, base_uom_id
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
      RETURNING *
    `, [
      name.trim(),
      name_mm?.trim() || null,
      description || null,
      parseFloat(price),
      cost ? parseFloat(cost) : null,
      category_id || null,
      sku?.trim() || null,
      barcode?.trim() || null,
      stock_quantity || 0,
      image_url || null,
      base_uom_id || null
    ]);

    res.json({ success: true, data: result.rows[0] });
  } catch (error) {
    console.error('Error creating product:', error);
    res.status(500).json({ 
      success: false, 
      error: process.env.NODE_ENV === 'development' ? error.message : 'Failed to create product'
    });
  }
});

// Update product
router.put('/:id', productValidation.update, async (req, res) => {
  try {
    const updateData = { ...req.body };
    
    // Convert empty strings to null for UUID fields
    if (updateData.category_id === '') updateData.category_id = null;
    if (updateData.base_uom_id === '') updateData.base_uom_id = null;
    if (updateData.sku === '') updateData.sku = null;
    if (updateData.barcode === '') updateData.barcode = null;
    if (updateData.image_url === '') updateData.image_url = null;
    
    // Build dynamic update query
    const fields = Object.keys(updateData);
    const values = Object.values(updateData);
    const setClause = fields.map((field, index) => `${field} = $${index + 1}`).join(', ');
    
    const result = await query(`
      UPDATE products 
      SET ${setClause}, updated_at = NOW()
      WHERE id = $${fields.length + 1}
      RETURNING *
    `, [...values, req.params.id]);

    if (result.rows.length === 0) {
      return res.status(404).json({ success: false, error: 'Product not found' });
    }

    res.json({ success: true, data: result.rows[0] });
  } catch (error) {
    console.error('Error updating product:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// Delete product
router.delete('/:id', async (req, res) => {
  try {
    const result = await query('DELETE FROM products WHERE id = $1 RETURNING id', [req.params.id]);
    
    if (result.rows.length === 0) {
      return res.status(404).json({ success: false, error: 'Product not found' });
    }
    
    res.json({ success: true, message: 'Product deleted successfully' });
  } catch (error) {
    console.error('Error deleting product:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// Search products
router.get('/search/:query', async (req, res) => {
  try {
    const searchQuery = req.params.query;
    const result = await query(`
      SELECT 
        p.*,
        json_build_object('name', c.name, 'name_mm', c.name_mm) as categories
      FROM products p
      LEFT JOIN categories c ON p.category_id = c.id
      WHERE 
        p.name ILIKE $1 OR 
        p.name_mm ILIKE $1 OR 
        p.sku ILIKE $1 OR 
        p.barcode = $2
      ORDER BY p.created_at DESC
    `, [`%${searchQuery}%`, searchQuery]);

    res.json({ success: true, data: result.rows });
  } catch (error) {
    console.error('Error searching products:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

module.exports = router;
