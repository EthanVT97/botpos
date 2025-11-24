const express = require('express');
const router = express.Router();
const { telegramBot, isTelegramAvailable } = require('../../config/bots');
const { pool, query, supabase } = require('../../config/database');
const { emitNewMessage, emitSessionUpdate, emitUnreadCountUpdate } = require('../../config/socket');
const flowExecutor = require('../../utils/flowExecutor');
const { verifyTelegramWebhook } = require('../../middleware/webhookVerification');

// Telegram webhook with verification
router.post('/', verifyTelegramWebhook, async (req, res) => {
  try {
    // Check if Telegram bot is configured
    if (!isTelegramAvailable()) {
      console.warn('⚠️  Telegram webhook received but bot not configured');
      return res.status(503).json({ error: 'Telegram bot not configured' });
    }

    const { message } = req.body;
    
    // Validate message structure
    if (!message || !message.text || !message.chat || !message.from) {
      console.warn('⚠️  Invalid Telegram webhook payload');
      return res.status(200).send('OK'); // Return 200 to avoid retries
    }
    
    if (message && message.text) {
      const chatId = message.chat.id;
      const userId = message.from.id;
      const userName = message.from.first_name;
      const text = message.text;

      // Get or create customer
      const { getOrCreateCustomer, saveIncomingMessage, saveOutgoingMessage } = require('../../utils/chatHelpers');
      const customer = await getOrCreateCustomer(userId.toString(), userName, 'telegram');

      // Save incoming message (this also updates session and unread count)
      await saveIncomingMessage(
        customer.id, 
        text, 
        'telegram', 
        message.message_id.toString()
      );

      // Try to process with flow executor first
      const flowResponse = await flowExecutor.processMessage(customer.id, text, 'telegram');
      
      if (flowResponse && flowResponse.message) {
        // Send flow response
        const sentMessage = await telegramBot.sendMessage(chatId, flowResponse.message);
        
        // Save bot response
        await saveOutgoingMessage(
          customer.id,
          flowResponse.message,
          'telegram',
          sentMessage.message_id.toString()
        );
      } else {
        // Fallback to default handling
        if (text.startsWith('/')) {
          await handleTelegramCommand(chatId, text, customer);
        } else {
          const response = 'မင်္ဂလာပါ! ကျွန်ုပ်တို့၏ POS စနစ်မှ ကြိုဆိုပါတယ်။\n\n' +
            'Commands:\n' +
            '/products - ကုန်ပစ္စည်းများကြည့်ရန်\n' +
            '/orders - မှာယူမှုများကြည့်ရန်\n' +
            '/help - အကူအညီ';
          
          const sentMessage = await telegramBot.sendMessage(chatId, response);
          
          // Save bot response
          await saveOutgoingMessage(
            customer.id,
            response,
            'telegram',
            sentMessage.message_id.toString()
          );
        }
      }
    }

    res.status(200).send('OK');
  } catch (error) {
    console.error('Telegram webhook error:', error);
    // Always return 200 to prevent Telegram from retrying
    res.status(200).send('OK');
  }
});

async function handleTelegramCommand(chatId, text, customer) {
  const command = text.split(' ')[0];

  switch (command) {
    case '/start':
    case '/help':
      await telegramBot.sendMessage(chatId,
        'မင်္ဂလာပါ! Myanmar POS Bot မှ ကြိုဆိုပါတယ်။\n\n' +
        'Available commands:\n' +
        '/products - ကုန်ပစ္စည်းများကြည့်ရန်\n' +
        '/orders - မှာယူမှုများကြည့်ရန်\n' +
        '/help - အကူအညီ'
      );
      break;

    case '/products':
      const { data: products } = await supabase
        .from('products')
        .select('*')
        .limit(10);
      
      let productList = '📦 ကုန်ပစ္စည်းများ:\n\n';
      products.forEach(p => {
        productList += `• ${p.name_mm || p.name}\n  💰 ${p.price} ကျပ်\n  📊 Stock: ${p.stock_quantity}\n\n`;
      });
      
      await telegramBot.sendMessage(chatId, productList);
      break;

    case '/orders':
      const { data: orders } = await supabase
        .from('orders')
        .select('*')
        .eq('customer_id', customer.id)
        .order('created_at', { ascending: false })
        .limit(5);
      
      if (orders.length === 0) {
        await telegramBot.sendMessage(chatId, 'သင့်တွင် မှာယူမှုမရှိသေးပါ။');
      } else {
        let orderList = '🛒 သင့်မှာယူမှုများ:\n\n';
        orders.forEach(o => {
          orderList += `Order #${o.id}\n💰 ${o.total_amount} ကျပ်\n📊 Status: ${o.status}\n\n`;
        });
        
        await telegramBot.sendMessage(chatId, orderList);
      }
      break;

    default:
      await telegramBot.sendMessage(chatId, 'ကျေးဇူးပြု၍ မှန်ကန်သော command ကို ရိုက်ထည့်ပါ။ /help ကို ရိုက်ပါ။');
  }
}

module.exports = router;
