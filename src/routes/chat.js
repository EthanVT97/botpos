const express = require('express');
const router = express.Router();
const { pool, query, supabase } = require('../config/database');
const { telegramBot, viberBot, ViberMessage } = require('../config/bots');
const { emitNewMessage, emitMessageRead, emitUnreadCountUpdate, emitSessionUpdate } = require('../config/socket');
const { chatValidation } = require('../middleware/validator');
const { chatLimiter } = require('../middleware/rateLimiter');
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
          email,
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

// Send message to customer (with rate limiting and validation)
router.post('/send', chatLimiter, chatValidation.send, async (req, res) => {
  try {
    const { customerId, message, channel } = req.body;

    // Get customer info
    const { data: customer, error: customerError } = await supabase
      .from('customers')
      .select('*')
      .eq('id', customerId)
      .single();

    if (customerError || !customer) {
      return res.status(404).json({ 
        success: false, 
        error: 'Customer not found' 
      });
    }

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
      const { isTelegramAvailable, isViberAvailable } = require('../config/bots');
      
      switch (targetChannel) {
        case 'telegram':
          if (!isTelegramAvailable()) {
            sendError = 'Telegram bot not configured';
          } else if (customer.telegram_id) {
            const result = await telegramBot.sendMessage(customer.telegram_id, message);
            channelMessageId = result.message_id.toString();
          } else {
            sendError = 'Customer has no Telegram ID';
          }
          break;

        case 'viber':
          if (!isViberAvailable()) {
            sendError = 'Viber bot not configured';
          } else if (customer.viber_id) {
            await viberBot.sendMessage({ id: customer.viber_id }, [
              new ViberMessage.Text(message)
            ]);
          } else {
            sendError = 'Customer has no Viber ID';
          }
          break;

        case 'messenger':
          const PAGE_ACCESS_TOKEN = process.env.MESSENGER_PAGE_ACCESS_TOKEN;
          if (!PAGE_ACCESS_TOKEN || PAGE_ACCESS_TOKEN === 'your_messenger_page_access_token') {
            sendError = 'Messenger bot not configured';
          } else if (customer.messenger_id) {
            const FB_API_VERSION = process.env.FB_API_VERSION || 'v18.0';
            const response = await axios.post(
              `https://graph.facebook.com/${FB_API_VERSION}/me/messages?access_token=${PAGE_ACCESS_TOKEN}`,
              {
                recipient: { id: customer.messenger_id },
                message: { text: message }
              }
            );
            channelMessageId = response.data.message_id;
          } else {
            sendError = 'Customer has no Messenger ID';
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

    // Emit real-time update via Socket.IO
    emitNewMessage(savedMessage, customerId);

    // Update session
    await supabase
      .from('chat_sessions')
      .upsert({
        customer_id: customerId,
        channel: targetChannel,
        last_message_at: new Date(),
        is_active: true
      }, {
        onConflict: 'customer_id'
      });

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
router.post('/mark-read/:customerId', chatValidation.markRead, async (req, res) => {
  try {
    const { customerId } = req.params;

    // Get unread message IDs before marking as read
    const { data: unreadMessages } = await supabase
      .from('chat_messages')
      .select('id')
      .eq('customer_id', customerId)
      .eq('sender_type', 'customer')
      .eq('is_read', false);

    const messageIds = unreadMessages?.map(m => m.id) || [];

    // Mark messages as read
    const { error } = await supabase
      .from('chat_messages')
      .update({ is_read: true, read_at: new Date() })
      .eq('customer_id', customerId)
      .eq('sender_type', 'customer')
      .eq('is_read', false);

    if (error) throw error;

    // Update session unread count
    const { data: session } = await supabase
      .from('chat_sessions')
      .update({ unread_count: 0 })
      .eq('customer_id', customerId)
      .select()
      .single();

    // Emit real-time updates
    if (messageIds.length > 0) {
      emitMessageRead(customerId, messageIds);
    }

    // Update total unread count
    const { data: sessions } = await supabase
      .from('chat_sessions')
      .select('unread_count')
      .eq('is_active', true);

    const totalUnread = sessions?.reduce((sum, s) => sum + (s.unread_count || 0), 0) || 0;
    emitUnreadCountUpdate(totalUnread);

    if (session) {
      emitSessionUpdate(session);
    }

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

    const totalUnread = (data || []).reduce((sum, session) => sum + (session.unread_count || 0), 0);

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

    const { data: session, error } = await supabase
      .from('chat_sessions')
      .update({ is_active: false, updated_at: new Date() })
      .eq('customer_id', customerId)
      .select()
      .single();

    if (error) throw error;

    // Emit session update
    emitSessionUpdate(session);

    res.json({ success: true });
  } catch (error) {
    console.error('Error closing chat session:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

module.exports = router;
