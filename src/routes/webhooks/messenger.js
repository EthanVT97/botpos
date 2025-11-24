const express = require('express');
const router = express.Router();
const axios = require('axios');
const { pool, query } = require('../../config/supabase');
const { emitNewMessage, emitSessionUpdate, emitUnreadCountUpdate } = require('../../config/socket');
const flowExecutor = require('../../utils/flowExecutor');
const { verifyMessengerWebhook } = require('../../middleware/webhookVerification');

const PAGE_ACCESS_TOKEN = process.env.MESSENGER_PAGE_ACCESS_TOKEN;
const VERIFY_TOKEN = process.env.MESSENGER_VERIFY_TOKEN;
const FB_API_VERSION = process.env.FB_API_VERSION || 'v18.0';

// Helper to check if Messenger is configured
const isMessengerConfigured = () => {
  return PAGE_ACCESS_TOKEN && 
         PAGE_ACCESS_TOKEN !== 'your_messenger_page_access_token' &&
         VERIFY_TOKEN &&
         VERIFY_TOKEN !== 'your_messenger_verify_token';
};

// Webhook verification
router.get('/', (req, res) => {
  const mode = req.query['hub.mode'];
  const token = req.query['hub.verify_token'];
  const challenge = req.query['hub.challenge'];

  if (mode && token) {
    if (token === VERIFY_TOKEN) {
      console.log('✅ Messenger webhook verified');
      res.status(200).send(challenge);
    } else {
      console.warn('⚠️  Invalid Messenger verify token');
      res.sendStatus(403);
    }
  } else {
    res.sendStatus(400);
  }
});

// Webhook handler with verification
router.post('/', verifyMessengerWebhook, async (req, res) => {
  try {
    // Check if Messenger is configured
    if (!isMessengerConfigured()) {
      console.warn('⚠️  Messenger webhook received but bot not configured');
      return res.status(503).json({ error: 'Messenger bot not configured' });
    }

    const { entry } = req.body;
    
    // Validate payload structure
    if (!entry || !Array.isArray(entry)) {
      console.warn('⚠️  Invalid Messenger webhook payload');
      return res.status(200).send('EVENT_RECEIVED');
    }

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
    console.error('Messenger webhook error:', error);
    // Always return 200 to prevent Facebook from retrying
    res.status(200).send('EVENT_RECEIVED');
  }
});

async function handleMessage(senderId, text) {
  try {
    // Get or create customer
    const { getOrCreateCustomer, saveIncomingMessage, saveOutgoingMessage } = require('../../utils/chatHelpers');
    const customer = await getOrCreateCustomer(senderId, `Messenger User`, 'messenger');

    // Save incoming message (this also updates session and unread count)
    await saveIncomingMessage(customer.id, text, 'messenger');

    // Try to process with flow executor first
    const flowResponse = await flowExecutor.processMessage(customer.id, text, 'messenger');
    
    if (flowResponse && flowResponse.message) {
      // Send flow response
      await sendTextMessage(senderId, flowResponse.message);
      
      // Save bot response
      await saveOutgoingMessage(customer.id, flowResponse.message, 'messenger');
    } else {
      // Fallback to default handling
      let response;
      if (text.toLowerCase().includes('product')) {
        await sendProductList(senderId, customer);
        return;
      } else if (text.toLowerCase().includes('order')) {
        await sendOrderList(senderId, customer);
        return;
      } else {
        response = 'မင်္ဂလာပါ! Myanmar POS Bot မှ ကြိုဆိုပါတယ်။\n\n' +
          'Type "products" to see products\n' +
          'Type "orders" to see your orders';
        await sendTextMessage(senderId, response);
      }

      // Save bot response
      if (response) {
        await saveOutgoingMessage(customer.id, response, 'messenger');
      }
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
    `https://graph.facebook.com/${FB_API_VERSION}/me/messages?access_token=${PAGE_ACCESS_TOKEN}`,
    messageData
  );
}

async function sendProductList(recipientId, customer) {
  const { data: products } = await supabase
    .from('products')
    .select('*')
    .limit(10);

  let productText = '📦 ကုန်ပစ္စည်းများ:\n\n';
  products.forEach(p => {
    productText += `• ${p.name_mm || p.name}\n  💰 ${p.price} ကျပ်\n\n`;
  });

  await sendTextMessage(recipientId, productText);
  
  // Save bot response
  const { saveOutgoingMessage } = require('../../utils/chatHelpers');
  await saveOutgoingMessage(customer.id, productText, 'messenger');
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
