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

  try {
    // The viber-bot library handles signature verification internally
    viberBotInstance.middleware()(req, res, () => {
      console.log('✅ Viber webhook processed successfully');
      res.status(200).send();
    });
  } catch (error) {
    console.error('❌ Viber webhook error:', error);
    res.status(200).send(); // Return 200 to avoid retries
  }
});

// Setup message handler for Viber bot
function setupViberMessageHandler() {
  if (!viberBotInstance) return;

  viberBotInstance.on('message', async (message) => {
    try {
      console.log('💬 Viber message received:', {
        from: message.userProfile?.name,
        text: message.text?.substring(0, 50),
        timestamp: new Date().toISOString()
      });

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

      console.log('👤 Customer:', { id: customer.id, name: customer.name });

      // Save incoming message (this also updates session and unread count)
      await saveIncomingMessage(customer.id, text, 'viber');
      console.log('💾 Message saved to database');

      // Try to process with flow executor first
      const flowResponse = await flowExecutor.processMessage(customer.id, text, 'viber');
      
      if (flowResponse && flowResponse.message) {
        // Send flow response
        await viberBotInstance.sendMessage(message.userProfile, [
          new ViberMessage.Text(flowResponse.message)
        ]);
        
        // Save bot response
        await saveOutgoingMessage(customer.id, flowResponse.message, 'viber');
        console.log('✅ Flow response sent');
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
          
          await viberBotInstance.sendMessage(message.userProfile, [
            new ViberMessage.Text(response)
          ]);
          
          // Save bot response
          await saveOutgoingMessage(customer.id, response, 'viber');
          console.log('✅ Welcome message sent');
        }
      }
    } catch (error) {
      console.error('❌ Viber message handler error:', error);
    }
  });

  console.log('✅ Viber message handler setup complete');
}

async function handleViberCommand(message, customer) {
  const command = message.text.split(' ')[0];

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
      
      await viberBotInstance.sendMessage(message.userProfile, [
        new ViberMessage.Text(productList)
      ]);
      console.log('✅ Products list sent');
      break;

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
      
      await viberBotInstance.sendMessage(message.userProfile, [
        new ViberMessage.Text(orderList)
      ]);
      console.log('✅ Orders list sent');
      break;

    default:
      await viberBotInstance.sendMessage(message.userProfile, [
        new ViberMessage.Text('ကျေးဇူးပြု၍ မှန်ကန်သော command ကို ရိုက်ထည့်ပါ။\n\n/products - ကုန်ပစ္စည်းများ\n/orders - မှာယူမှုများ\n/help - အကူအညီ')
      ]);
      console.log('✅ Help message sent');
  }
}

module.exports = router;
