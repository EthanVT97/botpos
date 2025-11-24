const express = require('express');
const router = express.Router();
const { pool, query } = require('../config/database');
const { sellingPriceValidation } = require('../middleware/validator');
const multer = require('multer');
const XLSX = require('xlsx');

// Configure multer for file uploads
const upload = multer({ 
  storage: multer.memoryStorage(),
  limits: { fileSize: 5 * 1024 * 1024 } // 5MB limit
});

/**
 * Calculate new price based on formula
 */
function calculatePrice(product, formula, percentage, fixedAmount) {
  const basePrice = product.cost || product.price;
  let newPrice;

  switch (formula) {
    case 'plus':
      newPrice = basePrice * (1 + percentage / 100);
      break;
    case 'minus':
      newPrice = basePrice * (1 - percentage / 100);
      break;
    case 'fixed_add':
      newPrice = basePrice + fixedAmount;
      break;
    case 'fixed_subtract':
      newPrice = basePrice - fixedAmount;
      break;
    case 'margin':
      // Price = Cost / (1 - Margin%)
      // Example: Cost 1000, Margin 20% => Price = 1000 / 0.8 = 1250
      newPrice = basePrice / (1 - percentage / 100);
      break;
    default:
      newPrice = basePrice;
  }

  // Round to whole number (Myanmar Kyat doesn't use decimals)
  return Math.round(newPrice);
}

/**
 * Log price change to history
 */
async function logPriceChange(productId, oldPrice, newPrice, changeType, formula, percentage, changedBy = 'system') {
  try {
    await supabase.from('price_history').insert({
      product_id: productId,
      old_price: oldPrice,
      new_price: newPrice,
      change_type: changeType,
      formula: formula,
      percentage: percentage,
      changed_by: changedBy
    });
  } catch (error) {
    console.error('Error logging price change:', error);
  }
}

// Bulk update selling prices with formula
router.post('/bulk-update', sellingPriceValidation.bulkUpdate, async (req, res) => {
  try {
    const { formula, percentage, fixedAmount, productIds } = req.body;

    // Validate required parameters based on formula
    if (['plus', 'minus', 'margin'].includes(formula) && !percentage) {
      return res.status(400).json({ 
        success: false, 
        error: 'Percentage is required for this formula' 
      });
    }

    if (['fixed_add', 'fixed_subtract'].includes(formula) && !fixedAmount) {
      return res.status(400).json({ 
        success: false, 
        error: 'Fixed amount is required for this formula' 
      });
    }

    const percentageValue = percentage ? parseFloat(percentage) : 0;
    const fixedAmountValue = fixedAmount ? parseFloat(fixedAmount) : 0;

    // Get products to update
    let query = supabase.from('products').select('id, name, price, cost');
    
    if (productIds && productIds.length > 0) {
      query = query.in('id', productIds);
    }

    const { data: products, error: fetchError } = await query;
    if (fetchError) throw fetchError;

    if (!products || products.length === 0) {
      return res.status(404).json({ 
        success: false, 
        error: 'No products found' 
      });
    }

    // Calculate new prices
    const updates = products.map(product => {
      const newPrice = calculatePrice(product, formula, percentageValue, fixedAmountValue);
      
      return {
        id: product.id,
        name: product.name,
        oldPrice: product.price,
        newPrice: newPrice
      };
    });

    // Update prices in database and log changes
    const updatePromises = updates.map(async (update) => {
      // Update product price
      await supabase
        .from('products')
        .update({ price: update.newPrice, updated_at: new Date() })
        .eq('id', update.id);
      
      // Log price change
      await logPriceChange(
        update.id, 
        update.oldPrice, 
        update.newPrice, 
        'bulk_update', 
        formula, 
        percentageValue
      );
    });

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
router.put('/update/:id', sellingPriceValidation.update, async (req, res) => {
  try {
    const { price } = req.body;
    const { id } = req.params;

    // Round to whole number (Myanmar Kyat)
    const newPrice = Math.round(parseFloat(price));

    // Get old price first
    const { data: oldProduct, error: fetchError } = await supabase
      .from('products')
      .select('price')
      .eq('id', id)
      .single();

    if (fetchError) throw fetchError;

    // Update price
    const { data, error } = await supabase
      .from('products')
      .update({ 
        price: newPrice,
        updated_at: new Date() 
      })
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;

    // Log price change
    await logPriceChange(id, oldProduct.price, newPrice, 'manual_edit', null, null);

    res.json({ success: true, data });
  } catch (error) {
    console.error('Update price error:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// Get price history for a product
router.get('/history/:productId', async (req, res) => {
  try {
    const { productId } = req.params;

    // Get product info
    const { data: product, error: productError } = await supabase
      .from('products')
      .select('id, name, name_mm, price, cost')
      .eq('id', productId)
      .single();

    if (productError) throw productError;

    // Get price history
    const { data: history, error: historyError } = await supabase
      .from('price_history')
      .select('*')
      .eq('product_id', productId)
      .order('created_at', { ascending: false })
      .limit(50);

    if (historyError) throw historyError;

    res.json({ 
      success: true, 
      data: {
        product,
        history: history || []
      }
    });
  } catch (error) {
    console.error('Get history error:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// Export prices to Excel format
router.get('/export', async (req, res) => {
  try {
    const { format = 'excel' } = req.query;

    const { data: products, error } = await supabase
      .from('products')
      .select('id, name, name_mm, price, cost, stock_quantity, categories(name)')
      .order('name', { ascending: true });

    if (error) throw error;

    // Prepare data for export
    const exportData = products.map(p => ({
      'Product ID': p.id,
      'Product Name': p.name,
      'Myanmar Name': p.name_mm || '',
      'Category': p.categories?.name || '',
      'Cost (Ks)': p.cost || 0,
      'Selling Price (Ks)': p.price,
      'Margin %': p.cost ? (((p.price - p.cost) / p.cost) * 100).toFixed(2) : 0,
      'Stock': p.stock_quantity || 0
    }));

    if (format === 'csv') {
      // CSV Export
      const csvHeader = Object.keys(exportData[0]).join(',') + '\n';
      const csvRows = exportData.map(row => 
        Object.values(row).map(val => `"${val}"`).join(',')
      ).join('\n');
      const csv = csvHeader + csvRows;

      res.setHeader('Content-Type', 'text/csv');
      res.setHeader('Content-Disposition', 'attachment; filename=selling-prices.csv');
      res.send(csv);
    } else {
      // Excel Export
      const worksheet = XLSX.utils.json_to_sheet(exportData);
      const workbook = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(workbook, worksheet, 'Selling Prices');

      // Set column widths
      worksheet['!cols'] = [
        { wch: 36 }, // Product ID
        { wch: 30 }, // Product Name
        { wch: 30 }, // Myanmar Name
        { wch: 20 }, // Category
        { wch: 12 }, // Cost
        { wch: 15 }, // Selling Price
        { wch: 10 }, // Margin
        { wch: 10 }  // Stock
      ];

      const buffer = XLSX.write(workbook, { type: 'buffer', bookType: 'xlsx' });

      res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
      res.setHeader('Content-Disposition', 'attachment; filename=selling-prices.xlsx');
      res.send(buffer);
    }
  } catch (error) {
    console.error('Export error:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// Import prices from Excel/CSV
router.post('/import', upload.single('file'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ 
        success: false, 
        error: 'No file uploaded' 
      });
    }

    // Parse Excel/CSV file
    const workbook = XLSX.read(req.file.buffer, { type: 'buffer' });
    const sheetName = workbook.SheetNames[0];
    const worksheet = workbook.Sheets[sheetName];
    const data = XLSX.utils.sheet_to_json(worksheet);

    if (!data || data.length === 0) {
      return res.status(400).json({ 
        success: false, 
        error: 'No data found in file' 
      });
    }

    // Validate and prepare updates
    const updates = [];
    const errors = [];

    for (let i = 0; i < data.length; i++) {
      const row = data[i];
      const rowNum = i + 2; // Excel row number (1-indexed + header)

      // Check required fields
      const productId = row['Product ID'];
      const newPrice = row['Selling Price (Ks)'];

      if (!productId) {
        errors.push(`Row ${rowNum}: Missing Product ID`);
        continue;
      }

      if (!newPrice || isNaN(parseFloat(newPrice))) {
        errors.push(`Row ${rowNum}: Invalid price value`);
        continue;
      }

      const price = Math.round(parseFloat(newPrice));

      if (price < 0) {
        errors.push(`Row ${rowNum}: Price cannot be negative`);
        continue;
      }

      updates.push({ id: productId, price });
    }

    if (errors.length > 0 && updates.length === 0) {
      return res.status(400).json({ 
        success: false, 
        error: 'No valid data to import',
        errors 
      });
    }

    // Get current prices for logging
    const productIds = updates.map(u => u.id);
    const { data: currentProducts, error: fetchError } = await supabase
      .from('products')
      .select('id, price')
      .in('id', productIds);

    if (fetchError) throw fetchError;

    const priceMap = {};
    currentProducts.forEach(p => {
      priceMap[p.id] = p.price;
    });

    // Update prices
    const updatePromises = updates.map(async (update) => {
      const oldPrice = priceMap[update.id];
      
      // Update product
      await supabase
        .from('products')
        .update({ price: update.price, updated_at: new Date() })
        .eq('id', update.id);
      
      // Log change
      await logPriceChange(update.id, oldPrice, update.price, 'import', null, null);
    });

    await Promise.all(updatePromises);

    res.json({ 
      success: true, 
      message: `Successfully imported ${updates.length} prices`,
      updated: updates.length,
      errors: errors.length > 0 ? errors : undefined
    });
  } catch (error) {
    console.error('Import error:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// Get import template
router.get('/import-template', async (req, res) => {
  try {
    const { data: products, error } = await supabase
      .from('products')
      .select('id, name, name_mm, price, cost, categories(name)')
      .order('name', { ascending: true })
      .limit(100);

    if (error) throw error;

    const templateData = products.map(p => ({
      'Product ID': p.id,
      'Product Name': p.name,
      'Myanmar Name': p.name_mm || '',
      'Category': p.categories?.name || '',
      'Current Cost (Ks)': p.cost || 0,
      'Selling Price (Ks)': p.price,
      'Instructions': 'Edit Selling Price column only'
    }));

    const worksheet = XLSX.utils.json_to_sheet(templateData);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Price Import Template');

    // Set column widths
    worksheet['!cols'] = [
      { wch: 36 }, // Product ID
      { wch: 30 }, // Product Name
      { wch: 30 }, // Myanmar Name
      { wch: 20 }, // Category
      { wch: 15 }, // Cost
      { wch: 18 }, // Selling Price
      { wch: 30 }  // Instructions
    ];

    const buffer = XLSX.write(workbook, { type: 'buffer', bookType: 'xlsx' });

    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.setHeader('Content-Disposition', 'attachment; filename=price-import-template.xlsx');
    res.send(buffer);
  } catch (error) {
    console.error('Template error:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

module.exports = router;
