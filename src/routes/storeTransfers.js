const express = require('express');
const router = express.Router();
const { supabase } = require('../config/supabase');

// Get all store transfers
router.get('/', async (req, res) => {
  try {
    const { status, store_id } = req.query;
    
    let query = supabase
      .from('store_transfers')
      .select(`
        *,
        from_store:stores!store_transfers_from_store_id_fkey(id, name, code),
        to_store:stores!store_transfers_to_store_id_fkey(id, name, code),
        requested_by_user:users!store_transfers_requested_by_fkey(id, full_name),
        approved_by_user:users!store_transfers_approved_by_fkey(id, full_name),
        store_transfer_items(
          *,
          products(id, name, name_mm, sku)
        )
      `)
      .order('created_at', { ascending: false });

    if (status) {
      query = query.eq('status', status);
    }

    if (store_id) {
      query = query.or(`from_store_id.eq.${store_id},to_store_id.eq.${store_id}`);
    }

    const { data, error } = await query;

    if (error) throw error;
    res.json({ success: true, data });
  } catch (error) {
    console.error('Error fetching store transfers:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// Get transfer by ID
router.get('/:id', async (req, res) => {
  try {
    const { data, error } = await supabase
      .from('store_transfers')
      .select(`
        *,
        from_store:stores!store_transfers_from_store_id_fkey(id, name, code),
        to_store:stores!store_transfers_to_store_id_fkey(id, name, code),
        requested_by_user:users!store_transfers_requested_by_fkey(id, full_name),
        approved_by_user:users!store_transfers_approved_by_fkey(id, full_name),
        store_transfer_items(
          *,
          products(id, name, name_mm, sku, image_url)
        )
      `)
      .eq('id', req.params.id)
      .single();

    if (error) throw error;
    res.json({ success: true, data });
  } catch (error) {
    console.error('Error fetching transfer:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// Create store transfer
router.post('/', async (req, res) => {
  try {
    const { from_store_id, to_store_id, items, notes, requested_by } = req.body;
    
    if (!from_store_id || !to_store_id || !items || items.length === 0) {
      return res.status(400).json({ 
        success: false, 
        error: 'From store, to store, and items are required' 
      });
    }

    if (from_store_id === to_store_id) {
      return res.status(400).json({ 
        success: false, 
        error: 'Cannot transfer to the same store' 
      });
    }

    // Check if stores exist
    const { data: stores } = await supabase
      .from('stores')
      .select('id')
      .in('id', [from_store_id, to_store_id]);
    
    if (!stores || stores.length !== 2) {
      return res.status(404).json({ 
        success: false, 
        error: 'One or both stores not found' 
      });
    }

    // Check stock availability
    for (const item of items) {
      const { data: inventory } = await supabase
        .from('store_inventory')
        .select('quantity')
        .eq('store_id', from_store_id)
        .eq('product_id', item.product_id)
        .single();
      
      if (!inventory || inventory.quantity < item.quantity) {
        const { data: product } = await supabase
          .from('products')
          .select('name')
          .eq('id', item.product_id)
          .single();
        
        return res.status(400).json({ 
          success: false, 
          error: `Insufficient stock for ${product?.name || 'product'}. Available: ${inventory?.quantity || 0}, Requested: ${item.quantity}` 
        });
      }
    }

    // Create transfer
    const { data: transfer, error: transferError } = await supabase
      .from('store_transfers')
      .insert([{
        from_store_id,
        to_store_id,
        requested_by,
        notes,
        status: 'pending'
      }])
      .select()
      .single();

    if (transferError) throw transferError;

    // Create transfer items
    const transferItems = items.map(item => ({
      transfer_id: transfer.id,
      product_id: item.product_id,
      quantity: item.quantity,
      notes: item.notes
    }));

    const { error: itemsError } = await supabase
      .from('store_transfer_items')
      .insert(transferItems);

    if (itemsError) {
      await supabase.from('store_transfers').delete().eq('id', transfer.id);
      throw itemsError;
    }

    // Fetch complete transfer
    const { data: completeTransfer } = await supabase
      .from('store_transfers')
      .select(`
        *,
        from_store:stores!store_transfers_from_store_id_fkey(id, name, code),
        to_store:stores!store_transfers_to_store_id_fkey(id, name, code),
        store_transfer_items(
          *,
          products(id, name, name_mm)
        )
      `)
      .eq('id', transfer.id)
      .single();

    res.json({ success: true, data: completeTransfer });
  } catch (error) {
    console.error('Error creating transfer:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// Approve and process transfer
router.post('/:id/approve', async (req, res) => {
  try {
    const { approved_by } = req.body;
    
    if (!approved_by) {
      return res.status(400).json({ 
        success: false, 
        error: 'Approver user ID is required' 
      });
    }

    const { error } = await supabase
      .rpc('process_store_transfer', {
        p_transfer_id: req.params.id,
        p_approved_by: approved_by
      });

    if (error) throw error;

    // Fetch updated transfer
    const { data } = await supabase
      .from('store_transfers')
      .select(`
        *,
        from_store:stores!store_transfers_from_store_id_fkey(id, name, code),
        to_store:stores!store_transfers_to_store_id_fkey(id, name, code)
      `)
      .eq('id', req.params.id)
      .single();

    res.json({ success: true, data });
  } catch (error) {
    console.error('Error approving transfer:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// Complete transfer (mark as received)
router.post('/:id/complete', async (req, res) => {
  try {
    const { received_items } = req.body;

    // Update received quantities if provided
    if (received_items && Array.isArray(received_items)) {
      for (const item of received_items) {
        await supabase
          .from('store_transfer_items')
          .update({ received_quantity: item.received_quantity })
          .eq('id', item.id);
      }
    }

    const { error } = await supabase
      .rpc('complete_store_transfer', {
        p_transfer_id: req.params.id
      });

    if (error) throw error;

    // Fetch updated transfer
    const { data } = await supabase
      .from('store_transfers')
      .select(`
        *,
        from_store:stores!store_transfers_from_store_id_fkey(id, name, code),
        to_store:stores!store_transfers_to_store_id_fkey(id, name, code)
      `)
      .eq('id', req.params.id)
      .single();

    res.json({ success: true, data });
  } catch (error) {
    console.error('Error completing transfer:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// Cancel transfer
router.post('/:id/cancel', async (req, res) => {
  try {
    const { data: transfer } = await supabase
      .from('store_transfers')
      .select('status')
      .eq('id', req.params.id)
      .single();

    if (!transfer) {
      return res.status(404).json({ 
        success: false, 
        error: 'Transfer not found' 
      });
    }

    if (transfer.status === 'completed') {
      return res.status(400).json({ 
        success: false, 
        error: 'Cannot cancel completed transfer' 
      });
    }

    const { data, error } = await supabase
      .from('store_transfers')
      .update({ status: 'cancelled', updated_at: new Date() })
      .eq('id', req.params.id)
      .select()
      .single();

    if (error) throw error;
    res.json({ success: true, data });
  } catch (error) {
    console.error('Error cancelling transfer:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// Delete transfer (only if pending or cancelled)
router.delete('/:id', async (req, res) => {
  try {
    const { data: transfer } = await supabase
      .from('store_transfers')
      .select('status')
      .eq('id', req.params.id)
      .single();

    if (!transfer) {
      return res.status(404).json({ 
        success: false, 
        error: 'Transfer not found' 
      });
    }

    if (!['pending', 'cancelled'].includes(transfer.status)) {
      return res.status(400).json({ 
        success: false, 
        error: 'Can only delete pending or cancelled transfers' 
      });
    }

    const { error } = await supabase
      .from('store_transfers')
      .delete()
      .eq('id', req.params.id);

    if (error) throw error;
    res.json({ success: true, message: 'Transfer deleted successfully' });
  } catch (error) {
    console.error('Error deleting transfer:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

module.exports = router;
