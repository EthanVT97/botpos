const express = require('express');
const router = express.Router();
const { viberBot, ViberMessage } = require('../../config/bots');
const { supabase } = require('../../config/supabase');
const { emitNewMessage, emitSessionUpdate, emitUnreadCountUpdate } = require('../../config/socket');
const flowExecutor = require('../../utils/flowExecutor');

// Viber webhook
router.post('/', (req, res) => {
  viberBot.middleware()(req, res, () => {
    res.status(200).send();
  });
});

// Handle Viber messages
viberBot.on('message', async (message) => {
  const userId = message.userProfile.id;
  const userName = message.userProfile.name;
  const text = message.text;

  try {
    // Find or create customer
    let { data: customer } = await supabase
      .from('customers')
      .select('*')
      .eq('viber_id', userId)
      .single();

    if (!customer) {
      const { data: newCustomer } = await supabase
        .from('customers')
        .insert([{ name: userName, viber_id: userId }])
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
        channel: 'viber',
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
        channel: 'viber',
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
    const flowResponse = await flowExecutor.processMessage(customer.id, text, 'viber');
    
    if (flowResponse && flowResponse.message) {
      // Send flow response
      await viberBot.sendMessage(message.userProfile, [
        new ViberMessage.Text(flowResponse.message)
      ]);
      
      // Save bot response
      await supabase
        .from('chat_messages')
        .insert([{
          customer_id: customer.id,
          sender_type: 'admin',
          message: flowResponse.message,
          channel: 'viber',
          is_read: true
        }]);
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
        await supabase
          .from('chat_messages')
          .insert([{
            customer_id: customer.id,
            sender_type: 'admin',
            message: response,
            channel: 'viber',
            is_read: true
          }]);
      }
    }
  } catch (error) {
    console.error('Viber error:', error);
  }
});

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
