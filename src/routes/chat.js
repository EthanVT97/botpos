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
    const result = await query(`
      SELECT 
        cs.*,
        json_build_object(
          'id', c.id,
          'name', c.name,
          'phone', c.phone,
          'email', c.email,
          'viber_id', c.viber_id,
          'telegram_id', c.telegram_id,
          'messenger_id', c.messenger_id
        ) as customers
      FROM chat_sessions cs
      LEFT JOIN customers c ON cs.customer_id = c.id
      WHERE cs.is_active = true
      ORDER BY cs.last_message_at DESC
    `);

    res.json({ success: true, data: result.rows });
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

    const result = await query(`
      SELECT * FROM chat_messages
      WHERE customer_id = $1
      ORDER BY created_at ASC
      LIMIT $2
    `, [customerId, parseInt(limit)]);

    res.json({ success: true, data: result.rows });
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
    const customerResult = await query(
      'SELECT * FROM customers WHERE id = $1',
      [customerId]
    );

    const customer = customerResult.rows[0];
    if (!customer) {
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
    const messageResult = await query(`
      INSERT INTO chat_messages (customer_id, sender_type, message, channel, channel_message_id, is_read, metadata)
      VALUES ($1, $2, $3, $4, $5, $6, $7)
      RETURNING *
    `, [
      customerId,
      'admin',
      message,
      targetChannel,
      channelMessageId,
      true,
      sendError ? JSON.stringify({ error: sendError }) : null
    ]);

    const savedMessage = messageResult.rows[0];

    // Emit real-time update via Socket.IO
    emitNewMessage(savedMessage, customerId);

    // Update session
    await query(`
      INSERT INTO chat_sessions (customer_id, channel, last_message_at, is_active)
      VALUES ($1, $2, NOW(), true)
      ON CONFLICT (customer_id) DO UPDATE SET
        channel = $2,
        last_message_at = NOW(),
        is_active = true,
        updated_at = NOW()
    `, [customerId, targetChannel]);

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
    const unreadResult = await query(`
      SELECT id FROM chat_messages
      WHERE customer_id = $1 AND sender_type = 'customer' AND is_read = false
    `, [customerId]);

    const messageIds = unreadResult.rows.map(m => m.id);

    // Mark messages as read
    await query(`
      UPDATE chat_messages
      SET is_read = true, updated_at = NOW()
      WHERE customer_id = $1 AND sender_type = 'customer' AND is_read = false
    `, [customerId]);

    // Update session unread count
    const sessionResult = await query(`
      UPDATE chat_sessions
      SET unread_count = 0, updated_at = NOW()
      WHERE customer_id = $1
      RETURNING *
    `, [customerId]);

    const session = sessionResult.rows[0];

    // Emit real-time updates
    if (messageIds.length > 0) {
      emitMessageRead(customerId, messageIds);
    }

    // Update total unread count
    const sessionsResult = await query(`
      SELECT unread_count FROM chat_sessions WHERE is_active = true
    `);

    const totalUnread = sessionsResult.rows.reduce((sum, s) => sum + (s.unread_count || 0), 0);
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
    const result = await query(`
      SELECT unread_count FROM chat_sessions WHERE is_active = true
    `);

    const totalUnread = result.rows.reduce((sum, session) => sum + (session.unread_count || 0), 0);

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

    const result = await query(`
      UPDATE chat_sessions
      SET is_active = false, updated_at = NOW()
      WHERE customer_id = $1
      RETURNING *
    `, [customerId]);

    const session = result.rows[0];

    // Emit session update
    if (session) {
      emitSessionUpdate(session);
    }

    res.json({ success: true });
  } catch (error) {
    console.error('Error closing chat session:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

module.exports = router;
