const express = require('express');
const router = express.Router();
const ViberBot = require('viber-bot').Bot;
const ViberMessage = require('viber-bot').Message;
const { pool, query, supabase } = require('../../config/database');
const { emitNewMessage, emitSessionUpdate, emitUnreadCountUpdate } = require('../../config/socket');
const flowExecutor = require('../../utils/flowExecutor');

// Dynamic Viber bot instance (loaded from database)
let viberBotInstance = null;
let viberBotToken = null;

// Initialize Viber bot from database
async function initializeViberBot() {
  try {
    const result = await query(
      'SELECT value FROM settings WHERE key = $1',
      ['viber_bot_token']
    );
    
    if (result.rows.length > 0 && result.rows[0].value) {
      const token = result.rows[0].value;
      
      if (token !== viberBotToken) {
        console.log('🔄 Initializing Viber bot with token from database...');
        viberBotToken = token;
        
        viberBotInstance = new ViberBot({
          authToken: token,
          name: 'Myanmar POS Bot',
          avatar: 'https://via.placeholder.com/150'
        });
        
        // Setup message handler
        setupViberMessageHandler();
        
        console.log('✅ Viber bot initialized successfully');
        return true;
      }
      return true;
    }
    
    console.warn('⚠️  Viber bot token not found in database');
    return false;
  } catch (error) {
    console.error('❌ Error initializing Viber bot:', error);
    return false;
  }
}

// Viber webhook
router.post('/', async (req, res) => {
  console.log('📱 Viber webhook received:', {
    event: req.body.event,
    sender: req.body.sender?.name,
    message: req.body.message?.text?.substring(0, 50),
    timestamp: new Date().toISOString()
  });

  // Initialize bot if not already done
  if (!viberBotInstance) {
    const initialized = await initializeViberBot();
    if (!initialized) {
      console.warn('⚠️  Viber bot not configured, returning 200');
      return res.status(200).send();
    }
  }

  // Handle message event directly
  if (req.body.event === 'message' && req.body.message && req.body.sender) {
    try {
      await handleViberMessage(req.body);
      console.log('✅ Viber message handled successfully');
    } catch (error) {
      console.error('❌ Error handling Viber message:', error);
    }
  }

  // Always return 200 to Viber
  res.status(200).send();
});

// Handle Viber message directly from webhook
async function handleViberMessage(webhookData) {
  try {
    console.log('💬 Processing Viber message...');

    const sender = webhookData.sender;
    const message = webhookData.message;

    if (!sender || !message || !message.text) {
      console.warn('⚠️  Invalid message structure');
      return;
    }

    const userId = sender.id;
    const userName = sender.name;
    const text = message.text;

    console.log('👤 User:', { id: userId, name: userName, text });

    // Get or create customer
    const { getOrCreateCustomer, saveIncomingMessage, saveOutgoingMessage } = require('../../utils/chatHelpers');
    const customer = await getOrCreateCustomer(userId, userName, 'viber');

    console.log('✅ Customer found/created:', { id: customer.id, name: customer.name });

    // Save incoming message
    await saveIncomingMessage(customer.id, text, 'viber');
    console.log('💾 Message saved to database');

    // Prepare response
    let response;
    
    // Check for commands
    if (text.startsWith('/')) {
      response = await getCommandResponse(text, customer);
    } else {
      // Default welcome message with keyboard
      response = 'မင်္ဂလာပါ! ကျွန်ုပ်တို့၏ POS စနစ်မှ ကြိုဆိုပါတယ်။\n\n' +
        'Commands:\n' +
        '/products - ကုန်ပစ္စည်းများကြည့်ရန်\n' +
        '/orders - မှာယူမှုများကြည့်ရန်\n' +
        '/help - အကူအညီ';
    }

    // Send response via Viber API
    await sendViberMessage(userId, response);
    
    // Save bot response
    await saveOutgoingMessage(customer.id, response, 'viber');
    console.log('✅ Response sent and saved');

  } catch (error) {
    console.error('❌ Error in handleViberMessage:', error);
    throw error;
  }
}

// Send message via Viber API
async function sendViberMessage(userId, text, keyboard = null) {
  try {
    const axios = require('axios');
    
    const payload = {
      receiver: userId,
      type: 'text',
      text: text,
      sender: {
        name: 'Myanmar POS Bot'
      }
    };

    // Add keyboard if provided
    if (keyboard) {
      payload.keyboard = keyboard;
    }

    const response = await axios.post(
      'https://chatapi.viber.com/pa/send_message',
      payload,
      {
        headers: {
          'X-Viber-Auth-Token': viberBotToken
        }
      }
    );

    console.log('📤 Viber API response:', response.data);
    return response.data;
  } catch (error) {
    console.error('❌ Error sending Viber message:', error.response?.data || error.message);
    throw error;
  }
}

// Setup message handler (kept for compatibility but not used)
function setupViberMessageHandler() {
  console.log('✅ Viber message handler setup (using direct webhook handling)');
}

// Get response for command
async function getCommandResponse(text, customer) {
  const command = text.split(' ')[0];
  console.log('🔧 Processing command:', command);

  switch (command) {
    case '/products':
      const { data: products } = await supabase
        .from('products')
        .select('*')
        .limit(10);
      
      let productList = 'ကုန်ပစ္စည်းများ:\n\n';
      if (products && products.length > 0) {
        products.forEach(p => {
          productList += `${p.name_mm || p.name} - ${p.price} ကျပ်\n`;
        });
      } else {
        productList += 'ကုန်ပစ္စည်းမရှိသေးပါ။';
      }
      return productList;

    case '/orders':
      const { data: orders } = await supabase
        .from('orders')
        .select('*')
        .eq('customer_id', customer.id)
        .order('created_at', { ascending: false })
        .limit(5);
      
      let orderList = 'သင့်မှာယူမှုများ:\n\n';
      if (orders && orders.length > 0) {
        orders.forEach(o => {
          orderList += `Order #${o.id.substring(0, 8)} - ${o.total_amount} ကျပ် - ${o.status}\n`;
        });
      } else {
        orderList += 'မှာယူမှုမရှိသေးပါ။';
      }
      return orderList;

    case '/help':
      return 'Available Commands:\n\n' +
        '/products - View products (ကုန်ပစ္စည်းများ)\n' +
        '/orders - View your orders (မှာယူမှုများ)\n' +
        '/help - Show this help (အကူအညီ)';

    default:
      return 'ကျေးဇူးပြု၍ မှန်ကန်သော command ကို ရိုက်ထည့်ပါ။\n\n' +
        '/products - ကုန်ပစ္စည်းများ\n' +
        '/orders - မှာယူမှုများ\n' +
        '/help - အကူအညီ';
  }
}

module.exports = router;
