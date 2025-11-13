const express = require('express');
const router = express.Router();
const axios = require('axios');
const { supabase } = require('../../config/supabase');

const PAGE_ACCESS_TOKEN = process.env.MESSENGER_PAGE_ACCESS_TOKEN;
const VERIFY_TOKEN = process.env.MESSENGER_VERIFY_TOKEN;

// Webhook verification
router.get('/', (req, res) => {
  const mode = req.query['hub.mode'];
  const token = req.query['hub.verify_token'];
  const challenge = req.query['hub.challenge'];

  if (mode && token === VERIFY_TOKEN) {
    res.status(200).send(challenge);
  } else {
    res.sendStatus(403);
  }
});

// Webhook handler
router.post('/', async (req, res) => {
  try {
    const { entry } = req.body;

    if (entry && entry[0].messaging) {
      for (const event of entry[0].messaging) {
        const senderId = event.sender.id;

        if (event.message && event.message.text) {
          await handleMessage(senderId, event.message.text);
        } else if (event.postback) {
          await handlePostback(senderId, event.postback);
        }
      }
    }

    res.status(200).send('EVENT_RECEIVED');
  } catch (error) {
    console.error('Messenger error:', error);
    res.status(500).send('Error');
  }
});

async function handleMessage(senderId, text) {
  try {
    // Find or create customer
    let { data: customer } = await supabase
      .from('customers')
      .select('*')
      .eq('messenger_id', senderId)
      .single();

    if (!customer) {
      const { data: newCustomer } = await supabase
        .from('customers')
        .insert([{ name: `User ${senderId}`, messenger_id: senderId }])
        .select()
        .single();
      customer = newCustomer;
    }

    // Handle commands
    if (text.toLowerCase().includes('product')) {
      await sendProductList(senderId);
    } else if (text.toLowerCase().includes('order')) {
      await sendOrderList(senderId, customer);
    } else {
      await sendTextMessage(senderId,
        'မင်္ဂလာပါ! Myanmar POS Bot မှ ကြိုဆိုပါတယ်။\n\n' +
        'Type "products" to see products\n' +
        'Type "orders" to see your orders'
      );
    }
  } catch (error) {
    console.error('Handle message error:', error);
  }
}

async function sendTextMessage(recipientId, text) {
  const messageData = {
    recipient: { id: recipientId },
    message: { text }
  };

  await axios.post(
    `https://graph.facebook.com/v18.0/me/messages?access_token=${PAGE_ACCESS_TOKEN}`,
    messageData
  );
}

async function sendProductList(recipientId) {
  const { data: products } = await supabase
    .from('products')
    .select('*')
    .limit(10);

  let productText = '📦 ကုန်ပစ္စည်းများ:\n\n';
  products.forEach(p => {
    productText += `• ${p.name_mm || p.name}\n  💰 ${p.price} ကျပ်\n\n`;
  });

  await sendTextMessage(recipientId, productText);
}

async function sendOrderList(recipientId, customer) {
  const { data: orders } = await supabase
    .from('orders')
    .select('*')
    .eq('customer_id', customer.id)
    .order('created_at', { ascending: false })
    .limit(5);

  if (orders.length === 0) {
    await sendTextMessage(recipientId, 'သင့်တွင် မှာယူမှုမရှိသေးပါ။');
  } else {
    let orderText = '🛒 သင့်မှာယူမှုများ:\n\n';
    orders.forEach(o => {
      orderText += `Order #${o.id}\n💰 ${o.total_amount} ကျပ်\n📊 ${o.status}\n\n`;
    });
    
    await sendTextMessage(recipientId, orderText);
  }
}

async function handlePostback(senderId, postback) {
  // Handle button clicks
  console.log('Postback:', postback);
}

module.exports = router;
