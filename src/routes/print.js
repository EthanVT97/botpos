const express = require('express');
const router = express.Router();
const PDFDocument = require('pdfkit');
const { pool, query } = require('../config/database');
const { authenticate } = require('../middleware/auth');

// All print routes require authentication
router.use(authenticate);

/**
 * @route   GET /api/print/receipt/:orderId
 * @desc    Generate PDF receipt for an order
 * @access  Private
 */
router.get('/receipt/:orderId', async (req, res) => {
  try {
    const { orderId } = req.params;

    // Get order with items and customer
    const { data: order, error } = await supabase
      .from('orders')
      .select(`
        *,
        customers (name, phone, email, address),
        order_items (*, products (name, name_mm, sku))
      `)
      .eq('id', orderId)
      .single();

    if (error || !order) {
      return res.status(404).json({
        success: false,
        error: 'Order not found'
      });
    }

    // Get store settings
    const { data: settings } = await supabase
      .from('settings')
      .select('*');

    const settingsMap = {};
    settings?.forEach(s => {
      settingsMap[s.key] = s.value;
    });

    // Create PDF
    const doc = new PDFDocument({ size: 'A4', margin: 50 });

    // Set response headers
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename=receipt-${orderId}.pdf`);

    // Pipe PDF to response
    doc.pipe(res);

    // Header
    doc.fontSize(20).text('Myanmar POS System', { align: 'center' });
    doc.fontSize(16).text('ရောင်းချမှုဘောင်ချာ', { align: 'center' });
    doc.moveDown();

    // Store info
    if (settingsMap.store_name) {
      doc.fontSize(12).text(settingsMap.store_name, { align: 'center' });
    }
    if (settingsMap.store_address) {
      doc.fontSize(10).text(settingsMap.store_address, { align: 'center' });
    }
    if (settingsMap.store_phone) {
      doc.fontSize(10).text(`Phone: ${settingsMap.store_phone}`, { align: 'center' });
    }
    doc.moveDown();

    // Divider
    doc.moveTo(50, doc.y).lineTo(550, doc.y).stroke();
    doc.moveDown();

    // Order info
    doc.fontSize(10);
    doc.text(`Receipt No: ${order.id.substring(0, 8).toUpperCase()}`, 50, doc.y);
    doc.text(`Date: ${new Date(order.created_at).toLocaleString()}`, 350, doc.y - 12);
    doc.moveDown();

    // Customer info
    if (order.customers) {
      doc.text(`Customer: ${order.customers.name}`);
      if (order.customers.phone) {
        doc.text(`Phone: ${order.customers.phone}`);
      }
    }
    doc.moveDown();

    // Divider
    doc.moveTo(50, doc.y).lineTo(550, doc.y).stroke();
    doc.moveDown();

    // Table header
    const tableTop = doc.y;
    doc.fontSize(10).font('Helvetica-Bold');
    doc.text('Item', 50, tableTop);
    doc.text('Qty', 300, tableTop);
    doc.text('Price', 370, tableTop);
    doc.text('Amount', 470, tableTop, { width: 80, align: 'right' });

    doc.moveDown();
    doc.moveTo(50, doc.y).lineTo(550, doc.y).stroke();
    doc.moveDown();

    // Items
    doc.font('Helvetica');
    let yPosition = doc.y;

    order.order_items.forEach((item, index) => {
      const itemName = item.products.name_mm || item.products.name;
      
      doc.text(itemName, 50, yPosition, { width: 240 });
      doc.text(item.quantity.toString(), 300, yPosition);
      doc.text(item.price.toLocaleString(), 370, yPosition);
      doc.text(item.subtotal.toLocaleString(), 470, yPosition, { width: 80, align: 'right' });
      
      yPosition += 20;
      
      // Add new page if needed
      if (yPosition > 700) {
        doc.addPage();
        yPosition = 50;
      }
    });

    doc.moveDown();
    doc.moveTo(50, doc.y).lineTo(550, doc.y).stroke();
    doc.moveDown();

    // Totals
    const totalsX = 370;
    doc.font('Helvetica');
    
    doc.text('Subtotal:', totalsX, doc.y);
    doc.text(`${order.total_amount.toLocaleString()} Ks`, 470, doc.y, { width: 80, align: 'right' });
    doc.moveDown(0.5);

    if (order.discount > 0) {
      doc.text('Discount:', totalsX, doc.y);
      doc.text(`-${order.discount.toLocaleString()} Ks`, 470, doc.y, { width: 80, align: 'right' });
      doc.moveDown(0.5);
    }

    if (order.tax > 0) {
      doc.text('Tax:', totalsX, doc.y);
      doc.text(`${order.tax.toLocaleString()} Ks`, 470, doc.y, { width: 80, align: 'right' });
      doc.moveDown(0.5);
    }

    doc.font('Helvetica-Bold').fontSize(12);
    doc.text('Total:', totalsX, doc.y);
    doc.text(`${order.total_amount.toLocaleString()} Ks`, 470, doc.y, { width: 80, align: 'right' });
    doc.moveDown();

    // Payment method
    doc.font('Helvetica').fontSize(10);
    doc.text(`Payment Method: ${order.payment_method?.toUpperCase() || 'CASH'}`, 50, doc.y);
    doc.moveDown();

    // Footer
    doc.moveDown(2);
    doc.fontSize(10).text('Thank you for your business!', { align: 'center' });
    doc.text('ဝယ်ယူအားပေးမှုအတွက် ကျေးဇူးတင်ပါသည်။', { align: 'center' });
    doc.moveDown();
    doc.fontSize(8).text(`Printed: ${new Date().toLocaleString()}`, { align: 'center' });

    // Finalize PDF
    doc.end();

  } catch (error) {
    console.error('Print receipt error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to generate receipt'
    });
  }
});

/**
 * @route   GET /api/print/thermal/:orderId
 * @desc    Generate thermal printer format (ESC/POS)
 * @access  Private
 */
router.get('/thermal/:orderId', async (req, res) => {
  try {
    const { orderId } = req.params;

    // Get order with items
    const { data: order, error } = await supabase
      .from('orders')
      .select(`
        *,
        customers (name, phone),
        order_items (*, products (name, name_mm))
      `)
      .eq('id', orderId)
      .single();

    if (error || !order) {
      return res.status(404).json({
        success: false,
        error: 'Order not found'
      });
    }

    // Generate thermal receipt text
    let receipt = '';
    
    // Header
    receipt += '================================\n';
    receipt += '      Myanmar POS System\n';
    receipt += '      ရောင်းချမှုဘောင်ချာ\n';
    receipt += '================================\n\n';
    
    // Order info
    receipt += `Receipt: ${order.id.substring(0, 8).toUpperCase()}\n`;
    receipt += `Date: ${new Date(order.created_at).toLocaleString()}\n`;
    
    if (order.customers) {
      receipt += `Customer: ${order.customers.name}\n`;
    }
    
    receipt += '--------------------------------\n\n';
    
    // Items
    order.order_items.forEach(item => {
      const name = item.products.name_mm || item.products.name;
      receipt += `${name}\n`;
      receipt += `  ${item.quantity} x ${item.price} = ${item.subtotal} Ks\n`;
    });
    
    receipt += '\n--------------------------------\n';
    
    // Totals
    receipt += `Subtotal:        ${order.total_amount} Ks\n`;
    if (order.discount > 0) {
      receipt += `Discount:       -${order.discount} Ks\n`;
    }
    if (order.tax > 0) {
      receipt += `Tax:             ${order.tax} Ks\n`;
    }
    receipt += `TOTAL:           ${order.total_amount} Ks\n`;
    receipt += `Payment: ${order.payment_method?.toUpperCase()}\n`;
    
    receipt += '================================\n';
    receipt += '   Thank you! ကျေးဇူးတင်ပါသည်\n';
    receipt += '================================\n\n\n';

    res.setHeader('Content-Type', 'text/plain');
    res.send(receipt);

  } catch (error) {
    console.error('Thermal print error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to generate thermal receipt'
    });
  }
});

/**
 * @route   POST /api/print/settings
 * @desc    Update print settings
 * @access  Private
 */
router.post('/settings', async (req, res) => {
  try {
    const { store_name, store_address, store_phone, store_email, tax_rate } = req.body;

    const settings = [
      { key: 'store_name', value: store_name },
      { key: 'store_address', value: store_address },
      { key: 'store_phone', value: store_phone },
      { key: 'store_email', value: store_email },
      { key: 'tax_rate', value: tax_rate }
    ];

    for (const setting of settings) {
      if (setting.value !== undefined) {
        await supabase
          .from('settings')
          .upsert({
            key: setting.key,
            value: setting.value
          }, {
            onConflict: 'key'
          });
      }
    }

    res.json({
      success: true,
      message: 'Print settings updated'
    });

  } catch (error) {
    console.error('Update print settings error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to update settings'
    });
  }
});

module.exports = router;
