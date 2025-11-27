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

    // Prepare response and keyboard
    let response;
    let keyboard = null;
    
    // Check for commands
    if (text.startsWith('/')) {
      response = await getCommandResponse(text, customer);
      // Add keyboard to command responses too
      keyboard = getMainKeyboard();
    } else {
      // Default welcome message with keyboard
      response = 'မင်္ဂလာပါ! ကျွန်ုပ်တို့၏ POS စနစ်မှ ကြိုဆိုပါတယ်။\n\n' +
        'ကျေးဇူးပြု၍ အောက်ပါခလုတ်များမှ ရွေးချယ်ပါ:';
      keyboard = getMainKeyboard();
    }

    // Send response via Viber API with keyboard
    await sendViberMessage(userId, response, keyboard);
    
    // Save bot response
    await saveOutgoingMessage(customer.id, response, 'viber');
    console.log('✅ Response sent and saved');

  } catch (error) {
    console.error('❌ Error in handleViberMessage:', error);
    throw error;
  }
}

// Get main keyboard with buttons
function getMainKeyboard() {
  return {
    Type: 'keyboard',
    DefaultHeight: false,
    Buttons: [
      {
        Columns: 6,
        Rows: 1,
        BgColor: '#6366f1',
        BgMediaType: 'picture',
        BgMedia: '',
        Text: '<font color="#ffffff"><b>📦 ကုန်ပစ္စည်းများ</b></font>',
        TextSize: 'regular',
        TextVAlign: 'middle',
        TextHAlign: 'center',
        ActionType: 'reply',
        ActionBody: '/products',
        Silent: false
      },
      {
        Columns: 6,
        Rows: 1,
        BgColor: '#10b981',
        BgMediaType: 'picture',
        BgMedia: '',
        Text: '<font color="#ffffff"><b>📋 မှာယူမှုများ</b></font>',
        TextSize: 'regular',
        TextVAlign: 'middle',
        TextHAlign: 'center',
        ActionType: 'reply',
        ActionBody: '/orders',
        Silent: false
      },
      {
        Columns: 6,
        Rows: 1,
        BgColor: '#f59e0b',
        BgMediaType: 'picture',
        BgMedia: '',
        Text: '<font color="#ffffff"><b>❓ အကူအညီ</b></font>',
        TextSize: 'regular',
        TextVAlign: 'middle',
        TextHAlign: 'center',
        ActionType: 'reply',
        ActionBody: '/help',
        Silent: false
      },
      {
        Columns: 6,
        Rows: 1,
        BgColor: '#8b5cf6',
        BgMediaType: 'picture',
        BgMedia: '',
        Text: '<font color="#ffffff"><b>🏪 ဆိုင်အချက်အလက်</b></font>',
        TextSize: 'regular',
        TextVAlign: 'middle',
        TextHAlign: 'center',
        ActionType: 'reply',
        ActionBody: '/store',
        Silent: false
      }
    ]
  };
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
        name: 'Myanmar POS Bot',
        avatar: 'https://via.placeholder.com/150'
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
      
      let productList = '📦 ကုန်ပစ္စည်းများ:\n\n';
      if (products && products.length > 0) {
        products.forEach((p, index) => {
          productList += `${index + 1}. ${p.name_mm || p.name}\n`;
          productList += `   💰 ${p.price.toLocaleString()} ကျပ်\n`;
          if (p.stock_quantity !== undefined) {
            productList += `   📊 Stock: ${p.stock_quantity}\n`;
          }
          productList += '\n';
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
      
      let orderList = '📋 သင့်မှာယူမှုများ:\n\n';
      if (orders && orders.length > 0) {
        orders.forEach((o, index) => {
          const date = new Date(o.created_at).toLocaleDateString('en-GB');
          orderList += `${index + 1}. Order #${o.id.substring(0, 8)}\n`;
          orderList += `   💰 ${o.total_amount.toLocaleString()} ကျပ်\n`;
          orderList += `   📅 ${date}\n`;
          orderList += `   📊 Status: ${o.status}\n\n`;
        });
      } else {
        orderList += 'မှာယူမှုမရှိသေးပါ။\n\nကျေးဇူးပြု၍ ကုန်ပစ္စည်းများကို ကြည့်ရှုပြီး မှာယူပါ။';
      }
      return orderList;

    case '/store':
      const { data: stores } = await supabase
        .from('stores')
        .select('*')
        .eq('is_active', true)
        .limit(1);
      
      let storeInfo = '🏪 ဆိုင်အချက်အလက်:\n\n';
      if (stores && stores.length > 0) {
        const store = stores[0];
        storeInfo += `📍 ${store.name_mm || store.name}\n`;
        if (store.address) storeInfo += `🏠 ${store.address}\n`;
        if (store.phone) storeInfo += `📞 ${store.phone}\n`;
        if (store.email) storeInfo += `📧 ${store.email}\n`;
      } else {
        storeInfo += 'Myanmar POS System\n';
        storeInfo += '📞 Contact us for more information';
      }
      return storeInfo;

    case '/help':
      return '❓ Available Commands:\n\n' +
        '📦 /products - View products\n' +
        '   ကုန်ပစ္စည်းများကြည့်ရန်\n\n' +
        '📋 /orders - View your orders\n' +
        '   မှာယူမှုများကြည့်ရန်\n\n' +
        '🏪 /store - Store information\n' +
        '   ဆိုင်အချက်အလက်\n\n' +
        '❓ /help - Show this help\n' +
        '   အကူအညီ';

    default:
      return 'ကျေးဇူးပြု၍ အောက်ပါခလုတ်များမှ ရွေးချယ်ပါ။\n\n' +
        'သို့မဟုတ် commands များကို ရိုက်ထည့်နိုင်ပါသည်:\n' +
        '📦 /products\n' +
        '📋 /orders\n' +
        '🏪 /store\n' +
        '❓ /help';
  }
}

module.exports = router;
