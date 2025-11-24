const express = require('express');
const router = express.Router();
const { supabase } = require('../config/supabase');

// Get all stores
router.get('/', async (req, res) => {
  try {
    const { data, error } = await supabase
      .from('stores')
      .select(`
        *,
        users!stores_manager_id_fkey(id, full_name, email)
      `)
      .order('created_at', { ascending: false });

    if (error) throw error;
    res.json({ success: true, data });
  } catch (error) {
    console.error('Error fetching stores:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// Get store by ID
router.get('/:id', async (req, res) => {
  try {
    const { data, error } = await supabase
      .from('stores')
      .select(`
        *,
        users!stores_manager_id_fkey(id, full_name, email)
      `)
      .eq('id', req.params.id)
      .single();

    if (error) throw error;
    res.json({ success: true, data });
  } catch (error) {
    console.error('Error fetching store:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// Create store
router.post('/', async (req, res) => {
  try {
    const { name, name_mm, code, address, phone, email, manager_id, timezone, currency, tax_rate, settings } = req.body;
    
    if (!name || !code) {
      return res.status(400).json({ 
        success: false, 
        error: 'Store name and code are required' 
      });
    }

    // Check for duplicate code
    const { data: existing } = await supabase
      .from('stores')
      .select('id')
      .eq('code', code)
      .single();
    
    if (existing) {
      return res.status(409).json({ 
        success: false, 
        error: 'Store code already exists' 
      });
    }
    
    const { data, error } = await supabase
      .from('stores')
      .insert([{
        name: name.trim(),
        name_mm: name_mm?.trim(),
        code: code.trim().toUpperCase(),
        address,
        phone,
        email,
        manager_id,
        timezone: timezone || 'Asia/Yangon',
        currency: currency || 'MMK',
        tax_rate: tax_rate || 0,
        settings: settings || {},
        is_active: true
      }])
      .select()
      .single();

    if (error) throw error;
    res.json({ success: true, data });
  } catch (error) {
    console.error('Error creating store:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// Update store
router.put('/:id', async (req, res) => {
  try {
    const { data, error } = await supabase
      .from('stores')
      .update({ ...req.body, updated_at: new Date() })
      .eq('id', req.params.id)
      .select()
      .single();

    if (error) throw error;
    res.json({ success: true, data });
  } catch (error) {
    console.error('Error updating store:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// Delete store
router.delete('/:id', async (req, res) => {
  try {
    // Check if store has orders
    const { data: orders } = await supabase
      .from('orders')
      .select('id')
      .eq('store_id', req.params.id)
      .limit(1);
    
    if (orders && orders.length > 0) {
      return res.status(400).json({ 
        success: false, 
        error: 'Cannot delete store with existing orders. Deactivate instead.' 
      });
    }

    const { error } = await supabase
      .from('stores')
      .delete()
      .eq('id', req.params.id);

    if (error) throw error;
    res.json({ success: true, message: 'Store deleted successfully' });
  } catch (error) {
    console.error('Error deleting store:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// Get store inventory
router.get('/:id/inventory', async (req, res) => {
  try {
    const { data, error } = await supabase
      .rpc('get_store_inventory', { p_store_id: req.params.id });

    if (error) throw error;
    res.json({ success: true, data });
  } catch (error) {
    console.error('Error fetching store inventory:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// Update store inventory
router.post('/:id/inventory', async (req, res) => {
  try {
    const { product_id, quantity, min_quantity, max_quantity } = req.body;
    
    const { data, error } = await supabase
      .from('store_inventory')
      .upsert({
        store_id: req.params.id,
        product_id,
        quantity,
        min_quantity,
        max_quantity,
        updated_at: new Date()
      }, {
        onConflict: 'store_id,product_id'
      })
      .select()
      .single();

    if (error) throw error;
    res.json({ success: true, data });
  } catch (error) {
    console.error('Error updating store inventory:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// Get store performance
router.get('/:id/performance', async (req, res) => {
  try {
    const { data, error } = await supabase
      .from('v_store_performance')
      .select('*')
      .eq('store_id', req.params.id)
      .single();

    if (error) throw error;
    res.json({ success: true, data });
  } catch (error) {
    console.error('Error fetching store performance:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// Get all stores performance
router.get('/performance/all', async (req, res) => {
  try {
    const { data, error } = await supabase
      .from('v_store_performance')
      .select('*')
      .order('total_sales', { ascending: false });

    if (error) throw error;
    res.json({ success: true, data });
  } catch (error) {
    console.error('Error fetching stores performance:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

module.exports = router;
