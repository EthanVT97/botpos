const express = require('express');
const router = express.Router();
const { viberBot, ViberMessage } = require('../../config/bots');
const { supabase } = require('../../config/supabase');

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

    // Handle commands
    if (text.startsWith('/')) {
      await handleViberCommand(message, customer);
    } else {
      await viberBot.sendMessage(message.userProfile, [
        new ViberMessage.Text('မင်္ဂလာပါ! ကျွန်ုပ်တို့၏ POS စနစ်မှ ကြိုဆိုပါတယ်။\n\n' +
          'Commands:\n' +
          '/products - ကုန်ပစ္စည်းများကြည့်ရန်\n' +
          '/orders - မှာယူမှုများကြည့်ရန်\n' +
          '/help - အကူအညီ')
      ]);
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
