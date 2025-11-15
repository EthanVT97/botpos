const express = require('express');
const router = express.Router();
const { supabase } = require('../config/supabase');

// Bulk update selling prices with formula
router.post('/bulk-update', async (req, res) => {
  try {
    const { formula, percentage, productIds } = req.body;

    if (!formula || !percentage) {
      return res.status(400).json({ 
        success: false, 
        error: 'Formula and percentage are required' 
      });
    }

    const percentageValue = parseFloat(percentage);
    if (isNaN(percentageValue)) {
      return res.status(400).json({ 
        success: false, 
        error: 'Invalid percentage value' 
      });
    }

    // Get products to update
    let query = supabase.from('products').select('id, price, cost');
    
    if (productIds && productIds.length > 0) {
      query = query.in('id', productIds);
    }

    const { data: products, error: fetchError } = await query;
    if (fetchError) throw fetchError;

    // Calculate new prices
    const updates = products.map(product => {
      const basePrice = product.cost || product.price;
      let newPrice;

      if (formula === 'plus') {
        newPrice = basePrice * (1 + percentageValue / 100);
      } else if (formula === 'minus') {
        newPrice = basePrice * (1 - percentageValue / 100);
      } else {
        newPrice = basePrice;
      }

      return {
        id: product.id,
        price: Math.round(newPrice * 100) / 100 // Round to 2 decimals
      };
    });

    // Update prices in database
    const updatePromises = updates.map(update =>
      supabase
        .from('products')
        .update({ price: update.price, updated_at: new Date() })
        .eq('id', update.id)
    );

    await Promise.all(updatePromises);

    res.json({ 
      success: true, 
      message: `Updated ${updates.length} products`,
      data: updates 
    });
  } catch (error) {
    console.error('Bulk update error:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// Update single product price
router.put('/update/:id', async (req, res) => {
  try {
    const { price } = req.body;
    const { id } = req.params;

    if (!price || isNaN(parseFloat(price))) {
      return res.status(400).json({ 
        success: false, 
        error: 'Valid price is required' 
      });
    }

    const { data, error } = await supabase
      .from('products')
      .update({ 
        price: parseFloat(price),
        updated_at: new Date() 
      })
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;

    res.json({ success: true, data });
  } catch (error) {
    console.error('Update price error:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// Get price history (if you want to track changes)
router.get('/history/:productId', async (req, res) => {
  try {
    const { productId } = req.params;

    // This would require a price_history table
    // For now, just return current product info
    const { data, error } = await supabase
      .from('products')
      .select('id, name, price, cost, updated_at')
      .eq('id', productId)
      .single();

    if (error) throw error;

    res.json({ success: true, data });
  } catch (error) {
    console.error('Get history error:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// Export prices to CSV format
router.get('/export', async (req, res) => {
  try {
    const { data: products, error } = await supabase
      .from('products')
      .select('id, name, name_mm, price, cost, categories(name)')
      .order('name', { ascending: true });

    if (error) throw error;

    // Convert to CSV format
    const csvHeader = 'ID,Name,Myanmar Name,Category,Cost,Price\n';
    const csvRows = products.map(p => 
      `${p.id},"${p.name}","${p.name_mm || ''}","${p.categories?.name || ''}",${p.cost || 0},${p.price}`
    ).join('\n');

    const csv = csvHeader + csvRows;

    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', 'attachment; filename=selling-prices.csv');
    res.send(csv);
  } catch (error) {
    console.error('Export error:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

module.exports = router;
