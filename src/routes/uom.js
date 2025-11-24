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

// Get UOM by ID
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
      await supabase
        .from('product_uom')
        .update({ is_base_uom: false })
        .eq('product_id', product_id);
      
      // Update product's base_uom_id
      await supabase
        .from('products')
        .update({ base_uom_id: uom_id })
        .eq('id', product_id);
    }

    const { data, error } = await supabase
      .from('product_uom')
      .insert([{
        product_id,
        uom_id,
        is_base_uom,
        conversion_factor,
        price,
        cost,
        barcode
      }])
      .select()
      .single();

    if (error) throw error;
    res.json({ success: true, data });
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
      await supabase
        .from('product_uom')
        .update({ is_base_uom: false })
        .eq('product_id', product_id)
        .neq('id', req.params.id);
      
      // Update product's base_uom_id
      if (uom_id) {
        await supabase
          .from('products')
          .update({ base_uom_id: uom_id })
          .eq('id', product_id);
      }
    }

    const { data, error } = await supabase
      .from('product_uom')
      .update({ is_base_uom, conversion_factor, price, cost, barcode })
      .eq('id', req.params.id)
      .select()
      .single();

    if (error) throw error;
    res.json({ success: true, data });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// Delete product UOM
router.delete('/product/:id', async (req, res) => {
  try {
    const { error } = await supabase
      .from('product_uom')
      .update({ is_active: false })
      .eq('id', req.params.id);

    if (error) throw error;
    res.json({ success: true, message: 'Product UOM deleted successfully' });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// Get UOM conversions
router.get('/conversions', async (req, res) => {
  try {
    const { data, error } = await supabase
      .from('uom_conversion')
      .select(`
        *,
        from_uom:from_uom_id(code, name, name_mm),
        to_uom:to_uom_id(code, name, name_mm)
      `);

    if (error) throw error;
    res.json({ success: true, data });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// Add UOM conversion
router.post('/conversions', async (req, res) => {
  try {
    const { from_uom_id, to_uom_id, conversion_factor } = req.body;
    
    const { data, error } = await supabase
      .from('uom_conversion')
      .insert([{ from_uom_id, to_uom_id, conversion_factor }])
      .select()
      .single();

    if (error) throw error;
    res.json({ success: true, data });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// Convert quantity between UOMs
router.post('/convert', async (req, res) => {
  try {
    const { product_id, from_uom_id, to_uom_id, quantity } = req.body;
    
    const { data, error } = await supabase.rpc('convert_uom_quantity', {
      p_product_id: product_id,
      p_from_uom_id: from_uom_id,
      p_to_uom_id: to_uom_id,
      p_quantity: quantity
    });

    if (error) throw error;
    res.json({ success: true, data: { converted_quantity: data } });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

module.exports = router;
