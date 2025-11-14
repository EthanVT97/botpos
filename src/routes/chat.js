const express = require('express');
const router = express.Router();
const { supabase } = require('../config/supabase');
const { telegramBot, viberBot, ViberMessage } = require('../config/bots');
const axios = require('axios');

// Get all active chat sessions
router.get('/sessions', async (req, res) => {
  try {
    const { data, error } = await supabase
      .from('chat_sessions')
      .select(`
        *,
        customers (
          id,
          name,
          phone,
          viber_id,
          telegram_id,
          messenger_id
        )
      `)
      .eq('is_active', true)
      .order('last_message_at', { ascending: false });

    if (error) throw error;

    res.json({ success: true, data });
  } catch (error) {
    console.error('Error fetching chat sessions:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// Get messages for a specific customer
router.get('/messages/:customerId', async (req, res) => {
  try {
    const { customerId } = req.params;
    const { limit = 50 } = req.query;

    const { data, error } = await supabase
      .from('chat_messages')
      .select('*')
      .eq('customer_id', customerId)
      .order('created_at', { ascending: true })
      .limit(parseInt(limit));

    if (error) throw error;

    res.json({ success: true, data });
  } catch (error) {
    console.error('Error fetching messages:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// Send message to customer
router.post('/send', async (req, res) => {
  try {
    const { customerId, message, channel } = req.body;

    if (!customerId || !message) {
      return res.status(400).json({ 
        success: false, 
        error: 'Customer ID and message are required' 
      });
    }

    // Get customer info
    const { data: customer, error: customerError } = await supabase
      .from('customers')
      .select('*')
      .eq('id', customerId)
      .single();

    if (customerError) throw customerError;

    // Determine channel if not specified
    const targetChannel = channel || 
      (customer.telegram_id ? 'telegram' : 
       customer.viber_id ? 'viber' : 
       customer.messenger_id ? 'messenger' : null);

    if (!targetChannel) {
      return res.status(400).json({ 
        success: false, 
        error: 'Customer has no linked messaging channel' 
      });
    }

    // Send message via appropriate channel
    let channelMessageId = null;
    let sendError = null;

    try {
      switch (targetChannel) {
        case 'telegram':
          if (customer.telegram_id) {
            const result = await telegramBot.sendMessage(customer.telegram_id, message);
            channelMessageId = result.message_id.toString();
          }
          break;

        case 'viber':
          if (customer.viber_id) {
            await viberBot.sendMessage({ id: customer.viber_id }, [
              new ViberMessage.Text(message)
            ]);
          }
          break;

        case 'messenger':
          if (customer.messenger_id) {
            const PAGE_ACCESS_TOKEN = process.env.MESSENGER_PAGE_ACCESS_TOKEN;
            const response = await axios.post(
              `https://graph.facebook.com/v18.0/me/messages?access_token=${PAGE_ACCESS_TOKEN}`,
              {
                recipient: { id: customer.messenger_id },
                message: { text: message }
              }
            );
            channelMessageId = response.data.message_id;
          }
          break;
      }
    } catch (err) {
      sendError = err.message;
      console.error(`Error sending ${targetChannel} message:`, err);
    }

    // Save message to database
    const { data: savedMessage, error: saveError } = await supabase
      .from('chat_messages')
      .insert([{
        customer_id: customerId,
        sender_type: 'admin',
        message: message,
        channel: targetChannel,
        channel_message_id: channelMessageId,
        is_read: true,
        metadata: sendError ? { error: sendError } : null
      }])
      .select()
      .single();

    if (saveError) throw saveError;

    res.json({ 
      success: true, 
      data: savedMessage,
      channelSent: !sendError,
      error: sendError 
    });
  } catch (error) {
    console.error('Error sending message:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// Mark messages as read
router.post('/mark-read/:customerId', async (req, res) => {
  try {
    const { customerId } = req.params;

    const { error } = await supabase.rpc('mark_messages_read', {
      p_customer_id: customerId
    });

    if (error) throw error;

    res.json({ success: true });
  } catch (error) {
    console.error('Error marking messages as read:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// Get unread message count
router.get('/unread-count', async (req, res) => {
  try {
    const { data, error } = await supabase
      .from('chat_sessions')
      .select('unread_count')
      .eq('is_active', true);

    if (error) throw error;

    const totalUnread = data.reduce((sum, session) => sum + (session.unread_count || 0), 0);

    res.json({ success: true, data: { total: totalUnread } });
  } catch (error) {
    console.error('Error fetching unread count:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// Close/archive chat session
router.post('/sessions/:customerId/close', async (req, res) => {
  try {
    const { customerId } = req.params;

    const { error } = await supabase
      .from('chat_sessions')
      .update({ is_active: false, updated_at: new Date() })
      .eq('customer_id', customerId);

    if (error) throw error;

    res.json({ success: true });
  } catch (error) {
    console.error('Error closing chat session:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

module.exports = router;
