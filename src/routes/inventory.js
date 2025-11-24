const express = require('express');
const router = express.Router();
const { pool, query, supabase } = require('../config/database');

// Get all inventory movements
router.get('/movements', async (req, res) => {
  try {
    const result = await query(`
      SELECT 
        im.*,
        json_build_object(
          'name', p.name,
          'name_mm', p.name_mm
        ) as products
      FROM inventory_movements im
      LEFT JOIN products p ON im.product_id = p.id
      ORDER BY im.created_at DESC
    `);

    res.json({ success: true, data: result.rows });
  } catch (error) {
    console.error('Error fetching inventory movements:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// Add inventory movement
router.post('/movements', async (req, res) => {
  try {
    const { product_id, quantity, type, notes } = req.body;
    
    // Create movement record
    const movementResult = await query(`
      INSERT INTO inventory_movements (product_id, quantity, type, notes)
      VALUES ($1, $2, $3, $4)
      RETURNING *
    `, [product_id, quantity, type, notes]);

    const movement = movementResult.rows[0];

    // Update product stock
    let quantityChange = 0;
    if (type === 'in') {
      quantityChange = quantity;
    } else if (type === 'out') {
      quantityChange = -quantity;
    } else if (type === 'adjustment') {
      quantityChange = quantity;
    }

    await query(`
      UPDATE products
      SET stock_quantity = stock_quantity + $1,
          updated_at = NOW()
      WHERE id = $2
    `, [quantityChange, product_id]);

    res.json({ success: true, data: movement });
  } catch (error) {
    console.error('Error adding inventory movement:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// Get low stock products
router.get('/low-stock', async (req, res) => {
  try {
    const threshold = req.query.threshold || 10;
    
    const result = await query(`
      SELECT *
      FROM products
      WHERE stock_quantity <= $1
      ORDER BY stock_quantity ASC
    `, [parseInt(threshold)]);

    res.json({ success: true, data: result.rows });
  } catch (error) {
    console.error('Error fetching low stock products:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

module.exports = router;
