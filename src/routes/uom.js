const express = require('express');
const router = express.Router();
const { pool, query, supabase } = require('../config/database');

// Get all UOMs
router.get('/', async (req, res) => {
  try {
    const result = await query(`
      SELECT * FROM uom
      WHERE is_active = true
      ORDER BY name ASC
    `);

    res.json({ success: true, data: result.rows });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// Get UOM conversions (must be before /:id route)
router.get('/conversions', async (req, res) => {
  try {
    const result = await query(`
      SELECT 
        uc.*,
        json_build_object('code', fu.code, 'name', fu.name, 'name_mm', fu.name_mm) as from_uom,
        json_build_object('code', tu.code, 'name', tu.name, 'name_mm', tu.name_mm) as to_uom
      FROM uom_conversion uc
      LEFT JOIN uom fu ON uc.from_uom_id = fu.id
      LEFT JOIN uom tu ON uc.to_uom_id = tu.id
    `);

    res.json({ success: true, data: result.rows });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// Get UOM by ID (must be after specific routes like /conversions)
router.get('/:id', async (req, res) => {
  try {
    const result = await query('SELECT * FROM uom WHERE id = $1', [req.params.id]);
    const data = result.rows[0] || null;

    res.json({ success: true, data });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// Create UOM
router.post('/', async (req, res) => {
  try {
    const { code, name, name_mm, description } = req.body;
    
    const result = await query(`
      INSERT INTO uom (code, name, name_mm, description)
      VALUES ($1, $2, $3, $4)
      RETURNING *
    `, [code, name, name_mm, description]);

    res.json({ success: true, data: result.rows[0] });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// Update UOM
router.put('/:id', async (req, res) => {
  try {
    const { code, name, name_mm, description } = req.body;
    const result = await query(`
      UPDATE uom
      SET code = COALESCE($1, code),
          name = COALESCE($2, name),
          name_mm = COALESCE($3, name_mm),
          description = COALESCE($4, description),
          updated_at = NOW()
      WHERE id = $5
      RETURNING *
    `, [code, name, name_mm, description, req.params.id]);

    res.json({ success: true, data: result.rows[0] });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// Delete UOM (soft delete)
router.delete('/:id', async (req, res) => {
  try {
    await query('UPDATE uom SET is_active = false WHERE id = $1', [req.params.id]);
    res.json({ success: true, message: 'UOM deleted successfully' });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// Get product UOMs
router.get('/product/:productId', async (req, res) => {
  try {
    const result = await query(`
      SELECT * FROM v_product_uom_details
      WHERE product_id = $1
    `, [req.params.productId]);

    res.json({ success: true, data: result.rows });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// Add UOM to product
router.post('/product', async (req, res) => {
  try {
    const { product_id, uom_id, is_base_uom, conversion_factor, price, cost, barcode } = req.body;
    
    // If this is set as base UOM, unset other base UOMs for this product
    if (is_base_uom) {
      await query(`
        UPDATE product_uom
        SET is_base_uom = false
        WHERE product_id = $1
      `, [product_id]);
      
      // Update product's base_uom_id
      await query(`
        UPDATE products
        SET base_uom_id = $1
        WHERE id = $2
      `, [uom_id, product_id]);
    }

    const result = await query(`
      INSERT INTO product_uom (product_id, uom_id, is_base_uom, conversion_factor, price, cost, barcode)
      VALUES ($1, $2, $3, $4, $5, $6, $7)
      RETURNING *
    `, [product_id, uom_id, is_base_uom, conversion_factor, price, cost, barcode]);

    res.json({ success: true, data: result.rows[0] });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// Update product UOM
router.put('/product/:id', async (req, res) => {
  try {
    const { is_base_uom, conversion_factor, price, cost, barcode, product_id, uom_id } = req.body;
    
    // If this is set as base UOM, unset other base UOMs for this product
    if (is_base_uom && product_id) {
      await query(`
        UPDATE product_uom
        SET is_base_uom = false
        WHERE product_id = $1 AND id != $2
      `, [product_id, req.params.id]);
      
      // Update product's base_uom_id
      if (uom_id) {
        await query(`
          UPDATE products
          SET base_uom_id = $1
          WHERE id = $2
        `, [uom_id, product_id]);
      }
    }

    const result = await query(`
      UPDATE product_uom
      SET is_base_uom = COALESCE($1, is_base_uom),
          conversion_factor = COALESCE($2, conversion_factor),
          price = COALESCE($3, price),
          cost = COALESCE($4, cost),
          barcode = COALESCE($5, barcode),
          updated_at = NOW()
      WHERE id = $6
      RETURNING *
    `, [is_base_uom, conversion_factor, price, cost, barcode, req.params.id]);

    res.json({ success: true, data: result.rows[0] });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// Delete product UOM
router.delete('/product/:id', async (req, res) => {
  try {
    await query(`
      UPDATE product_uom
      SET is_active = false
      WHERE id = $1
    `, [req.params.id]);

    res.json({ success: true, message: 'Product UOM deleted successfully' });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// Add UOM conversion
router.post('/conversions', async (req, res) => {
  try {
    const { from_uom_id, to_uom_id, conversion_factor } = req.body;
    
    const result = await query(`
      INSERT INTO uom_conversion (from_uom_id, to_uom_id, conversion_factor)
      VALUES ($1, $2, $3)
      RETURNING *
    `, [from_uom_id, to_uom_id, conversion_factor]);

    res.json({ success: true, data: result.rows[0] });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// Convert quantity between UOMs
router.post('/convert', async (req, res) => {
  try {
    const { product_id, from_uom_id, to_uom_id, quantity } = req.body;
    
    const result = await query(`
      SELECT convert_uom_quantity($1, $2, $3, $4) as converted_quantity
    `, [product_id, from_uom_id, to_uom_id, quantity]);

    res.json({ success: true, data: { converted_quantity: result.rows[0].converted_quantity } });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

module.exports = router;
