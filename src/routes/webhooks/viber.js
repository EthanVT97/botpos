const express = require('express');
const router = express.Router();
const { viberBot, ViberMessage, isViberAvailable } = require('../../config/bots');
const { pool, query, supabase } = require('../../config/database');
const { emitNewMessage, emitSessionUpdate, emitUnreadCountUpdate } = require('../../config/socket');
const flowExecutor = require('../../utils/flowExecutor');
const { verifyViberWebhook } = require('../../middleware/webhookVerification');

// Viber webhook with verification
router.post('/', verifyViberWebhook, (req, res) => {
  // Check if Viber bot is configured
  if (!isViberAvailable()) {
    console.warn('⚠️  Viber webhook received but bot not configured');
    return res.status(503).json({ error: 'Viber bot not configured' });
  }

  try {
    viberBot.middleware()(req, res, () => {
      res.status(200).send();
    });
  } catch (error) {
    console.error('Viber webhook error:', error);
    res.status(200).send(); // Return 200 to avoid retries
  }
});

// Handle Viber messages (only if bot is configured)
if (isViberAvailable()) {
  viberBot.on('message', async (message) => {
  try {
    // Validate message structure
    if (!message || !message.userProfile || !message.text) {
      console.warn('⚠️  Invalid Viber message structure');
      return;
    }

    const userId = message.userProfile.id;
    const userName = message.userProfile.name;
    const text = message.text;

    // Get or create customer
    const { getOrCreateCustomer, saveIncomingMessage, saveOutgoingMessage } = require('../../utils/chatHelpers');
    const customer = await getOrCreateCustomer(userId, userName, 'viber');

    // Save incoming message (this also updates session and unread count)
    await saveIncomingMessage(customer.id, text, 'viber');

    // Try to process with flow executor first
    const flowResponse = await flowExecutor.processMessage(customer.id, text, 'viber');
    
    if (flowResponse && flowResponse.message) {
      // Send flow response
      await viberBot.sendMessage(message.userProfile, [
        new ViberMessage.Text(flowResponse.message)
      ]);
      
      // Save bot response
      await saveOutgoingMessage(customer.id, flowResponse.message, 'viber');
    } else {
      // Fallback to default handling
      if (text.startsWith('/')) {
        await handleViberCommand(message, customer);
      } else {
        const response = 'မင်္ဂလာပါ! ကျွန်ုပ်တို့၏ POS စနစ်မှ ကြိုဆိုပါတယ်။\n\n' +
          'Commands:\n' +
          '/products - ကုန်ပစ္စည်းများကြည့်ရန်\n' +
          '/orders - မှာယူမှုများကြည့်ရန်\n' +
          '/help - အကူအညီ';
        
        await viberBot.sendMessage(message.userProfile, [
          new ViberMessage.Text(response)
        ]);
        
        // Save bot response
        await saveOutgoingMessage(customer.id, response, 'viber');
      }
    }
  } catch (error) {
    console.error('Viber error:', error);
  }
  });
}

async function handleViberCommand(message, customer) {
  const command = message.text.split(' ')[0];

  switch (command) {
    case '/products':
      const { data: products } = await supabase
        .from('products')
        .select('*')
        .limit(10);
      
      let productList = 'ကုန်ပစ္စည်းများ:\n\n';
      products.forEach(p => {
        productList += `${p.name_mm || p.name} - ${p.price} ကျပ်\n`;
      });
      
      await viberBot.sendMessage(message.userProfile, [
        new ViberMessage.Text(productList)
      ]);
      break;

    case '/orders':
      const { data: orders } = await supabase
        .from('orders')
        .select('*')
        .eq('customer_id', customer.id)
        .order('created_at', { ascending: false })
        .limit(5);
      
      let orderList = 'သင့်မှာယူမှုများ:\n\n';
      orders.forEach(o => {
        orderList += `Order #${o.id} - ${o.total_amount} ကျပ် - ${o.status}\n`;
      });
      
      await viberBot.sendMessage(message.userProfile, [
        new ViberMessage.Text(orderList)
      ]);
      break;

    default:
      await viberBot.sendMessage(message.userProfile, [
        new ViberMessage.Text('ကျေးဇူးပြု၍ မှန်ကန်သော command ကို ရိုက်ထည့်ပါ။')
      ]);
  }
}

module.exports = router;
