const express = require('express');
const router = express.Router();
const { pool, query, supabase } = require('../config/database');
const { telegramBot, viberBot, ViberMessage } = require('../config/bots');
const { emitNewMessage, emitMessageRead, emitUnreadCountUpdate, emitSessionUpdate, emitTypingIndicator } = require('../config/socket');
const { chatValidation } = require('../middleware/validator');
const { chatLimiter } = require('../middleware/rateLimiter');
const axios = require('axios');
const multer = require('multer');
const path = require('path');
const fs = require('fs').promises;
const XLSX = require('xlsx');

// Configure multer for file uploads
const storage = multer.diskStorage({
  destination: async (req, file, cb) => {
    const uploadDir = path.join(__dirname, '../../uploads/chat');
    try {
      await fs.mkdir(uploadDir, { recursive: true });
      cb(null, uploadDir);
    } catch (error) {
      cb(error);
    }
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, uniqueSuffix + path.extname(file.originalname));
  }
});

const upload = multer({
  storage,
  limits: {
    fileSize: 10 * 1024 * 1024 // 10MB limit
  },
  fileFilter: (req, file, cb) => {
    const allowedTypes = /jpeg|jpg|png|gif|pdf|doc|docx|xls|xlsx|txt/;
    const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
    const mimetype = allowedTypes.test(file.mimetype);
    
    if (mimetype && extname) {
      return cb(null, true);
    } else {
      cb(new Error('Invalid file type. Only images and documents allowed.'));
    }
  }
});

// Get all active chat sessions with tags
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
        ) as customers,
        COALESCE(
          json_agg(
            DISTINCT jsonb_build_object(
              'id', ct.id,
              'name', ct.name,
              'color', ct.color
            )
          ) FILTER (WHERE ct.id IS NOT NULL),
          '[]'
        ) as tags
      FROM chat_sessions cs
      LEFT JOIN customers c ON cs.customer_id = c.id
      LEFT JOIN chat_session_tags cst ON cs.customer_id = cst.session_id
      LEFT JOIN conversation_tags ct ON cst.tag_id = ct.id
      WHERE cs.is_active = true
      GROUP BY cs.customer_id, cs.channel, cs.last_message_at, cs.unread_count, 
               cs.is_active, cs.is_typing, cs.typing_at, cs.priority, cs.created_at, cs.updated_at,
               c.id, c.name, c.phone, c.email, c.viber_id, c.telegram_id, c.messenger_id
      ORDER BY cs.last_message_at DESC
    `);

    res.json({ success: true, data: result.rows });
  } catch (error) {
    console.error('Error fetching chat sessions:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// Get messages for a specific customer with search
router.get('/messages/:customerId', async (req, res) => {
  try {
    const { customerId } = req.params;
    const { limit = 50, search = '' } = req.query;

    let queryText = `
      SELECT * FROM chat_messages
      WHERE customer_id = $1
    `;
    
    const params = [customerId];
    
    // Add search filter if provided
    if (search) {
      queryText += ` AND message ILIKE $${params.length + 1}`;
      params.push(`%${search}%`);
    }
    
    queryText += ` ORDER BY created_at ASC LIMIT $${params.length + 1}`;
    params.push(parseInt(limit));

    const result = await query(queryText, params);

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

// ============================================
// NEW FEATURES
// ============================================

// Typing indicator
router.post('/typing/:customerId', async (req, res) => {
  try {
    const { customerId } = req.params;
    const { isTyping } = req.body;

    await query(`
      UPDATE chat_sessions
      SET is_typing = $1, typing_at = NOW(), updated_at = NOW()
      WHERE customer_id = $2
    `, [isTyping, customerId]);

    // Emit typing indicator via Socket.IO
    emitTypingIndicator(customerId, isTyping);

    res.json({ success: true });
  } catch (error) {
    console.error('Error updating typing indicator:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// Upload file attachment
router.post('/upload', upload.single('file'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ success: false, error: 'No file uploaded' });
    }

    const fileUrl = `/uploads/chat/${req.file.filename}`;
    
    res.json({
      success: true,
      data: {
        url: fileUrl,
        name: req.file.originalname,
        type: req.file.mimetype,
        size: req.file.size
      }
    });
  } catch (error) {
    console.error('Error uploading file:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// Send message with attachment
router.post('/send-with-attachment', chatLimiter, async (req, res) => {
  try {
    const { customerId, message, attachmentUrl, attachmentType, attachmentName, attachmentSize } = req.body;

    // Get customer info
    const customerResult = await query('SELECT * FROM customers WHERE id = $1', [customerId]);
    const customer = customerResult.rows[0];
    
    if (!customer) {
      return res.status(404).json({ success: false, error: 'Customer not found' });
    }

    // Save message with attachment
    const messageResult = await query(`
      INSERT INTO chat_messages (
        customer_id, sender_type, message, channel, 
        attachment_url, attachment_type, attachment_name, attachment_size,
        is_read
      )
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
      RETURNING *
    `, [
      customerId, 'admin', message || 'Sent an attachment',
      customer.telegram_id ? 'telegram' : customer.viber_id ? 'viber' : 'messenger',
      attachmentUrl, attachmentType, attachmentName, attachmentSize, true
    ]);

    const savedMessage = messageResult.rows[0];

    // Emit real-time update
    emitNewMessage(savedMessage, customerId);

    // Update session
    await query(`
      INSERT INTO chat_sessions (customer_id, channel, last_message_at, is_active)
      VALUES ($1, $2, NOW(), true)
      ON CONFLICT (customer_id) DO UPDATE SET
        last_message_at = NOW(), updated_at = NOW()
    `, [customerId, savedMessage.channel]);

    res.json({ success: true, data: savedMessage });
  } catch (error) {
    console.error('Error sending message with attachment:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// Message Templates
router.get('/templates', async (req, res) => {
  try {
    const { category } = req.query;
    
    let queryText = 'SELECT * FROM message_templates WHERE is_active = true';
    const params = [];
    
    if (category) {
      queryText += ' AND category = $1';
      params.push(category);
    }
    
    queryText += ' ORDER BY usage_count DESC, name ASC';
    
    const result = await query(queryText, params);
    res.json({ success: true, data: result.rows });
  } catch (error) {
    console.error('Error fetching templates:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

router.post('/templates', async (req, res) => {
  try {
    const { name, content, category, shortcut } = req.body;
    
    const result = await query(`
      INSERT INTO message_templates (name, content, category, shortcut, created_by)
      VALUES ($1, $2, $3, $4, $5)
      RETURNING *
    `, [name, content, category, shortcut, req.user?.id]);
    
    res.json({ success: true, data: result.rows[0] });
  } catch (error) {
    console.error('Error creating template:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

router.put('/templates/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { name, content, category, shortcut, is_active } = req.body;
    
    const result = await query(`
      UPDATE message_templates
      SET name = $1, content = $2, category = $3, shortcut = $4, is_active = $5, updated_at = NOW()
      WHERE id = $6
      RETURNING *
    `, [name, content, category, shortcut, is_active, id]);
    
    res.json({ success: true, data: result.rows[0] });
  } catch (error) {
    console.error('Error updating template:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

router.delete('/templates/:id', async (req, res) => {
  try {
    const { id } = req.params;
    await query('DELETE FROM message_templates WHERE id = $1', [id]);
    res.json({ success: true });
  } catch (error) {
    console.error('Error deleting template:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

router.post('/templates/:id/use', async (req, res) => {
  try {
    const { id } = req.params;
    await query('SELECT increment_template_usage($1)', [id]);
    res.json({ success: true });
  } catch (error) {
    console.error('Error incrementing template usage:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// Customer Notes
router.get('/notes/:customerId', async (req, res) => {
  try {
    const { customerId } = req.params;
    
    const result = await query(`
      SELECT cn.*, u.name as created_by_name
      FROM customer_notes cn
      LEFT JOIN users u ON cn.created_by = u.id
      WHERE cn.customer_id = $1
      ORDER BY cn.created_at DESC
    `, [customerId]);
    
    res.json({ success: true, data: result.rows });
  } catch (error) {
    console.error('Error fetching notes:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

router.post('/notes', async (req, res) => {
  try {
    const { customerId, note } = req.body;
    
    const result = await query(`
      INSERT INTO customer_notes (customer_id, note, created_by)
      VALUES ($1, $2, $3)
      RETURNING *
    `, [customerId, note, req.user?.id]);
    
    res.json({ success: true, data: result.rows[0] });
  } catch (error) {
    console.error('Error creating note:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

router.put('/notes/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { note } = req.body;
    
    const result = await query(`
      UPDATE customer_notes
      SET note = $1, updated_at = NOW()
      WHERE id = $2
      RETURNING *
    `, [note, id]);
    
    res.json({ success: true, data: result.rows[0] });
  } catch (error) {
    console.error('Error updating note:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

router.delete('/notes/:id', async (req, res) => {
  try {
    const { id } = req.params;
    await query('DELETE FROM customer_notes WHERE id = $1', [id]);
    res.json({ success: true });
  } catch (error) {
    console.error('Error deleting note:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// Conversation Tags
router.get('/tags', async (req, res) => {
  try {
    const result = await query('SELECT * FROM conversation_tags ORDER BY name ASC');
    res.json({ success: true, data: result.rows });
  } catch (error) {
    console.error('Error fetching tags:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

router.post('/tags', async (req, res) => {
  try {
    const { name, color, description } = req.body;
    
    const result = await query(`
      INSERT INTO conversation_tags (name, color, description)
      VALUES ($1, $2, $3)
      RETURNING *
    `, [name, color, description]);
    
    res.json({ success: true, data: result.rows[0] });
  } catch (error) {
    console.error('Error creating tag:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

router.post('/sessions/:customerId/tags', async (req, res) => {
  try {
    const { customerId } = req.params;
    const { tagId } = req.body;
    
    await query(`
      INSERT INTO chat_session_tags (session_id, tag_id)
      VALUES ($1, $2)
      ON CONFLICT DO NOTHING
    `, [customerId, tagId]);
    
    res.json({ success: true });
  } catch (error) {
    console.error('Error adding tag to session:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

router.delete('/sessions/:customerId/tags/:tagId', async (req, res) => {
  try {
    const { customerId, tagId } = req.params;
    
    await query(`
      DELETE FROM chat_session_tags
      WHERE session_id = $1 AND tag_id = $2
    `, [customerId, tagId]);
    
    res.json({ success: true });
  } catch (error) {
    console.error('Error removing tag from session:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// Export conversation history
router.get('/export/:customerId', async (req, res) => {
  try {
    const { customerId } = req.params;
    const { format = 'xlsx' } = req.query;

    // Get customer info
    const customerResult = await query('SELECT * FROM customers WHERE id = $1', [customerId]);
    const customer = customerResult.rows[0];

    // Get all messages
    const messagesResult = await query(`
      SELECT * FROM chat_messages
      WHERE customer_id = $1
      ORDER BY created_at ASC
    `, [customerId]);

    const messages = messagesResult.rows;

    if (format === 'xlsx') {
      // Create Excel file
      const data = messages.map(msg => ({
        'Date': new Date(msg.created_at).toLocaleString(),
        'Sender': msg.sender_type === 'admin' ? 'Admin' : customer.name,
        'Message': msg.message,
        'Channel': msg.channel,
        'Read': msg.is_read ? 'Yes' : 'No',
        'Attachment': msg.attachment_url || ''
      }));

      const ws = XLSX.utils.json_to_sheet(data);
      const wb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, ws, 'Messages');

      const buffer = XLSX.write(wb, { type: 'buffer', bookType: 'xlsx' });

      res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
      res.setHeader('Content-Disposition', `attachment; filename=chat-${customer.name}-${Date.now()}.xlsx`);
      res.send(buffer);
    } else {
      // Return JSON
      res.json({
        success: true,
        data: {
          customer,
          messages,
          exportedAt: new Date().toISOString()
        }
      });
    }

    // Update last exported timestamp
    await query(`
      UPDATE chat_sessions
      SET last_exported_at = NOW()
      WHERE customer_id = $1
    `, [customerId]);

  } catch (error) {
    console.error('Error exporting conversation:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// Search across all messages
router.get('/search', async (req, res) => {
  try {
    const { q, limit = 50 } = req.query;

    if (!q) {
      return res.status(400).json({ success: false, error: 'Search query required' });
    }

    const result = await query(`
      SELECT 
        cm.*,
        c.name as customer_name,
        c.phone as customer_phone
      FROM chat_messages cm
      LEFT JOIN customers c ON cm.customer_id = c.id
      WHERE cm.message ILIKE $1
      ORDER BY cm.created_at DESC
      LIMIT $2
    `, [`%${q}%`, parseInt(limit)]);

    res.json({ success: true, data: result.rows });
  } catch (error) {
    console.error('Error searching messages:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

module.exports = router;
