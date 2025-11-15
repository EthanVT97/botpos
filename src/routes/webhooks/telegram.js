const express = require('express');
const router = express.Router();
const { telegramBot } = require('../../config/bots');
const { supabase } = require('../../config/supabase');
const { emitNewMessage, emitSessionUpdate, emitUnreadCountUpdate } = require('../../config/socket');
const flowExecutor = require('../../utils/flowExecutor');

// Telegram webhook
router.post('/', async (req, res) => {
  try {
    const { message } = req.body;
    
    if (message && message.text) {
      const chatId = message.chat.id;
      const userId = message.from.id;
      const userName = message.from.first_name;
      const text = message.text;

      // Find or create customer
      let { data: customer } = await supabase
        .from('customers')
        .select('*')
        .eq('telegram_id', userId.toString())
        .single();

      if (!customer) {
        const { data: newCustomer } = await supabase
          .from('customers')
          .insert([{ name: userName, telegram_id: userId.toString() }])
          .select()
          .single();
        customer = newCustomer;
      }

      // Save incoming message to database
      const { data: savedMessage } = await supabase
        .from('chat_messages')
        .insert([{
          customer_id: customer.id,
          sender_type: 'customer',
          message: text,
          channel: 'telegram',
          channel_message_id: message.message_id.toString(),
          is_read: false
        }])
        .select()
        .single();

      // Update or create chat session
      // First, get current session to increment unread count
      const { data: existingSession } = await supabase
        .from('chat_sessions')
        .select('unread_count')
        .eq('customer_id', customer.id)
        .single();

      const { data: session } = await supabase
        .from('chat_sessions')
        .upsert({
          customer_id: customer.id,
          channel: 'telegram',
          last_message_at: new Date(),
          is_active: true,
          unread_count: (existingSession?.unread_count || 0) + 1
        }, {
          onConflict: 'customer_id'
        })
        .select()
        .single();

      // Emit real-time updates
      if (savedMessage) {
        emitNewMessage(savedMessage, customer.id);
      }
      if (session) {
        emitSessionUpdate(session);
      }

      // Update total unread count
      const { data: sessions } = await supabase
        .from('chat_sessions')
        .select('unread_count')
        .eq('is_active', true);
      const totalUnread = sessions?.reduce((sum, s) => sum + (s.unread_count || 0), 0) || 0;
      emitUnreadCountUpdate(totalUnread);

      // Try to process with flow executor first
      const flowResponse = await flowExecutor.processMessage(customer.id, text, 'telegram');
      
      if (flowResponse && flowResponse.message) {
        // Send flow response
        await telegramBot.sendMessage(chatId, flowResponse.message);
        
        // Save bot response
        await supabase
          .from('chat_messages')
          .insert([{
            customer_id: customer.id,
            sender_type: 'admin',
            message: flowResponse.message,
            channel: 'telegram',
            is_read: true
          }]);
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
          
          await telegramBot.sendMessage(chatId, response);
          
          // Save bot response
          await supabase
            .from('chat_messages')
            .insert([{
              customer_id: customer.id,
              sender_type: 'admin',
              message: response,
              channel: 'telegram',
              is_read: true
            }]);
        }
      }
    }

    res.status(200).send('OK');
  } catch (error) {
    console.error('Telegram error:', error);
    res.status(500).send('Error');
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
